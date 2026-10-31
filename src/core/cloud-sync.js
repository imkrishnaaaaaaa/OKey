/**
 * OKey — Core: cloud sync controller
 *
 * Orchestrates Vault ⇄ CloudStore for a signed-in user:
 *   • delta sync (push local changes, pull remote changes)
 *   • first-run restore from an existing cloud vault
 *   • one-time "Move to cloud" migration of a local-only vault
 *
 * The UI owns scheduling (unlock/focus/interval) and error display; this
 * module owns semantics.
 */

import { STORAGE_KEYS } from './constants.js';
import { SYNC_EPOCH, CloudError } from './cloud.js';
import { mergeRemoteSettings } from './settings.js';

/** What a record looks like in the cloud: enough to tell if it changed. */
const stamp = (r) => `${r.version}:${r.updatedAt}`;

export class CloudSync {
  /**
   * @param {object} opts
   * @param {import('./adapters.js').StorageAdapter} opts.store
   * @param {import('./cloud.js').CloudStore} opts.cloud
   * @param {() => Promise<string|null>} opts.getUid
   * @param {() => Promise<string|null>} opts.getLastSyncAt  per-user cursor getter/setter are
   *        provided by the caller so multiple accounts never share cursors.
   * @param {(iso:string) => Promise<void>} opts.setLastSyncAt
   */
  constructor({ store, cloud, getUid, getLastSyncAt, setLastSyncAt }) {
    this.store = store;
    this.cloud = cloud;
    this.getUid = getUid;
    this.getLastSyncAt = getLastSyncAt;
    this.setLastSyncAt = setLastSyncAt;
    this._queueing = false;
  }

  /**
   * Delta sync for an unlocked vault: pull, merge, then push what changed here.
   *  - Pull first, so a lower local version never overwrites a higher cloud one.
   *  - The cursor is a server time (syncedAt), so no device clock matters.
   *  - A ledger of "what the cloud holds" per entry decides what to push. It is
   *    filled from pulls and pushes, so remote changes are never sent back.
   * A failed pull or push throws before the cursor moves, so the next sync
   * redoes the same work.
   * @returns {Promise<{pushed:number,pulled:number}>}
   */
  async sync(vault) {
    const uid = await this.getUid();
    if (!uid) throw new Error('Not signed in');
    await this._syncMeta(uid);

    const { records: remote, cursor } = await this.cloud.pullEntriesDelta(uid, (await this.getLastSyncAt()) || SYNC_EPOCH);
    let pulled = 0;
    if (remote.length) ({ applied: pulled } = await vault.mergeRemoteRecords(remote));

    const ledger = await this._loadLedger(uid);
    for (const r of remote) ledger[r.id] = stamp(r);
    const modified = (await vault.exportRecords()).filter((r) => ledger[r.id] !== stamp(r));
    const pushed = await this.cloud.pushEntries(uid, modified);
    for (const r of modified) ledger[r.id] = stamp(r);

    await this._saveLedger(uid, ledger);
    await this.setLastSyncAt(cursor);
    // Older versions kept an offline queue here. Its copies are stale, so drop them.
    await this.store.remove(STORAGE_KEYS.LEGACY_OFFLINE_QUEUE);
    return { pushed, pulled };
  }

  _ledgerKey(uid) { return `okey_pushed_${uid}`; }

  async _loadLedger(uid) {
    const k = this._ledgerKey(uid);
    return (await this.store.get(k))[k] || {};
  }

  _saveLedger(uid, ledger) { return this.store.set({ [this._ledgerKey(uid)]: ledger }); }

  /** True when the signed-in account already has a vault in the cloud. */
  async hasCloudVault() {
    const uid = await this.getUid();
    if (!uid) throw new Error('Not signed in');
    return !!(await this.cloud.pullMeta(uid))?.salt;
  }

  /**
   * New-device restore: open the cloud vault with the 24 recovery words and
   * seal it under a new local PIN. Writes nothing when the words are wrong.
   */
  async restoreFromCloud(vault, mnemonic, newPin) {
    const uid = await this.getUid();
    if (!uid) throw new Error('Not signed in');
    const meta = await this.cloud.pullMeta(uid);
    if (!meta?.salt) throw new Error('No cloud vault found for this account');
    const { records, cursor } = await this.cloud.pullEntriesDelta(uid, SYNC_EPOCH);
    await vault.restoreWithRecovery(mnemonic, newPin, meta, records);
    await this._saveLedger(uid, Object.fromEntries(records.map((r) => [r.id, stamp(r)])));
    await this.setLastSyncAt(cursor);
  }

  /**
   * One-time migration: push the local vault's key material + every record to
   * the signed-in account. Idempotent by entry id/version.
   */
  async moveToCloud(vault) {
    return (await this.sync(vault)).pushed;
  }

  /** Merge remote settings over local ones through the allowlist gate. */
  async pullSettings(settings, { apply }) {
    const uid = await this.getUid();
    if (!uid) return settings;
    const remote = await this.cloud.pullSettings(uid);
    if (!remote) return settings;
    const merged = mergeRemoteSettings(settings, remote);
    apply(merged);
    return merged;
  }

  async pushSettings(settings) {
    const uid = await this.getUid();
    if (!uid) return;
    await this.cloud.pushSettings(uid, settings);
  }

  /**
   * Keeps the cloud meta in step with this device, once per account and key set.
   *  - Another salt means another vault (another DEK): throw VAULT_EXISTS.
   *    Writing there would make the cloud vault unreadable.
   *  - A newer recovery key in the cloud (higher recoveryVersion) wins: copy it
   *    here and never push over it. Otherwise a device that missed the change
   *    would bring back the old words.
   *  - No meta, a legacy wrappedMaster, or a newer recovery key here: upload ours.
   * Old meta with no recoveryVersion counts as 1. The pass is cached per uid +
   * salt + version, so a local reset or a new recovery key checks again.
   */
  async _syncMeta(uid) {
    let local = await this._localMeta();
    if (this._metaKey === this._metaKeyFor(uid, local)) return;
    const remote = await this.cloud.pullMeta(uid);
    if (remote?.salt && remote.salt !== local.salt) {
      throw new CloudError('This account already holds a different vault. Reset this device and restore it with your 24 recovery words, or sign in with another account.', 'VAULT_EXISTS');
    }
    const remoteVersion = Number(remote?.recoveryVersion) || 1;
    if (remote?.wrappedRecovery && remoteVersion > local.recoveryVersion) {
      await this.store.set({
        [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: remote.wrappedRecovery,
        [STORAGE_KEYS.RECOVERY_VERSION]: remoteVersion,
      });
      local = await this._localMeta();
    } else if (!remote?.salt || remote.wrappedMaster || local.recoveryVersion > remoteVersion) {
      await this.cloud.pushMeta(uid, local);
    }
    this._metaKey = this._metaKeyFor(uid, local);
  }

  _metaKeyFor(uid, local) { return `${uid}:${local.salt}:${local.recoveryVersion}`; }

  /** The key material that may leave this device. Never the PIN wrap. */
  async _localMeta() {
    const c = await this.store.get([
      STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_RECOVERY, STORAGE_KEYS.RECOVERY_VERSION,
    ]);
    return {
      salt: c[STORAGE_KEYS.VAULT_SALT],
      kdfParams: c[STORAGE_KEYS.KDF_PARAMS],
      wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY] || '',
      recoveryVersion: Number(c[STORAGE_KEYS.RECOVERY_VERSION]) || 1,
      formatVersion: 2,
    };
  }
}
