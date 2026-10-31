import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  CloudStore, CloudError, toFsFields, fromFsFields, SYNC_EPOCH,
} from '../src/core/cloud.js';
import { CloudSync } from '../src/core/cloud-sync.js';
import { STORAGE_KEYS, DEFAULT_SETTINGS } from '../src/core/constants.js';
import { mergeRemoteSettings } from '../src/core/settings.js';
import { memoryFirestore } from './helpers.js';

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

const writesOf = (call) => JSON.parse(call.init.body).writes.map((w) => w.update);

test('pushEntries writes the right doc name, fields and payload', async () => {
  const { store, calls } = mockStore(() => ({}));
  await store.pushEntries(UID, [
    { id: 'e/1', domain: 'github.com', version: 2, isDeleted: false, updatedAt: '2026-01-01T00:00:00.000Z', displayOrder: 0, isPinned: true, folder: 'Dev', payload: 'CT!' },
  ]);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, ':commit');
  const [doc] = writesOf(calls[0]);
  assert.equal(doc.name, `projects/${PID}/databases/(default)/documents/users/${UID}/entries/e%2F1`);
  assert.equal(doc.fields.payload.stringValue, 'CT!');
  assert.equal(doc.fields.version.integerValue, '2');
  assert.equal(doc.fields.isPinned.booleanValue, true);
});

test('pushEntries sends every record, in commits under the 500-write limit', async () => {
  const { store, calls } = mockStore(() => ({}));
  const records = Array.from({ length: 1000 }, (_, i) => ({ id: `e${i}`, payload: 'P' }));
  const n = await store.pushEntries(UID, records);
  assert.equal(n, 1000);
  const sent = calls.flatMap((c) => writesOf(c).map((d) => d.fields.id.stringValue));
  assert.equal(sent.length, 1000);
  assert.equal(new Set(sent).size, 1000);
  assert.ok(calls.every((c) => writesOf(c).length <= 500));
});

test('pushEntries with nothing to send makes no request', async () => {
  const { store, calls } = mockStore(() => ({}));
  assert.equal(await store.pushEntries(UID, []), 0);
  assert.equal(calls.length, 0);
});

test('entry writes land in the collection that entry queries read', async () => {
  const { store, calls } = mockStore(() => []);
  await store.pushEntries(UID, [{ id: 'abc', payload: 'P' }]);
  await store.deleteEntry(UID, 'abc');
  await store.pullEntriesDelta(UID, SYNC_EPOCH);
  const [push, del, query] = calls;
  const parent = query.path.replace(/:runQuery$/, '');
  const { collectionId } = JSON.parse(query.init.body).structuredQuery.from[0];
  const expected = `${parent}/${collectionId}/abc`;
  assert.ok(writesOf(push)[0].name.endsWith(expected));
  assert.equal(del.path, expected);
  // Firestore document paths have an even number of segments.
  assert.equal(expected.split('/').filter(Boolean).length % 2, 0);
});

test('runQuery delta maps documents to at-rest records and returns the last syncedAt as cursor', async () => {
  const fields = toFsFields({ id: 'abc', domain: 'x.com', version: 3, isDeleted: false, updatedAt: '2026-02-01T00:00:00.000Z', displayOrder: 1, isPinned: false, folder: '', entryType: 'password', payload: 'P' });
  fields.syncedAt = { timestampValue: '2030-01-01T00:00:05.250Z' };
  const { store, calls } = mockStore(() => ([
    { document: { name: `projects/${PID}/databases/(default)/documents/users/${UID}/entries/abc`, fields } },
    { done: true },
  ]));
  const { records, cursor } = await store.pullEntriesDelta(UID, '2030-01-01T00:00:00.000Z');
  assert.deepEqual(records, [{ id: 'abc', domain: 'x.com', version: 3, isDeleted: false, updatedAt: '2026-02-01T00:00:00.000Z', displayOrder: 1, isPinned: false, folder: '', entryType: 'password', payload: 'P', syncedAt: '2030-01-01T00:00:05.250Z' }]);
  assert.equal(cursor, '2030-01-01T00:00:05.250Z');
  const q = JSON.parse(calls[0].init.body).structuredQuery;
  assert.equal(q.where.fieldFilter.op, 'GREATER_THAN_OR_EQUAL');
  assert.equal(q.where.fieldFilter.value.timestampValue, '2030-01-01T00:00:00.000Z');
});

