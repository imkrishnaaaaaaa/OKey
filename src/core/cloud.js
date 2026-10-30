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
    this.base = `${FS_BASE}/${projectId}/databases/${DB_ID}/documents`;
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

  /** @param {{salt,kdfParams,wrappedMaster,wrappedRecovery,formatVersion,updatedAt}} meta */
  async pushMeta(uid, meta) {
    const fields = toFsFields({
      salt: meta.salt,
      kdfParamsRaw: JSON.stringify(meta.kdfParams || {}),
      wrappedMaster: meta.wrappedMaster || '',
      wrappedRecovery: meta.wrappedRecovery || '',
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
    return doc?.fields ? fromFsFields(doc.fields) : null;
  }

  async pushSettings(uid, settings) {
    const fields = toFsFields({ ...settings, updatedAt: new Date().toISOString() });
    await this._request(
      `${this._userPath(uid)}/vault/settings`,
      { method: 'PATCH', body: JSON.stringify({ fields }) },
    );
  }

  // ---- entries ----

  /** Pull entries updated after `since` ISO string. Returns at-rest records. */
  async pullEntriesDelta(uid, since) {
    const body = {
      structuredQuery: {
        from: [{ collectionId: 'entries' }],
        where: {
          fieldFilter: { field: { fieldPath: 'updatedAt' }, op: 'GREATER_THAN', value: { stringValue: since } },
        },
        orderBy: [{ field: { fieldPath: 'updatedAt' } }],
        limit: { value: 500 },
      },
    };
    const res = await this._request(`${this._userPath(uid)}:runQuery`, { method: 'POST', body: JSON.stringify(body) });
    const rows = Array.isArray(res) ? res : [];
    return rows.filter((r) => r.document).map((r) => this._docToRecord(r.document));
  }

  async pullAllEntries(uid) {
    const body = { structuredQuery: { from: [{ collectionId: 'entries' }], limit: { value: 10000 } } };
    const res = await this._request(`${this._userPath(uid)}:runQuery`, { method: 'POST', body: JSON.stringify(body) });
    const rows = Array.isArray(res) ? res : [];
    return rows.filter((r) => r.document).map((r) => this._docToRecord(r.document));
  }

  /**
   * Push at-rest records (shape from Vault.exportRecords()). Batches writes.
   * @param {Array} records
   */
  async pushEntries(uid, records) {
    const batch = records.slice(0, 450);
    await Promise.all(batch.map((rec) => {
      const fields = toFsFields({
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
      });
      return this._request(
        `${this._userPath(uid)}/vault/entries/${encodeURIComponent(rec.id)}`,
        { method: 'PATCH', body: JSON.stringify({ fields }) },
      );
    }));
    return batch.length;
  }

  /** Hard-remove a tombstoned entry from the cloud (optional GC step). */
  async deleteEntry(uid, id) {
    await this._request(`${this._userPath(uid)}/vault/entries/${encodeURIComponent(id)}`, { method: 'DELETE' });
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
    };
  }
}

/** EPOCH used for first pulls. */
export const SYNC_EPOCH = '1970-01-01T00:00:00.000Z';
