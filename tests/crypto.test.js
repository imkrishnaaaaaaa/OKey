import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateDek, importAesKey, encryptString, decryptString,
  encryptJson, decryptJson, wrapKeyMaterial, unwrapKeyMaterial, randomBytes,
} from '../src/core/crypto.js';

test('AES-GCM string round trip', async () => {
  const dek = generateDek();
  const key = await importAesKey(dek);
  const ct = await encryptString('hello vault', key);
  assert.notEqual(ct, 'hello vault');
  assert.equal(await decryptString(ct, key), 'hello vault');
});

test('JSON round trip preserves structure', async () => {
  const key = await importAesKey(generateDek());
  const value = { password: 's3cret', tags: ['a', 'b'], nested: { x: 1 } };
  const pt = await decryptJson(await encryptJson(value, key), key);
  assert.deepEqual(pt, value);
});

test('tampered ciphertext fails to decrypt', async () => {
  const key = await importAesKey(generateDek());
  const raw = Buffer.from(await encryptString('data', key), 'base64');
  raw[raw.length - 1] ^= 0xff;
  await assert.rejects(() => decryptString(raw.toString('base64'), key));
});

test('wrong key cannot decrypt', async () => {
  const keyA = await importAesKey(generateDek());
  const keyB = await importAesKey(generateDek());
  const ct = await encryptString('secret', keyA);
  await assert.rejects(() => decryptString(ct, keyB));
});

test('unique IV per encryption (same plaintext differs)', async () => {
  const key = await importAesKey(generateDek());
  const a = await encryptString('same', key);
  const b = await encryptString('same', key);
  assert.notEqual(a, b);
});

test('wrap/unwrap DEK under KEK', async () => {
  const dek = generateDek();
  const kek = randomBytes(32);
  const wrapped = await wrapKeyMaterial(dek, kek);
  const unwrapped = await unwrapKeyMaterial(wrapped, kek);
  assert.deepEqual(Array.from(unwrapped), Array.from(dek));
  const bad = randomBytes(32);
  await assert.rejects(() => unwrapKeyMaterial(wrapped, bad));
});
