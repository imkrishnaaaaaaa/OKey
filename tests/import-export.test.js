import { test } from 'node:test';
import assert from 'node:assert/strict';
import { exportOkeyBackup, importOkeyBackup, importLastPass, importChrome } from '../src/core/import-export.js';

test('backup file never carries the PIN wrap', () => {
  const text = exportOkeyBackup({
    salt: 'S', kdfParams: { type: 'argon2id' }, wrappedMaster: 'PIN-WRAP', wrappedRecovery: 'R', records: [],
  });
  assert.equal('wrappedMaster' in JSON.parse(text), false);
  const back = importOkeyBackup(text);
  assert.equal(back.wrappedRecovery, 'R');
  assert.equal(back.salt, 'S');
});

// ---- CSV parsing (F11) ----

const LASTPASS_HEADER = 'url,username,password,totp,extra,name,grouping,fav';

test('a quoted note with line breaks stays one entry', () => {
  const csv = [
    LASTPASS_HEADER,
    'https://a.com,alice,pw1,,"line1',
    'line2, with comma",A site,Work,0',
    'https://b.com,bob,pw2,,,B site,,1',
  ].join('\n');
  const items = importLastPass(csv);
  assert.equal(items.length, 2);
  assert.equal(items[0].domain, 'a.com');
  assert.equal(items[0].password, 'pw1');
  assert.equal(items[0].notes, 'line1\nline2, with comma');
  assert.equal(items[0].siteName, 'A site');
  assert.ok(items[0].tags.includes('Work'));
  assert.equal(items[1].domain, 'b.com');
  assert.equal(items[1].isFavorite, true);
});

test('CRLF files, a leading BOM, blank lines and a missing final newline all parse', () => {
  const csv = '\uFEFFname,url,username,password\r\nOne,https://one.com,u1,p1\r\n\r\nTwo,https://two.com,u2,p2';
  const items = importChrome(csv);
  assert.deepEqual(items.map((i) => [i.siteName, i.domain, i.username, i.password]), [
    ['One', 'one.com', 'u1', 'p1'],
    ['Two', 'two.com', 'u2', 'p2'],
  ]);
});

test('escaped quotes and commas inside quotes are kept', () => {
  const csv = 'name,url,username,password\n"Say ""hi"", ok",https://x.com,u,"p,w"\n';
  const [item] = importChrome(csv);
  assert.equal(item.siteName, 'Say "hi", ok');
  assert.equal(item.password, 'p,w');
});
