/**
 * Auto-lock timer. Every activity starts the countdown again, so the vault
 * locks `timeoutMs` after the LAST activity. Only `onTouch` (extending the
 * session) is throttled: skipping the re-arm too would leave no timer at all.
 */
export function createIdleTimer({ isUnlocked, timeoutMs, onTouch, onLock, throttleMs = 4000, now = Date.now }) {
  let timer = null;
  let lastTouch = 0;
  function activity() {
    clearTimeout(timer);
    if (!isUnlocked()) return;
    const t = now();
    if (t - lastTouch >= throttleMs) {
      lastTouch = t;
      onTouch();
    }
    timer = setTimeout(onLock, timeoutMs());
  }
  /** Stop a pending lock, for example after a manual lock. */
  activity.cancel = () => clearTimeout(timer);
  return activity;
}
