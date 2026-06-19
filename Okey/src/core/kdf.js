/**
 * OKey — Core: Key Derivation
 *
 * Derives a 256-bit Key Encryption Key (KEK) from a human secret
 * (master password or recovery key) + a per-vault salt.
 *
 * - Argon2id (memory-hard) is the default, via the vetted, self-contained
 *   `hash-wasm` library (WASM inlined; no remote fetch; no eval beyond the
 *   `wasm-unsafe-eval` already granted in the extension CSP).
 * - PBKDF2-HMAC-SHA256 @ 600k iterations is the deterministic fallback when
 *   WASM cannot initialize (rare; e.g. hardened/old runtimes).
 * - The exact parameters used are returned and persisted per-vault so the KEK
 *   reproduces on any device, regardless of that device's capabilities.
 */

import { argon2id } from 'hash-wasm';
import { KDF } from './constants.js';
import { utf8ToBytes } from './encoding.js';
import { secureWipe } from './crypto.js';

/**
 * @typedef {Object} KdfParams
 * @property {'argon2id'|'pbkdf2'} type
 * @property {number} [time]
 * @property {number} [memoryKiB]
 * @property {number} [parallelism]
 * @property {number} [iterations]
 * @property {string} [hash]
 */

/** @type {boolean|null} */
let _argon2Ok = null;

/**
 * Probe whether Argon2id (WASM) is usable in this runtime. Cached.
 * @returns {Promise<boolean>}
 */
export async function isArgon2Available() {
  if (_argon2Ok !== null) return _argon2Ok;
  try {
    await argon2id({
      password: 'probe',
      salt: new Uint8Array(16),
      parallelism: 1,
      iterations: 1,
      memorySize: 256,
      hashLength: 32,
      outputType: 'binary',
    });
    _argon2Ok = true;
  } catch {
    _argon2Ok = false;
  }
  return _argon2Ok;
}

/**
 * Recommended KDF params for a freshly created vault on this device.
 * @returns {Promise<KdfParams>}
 */
export async function getRecommendedKdfParams() {
  if (await isArgon2Available()) {
    return {
      type: 'argon2id',
      time: KDF.ARGON2_TIME,
      memoryKiB: KDF.ARGON2_MEMORY_KIB,
      parallelism: KDF.ARGON2_PARALLELISM,
    };
  }
  return { type: 'pbkdf2', iterations: KDF.PBKDF2_ITERATIONS, hash: KDF.PBKDF2_HASH };
}

/**
 * Derive a 256-bit KEK from a secret + salt.
 * The secret bytes are wiped from memory before returning.
 *
 * @param {string} secret master password or recovery key
 * @param {Uint8Array} salt ≥16 bytes
 * @param {KdfParams|null} [params] when null, recommended params for this device are used
 * @returns {Promise<{ kek: Uint8Array, kdfParams: KdfParams }>}
 */
export async function deriveKek(secret, salt, params = null) {
  const secretBytes = utf8ToBytes(secret);
  try {
    const effective = params || (await getRecommendedKdfParams());
    if (effective.type === 'argon2id' && (await isArgon2Available())) {
      const kek = await argon2id({
        password: secretBytes,
        salt,
        parallelism: effective.parallelism ?? KDF.ARGON2_PARALLELISM,
        iterations: effective.time ?? KDF.ARGON2_TIME,
        memorySize: effective.memoryKiB ?? KDF.ARGON2_MEMORY_KIB,
        hashLength: KDF.ARGON2_HASH_LENGTH,
        outputType: 'binary',
      });
      return {
        kek: new Uint8Array(kek),
        kdfParams: {
          type: 'argon2id',
          time: effective.time ?? KDF.ARGON2_TIME,
          memoryKiB: effective.memoryKiB ?? KDF.ARGON2_MEMORY_KIB,
          parallelism: effective.parallelism ?? KDF.ARGON2_PARALLELISM,
        },
      };
    }
    return derivePbkdf2(secretBytes, salt, effective);
  } finally {
    secureWipe(secretBytes);
  }
}

/**
 * @param {Uint8Array} secretBytes
 * @param {Uint8Array} salt
 * @param {KdfParams} params
 * @returns {Promise<{ kek: Uint8Array, kdfParams: KdfParams }>}
 */
async function derivePbkdf2(secretBytes, salt, params) {
  const iterations = params?.iterations ?? KDF.PBKDF2_ITERATIONS;
  const hash = params?.hash ?? KDF.PBKDF2_HASH;
  const base = await globalThis.crypto.subtle.importKey('raw', secretBytes, 'PBKDF2', false, ['deriveBits']);
  const bits = await globalThis.crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash }, base, 256);
  return { kek: new Uint8Array(bits), kdfParams: { type: 'pbkdf2', iterations, hash } };
}

/** Test-only: reset the cached Argon2 availability probe. */
export function _resetArgon2Probe() {
  _argon2Ok = null;
}
