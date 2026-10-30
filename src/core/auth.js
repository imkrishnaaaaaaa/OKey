/**
 * OKey — Core: Sync request authentication
 *
 * The deployed Apps Script URL is the shared secret (owner decision: "the link
 * is the password"). Both sides derive the same HMAC-SHA256 key from the script
 * ID embedded in the URL, so a request without the URL cannot be forged — even
 * by someone who can see traffic.
 *
 * Envelope: { v, action, ts, nonce, sig, data }
 *   sig = base64(HMAC-SHA256(key, `${action}|${ts}|${nonce}|${data}`))
 *   data is the JSON *string* of the payload, so the signature covers exact
 *   bytes and neither side has to re-serialize objects identically.
 *
 * ponytail: key rotates by redeploying to a new script; per-request replay
 * protection lives server-side in CacheService. If sync throughput ever needs
 * real rotation, add an optional passphrase mixed into the KDF here.
 */

import { utf8ToBytes, bytesToBase64, base64ToBytes, timingSafeEqual } from './encoding.js';

const ENVELOPE_VERSION = 1;

/** Extract the stable script id from an Apps Script /exec URL. */
export function scriptIdFromUrl(url) {
  const m = /\/macros\/s\/([^/]+)/.exec(String(url || ''));
  return m ? m[1] : String(url || '');
}

async function hmacKey(url) {
  const material = await crypto.subtle.digest('SHA-256', utf8ToBytes(`okey-sync-v1:${scriptIdFromUrl(url)}`));
  return crypto.subtle.importKey('raw', material, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
}

/**
 * Build a signed request envelope for `action` with the given payload object.
 * @param {string} url Apps Script web-app URL (the shared secret)
 * @param {string} action route name
 * @param {object} payload JSON-serializable body
 */
export async function signRequest(url, action, payload = {}) {
  const data = JSON.stringify(payload);
  const ts = Date.now();
  const nonce = bytesToBase64(crypto.getRandomValues(new Uint8Array(12)));
  const key = await hmacKey(url);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${action}|${ts}|${nonce}|${data}`));
  return {
    v: ENVELOPE_VERSION,
    action,
    ts,
    nonce,
    sig: bytesToBase64(new Uint8Array(mac)),
    data,
  };
}

/**
 * Verify an envelope against a URL-derived key (used by tests and any future
 * Node provider implementing the same protocol).
 * @returns {Promise<{action:string, payload:object}>} parsed request
 * @throws {Error} on any signature/timestamp/version mismatch
 */
export async function verifyRequest(url, envelope, { now = Date.now(), maxSkewMs = 300_000, seenNonces = null } = {}) {
  if (!envelope || envelope.v !== ENVELOPE_VERSION) throw new Error('BAD_ENVELOPE');
  const skew = Math.abs(now - Number(envelope.ts));
  if (!Number.isFinite(skew) || skew > maxSkewMs) throw new Error('TIMESTAMP_SKEW');
  const key = await hmacKey(url);
  const mac = await crypto.subtle.sign('HMAC', key, utf8ToBytes(`${envelope.action}|${envelope.ts}|${envelope.nonce}|${envelope.data}`));
  const expected = bytesToBase64(new Uint8Array(mac));
  if (!timingSafeEqual(base64ToBytes(expected), base64ToBytes(String(envelope.sig || '')))) throw new Error('BAD_SIGNATURE');
  if (seenNonces && seenNonces.has(envelope.nonce)) throw new Error('REPLAYED_NONCE');
  seenNonces?.add(envelope.nonce);
  let payload = {};
  try { payload = JSON.parse(envelope.data || '{}'); } catch { throw new Error('BAD_PAYLOAD'); }
  return { action: String(envelope.action), payload };
}
