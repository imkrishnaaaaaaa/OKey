import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEntry, validateEntry } from '../src/core/schema.js';
import { mergeRemoteSettings, sanitizeSettings } from '../src/core/settings.js';

const genId = () => '0123456789abcdef';
const now = () => '2026-01-01T00:00:00.000Z';

test('createEntry fills defaults and clamps hostile input', () => {
  const e = createEntry({
    domain: 'HTTPS://Evil.COM/<script>',
    siteName: 'x'.repeat(500),
    password: 'p'.repeat(20000),
    tags: Array(50).fill('t'),
  }, genId, now);
  assert.equal(e.domain, 'https://evil.com/<script>');
  assert.ok(e.siteName.length <= 200);
  assert.ok(e.password.length <= 10000);
  assert.equal(e.tags.length <= 30, true);
  assert.equal(e.version, 1);
});

test('validateEntry requires an identifier', () => {
  const blank = createEntry({}, genId, now);
  assert.throws(() => validateEntry(blank), /domain, site name/);
});

test('password entries require a secret', () => {
  const e = createEntry({ siteName: 'x' }, genId, now);
  assert.throws(() => validateEntry(e), /Password or TOTP/);
});

test('mergeRemoteSettings drops unknown keys', () => {
  const out = mergeRemoteSettings(
    { autoLockTimeout: 60 },
    { autoLockTimeout: 300, evilKey: 'rm -rf', theme: 'dark', rootAdmin: true },
  );
  assert.equal(out.autoLockTimeout, 300);
  assert.equal(out.theme, 'dark');
  assert.equal('evilKey' in out, false);
});

test('mergeRemoteSettings clamps security-critical numbers (revamp H3)', () => {
  const out = mergeRemoteSettings({ autoLockTimeout: 60, clipboardClearTimeout: 30 },
    { autoLockTimeout: 86400, clipboardClearTimeout: -5, syncIntervalMinutes: 999999 });
  assert.equal(out.autoLockTimeout, 1800);   // MAX_AUTO_LOCK_SECONDS
  assert.equal(out.clipboardClearTimeout, 10); // MIN
  assert.equal(out.syncIntervalMinutes, 10080); // MAX interval
});

test('non-string themes are rejected', () => {
  const out = mergeRemoteSettings({ theme: 'dark' }, { theme: 'javascript:alert(1)' });
  assert.equal(out.theme, 'dark');
});

test('sanitizeSettings accepts valid full object', () => {
  const out = sanitizeSettings({
    faviconsEnabled: true,
    passwordGeneratorDefaults: { length: 999, symbols: false },
  });
  assert.equal(out.faviconsEnabled, true);
  assert.equal(out.passwordGeneratorDefaults.length, 128);
  assert.equal(out.passwordGeneratorDefaults.symbols, false);
});
