/**
 * OKey — Core: Sync engine (transport-agnostic)
 *
 * Bidirectional delta sync between the local vault and a Google Apps Script
 * web app that fronts a Google Sheet. The remote is TRANSPORT ONLY — it stores
 * cleartext metadata + ciphertext payloads and never sees plaintext or keys.
 *
 * Injected dependencies keep this usable from both the extension (chrome
 * storage + chrome.identity token) and the PWA (IndexedDB + GIS token).
 *
 *   network.fetch(url, init)   → Response
 *   network.getAuthToken()     → bearer token | null
 *   storage                    → StorageAdapter (configs, queue, lastSync)
 */

import { STORAGE_KEYS, SYNC, APP, SHEET_NAMES } from './constants.js';
import { generateUuid, nowIso } from './util.js';
import { SyncError } from './errors.js';

const EPOCH = '1970-01-01T00:00:00.000Z';

export class SyncEngine {
  /**
   * @param {import('./adapters.js').StorageAdapter} storage
   * @param {import('./adapters.js').NetworkAdapter} network
   */
  constructor(storage, network) {
    this.storage = storage;
    this.network = network;
  }

  // ---- Sheet profiles ----

  async getProfiles() {
    const { [STORAGE_KEYS.SHEETS_CONFIG]: sheets = [] } = await this.storage.get(STORAGE_KEYS.SHEETS_CONFIG);
    return sheets;
  }

  async getActiveProfile() {
    const sheets = await this.getProfiles();
    return sheets.find((s) => s.isActive) || sheets[0] || null;
  }

