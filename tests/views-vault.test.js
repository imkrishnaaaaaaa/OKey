import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom, MemoryStorage } from './helpers.js';

const dom = installFakeDom();
globalThis.requestAnimationFrame ??= (f) => f();
const { Vault } = await import('../src/core/vault.js');
const { DEFAULT_SETTINGS } = await import('../src/core/constants.js');
const { ctx, attachCore, setView, trySync } = await import('../src/ui/app-core.js');

const flush = () => new Promise((r) => setTimeout(r, 20));
const cards = (root) => root.findAll((n) => n.className?.startsWith?.('ok-entry '));

test('a background sync keeps what the user typed in the search box', async () => {
  const storage = new MemoryStorage();
  const vault = new Vault(storage);
  attachCore({ storage, vault });
  ctx.settings = { ...DEFAULT_SETTINGS };
  await vault.setup('4242');
  await vault.addEntry({ siteName: 'GitHub', domain: 'github.com', username: 'u', password: 'p' });
  await vault.addEntry({ siteName: 'GitLab', domain: 'gitlab.com', username: 'u', password: 'p' });

  setView('list');
  await flush();
  const app = dom.getElementById('app');
  const searchBox = () => app.find((n) => n.tag === 'input' && n.attrs.placeholder?.startsWith('Search'));
  const box = searchBox();
  box.value = 'gitlab';
  box.dispatch('input');
  await flush();
  assert.equal(cards(app).length, 1);

  // A sync brings in one more match while the user is typing.
  ctx.user = { uid: 'u1' };
  ctx.cloudSync = {
    async sync() { await vault.addEntry({ siteName: 'GitLab EU', domain: 'gitlab.eu', username: 'u', password: 'p' }); return { pushed: 0, pulled: 1 }; },
    async pullSettings(s) { return s; },
  };
  await trySync();
  await flush();

  assert.equal(searchBox(), box, 'the same search box is still on screen');
  assert.equal(box.value, 'gitlab');
  assert.equal(cards(app).length, 2, 'the new match is listed');
});

test('the list screen has an "Add login" button that opens the edit form', async () => {
  const storage = new MemoryStorage();
  const vault = new Vault(storage);
  attachCore({ storage, vault });
  ctx.settings = { ...DEFAULT_SETTINGS };
  await vault.setup('4242');
  await vault.addEntry({ siteName: 'GitHub', domain: 'github.com', username: 'u', password: 'p' });

  setView('list');
  await flush();
  const app = dom.getElementById('app');
  const add = app.find((n) => n.tag === 'button' && n.attrs['aria-label'] === 'Add login');
  assert.ok(add, 'there is a way to add a second login');
  add.click();
  await flush();
  assert.ok(app.find((n) => n.tag === 'button' && n.textContent === 'Add to vault'), 'the edit form is open');
});

test('the footer is the last thing on every unlocked screen, with "Edit item" above it', async () => {
  const storage = new MemoryStorage();
  const vault = new Vault(storage);
  attachCore({ storage, vault });
  ctx.settings = { ...DEFAULT_SETTINGS };
  await vault.setup('4242');
  const e = await vault.addEntry({ siteName: 'GitHub', domain: 'github.com', username: 'u', password: 'p' });

  for (const [view, arg] of [['list'], ['detail', e.id], ['edit', e.id], ['generator'], ['settings']]) {
    if (view === 'edit' || view === 'generator') continue; // these have no footer
    setView(view, arg);
    await flush();
    const kids = dom.getElementById('app').children;
    const last = kids[kids.length - 1];
    assert.equal(last.className, 'ok-footer', `${view}: footer is last`);
  }
  setView('detail', e.id);
  await flush();
  const kids = dom.getElementById('app').children;
  const editAt = kids.findIndex((k) => k.find((n) => n.tag === 'button' && n.textContent === 'Edit item'));
  assert.ok(editAt >= 0 && editAt < kids.length - 1, '"Edit item" is above the footer');
});
