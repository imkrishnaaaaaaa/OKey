/**
 * OKey — Core: Cloud store (Firestore over REST)
 *
 * Platform-agnostic transport: plain fetch + an injected bearer-token provider,
 * so it runs identically in the extension, the PWA, and Node tests. The server
 * sees ciphertext payloads + non-sensitive metadata only (docs/architecture.md).
 *
 * Realtime note: v2.0 uses delta pulls (updatedAt > lastSyncAt) on unlock,
 * focus, and a short interval while unlocked. Snapshot listeners are a later
 * enhancement — semantics here don't change when they land.
 */

const FS_BASE = 'https://firestore.googleapis.com/v1/projects';
const DB_ID = '(default)';
// Firestore caps a commit at 500 writes and 10 MiB. Entry payloads can reach
// 100 KB each, so 50 per commit keeps the worst case near 5 MiB.
const COMMIT_BATCH = 50;
// Entries written by one commit share a syncedAt, so a pull page must be bigger
// than one commit or those entries could straddle two pages. Keep this above COMMIT_BATCH.
const PULL_PAGE = 500;

export class CloudError extends Error {
  constructor(message, code = 'CLOUD_ERROR') {
    super(message);
    this.code = code;
  }
}

// ---------- Firestore JSON value codecs ----------

export function toFsValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (Number.isInteger(v)) return { integerValue: String(v) };
  if (typeof v === 'number') return { doubleValue: v };
  if (v instanceof Date) return { timestampValue: v.toISOString() };
  return { stringValue: String(v) };
}

export function fromFsValue(fv) {
  if (!fv || typeof fv !== 'object') return null;
  if ('stringValue' in fv) return fv.stringValue;
  if ('integerValue' in fv) return Number(fv.integerValue);
  if ('doubleValue' in fv) return Number(fv.doubleValue);
  if ('booleanValue' in fv) return fv.booleanValue;
  if ('timestampValue' in fv) return fv.timestampValue;
  if ('nullValue' in fv) return null;
  return null;
}

export function toFsFields(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) out[k] = toFsValue(v);
  return out;
}

export function fromFsFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields || {})) out[k] = fromFsValue(v);
  return out;
}

// ---------- Store ----------

/**
 * @param {object} opts
 * @param {string} opts.projectId   Firebase project id
 * @param {() => Promise<string|null>} opts.getToken  bearer ID token provider
 */
export class CloudStore {
  constructor({ projectId, getToken }) {
    this.docsRoot = `projects/${projectId}/databases/${DB_ID}/documents`;
    this.base = `${FS_BASE}/${projectId}/databases/${DB_ID}/documents`;
    this.pageSize = PULL_PAGE;
    this.getToken = getToken;
  }

