import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vault } from '../src/core/vault.js';
import { CloudStore, toFsFields } from '../src/core/cloud.js';
import { CloudSync } from '../src/core/cloud-sync.js';
import { STORAGE_KEYS } from '../src/core/constants.js';
import { generateRecoveryMnemonic } from '../src/core/recovery.js';
import { MemoryStorage, memoryFirestore } from './helpers.js';

const UID = 'u1';
const META = `/users/${UID}/vault/meta`;
const PIN_A = '1234';
const PIN_B = '5678';

/** One phone or browser: its own storage and vault, sharing one cloud. */
function device(db) {
  const storage = new MemoryStorage();
  const vault = new Vault(storage);
  const cloud = new CloudStore({ projectId: 'p', getToken: async () => 't' });
  cloud._request = db.request;
  let cursor = null;
  const sync = new CloudSync({
    store: storage, cloud, getUid: async () => UID,
    getLastSyncAt: async () => cursor, setLastSyncAt: async (c) => { cursor = c; },
  });
  return { storage, vault, sync, cloud };
}

/** Device A with one entry, already uploaded. */
async function deviceWithCloudVault(db) {
  const a = device(db);
  const { recoveryMnemonic } = await a.vault.setup(PIN_A);
  await a.vault.addEntry({ siteName: 'Shared', domain: 'shared.com', username: 'u', password: 'pw' });
  await a.sync.moveToCloud(a.vault);
  return { a, words: recoveryMnemonic };
}

test('cloud meta never holds wrappedMaster', async () => {
  const db = memoryFirestore();
  await deviceWithCloudVault(db);
  const keys = Object.keys(db.docs.get(META));
  assert.ok(keys.includes('salt') && keys.includes('wrappedRecovery'));
  assert.equal(keys.includes('wrappedMaster'), false);
});

test('new device restores with the 24 words and picks its own PIN', async () => {
  const db = memoryFirestore();
  const { words } = await deviceWithCloudVault(db);
  const b = device(db);
  await b.sync.restoreFromCloud(b.vault, words, PIN_B);
  assert.equal(b.vault.getEntries()[0].siteName, 'Shared');

  const reopened = new Vault(b.storage);
  await reopened.unlock(PIN_B);
  assert.equal(reopened.getEntries().length, 1);
  await assert.rejects(new Vault(b.storage).unlock(PIN_A), /Incorrect/);
});

test('wrong or invalid words restore nothing', async () => {
  const db = memoryFirestore();
  await deviceWithCloudVault(db);
  const b = device(db);
  await assert.rejects(b.sync.restoreFromCloud(b.vault, generateRecoveryMnemonic(), PIN_B), (e) => e.code === 'DECRYPTION_FAILED');
  await assert.rejects(b.sync.restoreFromCloud(b.vault, 'not a real recovery key', PIN_B), (e) => e.name === 'ValidationError');
  assert.equal(b.storage.map.size, 0);
  assert.equal(b.vault.isUnlocked(), false);
});

test('a weak new PIN restores nothing', async () => {
  const db = memoryFirestore();
  const { words } = await deviceWithCloudVault(db);
  const b = device(db);
  await assert.rejects(b.sync.restoreFromCloud(b.vault, words, 'ab'), (e) => e.name === 'ValidationError');
  assert.equal(b.storage.map.size, 0);
});

test('after a new recovery key, the new words restore and the old ones fail', async () => {
  const db = memoryFirestore();
  const { a, words: oldWords } = await deviceWithCloudVault(db);
  const { recoveryMnemonic: newWords } = await a.vault.regenerateRecovery();
  await a.sync.sync(a.vault);

  const old = device(db);
  await assert.rejects(old.sync.restoreFromCloud(old.vault, oldWords, PIN_B), (e) => e.code === 'DECRYPTION_FAILED');
  const fresh = device(db);
  await fresh.sync.restoreFromCloud(fresh.vault, newWords, PIN_B);
  assert.equal(fresh.vault.getEntries().length, 1);
});

test('sync removes a legacy wrappedMaster from the cloud meta', async () => {
  const db = memoryFirestore();
  const { a } = await deviceWithCloudVault(db);
  const s = await a.storage.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.WRAPPED_BY_RECOVERY, STORAGE_KEYS.WRAPPED_BY_MASTER]);
  db.docs.set(META, toFsFields({
    salt: s[STORAGE_KEYS.VAULT_SALT], kdfParamsRaw: '{}', formatVersion: 2,
    wrappedRecovery: s[STORAGE_KEYS.WRAPPED_BY_RECOVERY], wrappedMaster: s[STORAGE_KEYS.WRAPPED_BY_MASTER],
  }));
  const fresh = device(db); // new CloudSync, so the per-session check runs again
  fresh.storage.map = a.storage.map;
  await fresh.sync.sync(a.vault);
  assert.equal(Object.keys(db.docs.get(META)).includes('wrappedMaster'), false);
});

test('sync uploads the key material when the cloud has none', async () => {
  const db = memoryFirestore();
  const a = device(db);
  await a.vault.setup(PIN_A);
  await a.sync.sync(a.vault);
  const keys = Object.keys(db.docs.get(META));
  assert.ok(keys.includes('salt') && keys.includes('wrappedRecovery'));
});

