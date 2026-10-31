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

  /**
   * Run `work(store)` in one transaction and resolve only after it COMMITS.
   * A request succeeding is not enough: the commit can still fail (quota), and
   * saying "saved" before that would lose a vault write without a word. A failed
   * request or an aborted transaction rejects. It is never turned into "no data".
   * @param {'readonly'|'readwrite'} mode
   * @param {(store: IDBObjectStore) => IDBRequest[]} work returns the requests to read results from
   * @returns {Promise<IDBRequest[]>}
   */
  async _tx(mode, work) {
    if (!this._db) {
      this._db = await openDb();
      this._db.onclose = () => { this._db = null; }; // reopen on the next call
    }
    return new Promise((resolve, reject) => {
      const tx = this._db.transaction(STORE, mode);
      let requests = [];
      tx.oncomplete = () => resolve(requests);
      tx.onerror = (e) => reject(e?.target?.error || tx.error || new Error('IndexedDB request failed'));
      tx.onabort = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
      requests = work(tx.objectStore(STORE));
    });
  }

  async get(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    const requests = await this._tx('readonly', (store) => list.map((k) => store.get(k)));
    const out = {};
    requests.forEach((req, i) => { if (req.result !== undefined) out[list[i]] = req.result; });
    return out;
  }

  async set(items) {
    await this._tx('readwrite', (store) => Object.entries(items).map(([k, v]) => store.put(v, k)));
  }

  async remove(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    await this._tx('readwrite', (store) => list.map((k) => store.delete(k)));
  }
}
