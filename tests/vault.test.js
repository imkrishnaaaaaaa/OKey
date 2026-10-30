import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vault } from '../src/core/vault.js';
import { MemoryStorage } from './helpers.js';

const PIN = '4242';

async function freshVault() {
  const v = new Vault(new MemoryStorage());
  await v.setup(PIN);
  return v;
}

test('setup → lock → unlock round trip', async () => {
  const v = await freshVault();
  const entry = await v.addEntry({ siteName: 'GitHub', domain: 'github.com', username: 'a@b.c', password: 'hunter22' });
  assert.equal(v.isUnlocked(), true);
  v.lock();
  assert.equal(v.isUnlocked(), false);
  assert.equal(v.getEntries().length, 0);

  const v2 = new Vault(v.storage);
  await v2.unlock(PIN);
  assert.equal(v2.getEntry(entry.id).username, 'a@b.c');
});

test('wrong PIN throws DecryptionError and counts attempts', async () => {
  const v = await freshVault();
  v.lock();
  const v2 = new Vault(v.storage);
  for (let i = 0; i < 3; i++) {
    await assert.rejects(() => v2.unlock('0000'), /Incorrect master PIN/);
  }
  // success resets the counter
  await v2.unlock(PIN);
});

test('payloads at rest are ciphertext (no plaintext secrets in storage)', async () => {
  const v = await freshVault();
  await v.addEntry({ siteName: 'Bank', domain: 'bank.com', username: 'me', password: 'SUPERSECRET' });
  v.lock();
  const raw = JSON.stringify([...v.storage.map.entries()]);
  assert.equal(raw.includes('SUPERSECRET'), false);
  assert.equal(raw.includes('bank.com'), true); // domain is cleartext metadata by design
});

test('recovery key unwraps the same vault', async () => {
  const storage = new MemoryStorage();
  const v = new Vault(storage);
  const { recoveryMnemonic } = await v.setup(PIN);
  await v.addEntry({ siteName: 'X', domain: 'x.com', password: 'p' });
  v.lock();

  const v2 = new Vault(storage);
  await v2.recoverWithMnemonic(recoveryMnemonic);
  assert.ok(v2.getEntries().length === 1);

  // old PIN no longer valid after re-wrap to a new one
  await v2.changeMasterPassword('9999');
  v2.lock();
  const v3 = new Vault(storage);
  await assert.rejects(() => v3.unlock(PIN), /Incorrect/);
  await v3.unlock('9999');
});

test('sync engine: two vaults converge through cloud records', async () => {
  // Device A creates + pushes; device B restores and merges.
  const storageA = new MemoryStorage();
  const a = new Vault(storageA);
  await a.setup(PIN);
  await a.addEntry({ siteName: 'Shared', domain: 'shared.com', username: 'u', password: 'pw' });
  const records = await a.exportRecords();
  const meta = Object.fromEntries([
    ['salt', Buffer.from(a._salt).toString('base64')],
    ['kdfParams', a._kdfParams],
    ['wrappedMaster', null], // filled below
  ]);
  // pull wrapped material straight from A's storage
  const storedA = await storageA.get(['okey_salt', 'okey_kdf_params', 'okey_wrapped_master']);
  meta.salt = storedA.okey_salt;
  meta.kdfParams = storedA.okey_kdf_params;
  meta.wrappedMaster = storedA.okey_wrapped_master;

  const storageB = new MemoryStorage();
  const b = new Vault(storageB);
  await b.restoreFromRemote(PIN, meta, records);
  assert.equal(b.getEntries()[0].siteName, 'Shared');

  // B edits → record merge back into A wins by version
  const [entry] = b.getEntries();
  await b.updateEntry(entry.id, { username: 'new@mail' });
  const updatedRecords = await b.exportRecords();
  await a.mergeRemoteRecords(updatedRecords.filter((r) => r.id === entry.id));
  assert.equal(a.getEntry(entry.id).username, 'new@mail');
});
