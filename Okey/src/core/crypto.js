/**
 * OKey — Core: Cryptography
 *
 * AES-256-GCM authenticated encryption via the Web Crypto API.
 * Platform-agnostic: relies only on globalThis.crypto.subtle (browser, worker, Node ≥18).
 *
 * SECURITY MODEL
 * --------------
 * - All entry data is encrypted with a random 256-bit Data Encryption Key (DEK,
 *   a.k.a. "vault key"). The DEK never leaves RAM in plaintext and never touches
 *   the Sheet, sync storage, or disk unencrypted.
 * - The DEK is *wrapped* (encrypted) under Key Encryption Keys (KEKs) derived
 *   from (a) the master password and (b) the recovery key. Changing the master
 *   password or recovering only re-wraps the DEK — entry ciphertext is untouched.
 * - Encryption keys are imported as non-extractable CryptoKeys so JS cannot read
 *   their bits. The raw DEK bytes are held only transiently and wiped on lock.
 * - Envelope is versioned and the version byte is authenticated (GCM AAD) to give
 *   cryptographic agility without downgrade ambiguity.
 *
 * ENVELOPE FORMAT (bytes):  [version:1][iv:12][ciphertext+tag]
 * String envelope: standard Base64 of the above.
 */

import { CRYPTO } from './constants.js';
import { bytesToBase64, base64ToBytes, utf8ToBytes, bytesToUtf8 } from './encoding.js';
import { DecryptionError, FormatError } from './errors.js';

const ENVELOPE_VERSION = 1;
const subtle = () => {
  const c = globalThis.crypto;
  if (!c || !c.subtle) throw new OKeyCryptoUnavailable();
  return c.subtle;
};

class OKeyCryptoUnavailable extends Error {
  constructor() {
    super('Web Crypto API (crypto.subtle) is unavailable in this context');
    this.name = 'OKeyCryptoUnavailable';
  }
}

/** Cryptographically secure random bytes. @param {number} n @returns {Uint8Array} */
export function randomBytes(n) {
  return globalThis.crypto.getRandomValues(new Uint8Array(n));
}

/** Generate a fresh random salt. @param {number} [len] @returns {Uint8Array} */
export function generateSalt(len = CRYPTO.SALT_LENGTH) {
  return randomBytes(len);
}

/** Generate a fresh 256-bit Data Encryption Key (raw bytes). @returns {Uint8Array} */
export function generateDek() {
  return randomBytes(CRYPTO.KEY_LENGTH / 8);
}

/**
 * Import 32 raw bytes as an AES-256-GCM CryptoKey.
 * @param {Uint8Array} rawBytes 32 bytes
 * @param {boolean} [extractable=false]
 * @returns {Promise<CryptoKey>}
 */
export async function importAesKey(rawBytes, extractable = false) {
  if (!(rawBytes instanceof Uint8Array) || rawBytes.length !== CRYPTO.KEY_LENGTH / 8) {
    throw new FormatError(`AES key material must be ${CRYPTO.KEY_LENGTH / 8} bytes`);
  }
  return subtle().importKey('raw', rawBytes, { name: CRYPTO.ALGORITHM }, extractable, ['encrypt', 'decrypt']);
}

/**
 * Encrypt raw bytes → versioned envelope bytes.
 * @param {Uint8Array} plaintext
 * @param {CryptoKey} key
 * @returns {Promise<Uint8Array>}
 */
export async function encryptBytes(plaintext, key) {
  const iv = randomBytes(CRYPTO.IV_LENGTH);
  const version = new Uint8Array([ENVELOPE_VERSION]);
  const ct = new Uint8Array(
    await subtle().encrypt(
      { name: CRYPTO.ALGORITHM, iv, tagLength: CRYPTO.TAG_LENGTH, additionalData: version },
      key,
      plaintext,
    ),
  );
  const out = new Uint8Array(1 + iv.length + ct.length);
  out[0] = ENVELOPE_VERSION;
  out.set(iv, 1);
  out.set(ct, 1 + iv.length);
  return out;
}

