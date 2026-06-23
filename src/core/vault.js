/**
 * OKey — Core: Vault
 *
 * The encrypted credential store. Holds decrypted entries in RAM only while
 * unlocked; everything at rest is AES-256-GCM ciphertext under a random DEK.
 *
 * KEY HIERARCHY
 *   masterKEK   = KDF(masterPassword, salt)           — derived, transient
 *   recoveryKEK = HKDF(recoveryMnemonicEntropy, salt) — derived, transient
 *   DEK         = random 256-bit key                  — wraps all entry payloads
 *   stored at rest: wrap(DEK, masterKEK), wrap(DEK, recoveryKEK)
 *
 *   Unlock      : derive masterKEK → unwrap DEK → decrypt entries
 *   Change pw   : derive new masterKEK (new salt) → re-wrap DEK (entries untouched)
 *   Recover     : derive recoveryKEK → unwrap DEK → then set a new master password
 *   Re-key      : new DEK → re-encrypt every entry → re-wrap under master+recovery
 *
 * AT-REST ENTRY RECORD (per entry — enables delta sync & 10k-entry scale):
 *   { id, domain, entryType, version, isDeleted, updatedAt, displayOrder, isPinned, payload }
 *   where `payload` is the GCM envelope of all remaining (sensitive) fields.
 *   Only `domain` is cleartext metadata (searchable, per product decision).
 */

import { APP, STORAGE_KEYS, LEGACY_STORAGE_KEYS, ENTRY_TYPES, SECURITY } from './constants.js';
import {
  generateDek, importAesKey, encryptJson, decryptJson, wrapKeyMaterial, unwrapKeyMaterial,
  generateSalt, secureWipe,
} from './crypto.js';
import { bytesToBase64, base64ToBytes } from './encoding.js';
import { deriveKek, getRecommendedKdfParams } from './kdf.js';
import { generateRecoveryMnemonic, deriveRecoveryKek } from './recovery.js';
import { createEntry, validateEntry } from './schema.js';
import { generateUuid, nowIso, deepClone } from './util.js';
import { VaultLockedError, DecryptionError, ValidationError } from './errors.js';

/** Fields kept cleartext in the at-rest record (everything else is encrypted). */
const META_KEYS = ['id', 'domain', 'entryType', 'version', 'isDeleted', 'updatedAt', 'displayOrder', 'isPinned', 'folder'];

export class Vault {
  /** @param {import('./adapters.js').StorageAdapter} storage */
  constructor(storage) {
    this.storage = storage;
    /** @type {Uint8Array|null} */ this._dek = null;
    /** @type {CryptoKey|null} */ this._dekKey = null;
    /** @type {import('./schema.js').VaultEntry[]} */ this._entries = [];
    this._unlocked = false;
    /** @type {Uint8Array|null} */ this._salt = null;
    this._kdfParams = null;
    /** id -> { version, record } cache so unchanged entries aren't re-encrypted. */
    this._payloadCache = new Map();
  }

  // ---- State ----

  isUnlocked() {
    return this._unlocked && this._dekKey !== null;
  }

  /** @returns {Promise<{ isSetup: boolean, formatVersion: number|null }>} */
  async getState() {
    const s = await this.storage.get([STORAGE_KEYS.SETUP_COMPLETE, STORAGE_KEYS.VAULT_METADATA]);
    return {
      isSetup: !!s[STORAGE_KEYS.SETUP_COMPLETE],
      formatVersion: s[STORAGE_KEYS.VAULT_METADATA]?.formatVersion ?? null,
    };
  }

  // ---- Setup / Unlock / Lock ----

