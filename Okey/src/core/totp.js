/**
 * OKey — Core: TOTP (RFC 6238) / HOTP (RFC 4226)
 *
 * Pure Web Crypto HMAC. Supports SHA-1/256/512, configurable digits & period.
 * No external dependencies.
 */

import { TOTP as CFG } from './constants.js';
import { ValidationError } from './errors.js';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Decode Base32 (RFC 4648), tolerant of whitespace, padding and lowercase.
 * @param {string} base32
 * @returns {Uint8Array}
 */
export function base32Decode(base32) {
  const cleaned = String(base32 || '').replace(/[\s=]/g, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out = [];
  for (const ch of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(ch);
    if (idx === -1) throw new ValidationError('Invalid Base32 character in TOTP secret');
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      out.push((value >>> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
}

const HMAC_HASH = { 'SHA-1': 'SHA-1', SHA1: 'SHA-1', 'SHA-256': 'SHA-256', SHA256: 'SHA-256', 'SHA-512': 'SHA-512', SHA512: 'SHA-512' };

async function hmac(keyBytes, msgBytes, algorithm) {
  const hash = HMAC_HASH[algorithm] || 'SHA-1';
  const key = await globalThis.crypto.subtle.importKey('raw', keyBytes, { name: 'HMAC', hash }, false, ['sign']);
  return new Uint8Array(await globalThis.crypto.subtle.sign('HMAC', key, msgBytes));
}

/** Big-endian 8-byte counter. */
function counterBytes(counter) {
  const buf = new Uint8Array(8);
  let n = counter;
  for (let i = 7; i >= 0; i--) {
    buf[i] = n & 0xff;
    n = Math.floor(n / 256);
  }
  return buf;
}

/**
 * Compute an HOTP value for a given counter.
 * @param {Uint8Array} keyBytes
 * @param {number} counter
 * @param {number} digits
 * @param {string} algorithm
 * @returns {Promise<string>}
 */
export async function hotp(keyBytes, counter, digits = CFG.DEFAULT_DIGITS, algorithm = CFG.DEFAULT_ALGORITHM) {
  const hash = await hmac(keyBytes, counterBytes(counter), algorithm);
  const offset = hash[hash.length - 1] & 0x0f;
  const bin =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);
  return (bin % 10 ** digits).toString().padStart(digits, '0');
}

/**
 * Generate the current TOTP code and seconds remaining in this window.
 * @param {string} secret Base32 secret
 * @param {Object} [opts]
 * @param {number} [opts.period]
 * @param {number} [opts.digits]
 * @param {string} [opts.algorithm]
 * @param {number} [opts.timestamp] override (ms) — test hook
 * @returns {Promise<{ code: string, remaining: number, period: number }>}
 */
export async function generateTOTP(secret, opts = {}) {
  const period = opts.period ?? CFG.DEFAULT_PERIOD;
  const digits = opts.digits ?? CFG.DEFAULT_DIGITS;
  const algorithm = opts.algorithm ?? CFG.DEFAULT_ALGORITHM;
  const ts = opts.timestamp ?? Date.now();
  const seconds = Math.floor(ts / 1000);
  const counter = Math.floor(seconds / period);
  const remaining = period - (seconds % period);
  const code = await hotp(base32Decode(secret), counter, digits, algorithm);
  return { code, remaining, period };
}

/**
 * Validate a user-supplied TOTP code against a secret, tolerating clock skew.
 * @param {string} secret
 * @param {string} code
 * @param {Object} [opts]
 * @returns {Promise<boolean>}
 */
export async function validateTOTP(secret, code, opts = {}) {
  const period = opts.period ?? CFG.DEFAULT_PERIOD;
  const digits = opts.digits ?? CFG.DEFAULT_DIGITS;
  const algorithm = opts.algorithm ?? CFG.DEFAULT_ALGORITHM;
  const window = opts.window ?? CFG.VALIDATION_WINDOW;
  const ts = opts.timestamp ?? Date.now();
  const counter = Math.floor(ts / 1000 / period);
  const key = base32Decode(secret);
  const target = String(code).trim();
  for (let i = -window; i <= window; i++) {
    if ((await hotp(key, counter + i, digits, algorithm)) === target) return true;
  }
  return false;
}

/**
 * Parse an otpauth:// URI.
 * @param {string} uri
 * @returns {{ type:string, label:string, issuer:string, account:string, secret:string, period:number, digits:number, algorithm:string }}
 */
export function parseOtpAuthUri(uri) {
  let url;
  try {
    url = new URL(uri);
  } catch {
    throw new ValidationError('Invalid otpauth URI');
  }
  if (url.protocol !== 'otpauth:') throw new ValidationError('Not an otpauth URI');
  const type = url.hostname.toLowerCase();
  const label = decodeURIComponent(url.pathname.replace(/^\//, ''));
  let issuer = url.searchParams.get('issuer') || '';
  let account = label;
  if (label.includes(':')) {
    const [a, ...rest] = label.split(':');
    if (!issuer) issuer = a.trim();
    account = rest.join(':').trim();
  }
  return {
    type,
    label,
    issuer,
    account,
    secret: (url.searchParams.get('secret') || '').replace(/\s+/g, ''),
    period: parseInt(url.searchParams.get('period') || '30', 10),
    digits: parseInt(url.searchParams.get('digits') || '6', 10),
    algorithm: (url.searchParams.get('algorithm') || 'SHA1').toUpperCase(),
  };
}

/** Build an otpauth:// URI for export/QR. */
export function buildOtpAuthUri({ secret, issuer, account, period = CFG.DEFAULT_PERIOD, digits = CFG.DEFAULT_DIGITS }) {
  const label = issuer ? `${issuer}:${account}` : account;
  const params = new URLSearchParams({ secret });
  if (issuer) params.set('issuer', issuer);
  if (period !== 30) params.set('period', String(period));
  if (digits !== 6) params.set('digits', String(digits));
  return `otpauth://totp/${encodeURIComponent(label)}?${params.toString()}`;
}

/** Lightweight validity check for a Base32 secret. */
export function isValidTotpSecret(secret) {
  if (!secret || typeof secret !== 'string') return false;
  const cleaned = secret.replace(/[\s=]/g, '').toUpperCase();
  return /^[A-Z2-7]+$/.test(cleaned) && cleaned.length >= 16;
}
