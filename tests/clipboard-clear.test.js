import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createClipboardCleaner } from '../src/extension/background/clipboard-clear.js';
import { clearViaCopy } from '../src/extension/offscreen/clear-clipboard.js';

/** Fake chrome.offscreen and chrome.runtime that record what happens. */
function fakeChrome({ hasDoc = false, sendFails = false } = {}) {
  const log = [];
  let open = hasDoc;
  return {
    log,
    offscreen: {
      async createDocument(opts) {
        if (open) throw new Error('Only a single offscreen document may be created.');
        open = true; log.push(['create', opts]);
      },
      async closeDocument() { open = false; log.push(['close']); },
    },
    runtime: {
      async sendMessage(m) { log.push(['send', m]); if (sendFails) throw new Error('no receiver'); return { success: true }; },
    },
  };
}
const names = (c) => c.log.map((e) => e[0]);

test('clearing makes an offscreen clipboard document, asks it to clear, then closes it', async () => {
  const c = fakeChrome();
  await createClipboardCleaner(c)();
  assert.deepEqual(names(c), ['create', 'send', 'close']);
  const create = c.log[0][1];
  assert.deepEqual(create.reasons, ['CLIPBOARD']);
  assert.match(create.url, /offscreen\/offscreen\.html$/);
  assert.ok(create.justification.length > 10);
  assert.deepEqual(c.log[1][1], { target: 'offscreen', type: 'CLEAR_CLIPBOARD' });
});

test('an offscreen document that already exists is reused', async () => {
  const c = fakeChrome({ hasDoc: true });
  await createClipboardCleaner(c)();
  assert.deepEqual(names(c), ['send', 'close']);
});

test('a failed message does not throw, and the document is still closed', async () => {
  const c = fakeChrome({ sendFails: true });
  await createClipboardCleaner(c)();
  assert.deepEqual(names(c), ['create', 'send', 'close']);
});

test('the offscreen page clears by copying a blank through a hidden box', () => {
  const calls = [];
  const box = { value: 'x', style: {}, select() { calls.push('select'); }, remove() { calls.push('remove'); } };
  const doc = {
    body: { append() { calls.push('append'); } },
    createElement: () => box,
    execCommand: (cmd) => { calls.push(['exec', cmd, box.value]); return true; },
  };
  assert.equal(clearViaCopy(doc), true);
  assert.deepEqual(calls, ['append', 'select', ['exec', 'copy', ' '], 'remove']);
});

test('the hidden box is removed even if copying throws', () => {
  const calls = [];
  const box = { style: {}, select() {}, remove() { calls.push('remove'); } };
  const doc = { body: { append() {} }, createElement: () => box, execCommand() { throw new Error('denied'); } };
  assert.equal(clearViaCopy(doc), false);
  assert.deepEqual(calls, ['remove']);
});
