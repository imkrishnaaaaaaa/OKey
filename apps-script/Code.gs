/************************************************************
 * OKey Backend
 * Personal Zero-Knowledge Vault
 ************************************************************/

const APPSCRIPT_VERSION = "1.0.0";
const SCHEMA_VERSION = "1.0.0";

const SHEETS = {
  VAULT: "OKeyVault",
  META: "OKeyMeta",
  SETTINGS: "OKeySettings",
  ORDER: "OKeyOrder",
  CONFLICTS: "OKeyConflicts"
};

const HEADER = 1;
const START = 2;

const VAULT_COLS = [
  "ID", "Domain", "EntryType", "Version", "IsDeleted", 
  "UpdatedAt", "DisplayOrder", "IsPinned", "Folder", "Payload"
];

/************************************************************
 * ENTRY POINTS
 ************************************************************/
function doGet(e) { return handle(e); }
function doPost(e) { return handle(e); }

/************************************************************
 * ROUTER
 ************************************************************/
function handle(e) {
  try {
    const action = e && e.parameter && e.parameter.action ? String(e.parameter.action).trim() : "";
    const body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};

    switch (action) {
      case "ping": return ping();
      case "health": return health();
      case "version": return version();
      case "config": return config();
      case "initVault": return initVault();
      case "getVault": return getVault();
      case "getFolders": return getFolders();
      case "syncEntries": return syncEntries(body);
      case "settings": return settings();
      case "saveSettings": return saveSettings(body);
      case "metadata": return metadata();
      case "saveMetadata": return saveMetadata(body);
      case "getOrder": return getOrder();
      case "saveOrder": return saveOrder(body.order || []);
      case "dashboard": return dashboard();
      case "analytics": return analytics();
      default: return error("UNKNOWN_ACTION", "Unknown action: " + action);
    }
  } catch (err) {
    return error("INTERNAL_ERROR", String(err && err.message || err));
  }
}

/************************************************************
 * CORE HELPERS
 ************************************************************/
function ss() { return SpreadsheetApp.getActiveSpreadsheet(); }
function safeEmail() { try { return Session.getActiveUser().getEmail(); } catch (e) { return ""; } }
function nowIso() { return new Date().toISOString(); }

/************************************************************
 * RESPONSE HELPERS
 ************************************************************/
function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function ok(obj) {
  obj = obj || {};
  obj.status = "ok";
  return json(obj);
}

function error(code, message) {
  return json({ status: "error", code: code, message: message });
}

/************************************************************
 * SYSTEM ENDPOINTS
 ************************************************************/
function version() {
  return ok({ version: APPSCRIPT_VERSION, schemaVersion: SCHEMA_VERSION });
}

function config() {
  return ok({
    version: APPSCRIPT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    features: { sync: true, folders: true, analytics: true, dashboard: true }
  });
}

function ping() {
  return ok({ timestamp: nowIso(), email: safeEmail() });
}

function health() {
  const vault = ss().getSheetByName(SHEETS.VAULT);
  const count = vault ? Math.max(vault.getLastRow() - 1, 0) : 0;
  return ok({
    version: APPSCRIPT_VERSION,
    schemaVersion: SCHEMA_VERSION,
    timestamp: nowIso(),
    sheetId: ss().getId(),
    sheetUrl: ss().getUrl(),
    vaultEntries: count
  });
}

/************************************************************
 * SHEET HELPERS
 ************************************************************/
function ensureSheet(name, headers) {
  var sheet = ss().getSheetByName(name);
  if (!sheet) {
    sheet = ss().insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1F1F1F").setFontColor("#FFFFFF");
  }
  return sheet;
}

function applyHeaderStyle(sheet) {
  var lastCol = sheet.getLastColumn();
  if (lastCol <= 0) return;
  sheet.getRange(1, 1, 1, lastCol).setFontWeight("bold").setBackground("#1F1F1F").setFontColor("#FFFFFF");
  sheet.setFrozenRows(1);
}

/************************************************************
 * SCHEMA MIGRATION
 ************************************************************/
function migrateVaultSchema() {
  var sheet = ss().getSheetByName(SHEETS.VAULT);
  if (!sheet) return;
  var lastCol = sheet.getLastColumn();
  if (lastCol === 9 && sheet.getRange(1, 9).getValue() === "Payload") {
    sheet.insertColumnBefore(9);
    sheet.getRange(1, 1, 1, VAULT_COLS.length).setValues([VAULT_COLS]);
  }
}

