/**
 * Fill sessions: after the user picks a login, the page may need it again for a
 * short while (a second step asking for the password or a code).
 *
 * A session is bound to the tab AND the site it was started on. If the tab moves
 * to another site (a redirect, a link, an SSO hop) the session is dropped, so one
 * site's password is never handed to the next one. Sessions live in session
 * storage (memory only) and last 60 seconds.
 */

const PREFIX = 'okey_fill_session_';
const TTL_MS = 60_000;

/** @param {{get:Function,set:Function,remove:Function}} storage chrome.storage.session or a stand-in */
export function createFillSessions(storage, { ttlMs = TTL_MS, now = Date.now } = {}) {
  const key = (tabId) => `${PREFIX}${tabId}`;

  return {
    /** `submitted`: the login form was already submitted once in this session. */
    async set(tabId, origin, cred, { submitted = false } = {}) {
      if (!origin) throw new Error('A fill session needs the origin of the page');
      await storage.set({ [key(tabId)]: { cred, origin, submitted, timestamp: now() } });
    },

    /** The session for this tab, only if it is fresh and the page is on the same origin. */
    async get(tabId, origin) {
      const k = key(tabId);
      const data = (await storage.get(k))[k];
      if (!data) return null;
      if (now() - data.timestamp >= ttlMs || data.origin !== origin) {
        await storage.remove(k);
        return null;
      }
      return data;
    },

    clear(tabId) { return storage.remove(key(tabId)); },

    /** Every fill session, for example when the vault locks. */
    async clearAll() {
      const keys = Object.keys(await storage.get(null)).filter((k) => k.startsWith(PREFIX));
      if (keys.length) await storage.remove(keys);
    },
  };
}
