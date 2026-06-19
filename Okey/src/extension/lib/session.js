/**
 * OKey Extension — Ephemeral session state
 *
 * The unlocked vault's DEK is cached in chrome.storage.session, which is:
 *   - memory-only (never written to disk),
 *   - cleared when the browser closes,
 *   - restricted to TRUSTED_CONTEXTS (not readable by content scripts).
 *
 * This lets the popup re-open within the cooldown window without re-typing the
 * master password, while auto-lock / idle / OS-lock events purge it promptly.
 * The master password is NEVER stored — only the (already random) DEK, gated by
 * an expiry. This is an explicit, documented trade-off (see SECURITY.md).
 */

import { SECURITY, SYNC } from '../../core/constants.js';
import { bytesToBase64, base64ToBytes } from '../../core/encoding.js';

const K = {
  DEK: 'okey_session_dek',
  EXPIRY: 'okey_session_expiry',
  VIEW: 'okey_session_view',
  POPUP_OPEN: 'okey_popup_open',
};

/** Ensure session storage is not exposed to untrusted (content-script) contexts. */
export async function hardenSession() {
  try {
    await chrome.storage.session.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
  } catch {
    /* older Chrome: TRUSTED_CONTEXTS is already the default */
  }
}

/**
 * Cache the DEK with a cooldown and (re)arm the auto-lock alarm.
 * @param {Uint8Array} dekBytes
 * @param {number} autoLockSeconds
 */
export async function cacheDek(dekBytes, autoLockSeconds = SECURITY.DEFAULT_AUTO_LOCK_SECONDS) {
  const seconds = clamp(autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  await chrome.storage.session.set({
    [K.DEK]: bytesToBase64(dekBytes),
    [K.EXPIRY]: Date.now() + seconds * 1000,
  });
  await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: seconds / 60 });
}

/** Extend the session lock timer after trusted user activity. */
export async function touchSession(autoLockSeconds = SECURITY.DEFAULT_AUTO_LOCK_SECONDS) {
  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY]);
  if (!s[K.DEK]) return false;
  if (s[K.EXPIRY] && Date.now() >= s[K.EXPIRY]) {
    await clearSession();
    return false;
  }
  const seconds = clamp(autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  await chrome.storage.session.set({ [K.EXPIRY]: Date.now() + seconds * 1000 });
  await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: seconds / 60 });
  return true;
}

/**
 * Return the cached DEK bytes if still valid, else null (and clears if expired).
 * Touch-extends the expiry on access.
 * @returns {Promise<Uint8Array|null>}
 */
export async function getCachedDek(autoLockSeconds = SECURITY.DEFAULT_AUTO_LOCK_SECONDS) {
  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY]);
  if (!s[K.DEK]) return null;
  if (s[K.EXPIRY] && Date.now() >= s[K.EXPIRY]) {
    await clearSession();
    return null;
  }
  const seconds = clamp(autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  await chrome.storage.session.set({ [K.EXPIRY]: Date.now() + seconds * 1000 });
  await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: seconds / 60 });
  return base64ToBytes(s[K.DEK]);
}

export async function isUnlockedInSession() {
  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY]);
  return !!s[K.DEK] && (!s[K.EXPIRY] || Date.now() < s[K.EXPIRY]);
}

export async function clearSession() {
  await chrome.storage.session.remove([K.DEK, K.EXPIRY]);
  await chrome.alarms.clear(SYNC.AUTO_LOCK_ALARM);
}

/** View state persistence (feedback #25). */
export async function saveViewState(state) {
  await chrome.storage.session.set({ [K.VIEW]: state });
}
export async function getViewState() {
  return (await chrome.storage.session.get(K.VIEW))[K.VIEW] || null;
}

export async function setPopupOpen(open) {
  if (open) await chrome.storage.session.set({ [K.POPUP_OPEN]: Date.now() });
  else await chrome.storage.session.remove(K.POPUP_OPEN);
}
export async function isPopupOpen() {
  const v = (await chrome.storage.session.get(K.POPUP_OPEN))[K.POPUP_OPEN];
  // Treat a stale flag (>30s without heartbeat) as closed.
  return !!v && Date.now() - v < 30_000;
}

function clamp(n, lo, hi) {
  return Math.min(Math.max(Number(n) || lo, lo), hi);
}
