import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom, MemoryStorage } from './helpers.js';

const dom = installFakeDom();
globalThis.requestAnimationFrame ??= (f) => f();
const { Vault } = await import('../src/core/vault.js');
const { exportOkeyBackup } = await import('../src/core/import-export.js');
const { generateRecoveryMnemonic } = await import('../src/core/recovery.js');
const { DEFAULT_SETTINGS, STORAGE_KEYS } = await import('../src/core/constants.js');
const { ctx, attachCore } = await import('../src/ui/app-core.js');
const { renderRestore, renderWelcome } = await import('../src/extension/ui/views-auth.js');

const flush = (ms = 700) => new Promise((r) => setTimeout(r, ms));

async function backupOfAVault() {
  const storage = new MemoryStorage();
  const v = new Vault(storage);
  const { recoveryMnemonic } = await v.setup('1234');
  await v.addEntry({ siteName: 'Bank', domain: 'bank.com', username: 'me', password: 'BANK-PW' });
  const s = await storage.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
  return {
    words: recoveryMnemonic,
    text: exportOkeyBackup({ salt: s[STORAGE_KEYS.VAULT_SALT], kdfParams: s[STORAGE_KEYS.KDF_PARAMS], wrappedRecovery: s[STORAGE_KEYS.WRAPPED_BY_RECOVERY], records: await v.exportRecords() }),
  };
}

/** A new, empty device showing the backup screen. */
function openBackupScreen() {
  const storage = new MemoryStorage();
  const vault = new Vault(storage);
  attachCore({ storage, vault });
  ctx.settings = { ...DEFAULT_SETTINGS };
  const root = dom.createElement('div');
  renderRestore(ctx, root, { mode: 'backup', back: 'welcome' });
  const file = root.find((n) => n.tag === 'input' && n.attrs.type === 'file');
  const words = root.find((n) => n.tag === 'textarea');
  const cells = root.findAll((n) => n.tag === 'input' && n.className === 'nb-pin-cell');
  const typeGroup = (group, digits) => cells.slice(group * 4, group * 4 + 4).forEach((c, i) => { c.value = digits[i]; c.dispatch('input'); });
  return { storage, vault, root, file, words, typeGroup };
}

test('the backup screen asks for a file, the words and a new PIN', () => {
  const { file, words, root } = openBackupScreen();
  assert.ok(file, 'a file chooser');
  assert.ok(words, 'a box for the 24 words');
  assert.equal(root.findAll((n) => n.tag === 'input' && n.className === 'nb-pin-cell').length, 8, 'PIN and confirm');
});

test('file, right words and a new PIN restore the vault', async () => {
  const { words: key, text } = await backupOfAVault();
  const s = openBackupScreen();
  s.file.files = [{ text: async () => text }];
  s.words.value = key;
  s.typeGroup(0, '5678');
  s.typeGroup(1, '5678'); // the 4th confirm digit submits
  await flush(1500);
  assert.equal(s.vault.isUnlocked(), true);
  assert.equal(s.vault.getEntries()[0].password, 'BANK-PW');
});

test('no file chosen, or the wrong words, write nothing', async () => {
  const { text } = await backupOfAVault();

  const noFile = openBackupScreen();
  noFile.words.value = generateRecoveryMnemonic();
  noFile.typeGroup(0, '5678'); noFile.typeGroup(1, '5678');
  await flush();
  assert.equal(noFile.storage.map.size, 0);

  const wrong = openBackupScreen();
  wrong.file.files = [{ text: async () => text }];
  wrong.words.value = generateRecoveryMnemonic();
  wrong.typeGroup(0, '5678'); wrong.typeGroup(1, '5678');
  await flush(1200);
  assert.equal(wrong.storage.map.size, 0);
  assert.equal(wrong.vault.isUnlocked(), false);
});

test('the welcome screen offers "Restore from a backup file"', () => {
  const root = dom.createElement('div');
  renderWelcome({}, root);
  const btn = root.find((n) => n.tag === 'button' && n.textContent === 'Restore from a backup file');
  assert.ok(btn);
});
