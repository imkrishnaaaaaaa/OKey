import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createFillSessions } from '../src/extension/lib/fill-session.js';

/** A stand-in for chrome.storage.session: get(key|null), set, remove. */
function fakeSessionStorage(initial = {}) {
  const data = { ...initial };
  return {
    data,
    async get(k) { return k === null ? { ...data } : { [k]: data[k] }; },
    async set(items) { Object.assign(data, items); },
    async remove(keys) { for (const k of [].concat(keys)) delete data[k]; },
  };
}
const CRED = { username: 'me', password: 'PASSWORD', totpCode: '123456' };

function setup() {
  let clock = 1_000_000;
  const storage = fakeSessionStorage();
  const sessions = createFillSessions(storage, { now: () => clock });
  return { storage, sessions, advance: (ms) => { clock += ms; } };
}

test('the same tab on the same site gets its session back', async () => {
  const { sessions } = setup();
  await sessions.set(7, 'https://bank.com', CRED);
  assert.deepEqual((await sessions.get(7, 'https://bank.com')).cred, CRED);
});

test('a tab that moved to another site gets nothing, and the secret is dropped', async () => {
  const { sessions, storage } = setup();
  await sessions.set(7, 'https://bank.com', CRED);
  assert.equal(await sessions.get(7, 'https://evil.com'), null);
  assert.equal(JSON.stringify(storage.data).includes('PASSWORD'), false);
  assert.equal(await sessions.get(7, 'https://bank.com'), null, 'it does not come back after a hop');
});

test('a session ends after 60 seconds', async () => {
  const { sessions, storage, advance } = setup();
  await sessions.set(7, 'https://bank.com', CRED);
  advance(59_000);
  assert.ok(await sessions.get(7, 'https://bank.com'));
  advance(2_000);
  assert.equal(await sessions.get(7, 'https://bank.com'), null);
  assert.deepEqual(storage.data, {});
});

test('tabs do not see each other\'s sessions', async () => {
  const { sessions } = setup();
  await sessions.set(1, 'https://bank.com', CRED);
  assert.equal(await sessions.get(2, 'https://bank.com'), null);
});

test('a session without an origin is refused', async () => {
  const { sessions } = setup();
  await assert.rejects(sessions.set(7, '', CRED), /origin/i);
});

test('clearAll removes every fill session and nothing else', async () => {
  const { sessions, storage } = setup();
  await storage.set({ okey_session_dek: 'keep', other: 1 });
  await sessions.set(1, 'https://a.com', CRED);
  await sessions.set(2, 'https://b.com', CRED);
  await sessions.clearAll();
  assert.deepEqual(Object.keys(storage.data).sort(), ['okey_session_dek', 'other']);
});

test('a session remembers that it already submitted, across page loads', async () => {
  const { sessions } = setup();
  await sessions.set(7, 'https://bank.com', CRED);
  assert.equal((await sessions.get(7, 'https://bank.com')).submitted, false);
  await sessions.set(7, 'https://bank.com', CRED, { submitted: true });
  assert.equal((await sessions.get(7, 'https://bank.com')).submitted, true);
});
