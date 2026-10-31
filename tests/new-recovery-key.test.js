import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom, MemoryStorage } from './helpers.js';

const dom = installFakeDom();
globalThis.requestAnimationFrame ??= (f) => f();
const { Vault } = await import('../src/core/vault.js');
const { DEFAULT_SETTINGS, STORAGE_KEYS } = await import('../src/core/constants.js');
const { ctx, attachCore } = await import('../src/ui/app-core.js');
const { openNewRecoveryKey } = await import('../src/extension/ui/views-vault.js');

const flush = (ms = 600) => new Promise((r) => setTimeout(r, ms));
const PIN = '4242';

async function setup() {
  const storage = new MemoryStorage();
  const vault = new Vault(storage);
  attachCore({ storage, vault });
  ctx.settings = { ...DEFAULT_SETTINGS };
  const { recoveryMnemonic } = await vault.setup(PIN);
  return { storage, vault, oldWords: recoveryMnemonic };
}

const modal = () => dom.body.find((n) => n.className === 'nb-modal');
function typePin(digits) {
  const cells = modal().findAll((n) => n.tag === 'input' && n.className === 'nb-pin-cell');
  cells.slice(0, 4).forEach((c, i) => { c.value = digits[i]; c.dispatch('input'); });
}
const button = (label) => modal().find((n) => n.tag === 'button' && n.textContent === label);

/** Read the 24 words off the screen and answer the three questions correctly. */
function answerWordCheck() {
  const words = modal().findAll((n) => n.className === 'ok-word').map((n) => n.children[1].text);
  const boxes = modal().findAll((n) => n.tag === 'input' && n.attrs.placeholder?.startsWith('Word '));
  boxes.forEach((b) => { b.value = words[Number(b.attrs.placeholder.slice(5)) - 1]; b.dispatch('input'); });
  return words.join(' ');
}

test('a wrong PIN stops it before any new words are made', async () => {
  const { vault, oldWords } = await setup();
  openNewRecoveryKey();
  typePin('0000');
  button('Continue').click();
  await flush();
  assert.equal(modal().findAll((n) => n.className === 'ok-word').length, 0);
  assert.equal(await vault.verifyRecoveryWords(oldWords), true);
});

test('closing the window before confirming leaves the old words working', async () => {
  const { vault, oldWords } = await setup();
  openNewRecoveryKey();
  typePin(PIN);
  button('Continue').click();
  await flush();
  assert.equal(modal().findAll((n) => n.className === 'ok-word').length, 24, 'the new words are on screen');
  dom.dispatch('keydown', { key: 'Escape' });
  assert.equal(await vault.verifyRecoveryWords(oldWords), true, 'still the old words');
});

test('confirming with three right words activates the new key and stops the old one', async () => {
  const { vault, oldWords, storage } = await setup();
  openNewRecoveryKey();
  typePin(PIN);
  button('Continue').click();
  await flush();
  const newWords = answerWordCheck();
  button('I saved it. Activate the new key').click();
  await flush(200);
  assert.equal(await vault.verifyRecoveryWords(newWords), true);
  assert.equal(await vault.verifyRecoveryWords(oldWords), false);
  assert.ok(storage.map.get(STORAGE_KEYS.LAST_RECOVERY_CHECK_AT), 'the check date is saved');
  assert.equal(storage.map.get(STORAGE_KEYS.RECOVERY_VERSION), 2);
});
