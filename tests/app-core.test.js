import { test } from 'node:test';
import assert from 'node:assert/strict';

// app-core only touches document to fire the sync-status event.
globalThis.document ??= new EventTarget();
const { ctx, trySync } = await import('../src/ui/app-core.js');

test('trySync hands the unlocked vault to CloudSync.sync', async () => {
  let seen = null;
  ctx.vault = { isUnlocked: () => true };
  ctx.user = { uid: 'u1' };
  ctx.cloudSync = {
    async sync(v) { seen = v; return { pushed: 0, pulled: 0 }; },
    async pullSettings(s) { return s; },
  };
  await trySync();
  assert.equal(seen, ctx.vault);
  assert.equal(ctx.syncStatus, 'ok');
});
