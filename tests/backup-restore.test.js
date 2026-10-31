import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vault } from '../src/core/vault.js';
import { exportOkeyBackup } from '../src/core/import-export.js';
import { restoreFromBackup } from '../src/core/backup-restore.js';
import { generateRecoveryMnemonic } from '../src/core/recovery.js';
import { STORAGE_KEYS } from '../src/core/constants.js';
import { MemoryStorage } from './helpers.js';

const PIN_A = '1234';
const PIN_B = '5678';

/** Device A with two entries, and the text of its backup file. */
async function deviceWithBackup() {
  const storage = new MemoryStorage();
  const v = new Vault(storage);
  const { recoveryMnemonic } = await v.setup(PIN_A);
  await v.addEntry({ siteName: 'Bank', domain: 'bank.com', username: 'me', password: 'BANK-PW' });
  await v.addEntry({ siteName: 'Shop', domain: 'shop.com', username: 'me2', password: 'SHOP-PW' });
  const s = await storage.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
  const text = exportOkeyBackup({
    salt: s[STORAGE_KEYS.VAULT_SALT], kdfParams: s[STORAGE_KEYS.KDF_PARAMS],
    wrappedRecovery: s[STORAGE_KEYS.WRAPPED_BY_RECOVERY], records: await v.exportRecords(),
  });
  return { words: recoveryMnemonic, text };
}
const emptyDevice = () => { const storage = new MemoryStorage(); return { storage, vault: new Vault(storage) }; };

test('a backup restores on a new device with the 24 words and a new PIN', async () => {
  const { words, text } = await deviceWithBackup();
  const { storage, vault } = emptyDevice();
  await restoreFromBackup(vault, text, words, PIN_B);
  assert.deepEqual(vault.getEntries().map((e) => e.siteName).sort(), ['Bank', 'Shop']);
  assert.equal(vault.getEntries().find((e) => e.siteName === 'Bank').password, 'BANK-PW');

  const reopened = new Vault(storage);
  await reopened.unlock(PIN_B);
  assert.equal(reopened.getEntries().length, 2);
  await assert.rejects(new Vault(storage).unlock(PIN_A), /Incorrect/);
});

test('the backup file holds no PIN wrap, so the 24 words are the only way in', async () => {
  const { text } = await deviceWithBackup();
  assert.equal(text.includes('wrappedMaster'), false);
});

test('wrong words, a weak PIN or a damaged file write nothing', async () => {
  const { words, text } = await deviceWithBackup();
  const cases = [
    [text, generateRecoveryMnemonic(), PIN_B, (e) => e.code === 'DECRYPTION_FAILED'],
    [text, 'not a real key', PIN_B, (e) => e.name === 'ValidationError'],
    [text, words, 'ab', (e) => e.name === 'ValidationError'],
  ];
  for (const [t, w, pin, check] of cases) {
    const { storage, vault } = emptyDevice();
    await assert.rejects(restoreFromBackup(vault, t, w, pin), check);
    assert.equal(storage.map.size, 0);
    assert.equal(vault.isUnlocked(), false);
  }
});

test('a file that is not a good OKey backup is refused with a clear message', async () => {
  const { words, text } = await deviceWithBackup();
  const good = JSON.parse(text);
  const bad = {
    'not JSON': ['{ nope', /not valid JSON|not a backup/i],
    'another format': [JSON.stringify({ format: 'bitwarden' }), /not an okey backup/i],
    'no salt': [JSON.stringify({ ...good, salt: undefined }), /damaged.*salt/i],
    'no recovery wrap': [JSON.stringify({ ...good, wrappedRecovery: '' }), /damaged.*recovery/i],
    'records not a list': [JSON.stringify({ ...good, records: 'x' }), /damaged.*records/i],
    'newer version': [JSON.stringify({ ...good, version: 99 }), /newer version/i],
  };
  for (const [name, [file, message]] of Object.entries(bad)) {
    const { storage, vault } = emptyDevice();
    await assert.rejects(restoreFromBackup(vault, file, words, PIN_B), (e) => e.name === 'ValidationError' && message.test(e.message), name);
    assert.equal(storage.map.size, 0, name);
  }
});