  async addProfile({ label, appsScriptUrl, sheetId }) {
    const trimmedUrl = (appsScriptUrl || '').trim();
    if (!/^https:\/\/script\.google\.com\//.test(trimmedUrl)) {
      throw new SyncError('Apps Script URL must start with https://script.google.com/', 'BAD_URL');
    }
    const sheets = await this.getProfiles();
    if (sheets.length >= APP.MAX_SHEETS) throw new SyncError(`Maximum ${APP.MAX_SHEETS} vaults`, 'MAX_SHEETS');

    const trimmedLabel = (label || `Vault ${sheets.length + 1}`).trim();

    const duplicateUrl = sheets.find((s) => s.appsScriptUrl.trim() === trimmedUrl);
    if (duplicateUrl) {
      throw new SyncError('A vault with this Apps Script URL already exists', 'DUPLICATE_URL');
    }

    const duplicateLabel = sheets.find((s) => s.label.trim().toLowerCase() === trimmedLabel.toLowerCase());
    if (duplicateLabel) {
      throw new SyncError('A vault with this name already exists', 'DUPLICATE_LABEL');
    }

    const profile = {
      id: generateUuid(),
      label: trimmedLabel.slice(0, 60),
      appsScriptUrl: trimmedUrl,
      sheetId: sheetId || '',
      isActive: sheets.length === 0,
      lastSyncAt: EPOCH,
    };
    sheets.push(profile);
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
    if (profile.isActive) {
      await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: EPOCH });
    }
    return profile;
  }

  async updateProfile(id, patch) {
    const sheets = await this.getProfiles();
    const p = sheets.find((s) => s.id === id);
    if (!p) throw new SyncError('Profile not found', 'NOT_FOUND');
    if (patch.label !== undefined) {
      const trimmedLabel = String(patch.label).trim();
      const duplicateLabel = sheets.find((s) => s.id !== id && s.label.trim().toLowerCase() === trimmedLabel.toLowerCase());
      if (duplicateLabel) throw new SyncError('A vault with this name already exists', 'DUPLICATE_LABEL');
      p.label = trimmedLabel.slice(0, 60);
    }
    if (patch.appsScriptUrl !== undefined) {
      const trimmedUrl = String(patch.appsScriptUrl).trim();
      if (!/^https:\/\/script\.google\.com\//.test(trimmedUrl)) {
        throw new SyncError('Apps Script URL must start with https://script.google.com/', 'BAD_URL');
      }
      const duplicateUrl = sheets.find((s) => s.id !== id && s.appsScriptUrl.trim() === trimmedUrl);
      if (duplicateUrl) throw new SyncError('A vault with this Apps Script URL already exists', 'DUPLICATE_URL');
      if (p.appsScriptUrl !== trimmedUrl) {
        p.appsScriptUrl = trimmedUrl;
        p.lastSyncAt = EPOCH;
        if (p.isActive) {
          await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: EPOCH });
        }
      }
    }
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
    return p;
  }

  async removeProfile(id) {
    let sheets = await this.getProfiles();
    const wasActive = sheets.find((s) => s.id === id)?.isActive;
    sheets = sheets.filter((s) => s.id !== id);
    if (wasActive && sheets.length) {
      sheets[0].isActive = true;
      await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: sheets[0].lastSyncAt || EPOCH });
    } else if (wasActive && !sheets.length) {
      await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: EPOCH });
    }
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
  }

  async switchProfile(id) {
    const sheets = await this.getProfiles();
    let activeProfile = null;
    for (const s of sheets) {
      s.isActive = s.id === id;
      if (s.isActive) activeProfile = s;
    }
    await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
    if (activeProfile) {
      await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: activeProfile.lastSyncAt || EPOCH });
    }
  }

  // ---- Remote calls ----

  async _call(action, body) {
    const profile = await this.getActiveProfile();
    if (!profile?.appsScriptUrl) throw new SyncError('No vault sheet configured', 'NO_PROFILE');
    const token = await this.network.getAuthToken();
    const url = `${profile.appsScriptUrl}?action=${encodeURIComponent(action)}`;
    let res;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      res = await this.network.fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body || {}),
      });
    } catch (e) {
      throw new SyncError(`Network error: ${e.message}`, 'NETWORK');
    }
    if (!res.ok) throw new SyncError(`Server returned HTTP ${res.status}`, 'HTTP');
    const json = await res.json();
    if (json.status !== 'ok') throw new SyncError(json.message || 'Sync failed', json.code || 'REMOTE');
    return json;
  }

  /** Verify connectivity & auth. */
  async ping() {
    return this._call('ping', {});
  }

  /** Create/repair the Sheet tab structure. */
  async setupSheet() {
    return this._call('initVault', {});
  }

  /** Get or fetch unique folders list. */
  async getFolders(force = false) {
    const cached = await this.storage.get([STORAGE_KEYS.CACHED_FOLDERS, STORAGE_KEYS.FOLDERS_CACHE_TIME]);
    const list = cached[STORAGE_KEYS.CACHED_FOLDERS] || [];
    const time = cached[STORAGE_KEYS.FOLDERS_CACHE_TIME] || 0;
    const now = Date.now();

    const profile = await this.getActiveProfile();
    if (!profile?.appsScriptUrl) {
      return list;
    }

    // Refresh if force is true, list is empty, or cache is older than 24 hours (86400000 ms)
    if (force || !list.length || (now - time) > 24 * 60 * 60 * 1000) {
      try {
        const result = await this._call('getFolders', {});
        if (result && result.folders) {
          await this.storage.set({
            [STORAGE_KEYS.CACHED_FOLDERS]: result.folders,
            [STORAGE_KEYS.FOLDERS_CACHE_TIME]: now,
          });
          return result.folders;
        }
      } catch (e) {
        if (e?.code !== 'NO_PROFILE') console.error('Failed to fetch folders:', e);
      }
    }
    return list;
  }

  /**
   * Push the (non-sensitive) key material so a new device can unlock from the
   * Sheet. wrappedMaster/wrappedRecovery are useless without the secrets.
   * @param {{salt:string,kdfParams:object,wrappedMaster:string,wrappedRecovery:string}} material
   */
  async pushKeyMaterial(material) {
    return this._call('saveMetadata', {
      metadata: {
        salt: material.salt,
        kdfParams: material.kdfParams,
        wrappedMaster: material.wrappedMaster,
        wrappedRecovery: material.wrappedRecovery,
        formatVersion: APP.VAULT_FORMAT_VERSION,
      },
    });
  }

  /** Pull key material + records from the Sheet (device migration / first sync). */
  async pullVault() {
    return this._call('getVault', {});
  }

  /** Push non-sensitive user settings to the Sheet (feedback #14). */
  async pushSettings(settings) {
    return this._call('saveSettings', { settings });
  }

  /** Pull user settings from the Sheet. */
  async pullSettings() {
    const r = await this._call('settings', {});
    return r.settings || {};
  }

  /** Check version compatibility. */
  async checkVersion() {
    try {
      const r = await this._call('version', {});
      return { 
        backendVersion: r.version, 
        backendSchema: r.schemaVersion,
        localVersion: APP.APPSCRIPT_VERSION,
        localSchema: APP.SCHEMA_VERSION,
        mismatch: r.version !== APP.APPSCRIPT_VERSION || r.schemaVersion !== APP.SCHEMA_VERSION
      };
    } catch (e) {
      if (e.code === 'NO_PROFILE') return { mismatch: false }; // no backend yet
      throw e;
    }
  }

  /**
   * Fetch vault metadata (salt, kdfParams, wrappedMaster) from a sheet without needing an active profile.
   * Useful for "Restore from Sheet" flow and validating before blind sync.
   * @param {string} [explicitUrl] Optional URL. If omitted, uses the active profile.
   */
  async fetchMetadata(explicitUrl) {
    let url = explicitUrl;
    if (!url) {
      const profile = await this.getActiveProfile();
      if (!profile?.appsScriptUrl) throw new SyncError('No vault sheet configured', 'NO_PROFILE');
      url = profile.appsScriptUrl;
    }
    const trimmedUrl = url.trim();
    if (!/^https:\/\/script\.google\.com\//.test(trimmedUrl)) {
      throw new SyncError('Apps Script URL must start with https://script.google.com/', 'BAD_URL');
    }
    
    const token = await this.network.getAuthToken();
    const endpoint = `${trimmedUrl}?action=metadata`;
    let res;
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      res = await this.network.fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
    } catch (e) {
      throw new SyncError(`Network error: ${e.message}`, 'NETWORK');
    }
    
    if (!res.ok) throw new SyncError(`Server returned HTTP ${res.status}`, 'HTTP');
    const json = await res.json();
    if (json.status !== 'ok') throw new SyncError(json.message || 'Failed to fetch metadata', json.code || 'REMOTE');
    return json.metadata || {};
  }

  /** Fetch Vault Dashboard Stats. */
  async fetchDashboard() {
    return this._call('dashboard', {});
  }

  /** Fetch Vault Analytics Stats. */
  async fetchAnalytics() {
    return this._call('analytics', {});
  }

  /**
   * Perform a delta sync for the given vault.
   * @param {import('./vault.js').Vault} vault unlocked vault
   * @returns {Promise<{ pushed:number, pulled:number, conflicts:number }>}
   */
  async sync(vault) {
    const profile = await this.getActiveProfile();
    const { [STORAGE_KEYS.LAST_SYNC_AT]: globalLastSyncAt = EPOCH } = await this.storage.get(STORAGE_KEYS.LAST_SYNC_AT);
    const lastSyncAt = profile ? (profile.lastSyncAt || EPOCH) : globalLastSyncAt;
    const records = await vault.exportRecords();
    const modified = records.filter((r) => (r.updatedAt || EPOCH) > lastSyncAt);

    let result;
    try {
      result = await this._call('syncEntries', { lastSyncAt, entries: modified });
    } catch (e) {
      await this._enqueue(modified);
      throw e;
    }

    const pulled = result.updatedEntries || [];
    const { applied } = await vault.mergeRemoteRecords(pulled);
    
    const nextSyncAt = result.serverTimestamp || nowIso();
    if (profile) {
      profile.lastSyncAt = nextSyncAt;
      const sheets = await this.getProfiles();
      const idx = sheets.findIndex((s) => s.id === profile.id);
      if (idx !== -1) {
        sheets[idx] = profile;
        await this.storage.set({ [STORAGE_KEYS.SHEETS_CONFIG]: sheets });
      }
    }
    await this.storage.set({ [STORAGE_KEYS.LAST_SYNC_AT]: nextSyncAt });
    return { pushed: modified.length, pulled: applied, conflicts: (result.conflicts || []).length };
  }

  // ---- Offline queue ----

  /** @private */
  async _enqueue(records) {
    if (!records?.length) return;
    const { [STORAGE_KEYS.OFFLINE_QUEUE]: queue = [] } = await this.storage.get(STORAGE_KEYS.OFFLINE_QUEUE);
    queue.push({ id: generateUuid(), records, queuedAt: nowIso(), retryCount: 0 });
    await this.storage.set({ [STORAGE_KEYS.OFFLINE_QUEUE]: queue });
  }

  /** Flush the offline queue; returns counts. */
  async flushQueue() {
    const { [STORAGE_KEYS.OFFLINE_QUEUE]: queue = [] } = await this.storage.get(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!queue.length) return { processed: 0, dropped: 0, remaining: 0 };
    const remaining = [];
    let processed = 0;
    let dropped = 0;
    for (const item of queue) {
      if (item.retryCount >= SYNC.MAX_RETRIES) {
        dropped++;
        continue;
      }
      try {
        await this._call('syncEntries', { lastSyncAt: EPOCH, entries: item.records });
        processed++;
      } catch {
        remaining.push({ ...item, retryCount: item.retryCount + 1 });
      }
    }
    await this.storage.set({ [STORAGE_KEYS.OFFLINE_QUEUE]: remaining });
    return { processed, dropped, remaining: remaining.length };
  }
}

export { SHEET_NAMES };
