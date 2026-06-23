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
  MINI_EXPIRY: 'okey_session_mini_expiry',
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
 * Cache the DEK with separate popup and mini-view auto-lock expiries.
 * @param {Uint8Array} dekBytes
 * @param {number} autoLockSeconds
 */
export async function cacheDek(dekBytes, autoLockSeconds) {
  const sStore = await chrome.storage.local.get('okey_settings');
  const settings = sStore['okey_settings'] || {};

  const extSeconds = clamp(settings.autoLockTimeout || autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  const miniSeconds = Number(settings.miniAutoLockTimeout) || 300;

  const now = Date.now();
  await chrome.storage.session.set({
    [K.DEK]: bytesToBase64(dekBytes),
    [K.EXPIRY]: now + extSeconds * 1000,
    [K.MINI_EXPIRY]: now + miniSeconds * 1000,
  });

  const delaySeconds = Math.min(extSeconds, miniSeconds);
  await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: delaySeconds / 60 });
}

/** Extend the session lock timer for a specific view context ('extension' or 'mini'). */
export async function touchSession(type = 'extension') {
  let viewType = type;
  if (typeof type === 'number') {
    viewType = 'extension';
  }

  const sStore = await chrome.storage.local.get('okey_settings');
  const settings = sStore['okey_settings'] || {};

  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY, K.MINI_EXPIRY]);
  if (!s[K.DEK]) return false;

  const now = Date.now();
  const exp = s[K.EXPIRY] || 0;
  const miniExp = s[K.MINI_EXPIRY] || 0;
  if (now >= exp && now >= miniExp) {
    await clearSession();
    return false;
  }

  const autoLockSeconds = viewType === 'mini'
    ? (settings.miniAutoLockTimeout || 300)
    : (settings.autoLockTimeout || SECURITY.DEFAULT_AUTO_LOCK_SECONDS);

  const seconds = clamp(autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  const newExpiry = now + seconds * 1000;

  const update = {};
  if (viewType === 'mini') {
    update[K.MINI_EXPIRY] = newExpiry;
  } else {
    update[K.EXPIRY] = newExpiry;
  }
  await chrome.storage.session.set(update);

  const finalExp = viewType === 'mini' ? exp : newExpiry;
  const finalMiniExp = viewType === 'mini' ? newExpiry : miniExp;

  const nextTarget = [];
  if (finalExp > now) nextTarget.push(finalExp);
  if (finalMiniExp > now) nextTarget.push(finalMiniExp);

  if (nextTarget.length > 0) {
    const earliest = Math.min(...nextTarget);
    const delayMinutes = Math.max(0.1, (earliest - now) / 60000);
    await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: delayMinutes });
  }

  return true;
}

/**
 * Return the cached DEK bytes if still valid for the specified view type, else null.
 * Touch-extends the expiry on access.
 * @returns {Promise<Uint8Array|null>}
 */
export async function getCachedDek(type = 'extension') {
  let viewType = type;
  if (typeof type === 'number') {
    viewType = 'extension';
  }

  const sStore = await chrome.storage.local.get('okey_settings');
  const settings = sStore['okey_settings'] || {};

  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY, K.MINI_EXPIRY]);
  if (!s[K.DEK]) return null;

  const now = Date.now();
  const expiryKey = viewType === 'mini' ? K.MINI_EXPIRY : K.EXPIRY;
  const exp = s[expiryKey] || 0;

  if (exp && now >= exp) {
    const otherExpiryKey = viewType === 'mini' ? K.EXPIRY : K.MINI_EXPIRY;
    const otherExp = s[otherExpiryKey] || 0;
    if (now >= otherExp) {
      await clearSession();
    }
    return null;
  }

  const autoLockSeconds = viewType === 'mini'
    ? (settings.miniAutoLockTimeout || 300)
    : (settings.autoLockTimeout || SECURITY.DEFAULT_AUTO_LOCK_SECONDS);

  const seconds = clamp(autoLockSeconds, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS);
  const newExpiry = now + seconds * 1000;

  const update = { [expiryKey]: newExpiry };
  await chrome.storage.session.set(update);

  const finalExp = viewType === 'mini' ? (s[K.EXPIRY] || 0) : newExpiry;
  const finalMiniExp = viewType === 'mini' ? newExpiry : (s[K.MINI_EXPIRY] || 0);

  const nextTarget = [];
  if (finalExp > now) nextTarget.push(finalExp);
  if (finalMiniExp > now) nextTarget.push(finalMiniExp);

  if (nextTarget.length > 0) {
    const earliest = Math.min(...nextTarget);
    const delayMinutes = Math.max(0.1, (earliest - now) / 60000);
    await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: delayMinutes });
  }

  return base64ToBytes(s[K.DEK]);
}

export async function isUnlockedInSession() {
  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY, K.MINI_EXPIRY]);
  const now = Date.now();
  return !!s[K.DEK] && ((s[K.EXPIRY] && now < s[K.EXPIRY]) || (s[K.MINI_EXPIRY] && now < s[K.MINI_EXPIRY]));
}

export async function checkAndClearSessionIfExpired() {
  const s = await chrome.storage.session.get([K.DEK, K.EXPIRY, K.MINI_EXPIRY]);
  if (!s[K.DEK]) return true;

  const now = Date.now();
  const exp = s[K.EXPIRY] || 0;
  const miniExp = s[K.MINI_EXPIRY] || 0;

  if (now >= exp && now >= miniExp) {
    await clearSession();
    return true;
  }

  const nextTarget = [];
  if (exp > now) nextTarget.push(exp);
  if (miniExp > now) nextTarget.push(miniExp);

  if (nextTarget.length > 0) {
    const earliest = Math.min(...nextTarget);
    const delayMinutes = Math.max(0.1, (earliest - now) / 60000);
    await chrome.alarms.create(SYNC.AUTO_LOCK_ALARM, { delayInMinutes: delayMinutes });
  }

  return false;
}

export async function clearSession() {
  await chrome.storage.session.remove([K.DEK, K.EXPIRY, K.MINI_EXPIRY]);
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
