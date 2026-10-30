/**
 * OKey — Core: cloud sync controller
 *
 * Orchestrates Vault ⇄ CloudStore for a signed-in user:
 *   • delta sync (push local changes, pull remote changes)
 *   • first-run restore from an existing cloud vault
 *   • one-time "Move to cloud" migration of a local-only vault
 *   • offline queue that flushes on the next successful sync
 *
 * The UI owns scheduling (unlock/focus/interval) and error display; this
 * module owns semantics.
 */

import { STORAGE_KEYS } from './constants.js';
import { nowIso } from './util.js';
import { SYNC_EPOCH } from './cloud.js';
import { mergeRemoteSettings } from './settings.js';

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
   * Delta sync for an unlocked vault.
   * @returns {Promise<{pushed:number,pulled:number,queued:number}>}
   */
  async sync(vault) {
    const uid = await this.getUid();
    if (!uid) throw new Error('Not signed in');
    const last = (await this.getLastSyncAt()) || SYNC_EPOCH;

    const records = await vault.exportRecords();
    const modified = records.filter((r) => (r.updatedAt || SYNC_EPOCH) > last);

    let pushed = 0;
    try {
      pushed = await this.cloud.pushEntries(uid, modified);
    } catch (e) {
      await this._enqueue(modified);
      const queued = await this.flushQueue(vault).catch(() => ({ remaining: 0 }));
      return { pushed: 0, pulled: 0, queued: queued.remaining };
    }

    let pulled = 0;
    const remote = await this.cloud.pullEntriesDelta(uid, last);
    if (remote.length) {
      ({ applied: pulled } = await vault.mergeRemoteRecords(remote));
    }

    const nextCursor = new Date().toISOString();
    await this.setLastSyncAt(nextCursor);
    const queued = await this.flushQueue(vault);
    return { pushed, pulled, queued: queued.remaining };
  }

  /** Pull key material and entries from the cloud into an empty local vault. */
  async restoreFromCloud(vault, masterPin) {
    const uid = await this.getUid();
    if (!uid) throw new Error('Not signed in');
    const meta = await this.cloud.pullMeta(uid);
    if (!meta?.salt || !meta?.wrappedMaster) throw new Error('No cloud vault found for this account');
    const entries = await this.cloud.pullAllEntries(uid);
    await vault.restoreFromRemote(masterPin, meta, entries);
    await this.setLastSyncAt(new Date().toISOString());
  }

  /**
   * One-time migration: push the local vault's key material + every record to
   * the signed-in account. Idempotent by entry id/version.
   */
  async moveToCloud(vault) {
    const uid = await this.getUid();
    if (!uid) throw new Error('Not signed in');
    const c = await this.store.get([
      STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS,
      STORAGE_KEYS.WRAPPED_BY_MASTER, STORAGE_KEYS.WRAPPED_BY_RECOVERY,
    ]);
    await this.cloud.pushMeta(uid, {
      salt: c[STORAGE_KEYS.VAULT_SALT],
      kdfParams: c[STORAGE_KEYS.KDF_PARAMS],
      wrappedMaster: c[STORAGE_KEYS.WRAPPED_BY_MASTER],
      wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY] || '',
      formatVersion: 2,
    });
    const records = await vault.exportRecords();
    await this.cloud.pushEntries(uid, records);
    await this.setLastSyncAt(nowIso());
    return records.length;
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

  // ---- offline queue ----

  async _enqueue(records) {
    if (!records?.length) return;
    const { [STORAGE_KEYS.OFFLINE_QUEUE]: queue = [] } = await this.store.get(STORAGE_KEYS.OFFLINE_QUEUE);
    queue.push({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, records });
    await this.store.set({ [STORAGE_KEYS.OFFLINE_QUEUE]: queue });
  }

  /** @returns {Promise<{processed:number,remaining:number}>} */
  async flushQueue(vault) {
    const { [STORAGE_KEYS.OFFLINE_QUEUE]: queue = [] } = await this.store.get(STORAGE_KEYS.OFFLINE_QUEUE);
    if (!queue.length) return { processed: 0, remaining: 0 };
    const uid = await this.getUid();
    if (!uid) return { processed: 0, remaining: queue.length };

    const remaining = [];
    let processed = 0;
    for (const item of queue.slice(-10)) { // ponytail: cap flush bursts at 10 batches
      try {
        await this.cloud.pushEntries(uid, item.records);
        processed++;
      } catch {
        remaining.push(item);
      }
    }
    await this.store.set({ [STORAGE_KEYS.OFFLINE_QUEUE]: remaining });
    void vault;
    return { processed, remaining: remaining.length };
  }
}
