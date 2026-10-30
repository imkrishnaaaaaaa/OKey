/**
 * OKey — Core: Settings schema
 *
 * Single gatekeeper for settings coming from ANY untrusted source (remote sync,
 * storage, message router). Only allowlisted keys pass; every value
 * is type-checked and clamped. This closes the "compromised sync disables
 * auto-lock on every device" hole (revamp H3/M10).
 */

import { DEFAULT_SETTINGS, PASSWORD_GEN, SECURITY, SYNC } from './constants.js';

/** [min, max] ranges for numeric settings. */
const NUMERIC_RANGES = {
  autoLockTimeout: [SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS],
  clipboardClearTimeout: [SECURITY.MIN_CLIPBOARD_CLEAR_SECONDS, SECURITY.MAX_CLIPBOARD_CLEAR_SECONDS],
  syncIntervalMinutes: [SYNC.MIN_INTERVAL_MINUTES, SYNC.MAX_INTERVAL_MINUTES],
  recentsMaxCount: [1, 100],
  miniAutoLockTimeout: [SECURITY.MIN_AUTO_LOCK_SECONDS, 3600],
};

const BOOLEAN_KEYS = ['biometricEnabled', 'autoSyncEnabled', 'showRecents', 'faviconsEnabled', 'autoSubmitEnabled', 'autoFillSingleMatch'];
const NUMBER_KEYS = Object.keys(NUMERIC_RANGES);
const THEMES = ['system', 'dark', 'light'];

/**
 * Sanitize one settings object against the schema.
 * @param {object} raw candidate settings (untrusted)
 * @param {object} base fallback/previous values
 * @returns {object} sanitized copy merged over base
 */
export function sanitizeSettings(raw, base = DEFAULT_SETTINGS) {
  const out = { ...base };
  if (!raw || typeof raw !== 'object') return out;

  for (const key of BOOLEAN_KEYS) {
    if (typeof raw[key] === 'boolean') out[key] = raw[key];
  }
  for (const key of NUMBER_KEYS) {
    const n = Number(raw[key]);
    if (Number.isFinite(n)) {
      const [lo, hi] = NUMERIC_RANGES[key];
      out[key] = Math.min(Math.max(Math.round(n), lo), hi);
    }
  }
  if (THEMES.includes(raw.theme)) out.theme = raw.theme;
  if (raw.sessionReunlockCooldown !== undefined) {
    const n = Number(raw.sessionReunlockCooldown);
    if (Number.isFinite(n)) out.sessionReunlockCooldown = Math.min(Math.max(n, 0), 60);
  }
  if (raw.passwordGeneratorDefaults && typeof raw.passwordGeneratorDefaults === 'object') {
    const pg = { ...out.passwordGeneratorDefaults };
    const p = raw.passwordGeneratorDefaults;
    for (const k of ['uppercase', 'lowercase', 'numbers', 'symbols']) {
      if (typeof p[k] === 'boolean') pg[k] = p[k];
    }
    if (Number.isFinite(Number(p.length))) {
      pg.length = Math.min(Math.max(Math.round(Number(p.length)), PASSWORD_GEN.MIN_LENGTH), PASSWORD_GEN.MAX_LENGTH);
    }
    out.passwordGeneratorDefaults = pg;
  }
  return out;
}

/**
 * Merge REMOTE settings into local ones. Remote keys not on the syncable
 * allowlist are dropped entirely.
 */
export function mergeRemoteSettings(local, remote) {
  return sanitizeSettings(remote, local);
}
