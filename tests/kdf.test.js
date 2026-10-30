import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveKek } from '../src/core/kdf.js';
import { generateSalt, randomBytes } from '../src/core/crypto.js';

test('KDF is deterministic for same secret + salt + params', async () => {
  const salt = new Uint8Array(16).fill(7);
  const params = { type: 'pbkdf2', iterations: 1000, hash: 'SHA-256' }; // fast for tests
  const a = await deriveKek('1234', salt, params);
  const b = await deriveKek('1234', salt, params);
  assert.deepEqual(Array.from(a.kek), Array.from(b.kek));
});

test('different secret → different KEK', async () => {
  const salt = new Uint8Array(16).fill(7);
  const params = { type: 'pbkdf2', iterations: 1000, hash: 'SHA-256' };
  const a = await deriveKek('1234', salt, params);
  const b = await deriveKek('4321', salt, params);
  assert.notDeepEqual(Array.from(a.kek), Array.from(b.kek));
});

test('different salt → different KEK', async () => {
  const params = { type: 'pbkdf2', iterations: 1000, hash: 'SHA-256' };
  const a = await deriveKek('1234', generateSalt(16), params);
  const b = await deriveKek('1234', generateSalt(16), params);
  assert.notDeepEqual(Array.from(a.kek), Array.from(b.kek));
});

test('params are echoed back so unlock reproduces on other devices', async () => {
  const params = { type: 'pbkdf2', iterations: 1000, hash: 'SHA-256' };
  const { kdfParams } = await deriveKek('1234', randomBytes(16), params);
  assert.deepEqual(kdfParams, params);
});