/************************************************************
 * INIT VAULT
 ************************************************************/
function initVault() {
  migrateVaultSchema();
  var vault = ensureSheet(SHEETS.VAULT, VAULT_COLS);
  var meta = ensureSheet(SHEETS.META, ["Key", "Value"]);
  var settings = ensureSheet(SHEETS.SETTINGS, ["Key", "Value"]);
  var order = ensureSheet(SHEETS.ORDER, ["EntryID", "DisplayOrder"]);
  var conflicts = ensureSheet(SHEETS.CONFLICTS, ["ConflictAt", "EntryID", "ClientVersion", "ServerVersion", "Payload"]);

  applyHeaderStyle(vault);
  applyHeaderStyle(meta);
  applyHeaderStyle(settings);
  applyHeaderStyle(order);
  applyHeaderStyle(conflicts);

  createDefaultSettings();
  removeDefaultSheet();

  return ok({
    sheetId: ss().getId(),
    sheetUrl: ss().getUrl(),
    version: APPSCRIPT_VERSION,
    schemaVersion: SCHEMA_VERSION
  });
}

/************************************************************
 * DEFAULT SETTINGS
 ************************************************************/
function createDefaultSettings() {
  var sheet = ss().getSheetByName(SHEETS.SETTINGS);
  if (!sheet) return;
  var existing = {};
  var last = sheet.getLastRow();
  if (last > HEADER) {
    var rows = sheet.getRange(START, 1, last - HEADER, 2).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0]) existing[String(rows[i][0])] = true;
    }
  }

  var defaults = {
    theme: "system",
    autoLockMinutes: 15,
    syncOnLaunch: true,
    syncOnSave: true,
    analyticsEnabled: true
  };

  for (var key in defaults) {
    if (!existing[key]) {
      sheet.appendRow([key, JSON.stringify(defaults[key])]);
    }
  }
}

/************************************************************
 * CLEANUP
 ************************************************************/
function removeDefaultSheet() {
  try {
    var sheet = ss().getSheetByName("Sheet1");
    if (sheet && sheet.getLastRow() <= 1) {
      ss().deleteSheet(sheet);
    }
  } catch (e) {}
}

/************************************************************
 * VAULT HELPERS
 ************************************************************/
function rowValues(entry) {
  return [
    entry.id,
    entry.domain || "",
    entry.entryType || "password",
    Number(entry.version) || 1,
    !!entry.isDeleted,
    entry.updatedAt || nowIso(),
    Number(entry.displayOrder) || 0,
    !!entry.isPinned,
    entry.folder || "",
    entry.payload || ""
  ];
}

function stripRow(record) {
  var copy = {};
  for (var key in record) {
    if (key !== "_row") copy[key] = record[key];
  }
  return copy;
}

/************************************************************
 * READ VAULT
 ************************************************************/
function readVault() {
  var sheet = ensureSheet(SHEETS.VAULT, VAULT_COLS);
  var map = {};
  var list = [];
  var last = sheet.getLastRow();
  if (last <= HEADER) {
    return { sheet: sheet, map: map, list: list };
  }

  var rows = sheet.getRange(START, 1, last - HEADER, VAULT_COLS.length).getValues();
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0]) continue;

    var rec = {
      id: r[0],
      domain: r[1],
      entryType: r[2],
      version: Number(r[3]) || 1,
      isDeleted: r[4] === true || r[4] === "TRUE" || r[4] === "true",
      updatedAt: r[5] || "",
      displayOrder: Number(r[6]) || 0,
      isPinned: r[7] === true || r[7] === "TRUE" || r[7] === "true",
      folder: r[8] || "",
      payload: r[9] || "",
      _row: i + START
    };

    map[rec.id] = rec;
    list.push(rec);
  }

  return { sheet: sheet, map: map, list: list };
}

/************************************************************
 * GET VAULT
 ************************************************************/
function getVault() {
  var vault = readVault();
  return ok({
    metadata: getKvMap(SHEETS.META),
    entries: vault.list.map(stripRow),
    serverTimestamp: nowIso()
  });
}

/************************************************************
 * SYNC ENGINE
 ************************************************************/
