import { test } from 'node:test';
import assert from 'node:assert/strict';

/**
 * A scripted IndexedDB. Each request succeeds on its own, then the transaction
 * commits (or fails) afterwards, like the real thing. Writes are applied only
 * on a successful commit.
 */
function installFakeIndexedDb({ failCommit = false, failRead = false } = {}) {
  const data = new Map();
  const db = {
    objectStoreNames: { contains: () => true },
    transaction() {
      const tx = { error: null, oncomplete: null, onerror: null, onabort: null };
      const writes = [];
      let failed = false;
      const request = (work) => {
        const req = { result: undefined, error: null, onsuccess: null, onerror: null };
        queueMicrotask(() => {
          if (work.fails) {
            failed = true;
            req.error = tx.error = new Error('read failed');
            req.onerror?.({ target: req });
            tx.onerror?.({ target: req });
            tx.onabort?.({ target: tx });
          } else {
            req.result = work.value;
            req.onsuccess?.({ target: req });
          }
        });
        return req;
      };
      tx.objectStore = () => ({
        get: (k) => request({ fails: failRead, value: data.get(k) }),
        put: (v, k) => { writes.push(() => data.set(k, v)); return request({}); },
        delete: (k) => { writes.push(() => data.delete(k)); return request({}); },
      });
      setTimeout(() => {
        if (failed) return;
        if (failCommit) {
          tx.error = new Error('QuotaExceededError');
          tx.onabort?.({ target: tx });
          return;
        }
        writes.forEach((w) => w());
        tx.oncomplete?.({ target: tx });
      }, 0);
      return tx;
    },
  };
  globalThis.indexedDB = {
    open() {
      const req = { result: db, onsuccess: null, onerror: null, onupgradeneeded: null };
      queueMicrotask(() => req.onsuccess?.({ target: req }));
      return req;
    },
  };
  return data;
}

const { IndexedDbAdapter } = await import('../src/pwa/lib/idb-adapter.js');

test('set and get round trip through a committed transaction', async () => {
  installFakeIndexedDb();
  const a = new IndexedDbAdapter();
  await a.set({ x: 1, y: { deep: true } });
  assert.deepEqual(await a.get(['x', 'y', 'missing']), { x: 1, y: { deep: true } });
});

test('set does not report success when the commit fails', async () => {
  const data = installFakeIndexedDb({ failCommit: true });
  const a = new IndexedDbAdapter();
  await assert.rejects(a.set({ vault: 'ciphertext' }), /Quota/);
  assert.equal(data.size, 0);
});

test('a read error is an error, never "no vault"', async () => {
  installFakeIndexedDb({ failRead: true });
  const a = new IndexedDbAdapter();
  await assert.rejects(a.get(['okey_setup_complete']), /read failed/);
});

test('remove commits, and does not report success when it cannot', async () => {
  const data = installFakeIndexedDb();
  const a = new IndexedDbAdapter();
  await a.set({ k: 'v' });
  await a.remove('k');
  assert.equal(data.has('k'), false);

  const failing = installFakeIndexedDb({ failCommit: true });
  failing.set('k', 'v');
  await assert.rejects(new IndexedDbAdapter().remove(['k']), /Quota/);
  assert.equal(failing.has('k'), true);
});
