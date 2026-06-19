/**
 * OKey — Core: Encoding utilities
 *
 * Pure, dependency-free, platform-agnostic byte/string conversions.
 * Works in browsers, service workers, and Node (≥18). No DOM, no chrome.*.
 *
 * Base64 helpers are implemented manually (not via btoa/atob on whole strings)
 * so they are binary-safe and chunked to avoid call-stack limits on large inputs.
 */

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = (() => {
  const t = new Int16Array(256).fill(-1);
  for (let i = 0; i < B64_CHARS.length; i++) t[B64_CHARS.charCodeAt(i)] = i;
  t['='.charCodeAt(0)] = -2; // padding sentinel
  return t;
})();

/**
 * Encode bytes to standard Base64.
 * @param {Uint8Array|ArrayBuffer} input
 * @returns {string}
 */
export function bytesToBase64(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  let out = '';
  let i = 0;
  const len = bytes.length;
  for (; i + 2 < len; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    out += B64_CHARS[(n >>> 18) & 63] + B64_CHARS[(n >>> 12) & 63] + B64_CHARS[(n >>> 6) & 63] + B64_CHARS[n & 63];
  }
  if (len - i === 1) {
    const n = bytes[i] << 16;
    out += B64_CHARS[(n >>> 18) & 63] + B64_CHARS[(n >>> 12) & 63] + '==';
  } else if (len - i === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    out += B64_CHARS[(n >>> 18) & 63] + B64_CHARS[(n >>> 12) & 63] + B64_CHARS[(n >>> 6) & 63] + '=';
  }
  return out;
}

/**
 * Decode standard (or URL-safe) Base64 to bytes.
 * @param {string} b64
 * @returns {Uint8Array}
 */
export function base64ToBytes(b64) {
  if (typeof b64 !== 'string') throw new TypeError('base64ToBytes expects a string');
  const s = b64.replace(/-/g, '+').replace(/_/g, '/').replace(/\s+/g, '');
  // Determine output length from padding.
  let pad = 0;
  if (s.endsWith('==')) pad = 2;
  else if (s.endsWith('=')) pad = 1;
  const usable = s.length - pad;
  const outLen = Math.floor((usable * 6) / 8);
  const out = new Uint8Array(outLen);
  let bits = 0;
  let acc = 0;
  let o = 0;
  for (let i = 0; i < s.length; i++) {
    const v = B64_LOOKUP[s.charCodeAt(i)];
    if (v === -2) break; // padding
    if (v === -1) throw new Error('Invalid Base64 character');
    acc = (acc << 6) | v;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out[o++] = (acc >>> bits) & 0xff;
    }
  }
  return out;
}

/** URL-safe Base64 (no padding) — used for tokens/identifiers. */
export function bytesToBase64Url(input) {
  return bytesToBase64(input).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** @param {string} utf8 @returns {Uint8Array} */
export function utf8ToBytes(utf8) {
  return new TextEncoder().encode(utf8);
}

/** @param {Uint8Array|ArrayBuffer} bytes @returns {string} */
export function bytesToUtf8(bytes) {
  return new TextDecoder().decode(bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes));
}

/** @param {Uint8Array} bytes @returns {string} lowercase hex */
export function bytesToHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += bytes[i].toString(16).padStart(2, '0');
  return s;
}

/** @param {string} hex @returns {Uint8Array} */
export function hexToBytes(hex) {
  const clean = hex.replace(/\s+/g, '');
  if (clean.length % 2 !== 0) throw new Error('Invalid hex length');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.substr(i * 2, 2), 16);
  return out;
}

/**
 * Constant-time comparison of two byte arrays.
 * Returns false immediately on length mismatch (length is not secret here).
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {boolean}
 */
export function timingSafeEqual(a, b) {
  if (!(a instanceof Uint8Array) || !(b instanceof Uint8Array)) return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}
