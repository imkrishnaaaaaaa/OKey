import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldLockOnIdleState } from '../src/extension/lib/idle-policy.js';

test('the OS screen lock locks the vault', () => {
  assert.equal(shouldLockOnIdleState('locked'), true);
});

test('a few seconds without typing does not, because the auto-lock timers own that', () => {
  assert.equal(shouldLockOnIdleState('idle'), false);
  assert.equal(shouldLockOnIdleState('active'), false);
});
