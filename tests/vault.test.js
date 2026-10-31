import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vault } from '../src/core/vault.js';
import { MemoryStorage } from './helpers.js';
import { STORAGE_KEYS } from '../src/core/constants.js';

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
  // Device A creates + pushes; device B restores with the recovery words and merges.
  const storageA = new MemoryStorage();
  const a = new Vault(storageA);
  const { recoveryMnemonic } = await a.setup(PIN);
  await a.addEntry({ siteName: 'Shared', domain: 'shared.com', username: 'u', password: 'pw' });
  const records = await a.exportRecords();
  // Only what the cloud meta may hold: no PIN wrap.
  const storedA = await storageA.get(['okey_salt', 'okey_kdf_params', 'okey_wrapped_recovery']);
  const meta = { salt: storedA.okey_salt, kdfParams: storedA.okey_kdf_params, wrappedRecovery: storedA.okey_wrapped_recovery };

  const storageB = new MemoryStorage();
  const b = new Vault(storageB);
  await b.restoreWithRecovery(recoveryMnemonic, '9999', meta, records);
  assert.equal(b.getEntries()[0].siteName, 'Shared');

  // B edits → record merge back into A wins by version
  const [entry] = b.getEntries();
  await b.updateEntry(entry.id, { username: 'new@mail' });
  const updatedRecords = await b.exportRecords();
  await a.mergeRemoteRecords(updatedRecords.filter((r) => r.id === entry.id));
  assert.equal(a.getEntry(entry.id).username, 'new@mail');
});

// ---- records we cannot decrypt (F9) ----

/** Vault with entries X and Y, where Y's ciphertext is then damaged on disk. */
async function vaultWithDamagedRecord() {
  const storage = new MemoryStorage();
  const v = new Vault(storage);
  await v.setup(PIN);
  await v.addEntry({ siteName: 'X', domain: 'x.com', username: 'u', password: 'p' });
  const y = await v.addEntry({ siteName: 'Y', domain: 'y.com', username: 'u', password: 'p' });
  v.lock();
  const { [STORAGE_KEYS.VAULT_DATA]: records } = await storage.get(STORAGE_KEYS.VAULT_DATA);
  const good = structuredClone(records.find((r) => r.id === y.id));
  const damaged = records.map((r) => (r.id === y.id ? { ...r, payload: 'AAAA' + r.payload.slice(4) } : r));
  await storage.set({ [STORAGE_KEYS.VAULT_DATA]: damaged });
  const reopened = new Vault(storage);
  await reopened.unlock(PIN);
  return { storage, reopened, good, damagedPayload: damaged.find((r) => r.id === y.id).payload };
}

test('a record that cannot be decrypted survives later saves', async () => {
  const { storage, reopened, damagedPayload } = await vaultWithDamagedRecord();
  assert.equal(reopened.getEntries().length, 1);
  await reopened.addEntry({ siteName: 'Z', domain: 'z.com', username: 'u', password: 'p' }); // saves
  const { [STORAGE_KEYS.VAULT_DATA]: records } = await storage.get(STORAGE_KEYS.VAULT_DATA);
  assert.equal(records.length, 3);
  assert.ok(records.some((r) => r.payload === damagedPayload));
});

test('a good copy replaces the kept record without duplicating it', async () => {
  const { storage, reopened, good } = await vaultWithDamagedRecord();
  await reopened.mergeRemoteRecords([good]);
  assert.equal(reopened.getEntries().length, 2);
  const { [STORAGE_KEYS.VAULT_DATA]: records } = await storage.get(STORAGE_KEYS.VAULT_DATA);
  assert.equal(records.filter((r) => r.id === good.id).length, 1);
  const again = new Vault(storage);
  await again.unlock(PIN);
  assert.equal(again.getEntry(good.id).siteName, 'Y');
  assert.equal(again.takeUndecryptableNotice(), 0);
});

test('the user is told about unreadable records once per unlock', async () => {
  const { reopened } = await vaultWithDamagedRecord();
  assert.equal(reopened.takeUndecryptableNotice(), 1);
  assert.equal(reopened.takeUndecryptableNotice(), 0);
});

test('recovering with the 24 words clears the failed-unlock counter', async () => {
  const storage = new MemoryStorage();
  const v = new Vault(storage);
  const { recoveryMnemonic } = await v.setup(PIN);
  v.lock();
  await storage.set({ [STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS]: 29 });

  const again = new Vault(storage);
  await again.recoverWithMnemonic(recoveryMnemonic);
  assert.equal(storage.map.has(STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS), false);
});

test('a wrong recovery key leaves the counter alone', async () => {
  const storage = new MemoryStorage();
  const v = new Vault(storage);
  await v.setup(PIN);
  v.lock();
  await storage.set({ [STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS]: 29 });
  const { generateRecoveryMnemonic } = await import('../src/core/recovery.js');
  await assert.rejects(new Vault(storage).recoverWithMnemonic(generateRecoveryMnemonic()), (e) => e.code === 'DECRYPTION_FAILED');
  assert.equal(storage.map.get(STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS), 29);
});

// ---- failed-unlock counter (F30) ----

const FAILS = STORAGE_KEYS.FAILED_UNLOCK_ATTEMPTS;
async function lockedVault() {
  const storage = new MemoryStorage();
  const v = new Vault(storage);
  await v.setup(PIN);
  v.lock();
  return storage;
}
const wrong = (storage) => new Vault(storage).unlock('0000');

test('each wrong PIN adds one to a real number', async () => {
  const storage = await lockedVault();
  await assert.rejects(wrong(storage), /Incorrect/);
  assert.strictEqual(storage.map.get(FAILS), 1);
  await assert.rejects(wrong(storage), /Incorrect/);
  assert.strictEqual(storage.map.get(FAILS), 2);
});

test('a right PIN after a few wrong ones resets the count', async () => {
  const storage = await lockedVault();
  await assert.rejects(wrong(storage), /Incorrect/);
  await assert.rejects(wrong(storage), /Incorrect/);
  await new Vault(storage).unlock(PIN);
  assert.equal(storage.map.has(FAILS), false);
});

test('the 30th wrong PIN wipes the vault', async () => {
  const storage = await lockedVault();
  await storage.set({ [FAILS]: 29 });
  await assert.rejects(wrong(storage), /wiped/);
  assert.equal(storage.map.has(STORAGE_KEYS.SETUP_COMPLETE), false);
  assert.equal(storage.map.has(STORAGE_KEYS.VAULT_DATA), false);
});

test('from the 25th wrong PIN on, the message says how many tries are left', async () => {
  const storage = await lockedVault();
  await storage.set({ [FAILS]: 24 });
  await assert.rejects(wrong(storage), /5 attempts remaining/);
});

test('a vault already at the limit refuses even the right PIN', async () => {
  const storage = await lockedVault();
  await storage.set({ [FAILS]: 30 });
  await assert.rejects(new Vault(storage).unlock(PIN), /Too many incorrect attempts/);
});
