/**
 * Which browser idle states lock the vault.
 *
 * Only the OS screen lock. The 'idle' state fires after a few seconds with no
 * mouse or keyboard input, which is also what reading a page looks like, and it
 * would lock the vault long before the user's own auto-lock time. The session
 * timers (auto-lock and the page session) already cover "walked away".
 */
export const shouldLockOnIdleState = (state) => state === 'locked';
