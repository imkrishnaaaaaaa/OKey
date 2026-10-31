import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestOnly } from '../src/ui/latest.js';

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

test('only the newest call may paint, even when an older one finishes last', async () => {
  const painted = [];
  const paint = latestOnly(async (isCurrent, q, delay) => {
    await wait(delay); // the slow part, like asking the browser for the current tab
    if (!isCurrent()) return;
    painted.push(q);
  });
  const slowOld = paint('a', 30);
  const fastNew = paint('ab', 1);
  await Promise.all([slowOld, fastNew]);
  assert.deepEqual(painted, ['ab']);
});

test('a call with nothing newer behind it paints', async () => {
  const painted = [];
  const paint = latestOnly(async (isCurrent, q) => { await wait(1); if (isCurrent()) painted.push(q); });
  await paint('one');
  await paint('two');
  assert.deepEqual(painted, ['one', 'two']);
});
