import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createUnlockGate } from '../src/extension/background/unlock-gate.js';

const KEY = 'okey_unlock_attempts';

function fakeStorage() {
  const data = {};
  return {
    data,
    async get(k) { return { [k]: data[k] }; },
    async set(items) { Object.assign(data, items); },
    async remove(k) { delete data[k]; },
  };
}

/** A gate whose attempts always fail unless told otherwise, with a recorded fake wait. */
function setup({ pinOk = () => false } = {}) {
  const storage = fakeStorage();
  const waits = [];
  const seenCounts = [];
  let running = 0;
  let maxRunning = 0;
  const gate = createUnlockGate({
    storage,
    wait: async (ms) => { waits.push(ms); seenCounts.push(storage.data[KEY]); },
    async tryUnlock(pin) {
      running++; maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 2));
      running--;
      return pinOk(pin) ? { success: true } : { success: false, error: 'Incorrect master PIN' };
    },
  });
  return { gate, storage, waits, seenCounts, maxRunning: () => maxRunning };
}

test('the first try is immediate, and each wrong try makes the next wait longer', async () => {
  const { gate, waits } = setup();
  await gate('1'); await gate('2'); await gate('3'); await gate('4');
  assert.deepEqual(waits, [4000, 8000, 16000]);
});

test('tries sent at the same moment still run one at a time and still wait longer each time', async () => {
  const { gate, waits, maxRunning } = setup();
  await Promise.all(['a', 'b', 'c', 'd', 'e'].map((p) => gate(p)));
  assert.equal(maxRunning(), 1);
  assert.deepEqual(waits, [4000, 8000, 16000, 32000]);
});

test('the count is raised before the wait, so a restart during the wait does not reset it', async () => {
  const { gate, seenCounts } = setup();
  await gate('1');
  await gate('2');
  assert.deepEqual(seenCounts, [2]); // when the second try waited, its own try was already counted
});

test('the wait never goes above one minute', async () => {
  const { gate, waits } = setup();
  for (let i = 0; i < 10; i++) await gate(String(i));
  assert.equal(Math.max(...waits), 60000);
});

test('a right PIN resets the count', async () => {
  const { gate, storage, waits } = setup({ pinOk: (p) => p === 'good' });
  await gate('bad'); await gate('bad'); await gate('good');
  assert.equal(storage.data[KEY], undefined);
  await gate('bad');
  assert.equal(waits.length, 2, 'no wait after the reset');
});
