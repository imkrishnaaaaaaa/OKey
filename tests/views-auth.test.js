import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers.js';

const dom = installFakeDom();
const { renderWelcome } = await import('../src/extension/ui/views-auth.js');
const { firebaseReady } = await import('../src/lib/firebase.js');
const cloud = firebaseReady();
const flush = () => new Promise((r) => setTimeout(r, 20));

test('a failed Google sign-in shows a message and gives the button back', async (t) => {
  if (!cloud) return t.skip('local Firebase config is placeholders');
  const root = dom.createElement('div');
  renderWelcome({}, root);
  const google = root.find((n) => n.tag === 'button' && n.children.some((c) => c.text === 'Continue with Google'));
  assert.ok(google, 'Google button is on the welcome screen');

  // Outside a browser the popup sign-in throws, which is the failure path.
  google.click();
  await flush();

  assert.notEqual(google.disabled, true, 'button is usable again');
  const toastBox = dom.body.find((n) => n.className === 'nb-toast-container');
  assert.ok(toastBox?.children.length >= 1, 'the user is told what went wrong');
});

// ---- double submit (F23) ----

import { Vault } from '../src/core/vault.js';
import { DecryptionError } from '../src/core/errors.js';
import { DEFAULT_SETTINGS } from '../src/core/constants.js';
import { MemoryStorage } from './helpers.js';

globalThis.requestAnimationFrame ??= (f) => f();
const { ctx, attachCore } = await import('../src/ui/app-core.js');
const { renderOnboarding, renderLock } = await import('../src/extension/ui/views-auth.js');

/** Type four digits into the first PIN box on screen. The 4th digit submits on its own. */
function typePin(root, digits, { thenEnter = true } = {}) {
  const cells = root.findAll((n) => n.tag === 'input' && n.className === 'nb-pin-cell');
  const group = cells.slice(-4); // the newest PIN group on screen
  group.forEach((cell, i) => { cell.value = digits[i]; cell.dispatch('input'); });
  // A user pressing Enter right after the 4th digit asks to submit a second time.
  if (thenEnter) group[3].dispatch('keydown', { key: 'Enter', preventDefault() {} });
}

function freshCore() {
  const storage = new MemoryStorage();
  const vault = new Vault(storage);
  attachCore({ storage, vault });
  ctx.settings = { ...DEFAULT_SETTINGS };
  return { storage, vault };
}

test('onboarding creates the vault once, even if the PIN is submitted twice', async () => {
  const { vault } = freshCore();
  let setups = 0;
  const realSetup = vault.setup.bind(vault);
  vault.setup = (...a) => { setups++; return realSetup(...a); };

  const root = dom.createElement('div');
  renderOnboarding(ctx, root);
  typePin(root, '1234', { thenEnter: false }); // step 1: choose the PIN
  typePin(root, '1234');                        // step 2: confirm it, then Enter again
  await flush(); await flush();
  assert.equal(setups, 1);
});

test('one wrong PIN is one failed try, even if it is submitted twice', async () => {
  const { vault } = freshCore();
  await vault.setup('4242');
  vault.lock();
  let tries = 0;
  vault.unlock = async () => { tries++; await new Promise((r) => setTimeout(r, 5)); throw new DecryptionError('Incorrect master PIN'); };

  const root = dom.createElement('div');
  renderLock(ctx, root);
  typePin(root, '0000');
  await new Promise((r) => setTimeout(r, 40));
  assert.equal(tries, 1);
});

// ---- Google sign-in inside the extension (F43) ----

const buttonWith = (root, text) => root.find((n) => n.tag === 'button' && (n.textContent === text || n.children.some((c) => c.text === text)));

test('in the extension, with no Google client id set, the welcome screen hides Google and offers email', (t) => {
  if (!cloud) return t.skip('local Firebase config is placeholders');
  globalThis.chrome = { runtime: { id: 'x' }, identity: {} };
  try {
    const root = dom.createElement('div');
    renderWelcome({}, root);
    assert.equal(buttonWith(root, 'Continue with Google'), null);
    assert.ok(buttonWith(root, 'Continue with email'), 'email stays available');
    assert.ok(buttonWith(root, 'Use OKey offline for now'), 'so does offline');
  } finally {
    delete globalThis.chrome;
  }
});

test('on the web the Google button is still there', (t) => {
  if (!cloud) return t.skip('local Firebase config is placeholders');
  const root = dom.createElement('div');
  renderWelcome({}, root);
  assert.ok(buttonWith(root, 'Continue with Google'));
});
