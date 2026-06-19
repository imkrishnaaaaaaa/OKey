/**
 * OKey — Core: Recovery key
 *
 * A recovery key is a 24-word BIP-39 mnemonic (256 bits of entropy + checksum)
 * generated at setup. The Data Encryption Key (DEK) is wrapped under a KEK
 * derived from this mnemonic, so the user can:
 *   - recover the vault after forgetting the master password, and
 *   - set a new master password (which simply re-wraps the same DEK).
 *
 * The mnemonic is shown ONCE and never persisted by OKey. Only the
 * recovery-wrapped DEK is stored (useless without the words).
 *
 * Because the mnemonic already carries 256 bits of entropy, we use HKDF (fast)
 * rather than a slow password hash to derive its KEK — there is nothing to
 * brute-force.
 */

import { generateMnemonic, validateMnemonic, mnemonicToEntropy } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import { hkdf } from './crypto.js';
import { ValidationError } from './errors.js';

const RECOVERY_INFO = 'okey:recovery-kek:v1';

/**
 * Generate a fresh 24-word recovery mnemonic.
 * @returns {string} space-separated words
 */
export function generateRecoveryMnemonic() {
  return generateMnemonic(wordlist, 256);
}

/** @param {string} mnemonic @returns {string[]} */
export function mnemonicWords(mnemonic) {
  return mnemonic.trim().toLowerCase().split(/\s+/);
}

/**
 * Validate a user-entered recovery mnemonic (checksum + wordlist).
 * @param {string} mnemonic
 * @returns {boolean}
 */
export function validateRecoveryMnemonic(mnemonic) {
  try {
    return validateMnemonic(normalizeMnemonic(mnemonic), wordlist);
  } catch {
    return false;
  }
}

/** Normalize spacing/case for comparison & validation. */
export function normalizeMnemonic(mnemonic) {
  return mnemonicWords(mnemonic).join(' ');
}

/**
 * Derive a 256-bit KEK from a recovery mnemonic, bound to the vault salt.
 * @param {string} mnemonic
 * @param {Uint8Array} salt the vault salt (binds the KEK to this vault)
 * @returns {Promise<Uint8Array>}
 */
export async function deriveRecoveryKek(mnemonic, salt) {
  const normalized = normalizeMnemonic(mnemonic);
  if (!validateMnemonic(normalized, wordlist)) {
    throw new ValidationError('Invalid recovery key');
  }
  const entropy = mnemonicToEntropy(normalized, wordlist); // 32 bytes
  return hkdf(entropy, salt, RECOVERY_INFO, 32);
}
