/**
 * Builds the CloudSync for whoever is signed in. Shared by the app screens and
 * the extension's background worker, so both read the user, the token and the
 * per-account cursor the same way.
 *
 * @param {object} opts
 * @param {import('../core/adapters.js').StorageAdapter} opts.store
 * @param {string} opts.projectId Firebase project id
 * @param {() => Promise<{uid: string, getIdToken: () => Promise<string>}|null>} opts.getUser
 */
import { CloudStore } from '../core/cloud.js';
import { CloudSync } from '../core/cloud-sync.js';

export function createCloudSync({ store, projectId, getUser }) {
  const cloud = new CloudStore({
    projectId,
    getToken: async () => {
      try { return (await (await getUser())?.getIdToken()) || null; } catch { return null; }
    },
  });
  const getUid = async () => (await getUser())?.uid || null;
  // One cursor per account, so switching accounts never reuses another's.
  const cursorKey = async () => {
    const uid = await getUid();
    return uid ? `okey_sync_cursor_${uid}` : null;
  };
  return new CloudSync({
    store,
    cloud,
    getUid,
    getLastSyncAt: async () => {
      const k = await cursorKey();
      return k ? (await store.get(k))[k] || null : null;
    },
    setLastSyncAt: async (iso) => {
      const k = await cursorKey();
      if (k) await store.set({ [k]: iso });
    },
  });
}
