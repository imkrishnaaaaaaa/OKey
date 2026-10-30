/**
 * Shared test helpers: in-memory StorageAdapter + fixtures.
 */

export class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  async get(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    const out = {};
    for (const k of list) if (this.map.has(k)) out[k] = structuredClone(this.map.get(k));
    return out;
  }
  async set(items) {
    for (const [k, v] of Object.entries(items)) this.map.set(k, structuredClone(v));
  }
  async remove(keys) {
    for (const k of Array.isArray(keys) ? keys : [keys]) this.map.delete(k);
  }
}
