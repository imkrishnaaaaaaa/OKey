import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hashFor, viewFromHash } from '../src/ui/route.js';

test('each unlocked screen has an address', () => {
  assert.equal(hashFor('list'), '#/');
  assert.equal(hashFor('detail', ['abc']), '#/item/abc');
  assert.equal(hashFor('edit', ['abc']), '#/edit/abc');
  assert.equal(hashFor('edit', []), '#/new');
  assert.equal(hashFor('generator'), '#/generator');
  assert.equal(hashFor('settings'), '#/settings');
});

test('screens before the vault is open have no address', () => {
  for (const v of ['welcome', 'onboarding', 'restore', 'lock', 'nonsense']) assert.equal(hashFor(v), null, v);
});

test('an address gives back the same screen and id', () => {
  for (const [view, args] of [['list', []], ['detail', ['abc']], ['edit', ['abc']], ['edit', []], ['generator', []], ['settings', []]]) {
    assert.deepEqual(viewFromHash(hashFor(view, args)), { view, args }, view);
  }
});

test('ids with odd characters survive the round trip', () => {
  const id = 'a/b c#d?e%f';
  assert.deepEqual(viewFromHash(hashFor('detail', [id])), { view: 'detail', args: [id] });
});

test('an empty, old or unknown address means the list', () => {
  for (const h of ['', '#', '#/', '#/nope', '#/item/', '#/item', 'garbage', undefined, null]) {
    assert.deepEqual(viewFromHash(h), { view: 'list', args: [] }, String(h));
  }
});
