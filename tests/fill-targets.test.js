import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findFillTargets } from '../src/extension/content/fill-targets.js';

// Fake inputs: { kind: 'user'|'password'|'totp', visible }
const input = (kind, visible = true) => ({ kind, visible });
const scopeOf = (...inputs) => ({ querySelectorAll: () => inputs });
const is = {
  username: (el) => el.kind === 'user',
  password: (el) => el.kind === 'password',
  totp: (el) => el.kind === 'totp',
  fillable: (el) => el.visible,
};

test('a hidden password box next to a visible email box is not filled', () => {
  const email = input('user');
  const hiddenPw = input('password', false);
  const t = findFillTargets(email, scopeOf(email, hiddenPw), is);
  assert.equal(t.user, email);
  assert.equal(t.password, null);
});

test('a visible email and a visible password are both found', () => {
  const email = input('user');
  const pw = input('password');
  const t = findFillTargets(email, scopeOf(email, pw), is);
  assert.deepEqual([t.user, t.password], [email, pw]);
});

test('a visible password box is chosen over a hidden one that comes first', () => {
  const email = input('user');
  const decoy = input('password', false);
  const real = input('password');
  assert.equal(findFillTargets(email, scopeOf(email, decoy, real), is).password, real);
});

test('the clicked password box is used as it is', () => {
  const pw = input('password');
  const t = findFillTargets(pw, scopeOf(pw), is);
  assert.equal(t.password, pw);
});

test('a hidden one-time-code box is ignored', () => {
  const pw = input('password');
  assert.equal(findFillTargets(pw, scopeOf(pw, input('totp', false)), is).totp, null);
  const visible = input('totp');
  assert.equal(findFillTargets(pw, scopeOf(pw, visible), is).totp, visible);
});

test('with no form or container around it, only the clicked box can be filled', () => {
  const email = input('user');
  const t = findFillTargets(email, null, is);
  assert.deepEqual([t.user, t.password, t.totp], [email, null, null]);
});
