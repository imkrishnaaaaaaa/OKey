/**
 * OKey PWA — IndexedDB StorageAdapter
 *
 * Satisfies the core StorageAdapter contract (get/set/remove) using a single
 * IndexedDB object store. Durable across sessions; stores ciphertext only.
 */

const DB_NAME = 'okey';
const STORE = 'kv';
const VERSION = 1;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** @implements {import('../../core/adapters.js').StorageAdapter} */
export class IndexedDbAdapter {
  constructor() {
    this._db = null;
  }

  async _store(mode) {
    if (!this._db) this._db = await openDb();
    return this._db.transaction(STORE, mode).objectStore(STORE);
  }

  async get(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    const store = await this._store('readonly');
    const out = {};
    await Promise.all(
      list.map(
        (k) =>
          new Promise((resolve) => {
            const req = store.get(k);
            req.onsuccess = () => {
              if (req.result !== undefined) out[k] = req.result;
              resolve();
            };
            req.onerror = () => resolve();
          }),
      ),
    );
    return out;
  }

  async set(items) {
    const store = await this._store('readwrite');
    await Promise.all(
      Object.entries(items).map(
        ([k, v]) =>
          new Promise((resolve, reject) => {
            const req = store.put(v, k);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          }),
      ),
    );
  }

  async remove(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    const store = await this._store('readwrite');
    await Promise.all(
      list.map(
        (k) =>
          new Promise((resolve) => {
            const req = store.delete(k);
            req.onsuccess = () => resolve();
            req.onerror = () => resolve();
          }),
      ),
    );
  }
}
