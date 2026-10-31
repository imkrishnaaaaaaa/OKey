import { test } from 'node:test';
import assert from 'node:assert/strict';

// A fake chrome.storage and chrome.alarms, just enough for lib/session.js.
const session = {};
const local = { okey_settings: { autoLockTimeout: 300, miniAutoLockTimeout: 300 } };
globalThis.chrome = {
  storage: {
    session: {
      async get(keys) {
        if (keys === null) return { ...session };
        const list = [].concat(keys);
        return Object.fromEntries(list.filter((k) => k in session).map((k) => [k, session[k]]));
      },
      async set(items) { Object.assign(session, items); },
      async remove(keys) { for (const k of [].concat(keys)) delete session[k]; },
    },
    local: { async get(k) { return { [k]: local[k] }; } },
  },
  alarms: { async create() {}, async clear() {} },
};
const { touchSession } = await import('../src/extension/lib/session.js');

const MIN = 60_000;
function reset({ ext, mini }) {
  for (const k of Object.keys(session)) delete session[k];
  Object.assign(session, { okey_session_dek: 'dek', okey_session_expiry: ext, okey_session_mini_expiry: mini });
}

test('touching the page session does not extend the popup session', async () => {
  const now = Date.now();
  reset({ ext: now + 1 * MIN, mini: now + 1 * MIN });
  assert.equal(await touchSession('mini'), true);
  assert.equal(session.okey_session_expiry, now + 1 * MIN, 'popup timer untouched');
  assert.ok(session.okey_session_mini_expiry > now + 4 * MIN, 'page timer extended');
});

test('a popup timer that has run out is not brought back by page activity', async () => {
  const now = Date.now();
  const expired = now - 5_000;
  reset({ ext: expired, mini: now + 5 * MIN });
  assert.equal(await touchSession('mini'), true);
  assert.equal(session.okey_session_expiry, expired);
});

test('an expired timer is never extended, whichever kind it is', async () => {
  const now = Date.now();
  reset({ ext: now + 5 * MIN, mini: now - 5_000 });
  assert.equal(await touchSession('mini'), false, 'page timer expired: no extension');
  assert.equal(session.okey_session_mini_expiry, now - 5_000);

  reset({ ext: now - 5_000, mini: now + 5 * MIN });
  assert.equal(await touchSession('extension'), false, 'popup timer expired: no extension');
  assert.equal(session.okey_session_expiry, now - 5_000);
});

test('a number still means the popup session, as the popup bridge passes one', async () => {
  const now = Date.now();
  reset({ ext: now + 1 * MIN, mini: now + 1 * MIN });
  assert.equal(await touchSession(300), true);
  assert.ok(session.okey_session_expiry > now + 4 * MIN);
  assert.equal(session.okey_session_mini_expiry, now + 1 * MIN);
});

test('with both timers out, the session is cleared', async () => {
  const now = Date.now();
  reset({ ext: now - 1000, mini: now - 1000 });
  assert.equal(await touchSession('mini'), false);
  assert.equal(session.okey_session_dek, undefined);
});

test('page activity extends the page session only', async () => {
  const { touchPageSession } = await import('../src/extension/lib/session.js');
  const now = Date.now();
  reset({ ext: now + 1 * MIN, mini: now + 1 * MIN });
  assert.equal(await touchPageSession(), true);
  assert.equal(session.okey_session_expiry, now + 1 * MIN);
  assert.ok(session.okey_session_mini_expiry > now + 4 * MIN);
});

test('the page session is capped at the same limit as the popup, in both places that set it', async () => {
  const { cacheDek } = await import('../src/extension/lib/session.js');
  const LIMIT_MS = 1800 * 1000;
  local.okey_settings = { autoLockTimeout: 300, miniAutoLockTimeout: 3600 };

  const before = Date.now();
  await cacheDek(new Uint8Array(4), 300);
  assert.ok(session.okey_session_mini_expiry - before <= LIMIT_MS + 1000, 'cacheDek');

  reset({ ext: Date.now() + 5 * MIN, mini: Date.now() + 5 * MIN });
  const t0 = Date.now();
  await touchSession('mini');
  assert.ok(session.okey_session_mini_expiry - t0 <= LIMIT_MS + 1000, 'touchSession');
  local.okey_settings = { autoLockTimeout: 300, miniAutoLockTimeout: 300 };
});
