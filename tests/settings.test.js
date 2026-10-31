import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeSettings } from '../src/core/settings.js';
import { SECURITY } from '../src/core/constants.js';

test('the page-session auto-lock never goes above the same limit as the popup', () => {
  assert.equal(sanitizeSettings({ miniAutoLockTimeout: 3600 }).miniAutoLockTimeout, SECURITY.MAX_AUTO_LOCK_SECONDS);
  assert.equal(sanitizeSettings({ autoLockTimeout: 3600 }).autoLockTimeout, SECURITY.MAX_AUTO_LOCK_SECONDS);
});

test('and not below the minimum', () => {
  assert.equal(sanitizeSettings({ miniAutoLockTimeout: 1 }).miniAutoLockTimeout, SECURITY.MIN_AUTO_LOCK_SECONDS);
});
