/**
 * Fill each box once and submit once per session, so a site that clears a box
 * after a failed login does not get the same password pushed in and submitted
 * over and over (which can lock the account).
 *
 * @param {{ submitted?: boolean }} [opts] submitted: this fill session already
 *   submitted on an earlier page, as stored with the session.
 */
export function createFillGuard({ submitted = false } = {}) {
  let filled = new WeakSet();
  const guard = {
    submitted,
    canFill: (el) => !filled.has(el),
    markFilled: (el) => { filled.add(el); },
    canSubmit: () => !guard.submitted,
    markSubmitted: () => { guard.submitted = true; },
    /** The user picked a login again: a new session. */
    reset: () => { filled = new WeakSet(); guard.submitted = false; },
  };
  return guard;
}
