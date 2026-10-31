import { test } from 'node:test';
import assert from 'node:assert/strict';
import { installFakeDom } from './helpers.js';

const dom = installFakeDom();
const { shell, ctx } = await import('../src/ui/app-core.js');

test('building the header again and again does not pile up sync listeners', () => {
  const before = dom.listenerCount('okey-sync-status');
  for (let i = 0; i < 6; i++) shell({ title: 'Settings', back: () => {} });
  assert.ok(dom.listenerCount('okey-sync-status') - before <= 1, `listeners: ${dom.listenerCount('okey-sync-status')}`);
});

test('the sync dot follows the status of the newest header only', () => {
  ctx.syncStatus = 'ok';
  const first = shell({ title: 'A', back: () => {} });
  const second = shell({ title: 'B', back: () => {} });
  dom.body.append(first.footer, second.footer);
  ctx.syncStatus = 'err';
  dom.dispatch('okey-sync-status');
  const dot = (f) => f.find((n) => n.className?.startsWith?.('ok-dot'));
  assert.notEqual(dot(first.footer).className, dot(second.footer).className, 'only the live header repaints');
});
