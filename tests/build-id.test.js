import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { hashTree } from '../build-id.mjs';

async function tree(files) {
  const dir = await mkdtemp(path.join(tmpdir(), 'okey-build-'));
  for (const [name, text] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(dir, name)), { recursive: true });
    await writeFile(path.join(dir, name), text);
  }
  return dir;
}

test('the same files give the same id, in any folder', async () => {
  const a = await tree({ 'app.js': 'one', 'styles/a.css': 'two' });
  const b = await tree({ 'styles/a.css': 'two', 'app.js': 'one' });
  assert.equal(await hashTree(a), await hashTree(b));
  assert.match(await hashTree(a), /^[0-9a-f]{12}$/);
});

test('changing a file, adding one or renaming one changes the id', async () => {
  const base = await hashTree(await tree({ 'app.js': 'one' }));
  assert.notEqual(base, await hashTree(await tree({ 'app.js': 'ONE' })));
  assert.notEqual(base, await hashTree(await tree({ 'app.js': 'one', 'extra.css': '' })));
  assert.notEqual(base, await hashTree(await tree({ 'main.js': 'one' })));
});

test('skipped files and source maps do not change the id', async () => {
  const dir = await tree({ 'app.js': 'one', 'sw.js': 'v1', 'app.js.map': 'm1' });
  const before = await hashTree(dir, { skip: ['sw.js'] });
  await writeFile(path.join(dir, 'sw.js'), 'v2');
  await writeFile(path.join(dir, 'app.js.map'), 'm2');
  assert.equal(await hashTree(dir, { skip: ['sw.js'] }), before);
});