function syncEntries(payload) {
  payload = payload || {};
  var incoming = payload.entries || [];
  var lastSyncAt = payload.lastSyncAt || "1970-01-01T00:00:00.000Z";
  var vault = readVault();
  var conflicts = [];
  
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);

  try {
    for (var i = 0; i < incoming.length; i++) {
      var entry = incoming[i];
      if (!entry || !entry.id) continue;

      var existing = vault.map[entry.id];
      if (!existing) {
        vault.sheet.appendRow(rowValues(entry));
        continue;
      }

      var incomingVersion = Number(entry.version) || 1;
      var serverVersion = Number(existing.version) || 1;
      var incomingTime = String(entry.updatedAt || "");
      var serverTime = String(existing.updatedAt || "");

      var shouldUpdate = incomingVersion > serverVersion ||
        (incomingVersion === serverVersion && incomingTime > serverTime);

      if (shouldUpdate) {
        vault.sheet.getRange(existing._row, 1, 1, VAULT_COLS.length).setValues([rowValues(entry)]);
        continue;
      }

      if (incomingVersion < serverVersion) {
        conflicts.push({
          id: entry.id,
          clientVersion: incomingVersion,
          serverVersion: serverVersion
        });
        
        ensureSheet(SHEETS.CONFLICTS, ["ConflictAt", "EntryID", "ClientVersion", "ServerVersion", "Payload"])
          .appendRow([nowIso(), entry.id, incomingVersion, serverVersion, entry.payload || ""]);
      }
    }
  } finally {
    lock.releaseLock();
  }

  var after = readVault();
  var updatedEntries = after.list.filter(function(record) {
    return String(record.updatedAt || "") > String(lastSyncAt);
  }).map(stripRow);

  return ok({
    updatedEntries: updatedEntries,
    conflicts: conflicts,
    serverTimestamp: nowIso()
  });
}

/************************************************************
 * FOLDERS
 ************************************************************/
function getFolders() {
  var vault = readVault();
  var folders = {};
  vault.list.forEach(function(record) {
    if (record.folder && !record.isDeleted) {
      folders[record.folder] = true;
    }
  });
  return ok({ folders: Object.keys(folders).sort() });
}

/************************************************************
 * KEY VALUE HELPERS
 ************************************************************/
function getKvMap(sheetName) {
  var sheet = ss().getSheetByName(sheetName);
  var result = {};
  if (!sheet) return result;
  
  var last = sheet.getLastRow();
  if (last <= HEADER) return result;

  var rows = sheet.getRange(START, 1, last - HEADER, 2).getValues();
  for (var i = 0; i < rows.length; i++) {
    var key = rows[i][0];
    if (!key) continue;
    try {
      result[key] = JSON.parse(rows[i][1]);
    } catch (e) {
      result[key] = rows[i][1];
    }
  }
  return result;
}

function saveKv(sheetName, data) {
  data = data || {};
  var sheet = ensureSheet(sheetName, ["Key", "Value"]);
  var existing = {};
  var last = sheet.getLastRow();
  
  if (last > HEADER) {
    var rows = sheet.getRange(START, 1, last - HEADER, 1).getValues();
    for (var i = 0; i < rows.length; i++) {
      if (rows[i][0]) existing[rows[i][0]] = i + START;
    }
  }

  for (var key in data) {
    var value = typeof data[key] === "object" ? JSON.stringify(data[key]) : String(data[key]);
    if (existing[key]) {
      sheet.getRange(existing[key], 2).setValue(value);
    } else {
      sheet.appendRow([key, value]);
    }
  }
  
  return ok({ saved: Object.keys(data).length });
}

/************************************************************
 * SETTINGS
 ************************************************************/
function settings() { return ok({ settings: getKvMap(SHEETS.SETTINGS) }); }
function saveSettings(body) { return saveKv(SHEETS.SETTINGS, body.settings || {}); }

/************************************************************
 * METADATA
 ************************************************************/
function metadata() { return ok({ metadata: getKvMap(SHEETS.META) }); }
function saveMetadata(body) { return saveKv(SHEETS.META, body.metadata || {}); }

/************************************************************
 * ORDER
 ************************************************************/
function saveOrder(order) {
  order = order || [];
  var sheet = ensureSheet(SHEETS.ORDER, ["EntryID", "DisplayOrder"]);
  var last = sheet.getLastRow();
  
  if (last > HEADER) {
    sheet.deleteRows(START, last - HEADER);
  }

  for (var i = 0; i < order.length; i++) {
    sheet.appendRow([order[i].id, order[i].displayOrder]);
  }
  return ok({ saved: order.length });
}

function getOrder() {
  var sheet = ss().getSheetByName(SHEETS.ORDER);
  var result = [];
  if (!sheet) return ok({ order: result });
  
  var last = sheet.getLastRow();
  if (last <= HEADER) return ok({ order: result });

  var rows = sheet.getRange(START, 1, last - HEADER, 2).getValues();
  for (var i = 0; i < rows.length; i++) {
    if (!rows[i][0]) continue;
    result.push({
      id: rows[i][0],
      displayOrder: Number(rows[i][1]) || 0
    });
  }
  return ok({ order: result });
}