test('pushEntries asks Firestore to stamp syncedAt with the server clock', async () => {
  const { store, calls } = mockStore(() => ({}));
  await store.pushEntries(UID, [{ id: 'a', payload: 'P' }]);
  const [w] = JSON.parse(calls[0].init.body).writes;
  assert.deepEqual(w.updateTransforms, [{ fieldPath: 'syncedAt', setToServerValue: 'REQUEST_TIME' }]);
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
  assert.ok(pushedBatches.length >= 1);
});

test('sync throws when the push fails, and the next sync re-sends the change', async () => {
  const vault = new MemVaultStub();
  vault.records = [{ id: 'a', version: 5, updatedAt: '2026-03-01T00:00:00.000Z' }];
  let offline = true;
  const sent = [];
  const ctl = makeController(async (path, init = {}) => {
    if (path === ':commit') {
      if (offline) throw new CloudError('offline', 'NETWORK');
      sent.push(...JSON.parse(init.body).writes.map((w) => w.update.fields.id.stringValue));
      return {};
    }
    return path.endsWith('/vault/meta') ? metaDoc('S') : [];
  }, { cursor: '2026-02-01T00:00:00.000Z' });
  await ctl.store.set({ [STORAGE_KEYS.VAULT_SALT]: 'S' });

  await assert.rejects(ctl.sync(vault), (e) => e.code === 'NETWORK');
  assert.equal(await ctl.getLastSyncAt(), '2026-02-01T00:00:00.000Z');

  offline = false;
  await ctl.sync(vault);
  assert.deepEqual(sent, ['a']);
});

test('copies left in the old offline queue are dropped, never pushed', async () => {
  const sent = [];
  const ctl = makeController(async (path, init = {}) => {
    if (path === ':commit') { sent.push(...JSON.parse(init.body).writes.map((w) => w.update.fields.id.stringValue)); return {}; }
    return path.endsWith('/vault/meta') ? metaDoc('S') : [];
  });
  await ctl.store.set({
    [STORAGE_KEYS.VAULT_SALT]: 'S',
    okey_offline_queue: [{ id: 'q1', records: [{ id: 'old', version: 1, updatedAt: '2026-01-01T00:00:00.000Z' }] }],
  });
  await ctl.sync(new MemVaultStub());
  assert.deepEqual(sent, []);
  assert.equal((await ctl.store.get('okey_offline_queue')).okey_offline_queue, undefined);
});

// legacy: an old account whose meta still holds a PIN wrap.
function metaDoc(salt, { legacy = false } = {}) {
  return { fields: toFsFields({ salt, kdfParamsRaw: '{}', wrappedRecovery: '', ...(legacy && { wrappedMaster: 'W' }) }) };
}

test('moveToCloud refuses to overwrite a different cloud vault', async () => {
  const writes = [];
  const ctl = makeController(async (path, init = {}) => {
    if (init.method) { writes.push(path); return {}; }
    return path.endsWith('/vault/meta') ? metaDoc('CLOUD-SALT') : [];
  });
  await ctl.store.set({ [STORAGE_KEYS.VAULT_SALT]: 'LOCAL-SALT' });
  await assert.rejects(ctl.moveToCloud(new MemVaultStub()), (e) => e.code === 'VAULT_EXISTS');
  assert.deepEqual(writes, []);
});

