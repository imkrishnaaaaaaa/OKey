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

// ---- Argon2 missing on this device (F8) ----

import { isArgon2Available, _resetArgon2Probe } from '../src/core/kdf.js';
import { Vault } from '../src/core/vault.js';
import { MemoryStorage } from './helpers.js';
import { STORAGE_KEYS } from '../src/core/constants.js';

const ARGON = { type: 'argon2id', time: 1, memoryKiB: 256, parallelism: 1 };

/** Run fn with WebAssembly hidden, so the Argon2 WASM cannot start. */
async function withoutWasm(fn) {
  const real = globalThis.WebAssembly;
  globalThis.WebAssembly = undefined;
  _resetArgon2Probe();
  try { return await fn(); } finally { globalThis.WebAssembly = real; }
}

test('an argon2id vault on a device without Argon2 throws FormatError, not a wrong-PIN error', async () => {
  const salt = new Uint8Array(16).fill(3);
  await assert.rejects(
    withoutWasm(() => deriveKek('1234', salt, ARGON)),
    (e) => e.name === 'FormatError' && e.code !== 'DECRYPTION_FAILED',
  );
});

test('a failed Argon2 probe is not remembered', async () => {
  assert.equal(await withoutWasm(() => isArgon2Available()), false);
  assert.equal(await isArgon2Available(), true);
});

test('restoring an argon2id vault on a device without Argon2 writes nothing', async () => {
  const a = new Vault(new MemoryStorage());
  const { recoveryMnemonic } = await a.setup('1234');
  const s = await a.storage.get(['okey_salt', 'okey_kdf_params', 'okey_wrapped_recovery']);
  const meta = { salt: s.okey_salt, kdfParams: s.okey_kdf_params, wrappedRecovery: s.okey_wrapped_recovery };

  const bStorage = new MemoryStorage();
  await assert.rejects(
    withoutWasm(() => new Vault(bStorage).restoreWithRecovery(recoveryMnemonic, '5678', meta, [])),
    (e) => e.name === 'FormatError',
  );
  assert.equal(bStorage.map.size, 0);
});

test('unlock during an Argon2 failure is not a wrong PIN, and the right PIN works afterwards', async () => {
  const storage = new MemoryStorage();
  const v = new Vault(storage);
  await v.setup('1234');
  v.lock();
  await assert.rejects(withoutWasm(() => new Vault(storage).unlock('1234')), (e) => e.name === 'FormatError');
  assert.equal(storage.map.get(STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS) ?? 0, 0);
  const again = new Vault(storage);
  await again.unlock('1234');
  assert.equal(again.isUnlocked(), true);
});