/************************************************************
 * DASHBOARD
 ************************************************************/
function dashboard() {
  var vault = readVault();
  var totalEntries = 0;
  var activeEntries = 0;
  var deletedEntries = 0;
  var pinnedEntries = 0;
  var folders = {};
  var latestSync = "";

  vault.list.forEach(function(entry) {
    totalEntries++;
    if (entry.isDeleted) deletedEntries++;
    else activeEntries++;
    if (entry.isPinned) pinnedEntries++;
    if (entry.folder && !entry.isDeleted) folders[entry.folder] = true;
    if (entry.updatedAt && entry.updatedAt > latestSync) latestSync = entry.updatedAt;
  });

  return ok({
    totalEntries: totalEntries,
    activeEntries: activeEntries,
    deletedEntries: deletedEntries,
    pinnedEntries: pinnedEntries,
    folders: Object.keys(folders).length,
    lastSync: latestSync || null
  });
}

/************************************************************
 * ANALYTICS
 ************************************************************/
function analytics() {
  var vault = readVault();
  var byType = {};
  var byFolder = {};
  var activeEntries = 0;
  var deletedEntries = 0;

  vault.list.forEach(function(entry) {
    if (entry.isDeleted) {
      deletedEntries++;
      return;
    }
    activeEntries++;
    var type = entry.entryType || "password";
    byType[type] = (byType[type] || 0) + 1;
    var folder = entry.folder || "Uncategorized";
    byFolder[folder] = (byFolder[folder] || 0) + 1;
  });

  return ok({
    activeEntries: activeEntries,
    deletedEntries: deletedEntries,
    entryTypes: byType,
    folders: byFolder
  });
}


End Points & sample respone:

