/**
 * OKey — Google Apps Script backend (TRANSPORT ONLY)
 *
 * This Web App stores and returns ENCRYPTED payloads + non-sensitive metadata.
 * It never sees plaintext credentials, master passwords, or keys — all
 * encryption/decryption happens client-side. Treat this file as a dumb,
 * append/update store keyed by entry id with last-writer-wins by version.
 *
 * DEPLOY: Extensions ▸ Apps Script ▸ Deploy ▸ New deployment ▸ Web app
 *   - Execute as: Me
 *   - Who has access: Only myself   (personal, zero-knowledge use)
 * Paste the resulting /exec URL into OKey ▸ Settings ▸ Connected Sheets.
 */

const SHEETS = {
  VAULT: 'OKeyVault',
  META: 'OKeyMeta',
  SETTINGS: 'OKeySettings',
  ORDER: 'OKeyOrder',
  CONFLICTS: 'OKeyConflicts',
};
const HEADER = 1;
const START = 2;
const VAULT_COLS = ['ID', 'Domain', 'EntryType', 'Version', 'IsDeleted', 'UpdatedAt', 'DisplayOrder', 'IsPinned', 'Payload'];

function doGet(e) { return handle(e); }
function doPost(e) { return handle(e); }

function handle(e) {
  try {
    const action = e && e.parameter ? e.parameter.action : null;
    if (!action) return json({ status: 'error', code: 'MISSING_ACTION', message: 'No action' });
    const body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    switch (action) {
      case 'ping': return json({ status: 'ok', timestamp: nowIso(), email: safeEmail() });
      case 'initVault': return initVault();
      case 'getVault': return getVault();
      case 'syncEntries': return syncEntries(body);
      case 'saveMetadata': return saveKv(SHEETS.META, body.metadata || {});
      case 'getSettings': return getKv(SHEETS.SETTINGS, true);
      case 'saveSettings': return saveKv(SHEETS.SETTINGS, body.settings || {});
      case 'saveOrder': return saveOrder(body.order || []);
      case 'getOrder': return getOrder();
      default: return json({ status: 'error', code: 'UNKNOWN_ACTION', message: 'Unknown action: ' + action });
    }
  } catch (err) {
    return json({ status: 'error', code: 'INTERNAL_ERROR', message: String(err && err.message || err) });
  }
}

function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function safeEmail() { try { return Session.getActiveUser().getEmail(); } catch (e) { return ''; } }
function nowIso() { return new Date().toISOString(); }
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ensureSheet(name, header) {
  let sheet = ss().getSheetByName(name);
  if (!sheet) {
    sheet = ss().insertSheet(name);
    sheet.appendRow(header);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function initVault() {
  ensureSheet(SHEETS.VAULT, VAULT_COLS);
  ensureSheet(SHEETS.META, ['Key', 'Value']);
  ensureSheet(SHEETS.SETTINGS, ['Key', 'Value']);
  ensureSheet(SHEETS.ORDER, ['EntryID', 'DisplayOrder']);
  ensureSheet(SHEETS.CONFLICTS, ['ConflictAt', 'EntryID', 'ClientVersion', 'ServerVersion', 'Payload']);
  const def = ss().getSheetByName('Sheet1');
  if (def && def.getLastRow() <= 1) { try { ss().deleteSheet(def); } catch (e) {} }
  return json({ status: 'ok', sheetId: ss().getId(), sheetUrl: ss().getUrl() });
}

function readVault() {
  const sheet = ensureSheet(SHEETS.VAULT, VAULT_COLS);
  const last = sheet.getLastRow();
  const map = {};
  const list = [];
  if (last > HEADER) {
    const rows = sheet.getRange(START, 1, last - HEADER, VAULT_COLS.length).getValues();
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (!r[0]) continue;
      const rec = {
        id: r[0], domain: r[1], entryType: r[2], version: Number(r[3]) || 1,
        isDeleted: r[4] === true || r[4] === 'TRUE' || r[4] === 'true',
        updatedAt: r[5], displayOrder: Number(r[6]) || 0,
        isPinned: r[7] === true || r[7] === 'TRUE' || r[7] === 'true', payload: r[8],
      };
      rec._row = i + START;
      map[rec.id] = rec;
      list.push(rec);
    }
  }
  return { sheet: sheet, map: map, list: list };
}

function rowValues(e) {
  return [e.id, e.domain || '', e.entryType || 'password', e.version || 1, !!e.isDeleted, e.updatedAt || nowIso(), e.displayOrder || 0, !!e.isPinned, e.payload || ''];
}
function stripRow(r) { const c = {}; for (const k in r) if (k !== '_row') c[k] = r[k]; return c; }

function getVault() {
  const v = readVault();
  return json({ status: 'ok', metadata: getKvMap(SHEETS.META), entries: v.list.map(stripRow), serverTimestamp: nowIso() });
}

function syncEntries(payload) {
  const lastSyncAt = payload.lastSyncAt || '1970-01-01T00:00:00.000Z';
  const incoming = payload.entries || [];
  const v = readVault();
  const conflicts = [];
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    for (let i = 0; i < incoming.length; i++) {
      const e = incoming[i];
      if (!e || !e.id) continue;
      const existing = v.map[e.id];
      if (!existing) {
        v.sheet.appendRow(rowValues(e));
      } else if (e.version > existing.version || (e.version === existing.version && (e.updatedAt || '') > (existing.updatedAt || ''))) {
        v.sheet.getRange(existing._row, 1, 1, VAULT_COLS.length).setValues([rowValues(e)]);
      } else if (e.version < existing.version) {
        conflicts.push({ id: e.id, clientVersion: e.version, serverVersion: existing.version });
        const cs = ensureSheet(SHEETS.CONFLICTS, ['ConflictAt', 'EntryID', 'ClientVersion', 'ServerVersion', 'Payload']);
        cs.appendRow([nowIso(), e.id, e.version, existing.version, e.payload || '']);
      }
    }
  } finally {
    lock.releaseLock();
  }
  // Return everything changed on the server since the client's last sync.
  const after = readVault();
  const updated = after.list.filter(function (r) { return (r.updatedAt || '') > lastSyncAt; }).map(stripRow);
  return json({ status: 'ok', updatedEntries: updated, conflicts: conflicts, serverTimestamp: nowIso() });
}

