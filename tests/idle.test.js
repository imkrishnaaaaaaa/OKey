import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { createIdleTimer } from '../src/ui/idle.js';

/** An idle timer on fake timers and a fake clock that moves with tick(). */
function setup({ unlocked = true, timeout = 60_000 } = {}) {
  mock.timers.enable({ apis: ['setTimeout'] });
  let clock = 10_000;
  const calls = { touch: 0, lock: 0 };
  const state = { unlocked, timeout };
  const idle = createIdleTimer({
    isUnlocked: () => state.unlocked,
    timeoutMs: () => state.timeout,
    onTouch: () => { calls.touch++; },
    onLock: () => { calls.lock++; },
    now: () => clock,
  });
  const tick = (ms) => { clock += ms; mock.timers.tick(ms); };
  return { idle, calls, state, tick };
}

test('two quick clicks do not switch auto-lock off', () => {
  const { idle, calls, tick } = setup();
  idle();        // unlock
  tick(500);
  idle();        // click an entry within 4 seconds
  tick(500);
  idle();        // click copy
  tick(59_999);
  assert.equal(calls.lock, 0);
  tick(1);
  assert.equal(calls.lock, 1);
  mock.timers.reset();
});

test('the lock countdown starts again from the last activity', () => {
  const { idle, calls, tick } = setup();
  idle();
  tick(50_000);
  idle();
  tick(50_000);
  assert.equal(calls.lock, 0);
  tick(10_000);
  assert.equal(calls.lock, 1);
  mock.timers.reset();
});

test('extending the session is throttled, the countdown is not', () => {
  const { idle, calls, tick } = setup();
  idle(); tick(1000); idle(); tick(1000); idle();
  assert.equal(calls.touch, 1);
  tick(4000);
  idle();
  assert.equal(calls.touch, 2);
  mock.timers.reset();
});

test('nothing is armed while the vault is locked', () => {
  const { idle, calls, tick } = setup({ unlocked: false });
  idle();
  tick(120_000);
  assert.deepEqual(calls, { touch: 0, lock: 0 });
  mock.timers.reset();
});

test('cancel stops a pending lock, and a new timeout setting applies on the next activity', () => {
  const { idle, calls, state, tick } = setup();
  idle();
  idle.cancel();
  tick(120_000);
  assert.equal(calls.lock, 0);
  state.timeout = 5_000;
  idle();
  tick(5_000);
  assert.equal(calls.lock, 1);
  mock.timers.reset();
});
