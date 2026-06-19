/**
 * OKey — Core: Password & passphrase generation + strength analysis
 *
 * Uniform, bias-free random selection via rejection sampling over
 * crypto.getRandomValues. Passphrases use the audited BIP-39 English wordlist
 * (2048 words → 11 bits/word) for high, easy-to-compute entropy.
 */

import { PASSWORD_GEN } from './constants.js';
import { randomBytes } from './crypto.js';
import { wordlist } from '@scure/bip39/wordlists/english';

const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const DIGITS = '0123456789';

/** Uniform random integer in [0, max) without modulo bias. */
function randIntBelow(max) {
  if (max <= 0) throw new RangeError('max must be > 0');
  const limit = Math.floor(256 / max) * max;
  // Pull bytes until one falls in the unbiased range.
  for (;;) {
    const b = randomBytes(1)[0];
    if (b < limit) return b % max;
  }
}

/** Pick a uniform random character from a charset string. */
function pick(charset) {
  return charset[randIntBelow(charset.length)];
}

/** Fisher–Yates shuffle (in place), crypto-random. */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randIntBelow(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generate a random password.
 * Guarantees at least one character from each enabled class (when length allows).
 * @param {Object} [options]
 * @param {number} [options.length]
 * @param {boolean} [options.uppercase]
 * @param {boolean} [options.lowercase]
 * @param {boolean} [options.numbers]
 * @param {boolean} [options.symbols]
 * @param {string} [options.symbolSet]
 * @returns {string}
 */
export function generatePassword(options = {}) {
  const length = Math.min(Math.max(options.length ?? PASSWORD_GEN.DEFAULT_LENGTH, 1), PASSWORD_GEN.MAX_LENGTH);
  const uppercase = options.uppercase ?? PASSWORD_GEN.DEFAULT_UPPERCASE;
  const lowercase = options.lowercase ?? PASSWORD_GEN.DEFAULT_LOWERCASE;
  const numbers = options.numbers ?? PASSWORD_GEN.DEFAULT_NUMBERS;
  const symbols = options.symbols ?? PASSWORD_GEN.DEFAULT_SYMBOLS;
  const symbolSet = options.symbolSet || PASSWORD_GEN.SYMBOL_SET;

  const classes = [];
  if (lowercase) classes.push(LOWER);
  if (uppercase) classes.push(UPPER);
  if (numbers) classes.push(DIGITS);
  if (symbols) classes.push(symbolSet);
  if (classes.length === 0) classes.push(LOWER + UPPER + DIGITS);

  const charset = classes.join('');
  const chars = [];
  // One guaranteed char per class (up to length).
  for (let i = 0; i < classes.length && i < length; i++) chars.push(pick(classes[i]));
  // Fill the rest from the full charset.
  for (let i = chars.length; i < length; i++) chars.push(pick(charset));
  return shuffle(chars).join('');
}

/**
 * Generate a passphrase from the BIP-39 wordlist.
 * @param {Object} [options]
 * @param {number} [options.words]
 * @param {string} [options.separator]
 * @param {boolean} [options.capitalize]
 * @param {boolean} [options.includeNumber] append a random digit group for sites requiring digits
 * @returns {string}
 */
export function generatePassphrase(options = {}) {
  const words = Math.max(options.words ?? PASSWORD_GEN.PASSPHRASE_DEFAULT_WORDS, 1);
  const separator = options.separator ?? PASSWORD_GEN.PASSPHRASE_SEPARATOR;
  const capitalize = !!options.capitalize;
  const out = [];
  for (let i = 0; i < words; i++) {
    let w = wordlist[randIntBelow(wordlist.length)];
    if (capitalize) w = w[0].toUpperCase() + w.slice(1);
    out.push(w);
  }
  let phrase = out.join(separator);
  if (options.includeNumber) phrase += separator + randIntBelow(9000) + 1000;
  return phrase;
}

/** True if `password` is not already present in `existing`. */
export function isPasswordUnique(password, existing = []) {
  return !existing.includes(password);
}

/**
 * Generate a password not already present in `existing`.
 * @returns {string}
 */
export function generateUniquePassword(options = {}, existing = [], maxAttempts = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const p = generatePassword(options);
    if (isPasswordUnique(p, existing)) return p;
  }
  throw new Error('Unable to generate a unique password after maximum attempts');
}

/**
 * Estimate password entropy (bits) from observed character classes.
 * @param {string} password
 * @returns {number}
 */
export function passwordEntropyBits(password) {
  if (!password) return 0;
  let pool = 0;
  if (/[a-z]/.test(password)) pool += 26;
  if (/[A-Z]/.test(password)) pool += 26;
  if (/[0-9]/.test(password)) pool += 10;
  if (/[^a-zA-Z0-9]/.test(password)) pool += 33;
  if (pool === 0) return 0;
  return Math.round(password.length * Math.log2(pool));
}

/** Passphrase entropy = words × log2(wordlist size). */
export function passphraseEntropyBits(wordCount, listSize = wordlist.length) {
  return Math.round(wordCount * Math.log2(listSize));
}

/**
 * Strength level 1..5 and label from entropy bits.
 * @param {number} bits
 * @returns {{ level:number, label:string }}
 */
export function strengthFromEntropy(bits) {
  let level;
  if (bits < 28) level = 1;
  else if (bits < 36) level = 2;
  else if (bits < 60) level = 3;
  else if (bits < 80) level = 4;
  else level = 5;
  return { level, label: ['', 'Very weak', 'Weak', 'Fair', 'Strong', 'Very strong'][level] };
}

/** Analyze an arbitrary password string. */
export function analyzePassword(password) {
  const entropy = passwordEntropyBits(password);
  return { entropy, ...strengthFromEntropy(entropy) };
}
