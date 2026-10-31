/**
 * Wrap an async painter so only the newest call may touch the page. The painter
 * gets `isCurrent()` first and checks it after every await, so a slow older call
 * that finishes last cannot draw over (or next to) a newer one.
 */
export function latestOnly(fn) {
  let newest = 0;
  return (...args) => {
    const mine = ++newest;
    return fn(() => mine === newest, ...args);
  };
}