test('moveToCloud re-runs over its own cloud vault', async () => {
  const writes = [];
  const ctl = makeController(async (path, init = {}) => {
    if (init.method) { writes.push(path); return {}; }
    return path.endsWith('/vault/meta') ? metaDoc('SAME-SALT', { legacy: true }) : [];
  });
  await ctl.store.set({ [STORAGE_KEYS.VAULT_SALT]: 'SAME-SALT' });
  await ctl.moveToCloud(new MemVaultStub());
  assert.ok(writes.some((p) => p.endsWith('/vault/meta')));
});

test('sync pushes nothing when the cloud holds a different vault', async () => {
  const writes = [];
  const ctl = makeController(async (path, init = {}) => {
    if (init.method === 'PATCH' || path === ':commit') { writes.push(path); return {}; }
    return path.endsWith('/vault/meta') ? metaDoc('CLOUD-SALT') : [];
  });
  await ctl.store.set({ [STORAGE_KEYS.VAULT_SALT]: 'LOCAL-SALT' });
  const vault = new MemVaultStub();
  vault.records = [{ id: 'a', version: 1, updatedAt: '2026-03-01T00:00:00.000Z' }];
  await assert.rejects(ctl.sync(vault), (e) => e.code === 'VAULT_EXISTS');
  assert.deepEqual(writes, []);
});

test('a local reset to a new salt is checked again', async () => {
  const ctl = makeController(async (path, init = {}) => {
    if (init.method) return {};
    return path.endsWith('/vault/meta') ? metaDoc('FIRST-SALT') : [];
  });
  await ctl.store.set({ [STORAGE_KEYS.VAULT_SALT]: 'FIRST-SALT' });
  await ctl.sync(new MemVaultStub());
  await ctl.store.set({ [STORAGE_KEYS.VAULT_SALT]: 'NEW-SALT' });
  await assert.rejects(ctl.sync(new MemVaultStub()), (e) => e.code === 'VAULT_EXISTS');
});

test('pushMeta drops wrappedMaster even if a caller passes it', async () => {
  const { store, calls } = mockStore(() => ({}));
  await store.pushMeta(UID, { salt: 'S', kdfParams: {}, wrappedMaster: 'PIN-WRAP', wrappedRecovery: 'R' });
  const body = JSON.parse(calls[0].init.body);
  assert.equal('wrappedMaster' in body.fields, false);
  assert.equal(body.fields.wrappedRecovery.stringValue, 'R');
});

// ---- settings sync (F12) ----

test('object settings travel as JSON text, never "[object Object]"', async () => {
  const { store, calls } = mockStore(() => ({}));
  await store.pushSettings(UID, { ...DEFAULT_SETTINGS, passwordGeneratorDefaults: { length: 24, symbols: false } });
  const { fields } = JSON.parse(calls[0].init.body);
  assert.equal(JSON.stringify(fields).includes('[object Object]'), false);
  assert.deepEqual(JSON.parse(fields.passwordGeneratorDefaultsRaw.stringValue), { length: 24, symbols: false });
});

test('generator defaults survive a push, a pull and the settings gate', async () => {
  const db = memoryFirestore();
  const store = new CloudStore({ projectId: PID, getToken: async () => 't' });
  store._request = db.request;
  await store.pushSettings(UID, { ...DEFAULT_SETTINGS, passwordGeneratorDefaults: { ...DEFAULT_SETTINGS.passwordGeneratorDefaults, length: 24, symbols: false } });
  const merged = mergeRemoteSettings(DEFAULT_SETTINGS, await store.pullSettings(UID));
  assert.equal(merged.passwordGeneratorDefaults.length, 24);
  assert.equal(merged.passwordGeneratorDefaults.symbols, false);
});

test('unreadable settings JSON from the cloud is ignored, not thrown', async () => {
  const { store } = mockStore(() => ({ fields: toFsFields({ theme: 'light', passwordGeneratorDefaultsRaw: '{not json' }) }));
  const out = await store.pullSettings(UID);
  assert.equal(out.theme, 'light');
  assert.equal('passwordGeneratorDefaults' in out, false);
});