  async _request(path, init = {}) {
    const token = await this.getToken();
    if (!token) throw new CloudError('Not signed in', 'NOT_SIGNED_IN');
    let res;
    try {
      res = await fetch(`${this.base}${path}`, {
        ...init,
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers || {}) },
      });
    } catch (e) {
      throw new CloudError(`Network error: ${e.message}`, 'NETWORK');
    }
    if (res.status === 404 && init.allowMissing) return null;
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { msg = (await res.json())?.error?.message || msg; } catch {}
      throw new CloudError(msg, res.status === 403 ? 'FORBIDDEN' : 'REMOTE');
    }
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  _userPath(uid) { return `/users/${uid}`; }

  // ---- meta ----

  async pullMeta(uid) {
    const doc = await this._request(`${this._userPath(uid)}/vault/meta`, { allowMissing: true });
    if (!doc?.fields) return null;
    const m = fromFsFields(doc.fields);
    m.kdfParams = typeof m.kdfParamsRaw === 'string' ? JSON.parse(m.kdfParamsRaw) : (m.kdfParams ?? null);
    delete m.kdfParamsRaw;
    return m;
  }

  /**
   * Replaces the whole meta doc (PATCH without a field mask). There is no
   * wrappedMaster here on purpose: the PIN has 10,000 options, so a copy of its
   * wrap in the cloud could be brute-forced offline. Only the 24-word recovery
   * wrap leaves the device.
   * @param {{salt,kdfParams,wrappedRecovery,recoveryVersion,formatVersion}} meta
   */
  async pushMeta(uid, meta) {
    const fields = toFsFields({
      salt: meta.salt,
      kdfParamsRaw: JSON.stringify(meta.kdfParams || {}),
      wrappedRecovery: meta.wrappedRecovery || '',
      recoveryVersion: meta.recoveryVersion || 1,
      formatVersion: meta.formatVersion || 2,
      updatedAt: new Date().toISOString(),
    });
    await this._request(
      `${this._userPath(uid)}/vault/meta`,
      { method: 'PATCH', body: JSON.stringify({ fields }) },
    );
  }

  // ---- settings ----

  async pullSettings(uid) {
    const doc = await this._request(`${this._userPath(uid)}/vault/settings`, { allowMissing: true });
    if (!doc?.fields) return null;
    const out = {};
    for (const [k, v] of Object.entries(fromFsFields(doc.fields))) {
      if (!k.endsWith('Raw')) { out[k] = v; continue; }
      // Object settings travel as JSON text. Bad JSON is dropped, and
      // sanitizeSettings still checks whatever parses.
      try { out[k.slice(0, -3)] = JSON.parse(v); } catch { /* ignore */ }
    }
    return out;
  }

  async pushSettings(uid, settings) {
    const flat = {};
    for (const [k, v] of Object.entries(settings)) {
      if (v && typeof v === 'object') flat[`${k}Raw`] = JSON.stringify(v);
      else flat[k] = v;
    }
    const fields = toFsFields({ ...flat, updatedAt: new Date().toISOString() });
    await this._request(
      `${this._userPath(uid)}/vault/settings`,
      { method: 'PATCH', body: JSON.stringify({ fields }) },
    );
  }

  // ---- entries ----

  /**
   * Pull every entry whose server time (syncedAt) is at or after `cursor`, in
   * pages. Returns the records plus the next cursor: the last syncedAt seen, or
   * the same cursor when nothing is new. The query uses >= so entries that share
   * the cursor's exact time are never skipped. Each entry is returned once.
   * @param {string} cursor a syncedAt timestamp (SYNC_EPOCH for a full pull)
   * @returns {Promise<{records: Array, cursor: string}>}
   */
  async pullEntriesDelta(uid, cursor) {
    const byId = new Map(); // pages overlap on the cursor's own time, so keep one copy per entry
    let from = cursor;
    for (;;) {
      const body = {
        structuredQuery: {
          from: [{ collectionId: 'entries' }],
          where: {
            fieldFilter: { field: { fieldPath: 'syncedAt' }, op: 'GREATER_THAN_OR_EQUAL', value: { timestampValue: from } },
          },
          orderBy: [{ field: { fieldPath: 'syncedAt' } }],
          limit: { value: this.pageSize },
        },
      };
      const res = await this._request(`${this._userPath(uid)}:runQuery`, { method: 'POST', body: JSON.stringify(body) });
      const page = (Array.isArray(res) ? res : []).filter((r) => r.document).map((r) => this._docToRecord(r.document));
      for (const r of page) byId.set(r.id, r);
      const last = page.at(-1)?.syncedAt;
      if (!last || page.length < this.pageSize) return { records: [...byId.values()], cursor: last || from };
      if (last === from) throw new CloudError('Cloud pull stalled on one timestamp', 'REMOTE');
      from = last;
    }
  }

  /**
   * Push at-rest records (shape from Vault.exportRecords()) with batched
   * commits. Each write replaces its whole doc, same as PATCH without a mask.
   * Throws on the first failed commit. Earlier commits stay, and re-sending is
   * safe because every write is a full replace of the same doc.
   * @param {Array} records
   * @returns {Promise<number>} how many records were sent
   */
  async pushEntries(uid, records) {
    for (let i = 0; i < records.length; i += COMMIT_BATCH) {
      const writes = records.slice(i, i + COMMIT_BATCH).map((rec) => ({
        update: {
          name: `${this.docsRoot}${this._userPath(uid)}/entries/${encodeURIComponent(rec.id)}`,
          fields: toFsFields({
            id: rec.id,
            domain: rec.domain || '',
            folder: rec.folder || '',
            entryType: rec.entryType || 'password',
            version: rec.version || 1,
            isDeleted: !!rec.isDeleted,
            updatedAt: rec.updatedAt || new Date().toISOString(),
            displayOrder: rec.displayOrder || 0,
            isPinned: !!rec.isPinned,
            payload: rec.payload || '',
          }),
        },
        // Server clock, so pulls never depend on any device's clock.
        updateTransforms: [{ fieldPath: 'syncedAt', setToServerValue: 'REQUEST_TIME' }],
      }));
      await this._request(':commit', { method: 'POST', body: JSON.stringify({ writes }) });
    }
    return records.length;
  }

  /** Hard-remove a tombstoned entry from the cloud (optional GC step). */
  async deleteEntry(uid, id) {
    await this._request(`${this._userPath(uid)}/entries/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  _docToRecord(doc) {
    const f = fromFsFields(doc.fields);
    return {
      id: f.id ?? doc.name.split('/').pop(),
      domain: f.domain || '',
      folder: f.folder || '',
      entryType: f.entryType || 'password',
      version: f.version || 1,
      isDeleted: !!f.isDeleted,
      updatedAt: f.updatedAt || '',
      displayOrder: f.displayOrder || 0,
      isPinned: !!f.isPinned,
      payload: f.payload || '',
      syncedAt: f.syncedAt || '',
    };
  }
}

/** EPOCH used for first pulls. */
export const SYNC_EPOCH = '1970-01-01T00:00:00.000Z';
