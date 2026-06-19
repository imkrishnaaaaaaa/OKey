/**
 * OKey Extension — Platform adapters
 *
 * Binds the platform-agnostic core to Chrome MV3 APIs:
 *   - ChromeStorageAdapter  → chrome.storage.local (durable)
 *   - ChromeSessionAdapter  → chrome.storage.session (RAM-only, TRUSTED_CONTEXTS)
 *   - chromeNetwork         → fetch + chrome.identity OAuth token
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

/**
 * Network adapter using chrome.identity for the OAuth bearer token.
 * `interactive` controls whether a sign-in prompt may appear.
 */
export const chromeNetwork = {
  fetch: (url, init) => fetch(url, init),
  async getAuthToken(interactive = false) {
    try {
      const result = await chrome.identity.getAuthToken({ interactive });
      // MV3 returns an object { token }, older returns a string.
      return typeof result === 'string' ? result : result?.token || null;
    } catch {
      return null;
    }
  },
};

/** Remove a cached OAuth token (e.g. after a 401) so the next call re-auths. */
export async function invalidateAuthToken() {
  try {
    const result = await chrome.identity.getAuthToken({ interactive: false });
    const token = typeof result === 'string' ? result : result?.token;
    if (token) await chrome.identity.removeCachedAuthToken({ token });
  } catch {
    /* ignore */
  }
}
