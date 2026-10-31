import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateTOTP, totpOptions, normalizeTotpParams, parseTotpInput, buildOtpAuthUri,
} from '../src/core/totp.js';
import { createEntry } from '../src/core/schema.js';
import { importOtpAuthUris, importBitwarden, exportBitwardenJson } from '../src/core/import-export.js';
import { Vault } from '../src/core/vault.js';
import { MemoryStorage } from './helpers.js';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function base32(text) {
  let bits = '';
  for (const b of Buffer.from(text)) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) out += ALPHABET[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}

// RFC 6238 appendix B, time 59s, 8 digits.
const SHA1_SECRET = base32('12345678901234567890');
const SHA256_SECRET = base32('12345678901234567890123456789012');
const mk = (data) => createEntry(data, () => 'id1', () => '2026-01-01T00:00:00.000Z');

test('RFC 6238 vectors: the generator is right for 8 digits and SHA-256', async () => {
  assert.equal((await generateTOTP(SHA1_SECRET, { digits: 8, timestamp: 59000 })).code, '94287082');
  assert.equal((await generateTOTP(SHA256_SECRET, { digits: 8, algorithm: 'SHA-256', timestamp: 59000 })).code, '46119246');
});

test('an entry keeps its TOTP settings, and the code uses them', async () => {
  const e = mk({ totpSecret: SHA256_SECRET, totpDigits: 8, totpPeriod: 30, totpAlgorithm: 'SHA256' });
  assert.deepEqual([e.totpDigits, e.totpPeriod, e.totpAlgorithm], [8, 30, 'SHA-256']);
  assert.equal((await generateTOTP(e.totpSecret, { ...totpOptions(e), timestamp: 59000 })).code, '46119246');
});

test('missing or bad TOTP settings fall back to the usual 6 digits, 30 seconds, SHA-1', () => {
  const plain = mk({ totpSecret: SHA1_SECRET });
  assert.deepEqual([plain.totpDigits, plain.totpPeriod, plain.totpAlgorithm], [6, 30, 'SHA-1']);
  assert.deepEqual(normalizeTotpParams({ digits: 99, period: 'x', algorithm: 'MD5' }), { totpDigits: 6, totpPeriod: 30, totpAlgorithm: 'SHA-1' });
  assert.equal(normalizeTotpParams({ period: 0 }).totpPeriod, 30);
  assert.equal(normalizeTotpParams({ period: 100000 }).totpPeriod, 30);
});

test('TOTP settings are saved encrypted and survive lock and unlock', async () => {
  const storage = new MemoryStorage();
  const v = new Vault(storage);
  await v.setup('1234');
  const added = await v.addEntry({ siteName: 'Bank', domain: 'bank.com', totpSecret: SHA256_SECRET, totpDigits: 8, totpPeriod: 60, totpAlgorithm: 'SHA-256' });
  v.lock();
  const again = new Vault(storage);
  await again.unlock('1234');
  const e = again.getEntry(added.id);
  assert.deepEqual([e.totpDigits, e.totpPeriod, e.totpAlgorithm], [8, 60, 'SHA-256']);
});

test('pasting an otpauth URI gives the secret and its settings; a plain secret gives no settings', () => {
  const uri = `otpauth://totp/Bank:me?secret=${SHA256_SECRET}&digits=8&period=60&algorithm=SHA256`;
  assert.deepEqual(parseTotpInput(uri), { secret: SHA256_SECRET, params: { totpDigits: 8, totpPeriod: 60, totpAlgorithm: 'SHA-256' } });
  assert.deepEqual(parseTotpInput(' ABCD EFGH '), { secret: 'ABCDEFGH', params: null });
});

test('importing otpauth URIs keeps digits, period and algorithm', () => {
  const [item] = importOtpAuthUris(`otpauth://totp/Bank:me?secret=${SHA256_SECRET}&issuer=Bank&digits=8&period=60&algorithm=SHA256`);
  assert.equal(item.totpSecret, SHA256_SECRET);
  assert.deepEqual([item.totpDigits, item.totpPeriod, item.totpAlgorithm], [8, 60, 'SHA-256']);
});

test('a Bitwarden login whose totp is an otpauth URI becomes a clean secret plus settings', () => {
  const json = JSON.stringify({ items: [{ type: 1, name: 'Bank', login: { username: 'me', password: 'p', totp: `otpauth://totp/Bank:me?secret=${SHA256_SECRET}&digits=8&algorithm=SHA256` } }] });
  const [item] = importBitwarden(json);
  assert.equal(item.totpSecret, SHA256_SECRET);
  assert.deepEqual([item.totpDigits, item.totpPeriod, item.totpAlgorithm], [8, 30, 'SHA-256']);
});

test('Bitwarden export keeps non-default settings as an otpauth URI and default ones as a bare secret', () => {
  const custom = mk({ siteName: 'A', domain: 'a.com', password: 'p', totpSecret: SHA256_SECRET, totpDigits: 8, totpPeriod: 60, totpAlgorithm: 'SHA-256' });
  const plain = mk({ siteName: 'B', domain: 'b.com', password: 'p', totpSecret: SHA1_SECRET });
  const items = JSON.parse(exportBitwardenJson([custom, plain])).items;
  assert.match(items[0].login.totp, /^otpauth:\/\/totp\//);
  const back = importBitwarden(exportBitwardenJson([custom]))[0];
  assert.deepEqual([back.totpSecret, back.totpDigits, back.totpPeriod, back.totpAlgorithm], [SHA256_SECRET, 8, 60, 'SHA-256']);
  assert.equal(items[1].login.totp, SHA1_SECRET);
});

test('buildOtpAuthUri writes the algorithm when it is not SHA-1', () => {
  assert.match(buildOtpAuthUri({ secret: 'ABC', account: 'me', algorithm: 'SHA-256' }), /algorithm=SHA256/);
});