// ---- generic key/value sheets (metadata + settings) ----
function getKvMap(name) {
  const sheet = ss().getSheetByName(name);
  const out = {};
  if (!sheet) return out;
  const last = sheet.getLastRow();
  if (last > HEADER) {
    const rows = sheet.getRange(START, 1, last - HEADER, 2).getValues();
    for (let i = 0; i < rows.length; i++) {
      const k = rows[i][0];
      if (!k) continue;
      try { out[k] = JSON.parse(rows[i][1]); } catch (e) { out[k] = rows[i][1]; }
    }
  }
  return out;
}
function getKv(name, asSettings) {
  const map = getKvMap(name);
  return json(asSettings ? { status: 'ok', settings: map } : { status: 'ok', metadata: map });
}
function saveKv(name, obj) {
  const sheet = ensureSheet(name, ['Key', 'Value']);
  const idx = {};
  const last = sheet.getLastRow();
  if (last > HEADER) {
    const rows = sheet.getRange(START, 1, last - HEADER, 1).getValues();
    for (let i = 0; i < rows.length; i++) if (rows[i][0]) idx[rows[i][0]] = i + START;
  }
  for (const k in obj) {
    const val = typeof obj[k] === 'object' ? JSON.stringify(obj[k]) : String(obj[k]);
    if (idx[k]) sheet.getRange(idx[k], 2).setValue(val);
    else sheet.appendRow([k, val]);
  }
  return json({ status: 'ok' });
}

function saveOrder(order) {
  const sheet = ensureSheet(SHEETS.ORDER, ['EntryID', 'DisplayOrder']);
  const last = sheet.getLastRow();
  if (last > HEADER) sheet.deleteRows(START, last - HEADER);
  for (let i = 0; i < order.length; i++) sheet.appendRow([order[i].id, order[i].displayOrder]);
  return json({ status: 'ok' });
}
function getOrder() {
  const sheet = ss().getSheetByName(SHEETS.ORDER);
  const out = [];
  if (sheet) {
    const last = sheet.getLastRow();
    if (last > HEADER) {
      const rows = sheet.getRange(START, 1, last - HEADER, 2).getValues();
      for (let i = 0; i < rows.length; i++) if (rows[i][0]) out.push({ id: rows[i][0], displayOrder: rows[i][1] });
    }
  }
  return json({ status: 'ok', order: out });
}
