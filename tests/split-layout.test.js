import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { installFakeDom, MemoryStorage } from './helpers.js';

const dom = installFakeDom();
globalThis.requestAnimationFrame ??= (f) => f();
let wide = true;
globalThis.matchMedia = () => ({ matches: wide });
const popHandlers = [];
globalThis.addEventListener = (type, fn) => { if (type === 'popstate') popHandlers.push(fn); };
const pushes = [];
globalThis.location = { hash: '' };
globalThis.history = { pushState(_s, _t, url) { pushes.push(url); globalThis.location.hash = url; } };

const { Vault } = await import('../src/core/vault.js');
const { DEFAULT_SETTINGS } = await import('../src/core/constants.js');
const { ctx, attachCore, setView, configureShell, goHome, resetIdle } = await import('../src/ui/app-core.js');

const flush = (ms = 60) => new Promise((r) => setTimeout(r, ms));
afterEach(() => resetIdle.cancel());
const app = () => dom.getElementById('app');
const searchBox = () => app().find((n) => n.tag === 'input' && n.attrs.placeholder?.startsWith('Search'));
const cards = () => app().findAll((n) => n.className?.startsWith?.('ok-entry '));
const pane = (name) => app().find((n) => n.className === `ok-pane ok-pane-${name}`);

async function unlockedVault() {
  const storage = new MemoryStorage();
  const vault = new Vault(storage);
  attachCore({ storage, vault });
  ctx.settings = { ...DEFAULT_SETTINGS };
  await vault.setup('4242');
  const a = await vault.addEntry({ siteName: 'GitHub', domain: 'github.com', username: 'u', password: 'p' });
  const b = await vault.addEntry({ siteName: 'GitLab', domain: 'gitlab.com', username: 'u', password: 'p' });
  pushes.length = 0; globalThis.location.hash = '';
  configureShell({ routing: true, twoPane: () => matchMedia('(min-width: 1000px)').matches });
  return { vault, a, b };
}

test('on a wide window the list and a calm empty pane sit side by side', async () => {
  wide = true;
  await unlockedVault();
  setView('list'); await flush();
  assert.ok(pane('list') && pane('main'), 'two panes');
  assert.ok(pane('list').find((n) => n.tag === 'input' && n.attrs.placeholder?.startsWith('Search')), 'search is in the list pane');
  assert.ok(JSON.stringify(pane('main'), (k, v) => (k === 'parent' || k === 'handlers' ? undefined : v)).includes('Select a login'));
  assert.equal(app().children.filter((c) => c.className === 'ok-footer').length, 1, 'one footer');
  assert.equal(pane('list').find((n) => n.className === 'ok-footer'), null, 'footer is not in the list pane');
});

test('the PWA shell fills the window at every breakpoint', () => {
  const css = readFileSync(new URL('../src/pwa/app.css', import.meta.url), 'utf8');
  assert.match(css, /height:\s*100dvh/, 'fills the phone window');
  assert.match(css, /max-width:\s*560px/, 'tablet column grows');
  assert.match(css, /max-width:\s*none/, 'desktop uses the whole window');

  const screens = readFileSync(new URL('../styles/nebula/screens.css', import.meta.url), 'utf8');
  assert.match(screens, /\.ok-group \{[^}]*width:\s*100%/, 'tablet cards fill the column');
  assert.match(screens, /@media \(hover: none\)[\s\S]*?\.ok-entry-actions \{ display: flex; \}/, 'touch rows show quick copy');
});

test('opening an item changes only the right pane, so the search text stays', async () => {
  wide = true;
  const { a } = await unlockedVault();
  setView('list'); await flush();
  const box = searchBox();
  box.value = 'git'; box.dispatch('input'); await flush();

  setView('detail', a.id); await flush();
  assert.equal(searchBox(), box, 'the same search box');
  assert.equal(box.value, 'git');
  assert.ok(pane('main').find((n) => n.tag === 'button' && n.textContent === 'Edit item'), 'the item is on the right');
  assert.equal(cards().filter((c) => c.className.includes('selected')).length, 1, 'one row is marked selected');
});

test('Escape goes back to the empty pane, but not while a dialog is open', async () => {
  wide = true;
  const { a } = await unlockedVault();
  setView('detail', a.id); await flush();
  dom.dispatch('keydown', { key: 'Escape' }); await flush();
  assert.equal(pane('main').find((n) => n.tag === 'button' && n.textContent === 'Edit item'), null);

  setView('detail', a.id); await flush();
  const { openModal } = await import('../src/ui/kit.js');
  const m = openModal([]);
  dom.dispatch('keydown', { key: 'Escape' }); await flush();
  assert.ok(pane('main').find((n) => n.tag === 'button' && n.textContent === 'Edit item'), 'the dialog took the Escape');
  m.close();
});

test('a narrow window keeps one screen at a time, as before', async () => {
  wide = false;
  const { a } = await unlockedVault();
  setView('list'); await flush();
  assert.equal(pane('list'), null);
  setView('detail', a.id); await flush();
  assert.equal(searchBox(), null, 'the detail replaced the list');
  assert.ok(app().find((n) => n.tag === 'button' && n.textContent === 'Edit item'));
});

test('screens get addresses, and Back and reload bring the same screen', async () => {
  wide = true;
  const { a } = await unlockedVault();
  setView('list'); setView('detail', a.id); setView('settings'); await flush();
  assert.deepEqual(pushes, ['#/', `#/item/${a.id}`, '#/settings']);

  globalThis.location.hash = `#/item/${a.id}`;
  popHandlers.forEach((f) => f()); await flush();
  assert.ok(pane('main').find((n) => n.tag === 'button' && n.textContent === 'Edit item'), 'Back shows the earlier item');
  assert.equal(pushes.length, 3, 'going back does not add history');

  globalThis.location.hash = '#/settings';
  goHome(); await flush();
  assert.ok(pane('main').find((n) => n.tag === 'h3' || n.textContent === 'Settings') || JSON.stringify(pane('main'), (k, v) => (k === 'parent' || k === 'handlers' ? undefined : v)).includes('Settings'), 'reload opens Settings');
});

test('Back does nothing while the vault is locked', async () => {
  wide = true;
  const { vault } = await unlockedVault();
  setView('list'); await flush();
  vault.lock();
  globalThis.location.hash = '#/settings';
  popHandlers.forEach((f) => f()); await flush();
  assert.equal(pane('main').find((n) => JSON.stringify(n.textContent).includes('Settings')) ?? null, null);
});