test('a device holding an old recovery wrap does not undo newer words', async () => {
  const db = memoryFirestore();
  const { a, words: oldWords } = await deviceWithCloudVault(db);
  const b = device(db);
  await b.sync.restoreFromCloud(b.vault, oldWords, PIN_B); // B holds the OLD wrap
  const { recoveryMnemonic: newWords } = await a.vault.regenerateRecovery();
  await a.sync.sync(a.vault); // A uploads the new wrap
  await b.sync.sync(b.vault); // B syncs later with its stale wrap

  const c = device(db);
  await c.sync.restoreFromCloud(c.vault, newWords, '9999'); // the user only kept the NEW words
  assert.equal(c.vault.getEntries().length, 1);
});

test('a stale device adopts the newer wrap, so its own next key carries on from it', async () => {
  const db = memoryFirestore();
  const { a, words: oldWords } = await deviceWithCloudVault(db);
  const b = device(db);
  await b.sync.restoreFromCloud(b.vault, oldWords, PIN_B);
  await a.vault.regenerateRecovery();
  await a.sync.sync(a.vault);
  await b.sync.sync(b.vault); // adopts A's wrap and number
  const { recoveryMnemonic: thirdWords } = await b.vault.regenerateRecovery();
  await b.sync.sync(b.vault);

  const c = device(db);
  await c.sync.restoreFromCloud(c.vault, thirdWords, '9999');
  assert.equal(c.vault.getEntries().length, 1);
});

// ---- sync convergence (F7) ----

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

test('a sync with no local changes pushes nothing, and one edit pushes one write', async () => {
  const db = memoryFirestore();
  const { a } = await deviceWithCloudVault(db);
  const before = db.commitLog.length;
  await a.sync.sync(a.vault);
  assert.equal(db.commitLog.length, before);

  await a.vault.updateEntry(a.vault.getEntries()[0].id, { username: 'edited' });
  await a.sync.sync(a.vault);
  assert.deepEqual(db.commitLog.slice(before), [1]);
});

test('a lower version with a later local time does not overwrite a higher cloud version', async () => {
  const db = memoryFirestore();
  const { a, words } = await deviceWithCloudVault(db);
  const b = device(db);
  await b.sync.restoreFromCloud(b.vault, words, PIN_B);
  const id = b.vault.getEntries()[0].id;

  for (let i = 0; i < 4; i++) await b.vault.updateEntry(id, { username: `b${i}` }); // version 5
  await b.sync.sync(b.vault);
  await sleep(5);
  await a.vault.updateEntry(id, { username: 'from-a' }); // version 2, but a later local time
  await a.sync.sync(a.vault);

  assert.equal(a.vault.getEntry(id).version, 5);
  assert.equal(a.vault.getEntry(id).username, 'b3');
  const c = device(db);
  await c.sync.restoreFromCloud(c.vault, words, '9999');
  assert.equal(c.vault.getEntry(id).version, 5);
});

test('two devices that edit the same entry end on the same version', async () => {
  const db = memoryFirestore();
  const { a, words } = await deviceWithCloudVault(db);
  const b = device(db);
  await b.sync.restoreFromCloud(b.vault, words, PIN_B);
  const id = a.vault.getEntries()[0].id;

  await a.vault.updateEntry(id, { username: 'from-a' });
  await a.sync.sync(a.vault);
  await sleep(5);
  await b.vault.updateEntry(id, { username: 'from-b' });
  await b.sync.sync(b.vault);
  await a.sync.sync(a.vault);

  assert.equal(a.vault.getEntry(id).username, 'from-b');
  assert.equal(b.vault.getEntry(id).username, 'from-b');
  assert.equal(a.vault.getEntry(id).version, b.vault.getEntry(id).version);
});

test('a change saved with an old device clock is still pulled', async () => {
  const db = memoryFirestore();
  const { a, words } = await deviceWithCloudVault(db);
  const b = device(db);
  await b.sync.restoreFromCloud(b.vault, words, PIN_B);

  await a.vault.addEntry({ siteName: 'Late', domain: 'late.com', username: 'u', password: 'pw' });
  const known = new Set(b.vault.getEntries().map((e) => e.id));
  const fresh = (await a.vault.exportRecords()).find((r) => !known.has(r.id));
  await a.cloud.pushEntries(UID, [{ ...fresh, updatedAt: '2020-01-01T00:00:00.000Z' }]); // slow clock

  await b.sync.sync(b.vault);
  assert.equal(b.vault.getEntries().length, 2);
});

test('pulls page through more changes than one page holds', async () => {
  const db = memoryFirestore();
  const { a, words } = await deviceWithCloudVault(db);
  // One commit per entry: entries from one commit share a server time and must fit in one page.
  for (let i = 0; i < 7; i++) {
    await a.vault.addEntry({ siteName: `S${i}`, domain: `s${i}.com`, username: 'u', password: 'pw' });
    await a.sync.sync(a.vault);
  }

  const b = device(db);
  b.cloud.pageSize = 3;
  await b.sync.restoreFromCloud(b.vault, words, PIN_B);
  assert.equal(b.vault.getEntries().length, 8);

  for (let i = 0; i < 7; i++) {
    await a.vault.addEntry({ siteName: `T${i}`, domain: `t${i}.com`, username: 'u', password: 'pw' });
    await a.sync.sync(a.vault);
  }
  await b.sync.sync(b.vault);
  assert.equal(b.vault.getEntries().length, 15);
});
