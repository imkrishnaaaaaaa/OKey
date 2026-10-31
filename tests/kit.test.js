import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers.js';

const dom = installFakeDom();
const { h, openModal, closeModal, confirmModal, copyValue, setClipboardPolicy, dropdown } = await import('../src/ui/kit.js');

const overlays = () => dom.body.children.filter((c) => c.className === 'nb-overlay');
const button = (label) => dom.body.find((n) => n.tag === 'button' && n.textContent === label);

test('openModal shows one dialog and close() removes it with its key listener', () => {
  const m = openModal([h('p', { text: 'hello' })]);
  assert.equal(overlays().length, 1);
  assert.equal(dom.listenerCount('keydown'), 1);
  m.close();
  assert.equal(overlays().length, 0);
  assert.equal(dom.listenerCount('keydown'), 0);
});

test('opening a second dialog closes the first', () => {
  openModal([h('p', { text: 'one' })]);
  openModal([h('p', { text: 'two' })]);
  assert.equal(overlays().length, 1);
  assert.equal(dom.listenerCount('keydown'), 1);
  closeModal();
});

test('closeModal closes whatever is open, and does nothing when nothing is', () => {
  closeModal();
  openModal([h('p', { text: 'x' })]);
  closeModal();
  assert.equal(overlays().length, 0);
  assert.equal(dom.listenerCount('keydown'), 0);
  closeModal();
});

test('Escape closes the dialog', () => {
  openModal([h('p', { text: 'x' })]);
  dom.dispatch('keydown', { key: 'Escape' });
  assert.equal(overlays().length, 0);
});

test('confirmModal answers true on Confirm and false on Cancel', async () => {
  const yes = confirmModal('Sure?', { confirmLabel: 'Do it' });
  button('Do it').click();
  assert.equal(await yes, true);
  const no = confirmModal('Sure?');
  button('Cancel').click();
  assert.equal(await no, false);
  assert.equal(overlays().length, 0);
});

test('confirmModal answers false when Escape, a click outside, or another dialog closes it', async () => {
  const viaEsc = confirmModal('Sure?');
  dom.dispatch('keydown', { key: 'Escape' });
  assert.equal(await viaEsc, false);

  const viaOutside = confirmModal('Sure?');
  const overlay = overlays()[0];
  overlay.dispatch('click', { target: overlay });
  assert.equal(await viaOutside, false);

  const replaced = confirmModal('Sure?');
  openModal([h('p', { text: 'other' })]);
  assert.equal(await replaced, false);
  closeModal();
});

// ---- clipboard clearing (F20) ----

/** A clipboard we can read and set, standing in for navigator.clipboard. */
function fakeClipboard({ canRead = true } = {}) {
  const board = { text: '' };
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    configurable: true,
    value: {
      writeText: async (t) => { board.text = t; },
      readText: async () => { if (!canRead) throw new Error('denied'); return board.text; },
    },
  });
  return board;
}
const flush = () => new Promise((r) => setImmediate(r));

test('a copied value is cleared after the set time', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const board = fakeClipboard();
  setClipboardPolicy({ seconds: () => 30, remote: null });
  await copyValue('s3cret', 'Password copied');
  assert.equal(board.text, 's3cret');
  mock.timers.tick(29_000); await flush();
  assert.equal(board.text, 's3cret');
  mock.timers.tick(1_000); await flush();
  assert.equal(board.text, '');
  mock.timers.reset();
});

test('something the user copied afterwards is not wiped', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const board = fakeClipboard();
  setClipboardPolicy({ seconds: () => 30, remote: null });
  await copyValue('s3cret');
  board.text = 'a shopping list';
  mock.timers.tick(30_000); await flush();
  assert.equal(board.text, 'a shopping list');
  mock.timers.reset();
});

test('the clipboard is cleared even when the page may not read it', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const board = fakeClipboard({ canRead: false });
  setClipboardPolicy({ seconds: () => 30, remote: null });
  await copyValue('s3cret');
  mock.timers.tick(30_000); await flush();
  assert.equal(board.text, '');
  mock.timers.reset();
});

test('a second copy restarts the clock and only the newest value is cleared', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  const board = fakeClipboard();
  setClipboardPolicy({ seconds: () => 30, remote: null });
  await copyValue('first');
  mock.timers.tick(20_000);
  await copyValue('second');
  mock.timers.tick(20_000); await flush();
  assert.equal(board.text, 'second');
  mock.timers.tick(10_000); await flush();
  assert.equal(board.text, '');
  mock.timers.reset();
});

test('the extension is told to clear too, because its popup may be closed by then', async () => {
  mock.timers.enable({ apis: ['setTimeout'] });
  fakeClipboard();
  const told = [];
  setClipboardPolicy({ seconds: () => 45, remote: (text, secs) => told.push([text, secs]) });
  await copyValue('s3cret');
  assert.deepEqual(told, [['s3cret', 45]]);
  mock.timers.reset();
});

// ---- dropdown listeners (F25) ----

test('a dropdown holds a document click listener only while it is open', () => {
  const before = dom.listenerCount('click');
  const dd = dropdown({ options: [{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }], value: 'a' });
  dom.body.append(dd.el);
  assert.equal(dom.listenerCount('click'), before, 'closed: no listener');

  dd.el.children[0].click(); // open
  assert.equal(dom.listenerCount('click'), before + 1);
  dd.el.children[0].click(); // close
  assert.equal(dom.listenerCount('click'), before);
  dd.el.remove();
});

test('many dropdowns that are never opened leave no listeners behind', () => {
  const before = dom.listenerCount('click');
  for (let i = 0; i < 20; i++) dropdown({ options: [{ value: 'a', label: 'A' }], value: 'a' });
  assert.equal(dom.listenerCount('click'), before);
});

test('an open dropdown closes on a click outside, and cleans up if its screen was replaced', () => {
  const before = dom.listenerCount('click');
  const dd = dropdown({ options: [{ value: 'a', label: 'A' }], value: 'a' });
  dom.body.append(dd.el);
  dd.el.children[0].click(); // open
  dd.el.remove();            // the screen changes while it is open
  dom.dispatch('click', { target: dom.body });
  assert.equal(dom.listenerCount('click'), before);
});
