import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runBackgroundSync } from '../src/extension/background/background-sync.js';
import { createCloudSync } from '../src/lib/cloud-sync-factory.js';
import { MemoryStorage } from './helpers.js';

/** A vault stand-in that counts lock() calls. */
const fakeVault = () => ({ locks: 0, lock() { this.locks++; } });

function deps(over = {}) {
  const vault = fakeVault();
  return {
    vault,
    calls: { opened: 0, synced: 0 },
    d: {
      isPopupOpen: async () => false,
      openVault: async () => vault,
      getCloudSync: async () => ({ sync: async () => ({ pushed: 2, pulled: 1 }) }),
      ...over,
    },
  };
}

test('it does nothing while the popup is open, and never opens the vault', async () => {
  let opened = false;
  const { d } = deps({ isPopupOpen: async () => true, openVault: async () => { opened = true; } });
  assert.deepEqual(await runBackgroundSync(d), { success: false, skipped: 'popup-open' });
  assert.equal(opened, false);
});

test('a locked vault is skipped', async () => {
  const { d } = deps({ openVault: async () => null });
  assert.deepEqual(await runBackgroundSync(d), { success: false, skipped: 'locked' });
});

test('not configured or signed out is skipped, and the vault is locked again', async () => {
  const a = deps({ getCloudSync: async () => null });
  assert.deepEqual(await runBackgroundSync(a.d), { success: false, skipped: 'not-configured' });
  assert.equal(a.vault.locks, 1);

  const b = deps({ getCloudSync: async () => ({ sync: async () => { throw new Error('Not signed in'); } }) });
  assert.deepEqual(await runBackgroundSync(b.d), { success: false, skipped: 'signed-out' });
  assert.equal(b.vault.locks, 1);
});

test('a good sync reports what moved and locks the vault', async () => {
  const { d, vault } = deps();
  assert.deepEqual(await runBackgroundSync(d), { success: true, pushed: 2, pulled: 1 });
  assert.equal(vault.locks, 1);
});

test('any other error is reported, trimmed, and the vault is still locked', async () => {
  const { d, vault } = deps({ getCloudSync: async () => ({ sync: async () => { throw new Error('x'.repeat(500)); } }) });
  const out = await runBackgroundSync(d);
  assert.equal(out.success, false);
  assert.equal(out.error.length, 120);
  assert.equal(vault.locks, 1);
});

// ---- the shared factory ----

test('the factory finds the user, token and per-account cursor', async () => {
  const store = new MemoryStorage();
  let user = null;
  const sync = createCloudSync({ store, projectId: 'p', getUser: async () => user });
  assert.equal(await sync.getUid(), null);
  assert.equal(await sync.getLastSyncAt(), null);
  assert.equal(await sync.cloud.getToken(), null);

  user = { uid: 'u1', getIdToken: async () => 'tok' };
  assert.equal(await sync.getUid(), 'u1');
  assert.equal(await sync.cloud.getToken(), 'tok');
  await sync.setLastSyncAt('2030-01-01T00:00:01Z');
  assert.equal(await sync.getLastSyncAt(), '2030-01-01T00:00:01Z');
  assert.equal(store.map.get('okey_sync_cursor_u1'), '2030-01-01T00:00:01Z');

  user = { uid: 'u2', getIdToken: async () => 'tok2' };
  assert.equal(await sync.getLastSyncAt(), null, 'another account has its own cursor');
});

test('a token that cannot be fetched is treated as signed out, not as a crash', async () => {
  const sync = createCloudSync({ store: new MemoryStorage(), projectId: 'p', getUser: async () => ({ uid: 'u', getIdToken: async () => { throw new Error('offline'); } }) });
  assert.equal(await sync.cloud.getToken(), null);
});