  /**
   * First-time vault creation.
   * @param {string} masterPassword
   * @returns {Promise<{ recoveryMnemonic: string }>} the recovery key — show once.
   */
  async setup(masterPassword) {
    assertStrongPassword(masterPassword);
    const salt = generateSalt();
    const kdfParams = await getRecommendedKdfParams();
    const dek = generateDek();

    const { kek: masterKek } = await deriveKek(masterPassword, salt, kdfParams);
    const recoveryMnemonic = generateRecoveryMnemonic();
    const recoveryKek = await deriveRecoveryKek(recoveryMnemonic, salt);

    const wrappedMaster = await wrapKeyMaterial(dek, masterKek);
    const wrappedRecovery = await wrapKeyMaterial(dek, recoveryKek);
    secureWipe(masterKek, recoveryKek);

    this._dek = dek;
    this._dekKey = await importAesKey(dek, false);
    this._entries = [];
    this._salt = salt;
    this._kdfParams = kdfParams;
    this._unlocked = true;
    this._payloadCache.clear();

    await this.storage.set({
      [STORAGE_KEYS.VAULT_SALT]: bytesToBase64(salt),
      [STORAGE_KEYS.KDF_PARAMS]: kdfParams,
      [STORAGE_KEYS.WRAPPED_BY_MASTER]: wrappedMaster,
      [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: wrappedRecovery,
      [STORAGE_KEYS.VAULT_DATA]: [],
      [STORAGE_KEYS.VAULT_METADATA]: { formatVersion: APP.VAULT_FORMAT_VERSION, createdAt: nowIso() },
      [STORAGE_KEYS.SETUP_COMPLETE]: true,
    });

    return { recoveryMnemonic };
  }

  /**
   * Initialize local storage from a remote sheet's key material and test decryption.
   * @param {string} masterPassword 
   * @param {Object} metadata The salt, wrappedMaster, and kdfParams from the sheet
   * @param {Array} entries The encrypted entries from the sheet
   */
  async restoreFromRemote(masterPassword, metadata, entries) {
    if (!metadata || !metadata.salt || !metadata.wrappedMaster) {
      throw new ValidationError('Remote vault does not contain valid key material');
    }
    
    const salt = base64ToBytes(metadata.salt);
    const kdfParams = metadata.kdfParams;
    const { kek } = await deriveKek(masterPassword, salt, kdfParams);
    
    let dek;
    try {
      dek = await unwrapKeyMaterial(metadata.wrappedMaster, kek);
    } catch (e) {
      secureWipe(kek);
      throw new DecryptionError('Incorrect master password for the remote vault');
    }
    secureWipe(kek);
    
    this._dek = dek;
    this._dekKey = await importAesKey(dek, false);
    this._salt = salt;
    this._kdfParams = kdfParams;
    this._unlocked = true;
    this._payloadCache.clear();
    
    this._entries = await this._decryptRecords(entries || []);
    
    await this.storage.set({
      [STORAGE_KEYS.VAULT_SALT]: metadata.salt,
      [STORAGE_KEYS.KDF_PARAMS]: kdfParams,
      [STORAGE_KEYS.WRAPPED_BY_MASTER]: metadata.wrappedMaster,
      [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: metadata.wrappedRecovery || '',
      [STORAGE_KEYS.VAULT_DATA]: entries || [],
      [STORAGE_KEYS.VAULT_METADATA]: { formatVersion: metadata.formatVersion || APP.VAULT_FORMAT_VERSION, createdAt: nowIso() },
      [STORAGE_KEYS.SETUP_COMPLETE]: true,
    });
  }

  /**
   * Unlock with the master password.
   * @param {string} masterPassword
   * @returns {Promise<void>}
   * @throws {DecryptionError} on wrong password
   */
  async unlock(masterPassword) {
    const c = await this._loadContainer();
    if (!c.salt || !c.wrappedMaster) throw new ValidationError('Vault is not initialized');

    const fails = (await this.storage.get(STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS)) || 0;
    if (fails >= SECURITY.MAX_FAILED_UNLOCKS) {
      throw new Error(`Too many incorrect attempts. Vault has been reset for your security.`);
    }

    const { kek } = await deriveKek(masterPassword, c.salt, c.kdfParams);
    let dek;
    try {
      dek = await unwrapKeyMaterial(c.wrappedMaster, kek);
    } catch (e) {
      secureWipe(kek);
      const newFails = fails + 1;
      await this.storage.set({ [STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS]: newFails });
      
      if (newFails >= SECURITY.MAX_FAILED_UNLOCKS) {
        const keys = [...Object.values(STORAGE_KEYS), ...Object.keys(LEGACY_STORAGE_KEYS)];
        await this.storage.remove(keys);
        throw new DecryptionError(`Too many incorrect attempts. Vault has been completely wiped for security.`);
      } else if (newFails >= SECURITY.WARN_FAILED_UNLOCKS) {
        throw new DecryptionError(`Incorrect master PIN. WARNING: ${SECURITY.MAX_FAILED_UNLOCKS - newFails} attempts remaining before vault is wiped!`);
      }
      throw new DecryptionError('Incorrect master PIN');
    }
    secureWipe(kek);
    
    if (fails > 0) {
      await this.storage.remove(STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS);
    }
    
    await this._activateWithDek(dek, c);
  }

  /**
   * Re-activate from a previously exported DEK (session re-unlock / biometric).
   * @param {Uint8Array} dekBytes
   */
  async unlockWithDek(dekBytes) {
    const c = await this._loadContainer();
    await this._activateWithDek(Uint8Array.from(dekBytes), c);
  }

  /** @private */
  async _activateWithDek(dek, container) {
    this._dekKey = await importAesKey(dek, false);
    this._dek = dek;
    this._salt = container.salt;
    this._kdfParams = container.kdfParams;
    this._payloadCache.clear();
    this._entries = await this._decryptRecords(container.records);
    this._unlocked = true;
  }

  /** Wipe all sensitive state from RAM. */
  lock() {
    secureWipe(this._dek);
    this._dek = null;
    this._dekKey = null;
    this._entries = [];
    this._salt = null;
    this._kdfParams = null;
    this._payloadCache.clear();
    this._unlocked = false;
  }

  /**
   * Copy of the raw DEK bytes (for session caching / biometric enrollment).
   * Caller MUST wipe the copy when done.
   * @returns {Uint8Array}
   */
  exportDek() {
    this._assertUnlocked();
    return Uint8Array.from(this._dek);
  }

  // ---- Recovery & key management ----

  /**
   * Recover the DEK using the recovery mnemonic. Leaves the vault unlocked.
   * The caller should immediately prompt for a new master password.
   * @param {string} mnemonic
   */
  async recoverWithMnemonic(mnemonic) {
    const c = await this._loadContainer();
    if (!c.salt || !c.wrappedRecovery) throw new ValidationError('No recovery key is configured');
    const recoveryKek = await deriveRecoveryKek(mnemonic, c.salt);
    let dek;
    try {
      dek = await unwrapKeyMaterial(c.wrappedRecovery, recoveryKek);
    } catch {
      secureWipe(recoveryKek);
      throw new DecryptionError('Recovery key did not match this vault');
    }
    secureWipe(recoveryKek);
    await this._activateWithDek(dek, c);
  }

  /**
   * Set a new master password (vault must be unlocked). Re-wraps the DEK under a
   * fresh salt; entry ciphertext is untouched.
   * @param {string} newPassword
   */
  async changeMasterPassword(newPassword) {
    this._assertUnlocked();
    assertStrongPassword(newPassword);
    const salt = this._salt || generateSalt();
    const kdfParams = this._kdfParams || await getRecommendedKdfParams();
    const { kek } = await deriveKek(newPassword, salt, kdfParams);
    const wrappedMaster = await wrapKeyMaterial(this._dek, kek);
    secureWipe(kek);
    this._salt = salt;
    this._kdfParams = kdfParams;
    await this.storage.set({
      [STORAGE_KEYS.VAULT_SALT]: bytesToBase64(salt),
      [STORAGE_KEYS.KDF_PARAMS]: kdfParams,
      [STORAGE_KEYS.WRAPPED_BY_MASTER]: wrappedMaster,
    });
  }

  /**
   * Regenerate the recovery key (vault must be unlocked). Returns the new
   * mnemonic to display once. Invalidates any previous recovery key.
   * @returns {Promise<{ recoveryMnemonic: string }>}
   */
  async regenerateRecovery() {
    this._assertUnlocked();
    const recoveryMnemonic = generateRecoveryMnemonic();
    const recoveryKek = await deriveRecoveryKek(recoveryMnemonic, this._salt);
    const wrappedRecovery = await wrapKeyMaterial(this._dek, recoveryKek);
    secureWipe(recoveryKek);
    await this.storage.set({ [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: wrappedRecovery });
    return { recoveryMnemonic };
  }

  /**
   * Full re-key: new DEK, re-encrypt every entry, re-wrap under master+recovery.
   * Requires the current master password. Returns a fresh recovery mnemonic.
   * @param {string} masterPassword
   * @returns {Promise<{ recoveryMnemonic: string }>}
   */
  async rekey(masterPassword) {
    this._assertUnlocked();
    // Verify password before destructive op.
    const c = await this._loadContainer();
    const { kek: verifyKek } = await deriveKek(masterPassword, c.salt, c.kdfParams);
    try {
      const probe = await unwrapKeyMaterial(c.wrappedMaster, verifyKek);
      secureWipe(probe);
    } catch {
      secureWipe(verifyKek);
      throw new DecryptionError('Incorrect master password');
    }
    secureWipe(verifyKek);

    const newDek = generateDek();
    const salt = generateSalt();
    const kdfParams = await getRecommendedKdfParams();
    const { kek: masterKek } = await deriveKek(masterPassword, salt, kdfParams);
    const recoveryMnemonic = generateRecoveryMnemonic();
    const recoveryKek = await deriveRecoveryKek(recoveryMnemonic, salt);
    const wrappedMaster = await wrapKeyMaterial(newDek, masterKek);
    const wrappedRecovery = await wrapKeyMaterial(newDek, recoveryKek);
    secureWipe(masterKek, recoveryKek, this._dek);

    this._dek = newDek;
    this._dekKey = await importAesKey(newDek, false);
    this._salt = salt;
    this._kdfParams = kdfParams;
    this._payloadCache.clear(); // force re-encryption of every entry

    await this.storage.set({
      [STORAGE_KEYS.VAULT_SALT]: bytesToBase64(salt),
      [STORAGE_KEYS.KDF_PARAMS]: kdfParams,
      [STORAGE_KEYS.WRAPPED_BY_MASTER]: wrappedMaster,
      [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: wrappedRecovery,
    });
    await this._persist();
    return { recoveryMnemonic };
  }

  // ---- CRUD ----

  /**
   * @param {Object} [filters]
   * @param {string} [filters.type]
   * @param {boolean} [filters.favoritesOnly]
   * @param {boolean} [filters.includeDeleted]
   * @returns {import('./schema.js').VaultEntry[]}
   */
  getEntries(filters = {}) {
    if (!this._unlocked) return [];
    let list = this._entries.filter((e) => filters.includeDeleted || !e.isDeleted);
    if (filters.type) list = list.filter((e) => e.entryType === filters.type);
    if (filters.favoritesOnly) list = list.filter((e) => e.isFavorite);
    list = list.slice().sort(entrySort);
    return list.map(deepClone);
  }

  getEntry(id) {
    if (!this._unlocked) return null;
    const e = this._entries.find((x) => x.id === id && !x.isDeleted);
    return e ? deepClone(e) : null;
  }

  /** @param {Partial<import('./schema.js').VaultEntry>} data */
  async addEntry(data) {
    this._assertUnlocked();
    if (this._entries.filter((e) => !e.isDeleted).length >= APP.MAX_ENTRIES) {
      throw new ValidationError(`Maximum of ${APP.MAX_ENTRIES} entries reached`);
    }
    const entry = createEntry(
      { ...data, displayOrder: data.displayOrder ?? this._entries.length },
      generateUuid,
      nowIso,
    );
    validateEntry(entry);
    this._entries.push(entry);
    await this._persist();
    return deepClone(entry);
  }

  async updateEntry(id, updates) {
    this._assertUnlocked();
    const e = this._entries.find((x) => x.id === id && !x.isDeleted);
    if (!e) throw new ValidationError('Entry not found');
    const merged = createEntry({ ...e, ...updates, id: e.id, createdAt: e.createdAt }, generateUuid, nowIso);
    merged.updatedAt = nowIso();
    merged.version = e.version + 1;
    validateEntry(merged);
    Object.assign(e, merged);
    await this._persist();
    return deepClone(e);
  }

  /** Soft-delete (tombstone retained for sync). */
  async deleteEntry(id) {
    this._assertUnlocked();
    const e = this._entries.find((x) => x.id === id);
    if (!e) throw new ValidationError('Entry not found');
    e.isDeleted = true;
    e.updatedAt = nowIso();
    e.version += 1;
    await this._persist();
  }

  async deleteEntries(ids) {
    this._assertUnlocked();
    const set = new Set(ids);
    let changed = false;
    for (const e of this._entries) {
      if (set.has(e.id) && !e.isDeleted) {
        e.isDeleted = true;
        e.updatedAt = nowIso();
        e.version += 1;
        changed = true;
      }
    }
    if (changed) await this._persist();
  }

  /** Mark an entry used (updates lastUsedAt without bumping sync version). */
  async touchEntry(id) {
    if (!this._unlocked) return;
    const e = this._entries.find((x) => x.id === id);
    if (e) {
      e.lastUsedAt = nowIso();
      // lastUsedAt lives in the encrypted payload but doesn't bump version,
      // so invalidate the cache to force this entry's payload to re-encrypt.
      this._payloadCache.delete(id);
      await this._persist();
    }
  }

  async reorderEntries(orderUpdates) {
    this._assertUnlocked();
    for (const { id, displayOrder } of orderUpdates) {
      const e = this._entries.find((x) => x.id === id);
      if (e) {
        e.displayOrder = displayOrder;
        e.updatedAt = nowIso();
        e.version += 1;
      }
    }
    await this._persist();
  }

  /**
   * Search across cleartext + decrypted metadata fields.
   * @param {string} query
   */
  search(query) {
    if (!this._unlocked) return [];
    const q = String(query || '').trim().toLowerCase();
    if (!q) return this.getEntries();
    return this._entries
      .filter((e) => !e.isDeleted)
      .filter((e) =>
        [e.domain, e.siteName, e.nickname, e.username, ...(e.tags || [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
      .slice()
      .sort(entrySort)
      .map(deepClone);
  }

  /** All non-deleted passwords (for reuse detection in the generator). */
  allPasswords() {
    if (!this._unlocked) return [];
    return this._entries.filter((e) => !e.isDeleted && e.password).map((e) => e.password);
  }

  // ---- Sync surface ----

  /**
   * At-rest records (cleartext metadata + encrypted payload) for pushing to a
   * remote. Safe to transmit: payloads are ciphertext.
   * @returns {Promise<Array>}
   */
  async exportRecords() {
    this._assertUnlocked();
    await this._persist(); // ensure cache is current
    const { [STORAGE_KEYS.VAULT_DATA]: records = [] } = await this.storage.get(STORAGE_KEYS.VAULT_DATA);
    return records;
  }

  /**
   * Merge remote records into the local vault (last-writer-wins by version then
   * updatedAt). Remote payloads are decrypted with the shared DEK.
   * @param {Array} remoteRecords
   * @returns {Promise<{ applied: number }>}
   */
  async mergeRemoteRecords(remoteRecords) {
    this._assertUnlocked();
    const byId = new Map(this._entries.map((e) => [e.id, e]));
    let applied = 0;
    for (const rec of remoteRecords || []) {
      if (!rec || !rec.id) continue;
      const local = byId.get(rec.id);
      const remoteNewer =
        !local ||
        rec.version > local.version ||
        (rec.version === local.version && rec.updatedAt > local.updatedAt);
      if (!remoteNewer) continue;
      const decoded = await this._recordToEntry(rec);
      if (!decoded) continue;
      if (local) Object.assign(local, decoded);
      else {
        this._entries.push(decoded);
        byId.set(decoded.id, decoded);
      }
      applied++;
    }
    if (applied) await this._persist();
    return { applied };
  }

  // ---- Persistence (private) ----

  /** @private */
  async _loadContainer() {
    const s = await this.storage.get([
      STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER,
      STORAGE_KEYS.WRAPPED_BY_RECOVERY, STORAGE_KEYS.VAULT_DATA,
    ]);
    return {
      salt: s[STORAGE_KEYS.VAULT_SALT] ? base64ToBytes(s[STORAGE_KEYS.VAULT_SALT]) : null,
      kdfParams: s[STORAGE_KEYS.KDF_PARAMS] || null,
      wrappedMaster: s[STORAGE_KEYS.WRAPPED_BY_MASTER] || null,
      wrappedRecovery: s[STORAGE_KEYS.WRAPPED_BY_RECOVERY] || null,
      records: s[STORAGE_KEYS.VAULT_DATA] || [],
    };
  }

  /** @private Decrypt an array of at-rest records into full entries. */
  async _decryptRecords(records) {
    const out = [];
    for (const rec of records) {
      const entry = await this._recordToEntry(rec);
      if (entry) {
        out.push(entry);
        this._payloadCache.set(entry.id, { version: entry.version, record: rec });
      }
    }
    return out;
  }

  /** @private */
  async _recordToEntry(rec) {
    try {
      const payload = rec.payload ? await decryptJson(rec.payload, this._dekKey) : {};
      return createEntry(
        {
          ...payload,
          id: rec.id,
          domain: rec.domain,
          entryType: rec.entryType,
          version: rec.version,
          isDeleted: rec.isDeleted,
          updatedAt: rec.updatedAt,
          displayOrder: rec.displayOrder,
          isPinned: rec.isPinned,
          folder: rec.folder,
        },
        generateUuid,
        nowIso,
      );
    } catch {
      // A record we cannot decrypt is skipped rather than crashing the whole unlock.
      return null;
    }
  }

  /** @private Encrypt changed entries and persist the records array. */
  async _persist() {
    if (!this._dekKey) throw new VaultLockedError('Cannot persist a locked vault');
    const records = [];
    const liveIds = new Set();
    for (const e of this._entries) {
      liveIds.add(e.id);
      const cached = this._payloadCache.get(e.id);
      if (cached && cached.version === e.version) {
        // Metadata may still have changed (lastUsedAt doesn't bump version, but
        // it lives in the payload) → refresh only when version unchanged AND
        // the cached record's meta matches.
        const rec = withMeta(e, cached.record.payload);
        records.push(rec);
        continue;
      }
      const payload = await encryptJson(payloadFields(e), this._dekKey);
      const rec = withMeta(e, payload);
      records.push(rec);
      this._payloadCache.set(e.id, { version: e.version, record: rec });
    }
    for (const id of this._payloadCache.keys()) if (!liveIds.has(id)) this._payloadCache.delete(id);
    await this.storage.set({ [STORAGE_KEYS.VAULT_DATA]: records });
  }

  _assertUnlocked() {
    if (!this.isUnlocked()) throw new VaultLockedError();
  }
}

// ---- helpers ----

function entrySort(a, b) {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
  if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
  return (a.nickname || a.siteName || a.domain || '').localeCompare(b.nickname || b.siteName || b.domain || '');
}

/** Build an at-rest record's cleartext metadata + payload. */
function withMeta(entry, payload) {
  const rec = { payload };
  for (const k of META_KEYS) rec[k] = entry[k];
  return rec;
}

/** Fields that go into the encrypted payload (everything not cleartext metadata). */
function payloadFields(entry) {
  const { siteName, nickname, tags, matchPatterns, isFavorite, createdAt, lastUsedAt,
    username, password, totpSecret, notes, customFields, schemaVersion } = entry;
  return { siteName, nickname, tags, matchPatterns, isFavorite, createdAt, lastUsedAt,
    username, password, totpSecret, notes, customFields, schemaVersion };
}

function assertStrongPassword(pw) {
  if (typeof pw !== 'string' || pw.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) {
    throw new ValidationError(`Master PIN must be at least ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} digits`);
  }
  if (!/^\d+$/.test(pw)) {
    throw new ValidationError('Master PIN must contain only digits');
  }
}

export { ENTRY_TYPES };
