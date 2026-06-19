/**
 * OKey PWA — Ephemeral session (per-tab)
 *
 * Caches the DEK in sessionStorage (cleared when the tab closes) with an expiry,
 * mirroring the extension's session behavior so reloads within the cooldown
 * don't require re-typing the master password. The master password is never
 * stored. An in-page idle timer enforces auto-lock.
 */

import { bytesToBase64, base64ToBytes } from '../../core/encoding.js';

const K = { DEK: 'okey_session_dek', EXP: 'okey_session_exp' };

export function cacheDek(dekBytes, autoLockSeconds) {
  sessionStorage.setItem(K.DEK, bytesToBase64(dekBytes));
  sessionStorage.setItem(K.EXP, String(Date.now() + autoLockSeconds * 1000));
}

export function getCachedDek(autoLockSeconds) {
  const dek = sessionStorage.getItem(K.DEK);
  const exp = Number(sessionStorage.getItem(K.EXP) || 0);
  if (!dek) return null;
  if (exp && Date.now() >= exp) {
    clearSession();
    return null;
  }
  sessionStorage.setItem(K.EXP, String(Date.now() + autoLockSeconds * 1000));
  return base64ToBytes(dek);
}

export function touchSession(autoLockSeconds) {
  if (sessionStorage.getItem(K.DEK)) sessionStorage.setItem(K.EXP, String(Date.now() + autoLockSeconds * 1000));
}

export function clearSession() {
  sessionStorage.removeItem(K.DEK);
  sessionStorage.removeItem(K.EXP);
}
