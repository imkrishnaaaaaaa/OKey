import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CloudStore, CloudError, toFsFields, fromFsFields,
} from '../src/core/cloud.js';
import { CloudSync } from '../src/core/cloud-sync.js';

const PID = 'demo-project';
const UID = 'user-1';

function mockStore(handler) {
  const calls = [];
  const getToken = async () => 'tok-123';
  const store = new CloudStore({ projectId: PID, getToken });
  store._request = async function (path, init = {}) {
    calls.push({ path, init });
    return handler(path, init);
  };
  return { store, calls };
}

test('fs value codecs round-trip scalars', () => {
  const obj = {
    s: 'hello', i: 42, d: 1.5, b: true, n: null, t: new Date('2026-01-01T00:00:00Z'),
  };
  const back = fromFsFields(toFsFields(obj));
  assert.equal(back.s, 'hello');
  assert.equal(back.i, 42);
  assert.equal(back.d, 1.5);
  assert.equal(back.b, true);
  assert.equal(back.n, null);
  assert.equal(new Date(back.t).toISOString(), '2026-01-01T00:00:00.000Z');
});

test('pullMeta decodes kdfParams JSON blob', async () => {
  const meta = {
    fields: toFsFields({
      salt: 'abc', wrappedMaster: 'wm', wrappedRecovery: '', formatVersion: 2,
      updatedAt: '2026-01-02T00:00:00.000Z',
    }),
  };
  meta.fields.kdfParamsRaw = { stringValue: '{"type":"argon2id","time":3}' };
  const { store } = mockStore(() => meta);
  const out = await store.pullMeta(UID);
  assert.equal(out.salt, 'abc');
  assert.deepEqual(out.kdfParams, { type: 'argon2id', time: 3 });
});

test('pushEntries batches records with correct doc paths and payload', async () => {
  const seenPaths = [];
  const { store, calls } = mockStore((path) => { seenPaths.push(path); return {}; });
  await store.pushEntries(UID, [
    { id: 'e/1', domain: 'github.com', version: 2, isDeleted: false, updatedAt: '2026-01-01T00:00:00.000Z', displayOrder: 0, isPinned: true, folder: 'Dev', payload: 'CT!' },
  ]);
  assert.ok(seenPaths[0].includes('/vault/entries/e%2F1'));
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.fields.payload.stringValue, 'CT!');
  assert.equal(body.fields.version.integerValue, '2');
  assert.equal(body.fields.isPinned.booleanValue, true);
});

test('runQuery delta maps documents to at-rest records', async () => {
  const { store } = mockStore(() => ([
    { document: { name: `projects/${PID}/databases/(default)/documents/users/${UID}/vault/entries/abc`, fields: toFsFields({ id: 'abc', domain: 'x.com', version: 3, isDeleted: false, updatedAt: '2026-02-01T00:00:00.000Z', displayOrder: 1, isPinned: false, folder: '', entryType: 'password', payload: 'P' }) } },
    { done: true },
  ]));
  const out = await store.pullEntriesDelta(UID, '2026-01-01T00:00:00.000Z');
  assert.equal(out.length, 1);
  assert.deepEqual(out[0], { id: 'abc', domain: 'x.com', version: 3, isDeleted: false, updatedAt: '2026-02-01T00:00:00.000Z', displayOrder: 1, isPinned: false, folder: '', entryType: 'password', payload: 'P' });
});

test('404 with allowMissing yields null (fresh account)', async () => {
  const { store } = mockStore((path, init) => {
    if (init.allowMissing) throw Object.assign(new Error(), { status: 404 });
    return {};
  });
  // simulate the real _request behavior for allowMissing
  const realRequest = CloudStore.prototype._request;
  const tokenProvider = async () => 'tok';
  const s2 = new CloudStore({ projectId: PID, getToken: tokenProvider });
  s2.getToken = tokenProvider;
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => ({ status: 404, ok: false, text: async () => '' });
  try {
    const out = await s2.pullMeta(UID);
    assert.equal(out, null);
  } finally {
    globalThis.fetch = origFetch;
    void realRequest;
  }
});

test('missing token raises NOT_SIGNED_IN', async () => {
  const s2 = new CloudStore({ projectId: PID, getToken: async () => null });
  await assert.rejects(() => s2.pullMeta(UID), /Not signed in/);
});

// ---- controller ----

class MemVaultStub {
  constructor() { this.records = []; this.merged = []; }
  async exportRecords() { return this.records; }
  async mergeRemoteRecords(remote) { this.merged.push(...remote); return { applied: remote.length }; }
}

function makeController(handler, state = {}) {
  const cloud = new CloudStore({ projectId: PID, getToken: async () => 't' });
  cloud._request = handler;
  let cursor = state.cursor || null;
  return new CloudSync({
    store: {
      map: new Map(),
      async get(k) { return Array.isArray(k) ? Object.fromEntries(k.map((x) => [x, this.map.get(x)])) : { [k]: this.map.get(k) }; },
      async set(items) { for (const [k, v] of Object.entries(items)) this.map.set(k, structuredClone(v)); },
      async remove(keys) { for (const k of [].concat(keys)) this.map.delete(k); },
    },
    cloud,
    getUid: async () => UID,
    getLastSyncAt: async () => cursor,
    setLastSyncAt: async (iso) => { cursor = iso; },
  });
}

test('CloudSync.sync pushes modified + pulls delta + advances cursor', async () => {
  const vault = new MemVaultStub();
  vault.records = [{ id: 'a', version: 5, updatedAt: '2026-03-01T00:00:00.000Z', domain: 'a.com' }];
  const pushedBatches = [];
  const ctl = makeController(async (path, init) => {
    if (path.includes(':runQuery')) {
      return [{ document: { name: '/entries/b', fields: toFsFields({ id: 'b', version: 9, updatedAt: '2026-03-02T00:00:00.000Z', domain: 'b.com', payload: 'X' }) } }];
    }
    pushedBatches.push(JSON.parse(init?.body || '{}'));
    return {};
  }, { cursor: '2026-02-01T00:00:00.000Z' });

  const r = await ctl.sync(vault);
  assert.equal(r.pushed, 1);
  assert.equal(r.pulled, 1);
  assert.ok(r.queued === 0);
  assert.ok(pushedBatches.length >= 1);
});

test('CloudSync queues on transport failure and reports queued', async () => {
  const vault = new MemVaultStub();
  vault.records = [{ id: 'a', version: 5, updatedAt: '2026-03-01T00:00:00.000Z' }];
  const ctl = makeController(async (path) => {
    if (path.startsWith('/users/') && !path.includes(':runQuery')) throw new Error('offline');
    return [];
  });
  const r = await ctl.sync(vault);
  assert.equal(r.pushed, 0);
  assert.equal(r.queued, 1);
});