Details:
🛠 System & Health Endpoints
ping (GET/POST): Returns the current server timestamp and the authenticated email.
health (GET/POST): Validates the VAULT sheet and returns the total number of vault entries along with the Sheet ID and URL.
version (GET/POST): Returns the APPSCRIPT_VERSION and SCHEMA_VERSION.
config (GET/POST): Returns basic configuration and feature flags (e.g., sync, folders, analytics).
📂 Core Vault Endpoints
initVault (POST): Initializes or repairs all necessary sheets, freezes and styles headers, and creates default settings. Returns the sheetUrl and sheetId.
getVault (GET/POST): Returns the entire vault data as well as global metadata and the server timestamp.
syncEntries (POST): The core synchronization engine. Pass a JSON body with entries (array of items) and lastSyncAt. Returns updatedEntries (since your last sync), conflicts, and the serverTimestamp.
🗂 Folders, Order, & Settings
getFolders (GET/POST): Returns an array of all unique active folder names dynamically generated from the vault entries.
settings (GET) / saveSettings (POST): Retrieves or saves the Vault user settings.
metadata (GET) / saveMetadata (POST): Retrieves or saves global metadata.
getOrder (GET) / saveOrder (POST): Retrieves or saves custom drag-and-drop order indexing.
📊 Insights
dashboard (GET/POST): Returns macro statistics including totalEntries, activeEntries, deletedEntries, pinnedEntries, total folders, and lastSync timestamp.
analytics (GET/POST): Returns detailed breakdowns, including entry counts grouped by entryTypes and folders.


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=ping
{"timestamp":"2026-06-20T21:21:23.722Z","email":"","status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=health
{"version":"1.0.0","schemaVersion":"1.0.0","timestamp":"2026-06-20T21:22:02.632Z","sheetId":"15dXJ4uFRnoCvKlpQQJ00x5bA3mDKDNvQGYC45l-yYUc","sheetUrl":"https://docs.google.com/spreadsheets/d/15dXJ4uFRnoCvKlpQQJ00x5bA3mDKDNvQGYC45l-yYUc/edit","vaultEntries":2,"status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=version
{"version":"1.0.0","schemaVersion":"1.0.0","status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=config
{"version":"1.0.0","schemaVersion":"1.0.0","features":{"sync":true,"folders":true,"analytics":true,"dashboard":true},"status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=initVault
{"sheetId":"15dXJ4uFRnoCvKlpQQJ00x5bA3mDKDNvQGYC45l-yYUc","sheetUrl":"https://docs.google.com/spreadsheets/d/15dXJ4uFRnoCvKlpQQJ00x5bA3mDKDNvQGYC45l-yYUc/edit","version":"1.0.0","schemaVersion":"1.0.0","status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=getVault
{"metadata":{"salt":"VjcTk9q/UT+4LjnoEz3Xc8grKpHLbQgA7im/4gmjwXc=","kdfParams":{"memoryKiB":65536,"parallelism":1,"time":3,"type":"argon2id"},"wrappedMaster":"ATowkernMkwz4crlgYkBEcNgoPY8JKqUA8zO1jsq+Ffa3J4lniaNtCiYhzh+qt0XjqvFHdLA4nx/6a1BVg==","wrappedRecovery":"AalsFXAi7ss1UW7bcfEvR2SNR+Zi9yvFJmEkwo6RuuEYsDPIJ/S0Ah51ynPZJYHA/04GZ87ozAeKIiBGdg==","formatVersion":2},"entries":[{"id":"22ae2d81-cc10-4748-a782-3bf282e910d1","domain":"squoosh.app","entryType":"password","version":1,"isDeleted":false,"updatedAt":"2026-06-20T20:15:03.585Z","displayOrder":0,"isPinned":false,"folder":"Test","payload":"AQhgbH26NGs/RsHhREhuMG4dAayNOp7oOsF7L50Xl0hTAMCXaj+8M/VuyBAsYdkFbiXFfcStKiqINal7q+o4MEGz46lCFINn72s8nf/4M3Sue4PWXfDIZYLku3uaToo4bEIlgHAV9G04xTIQveUvXcihVElrm4uCP+EtBHHQpoUWkrOyeV5yHrNcFYkMzOJIbocc4MoZpwRxTBToPj+Lbi+y+HRqDO82C+55Sp3yDytfA4t/dauBqUukrOgBquHvPxR/WoPuaB9e5c9grfx/lSCDTfNTEiCfwZFnvj6CDcSGARtBF+TlfWaXCKR2Rvf4VuVDwCY19gemdIWinhf1V7npprQrojK5df7y15DFQNrwpFGkBT6OWNVx806kih2Ar3LKLTPHPhYkwG5MTgVWYsTiVy4OkWXHISrq48GExFkkfGPeAbOoJwGOWAeTghBFZPcTIOYMmuY2s2aMnz4+YtUfTP2xfTAoRfMsOg=="},{"id":"c1d2485f-e5d7-4221-93da-bc8ed2da4251","domain":"1flex.org","entryType":"password","version":1,"isDeleted":false,"updatedAt":"2026-06-20T20:16:09.300Z","displayOrder":1,"isPinned":false,"folder":"Test2","payload":"AWMFUbvfOBfzDbzyRZptPSx4Lwz+icI+FoXSfzbS+T7xPIAmh6t3SNhFP2rdD+BfkPLrdUlYE9suHKpaO39tvV97AjiwfW4FHjFWn3aDZYkD7P3kUEgzVB9o7JIkoTnHyfESImZzFacCWl2IVpwCrBMiUl8/Ewa8nHjSsxoM4THGCpk9OnxFwr92fY+2549jBG+asjiEjAg2EJ+VFpavQqhMU0zok5zk7+PqSbACYPskr0yGON82FEVmU5pkhBg1AKgNM19QQbHEoj5dpZsY8i8hAJWbFaxgd7EM9wr10wVWbaz9rnD8jg82SzD9brgMMVMHaXpSUIYsfGgtveLPSyZQphNQ3F2SWDs+mqX0W21Nmt1TZARZbYXIn74HFPYhNNg23n0ZyQqvNnWVOGGesyeMCWzZcAoPT7oSupflFa4dJjkpJXNT7YBKgcxqIagRSU3u7bg9zEPknJBgXAly360sieDdqRE="}],"serverTimestamp":"2026-06-20T21:26:32.602Z","status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=syncEntries
{"updatedEntries":[{"id":"22ae2d81-cc10-4748-a782-3bf282e910d1","domain":"squoosh.app","entryType":"password","version":1,"isDeleted":false,"updatedAt":"2026-06-20T20:15:03.585Z","displayOrder":0,"isPinned":false,"folder":"Test","payload":"AQhgbH26NGs/RsHhREhuMG4dAayNOp7oOsF7L50Xl0hTAMCXaj+8M/VuyBAsYdkFbiXFfcStKiqINal7q+o4MEGz46lCFINn72s8nf/4M3Sue4PWXfDIZYLku3uaToo4bEIlgHAV9G04xTIQveUvXcihVElrm4uCP+EtBHHQpoUWkrOyeV5yHrNcFYkMzOJIbocc4MoZpwRxTBToPj+Lbi+y+HRqDO82C+55Sp3yDytfA4t/dauBqUukrOgBquHvPxR/WoPuaB9e5c9grfx/lSCDTfNTEiCfwZFnvj6CDcSGARtBF+TlfWaXCKR2Rvf4VuVDwCY19gemdIWinhf1V7npprQrojK5df7y15DFQNrwpFGkBT6OWNVx806kih2Ar3LKLTPHPhYkwG5MTgVWYsTiVy4OkWXHISrq48GExFkkfGPeAbOoJwGOWAeTghBFZPcTIOYMmuY2s2aMnz4+YtUfTP2xfTAoRfMsOg=="},{"id":"c1d2485f-e5d7-4221-93da-bc8ed2da4251","domain":"1flex.org","entryType":"password","version":1,"isDeleted":false,"updatedAt":"2026-06-20T20:16:09.300Z","displayOrder":1,"isPinned":false,"folder":"Test2","payload":"AWMFUbvfOBfzDbzyRZptPSx4Lwz+icI+FoXSfzbS+T7xPIAmh6t3SNhFP2rdD+BfkPLrdUlYE9suHKpaO39tvV97AjiwfW4FHjFWn3aDZYkD7P3kUEgzVB9o7JIkoTnHyfESImZzFacCWl2IVpwCrBMiUl8/Ewa8nHjSsxoM4THGCpk9OnxFwr92fY+2549jBG+asjiEjAg2EJ+VFpavQqhMU0zok5zk7+PqSbACYPskr0yGON82FEVmU5pkhBg1AKgNM19QQbHEoj5dpZsY8i8hAJWbFaxgd7EM9wr10wVWbaz9rnD8jg82SzD9brgMMVMHaXpSUIYsfGgtveLPSyZQphNQ3F2SWDs+mqX0W21Nmt1TZARZbYXIn74HFPYhNNg23n0ZyQqvNnWVOGGesyeMCWzZcAoPT7oSupflFa4dJjkpJXNT7YBKgcxqIagRSU3u7bg9zEPknJBgXAly360sieDdqRE="}],"conflicts":[],"serverTimestamp":"2026-06-20T21:28:52.518Z","status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=getFolders
{"folders":["Test","Test2"],"status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=settings
{"settings":{"autoLockTimeout":60,"sessionReunlockCooldown":1,"clipboardClearTimeout":30,"biometricEnabled":false,"autoSyncEnabled":true,"syncIntervalMinutes":1440,"showRecents":true,"recentsMaxCount":10,"faviconsEnabled":true,"theme":"light","passwordGeneratorDefaults":{"length":20,"lowercase":true,"numbers":true,"symbols":true,"uppercase":true},"autoLockMinutes":15,"syncOnLaunch":true,"syncOnSave":true,"analyticsEnabled":true},"status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=saveSettings
{"saved":0,"status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=metadata
{"metadata":{"salt":"VjcTk9q/UT+4LjnoEz3Xc8grKpHLbQgA7im/4gmjwXc=","kdfParams":{"memoryKiB":65536,"parallelism":1,"time":3,"type":"argon2id"},"wrappedMaster":"ATowkernMkwz4crlgYkBEcNgoPY8JKqUA8zO1jsq+Ffa3J4lniaNtCiYhzh+qt0XjqvFHdLA4nx/6a1BVg==","wrappedRecovery":"AalsFXAi7ss1UW7bcfEvR2SNR+Zi9yvFJmEkwo6RuuEYsDPIJ/S0Ah51ynPZJYHA/04GZ87ozAeKIiBGdg==","formatVersion":2},"status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=saveMetadata
{"saved":0,"status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=getOrder
{"order":[],"status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=saveOrder
{"saved":0,"status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=dashboard
{"totalEntries":2,"activeEntries":2,"deletedEntries":0,"pinnedEntries":0,"folders":2,"lastSync":"2026-06-20T20:16:09.300Z","status":"ok"}


https://script.google.com/macros/s/AKfycbwfhZUvxvgWI-Ye8QU49nQ5T4az6qhPj7bAInKqX4eur3dAFntQuUuNadnFvw6aAL8b/exec?action=analytics
{"activeEntries":2,"deletedEntries":0,"entryTypes":{"password":2},"folders":{"Test":1,"Test2":1},"status":"ok"}