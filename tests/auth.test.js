import { test } from 'node:test';
import assert from 'node:assert/strict';
import { signRequest, verifyRequest } from '../src/core/auth.js';

const URL_A = 'https://script.google.com/macros/s/DEPLOYID/exec';
const URL_B = 'https://script.google.com/macros/s/OTHERID/exec';

test('sign → verify round trip', async () => {
  const env = await signRequest(URL_A, 'getVault', { a: 1 });
  const { action, payload } = await verifyRequest(URL_A, env);
  assert.equal(action, 'getVault');
  assert.deepEqual(payload, { a: 1 });
});

test('signature bound to exact payload bytes', async () => {
  const env = await signRequest(URL_A, 'syncEntries', { entries: [] });
  const forged = JSON.parse(env.data);
  forged.entries.push({ id: 'injected' });
  await assert.rejects(() => verifyRequest(URL_A, { ...env, data: JSON.stringify(forged) }), /BAD_SIGNATURE|REPLAYED_NONCE/);
});

test('wrong deployment URL (different key) rejected', async () => {
  const env = await signRequest(URL_A, 'ping', {});
  await assert.rejects(() => verifyRequest(URL_B, env), /BAD_SIGNATURE/);
});

test('stale timestamp rejected', async () => {
  const env = await signRequest(URL_A, 'ping', {});
  await assert.rejects(() => verifyRequest(URL_A, env, { now: Date.now() + 10 * 60 * 1000 }), /TIMESTAMP_SKEW/);
});

test('nonce reuse rejected when replay cache provided', async () => {
  const seen = new Set();
  const env = await signRequest(URL_A, 'ping', {});
  await verifyRequest(URL_A, env, { seenNonces: seen });
  await assert.rejects(() => verifyRequest(URL_A, env, { seenNonces: seen }), /REPLAYED_NONCE/);
});

test('envelope version mismatch rejected', async () => {
  const env = await signRequest(URL_A, 'ping', {});
  await assert.rejects(() => verifyRequest(URL_A, { ...env, v: 99 }));
});
