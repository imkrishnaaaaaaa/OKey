/**
 * OKey — Core: Platform adapter contracts (documentation + helpers)
 *
 * The core is platform-agnostic. Each platform supplies adapters that satisfy
 * these contracts. This file documents the interfaces and provides a simple
 * in-memory StorageAdapter used by tests and as a reference implementation.
 */

/**
 * @typedef {Object} StorageAdapter
 * Durable key/value store (extension: chrome.storage.local; PWA: IndexedDB).
 * @property {(keys: string|string[]) => Promise<Record<string, any>>} get
 * @property {(items: Record<string, any>) => Promise<void>} set
 * @property {(keys: string|string[]) => Promise<void>} remove
 */

/**
 * @typedef {Object} SessionAdapter
 * Ephemeral, memory-backed store cleared when the browser/app closes
 * (extension: chrome.storage.session; PWA: in-memory + sessionStorage marker).
 * Same shape as StorageAdapter.
 */

/**
 * @typedef {Object} NetworkAdapter
 * Performs the actual sync transport.
 * @property {(url: string, init: RequestInit) => Promise<Response>} fetch
 * @property {() => Promise<string|null>} getAuthToken  OAuth bearer token (or null)
 */

/**
 * Minimal in-memory StorageAdapter. Reference impl + test double.
 * @implements {StorageAdapter}
 */
export class MemoryStorageAdapter {
  constructor(initial = {}) {
    this._data = new Map(Object.entries(initial));
  }

  async get(keys) {
    const out = {};
    const list = Array.isArray(keys) ? keys : [keys];
    for (const k of list) if (this._data.has(k)) out[k] = this._data.get(k);
    return out;
  }

  async set(items) {
    for (const [k, v] of Object.entries(items)) this._data.set(k, v);
  }

  async remove(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    for (const k of list) this._data.delete(k);
  }

  /** Test helper. */
  snapshot() {
    return Object.fromEntries(this._data);
  }
}
