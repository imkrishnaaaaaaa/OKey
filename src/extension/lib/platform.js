/**
 * OKey Extension — Platform adapters
 *
 * Binds the platform-agnostic core to Chrome MV3 APIs:
 *   - ChromeStorageAdapter  → chrome.storage.local (durable)
 *   - ChromeSessionAdapter  → chrome.storage.session (RAM-only, TRUSTED_CONTEXTS)
 */

/** @implements {import('../../core/adapters.js').StorageAdapter} */
export class ChromeStorageAdapter {
  constructor(area = 'local') {
    this.area = chrome.storage[area];
  }

  get(keys) {
    return this.area.get(keys);
  }

  set(items) {
    return this.area.set(items);
  }

  remove(keys) {
    return this.area.remove(keys);
  }
}