/**
 * Decrypt a versioned envelope → raw bytes.
 * @param {Uint8Array} envelope
 * @param {CryptoKey} key
 * @returns {Promise<Uint8Array>}
 */
export async function decryptBytes(envelope, key) {
  if (!(envelope instanceof Uint8Array) || envelope.length < 1 + CRYPTO.IV_LENGTH + 16) {
    throw new FormatError('Ciphertext envelope too short');
  }
  const version = envelope[0];
  if (version !== ENVELOPE_VERSION) throw new FormatError(`Unsupported envelope version ${version}`);
  const iv = envelope.subarray(1, 1 + CRYPTO.IV_LENGTH);
  const ct = envelope.subarray(1 + CRYPTO.IV_LENGTH);
  try {
    const pt = await subtle().decrypt(
      { name: CRYPTO.ALGORITHM, iv, tagLength: CRYPTO.TAG_LENGTH, additionalData: new Uint8Array([version]) },
      key,
      ct,
    );
    return new Uint8Array(pt);
  } catch {
    throw new DecryptionError();
  }
}

/** Encrypt a UTF-8 string → Base64 envelope. */
export async function encryptString(plaintext, key) {
  return bytesToBase64(await encryptBytes(utf8ToBytes(plaintext), key));
}

/** Decrypt a Base64 envelope → UTF-8 string. */
export async function decryptString(b64, key) {
  return bytesToUtf8(await decryptBytes(base64ToBytes(b64), key));
}

/** Encrypt a JSON-serializable value → Base64 envelope. */
export async function encryptJson(value, key) {
  return encryptString(JSON.stringify(value), key);
}

/** Decrypt a Base64 envelope → parsed JSON value. */
export async function decryptJson(b64, key) {
  return JSON.parse(await decryptString(b64, key));
}

/**
 * Wrap (encrypt) raw DEK bytes under a KEK (raw bytes) → Base64 envelope.
 * @param {Uint8Array} dekBytes
 * @param {Uint8Array} kekBytes 32 bytes
 * @returns {Promise<string>}
 */
export async function wrapKeyMaterial(dekBytes, kekBytes) {
  const kek = await importAesKey(kekBytes, false);
  return bytesToBase64(await encryptBytes(dekBytes, kek));
}

/**
 * Unwrap (decrypt) a Base64-wrapped DEK using a KEK → raw DEK bytes.
 * Throws DecryptionError if the KEK is wrong (e.g. wrong master password).
 * @param {string} wrappedB64
 * @param {Uint8Array} kekBytes 32 bytes
 * @returns {Promise<Uint8Array>}
 */
export async function unwrapKeyMaterial(wrappedB64, kekBytes) {
  const kek = await importAesKey(kekBytes, false);
  return decryptBytes(base64ToBytes(wrappedB64), kek);
}

/**
 * HKDF-SHA-256 subkey derivation.
 * @param {Uint8Array} ikm input keying material
 * @param {Uint8Array} salt
 * @param {string} info context label
 * @param {number} [lengthBytes=32]
 * @returns {Promise<Uint8Array>}
 */
export async function hkdf(ikm, salt, info, lengthBytes = 32) {
  const base = await subtle().importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await subtle().deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info: utf8ToBytes(info) },
    base,
    lengthBytes * 8,
  );
  return new Uint8Array(bits);
}

/** SHA-256 digest. @param {Uint8Array} bytes @returns {Promise<Uint8Array>} */
export async function sha256(bytes) {
  return new Uint8Array(await subtle().digest('SHA-256', bytes));
}

/**
 * Best-effort wipe of sensitive byte buffers (overwrite then zero).
 * JS cannot guarantee memory zeroing, but this limits the window of exposure.
 * @param {...(Uint8Array|null|undefined)} buffers
 */
export function secureWipe(...buffers) {
  for (const buf of buffers) {
    if (buf instanceof Uint8Array && buf.length) {
      globalThis.crypto.getRandomValues(buf);
      buf.fill(0);
    }
  }
}
