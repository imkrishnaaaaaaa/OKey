/**
 * Slows down PIN guessing against the service worker.
 *
 * Tries run one at a time, and the count is raised BEFORE the wait. Without both,
 * many tries sent together all read the same count, all skip the wait, and the
 * slow-down means nothing. The count lives in memory-only session storage.
 * The first try is immediate. After that each wrong try doubles the wait, up to a minute.
 */

const KEY = 'okey_unlock_attempts';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * @param {{get:Function,set:Function,remove:Function}} opts.storage chrome.storage.session or a stand-in
 * @param {(pin: string) => Promise<{success: boolean}>} opts.tryUnlock the real unlock
 * @returns {(pin: string) => Promise<{success: boolean}>}
 */
export function createUnlockGate({ storage, tryUnlock, wait = sleep, baseMs = 2000, maxMs = 60_000 }) {
  let chain = Promise.resolve();

  async function attempt(pin) {
    const attempts = Number((await storage.get(KEY))[KEY]) || 0;
    await storage.set({ [KEY]: attempts + 1 });
    if (attempts > 0) await wait(Math.min(baseMs * 2 ** Math.min(attempts, 6), maxMs));
    const result = await tryUnlock(pin);
    if (result.success) await storage.remove(KEY);
    return result;
  }

  return (pin) => {
    const run = chain.then(() => attempt(pin));
    chain = run.catch(() => {}); // one failed try must not block the next
    return run;
  };
}
