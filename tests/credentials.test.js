import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Vault } from '../src/core/vault.js';
import { listSiteCredentials, getCredentialSecret } from '../src/extension/background/credentials.js';
import { MemoryStorage } from './helpers.js';

const TOTP_SECRET = 'JBSWY3DPEHPK3PXP';

async function vaultWithLogins(extra = 0) {
  const v = new Vault(new MemoryStorage());
  await v.setup('1234');
  const bank = await v.addEntry({ siteName: 'Bank', domain: 'bank.com', username: 'me', password: 'BANK-PASSWORD', totpSecret: TOTP_SECRET });
  const shop = await v.addEntry({ siteName: 'Shop', domain: 'shop.com', username: 'me2', password: 'SHOP-PASSWORD' });
  for (let i = 0; i < extra; i++) await v.addEntry({ siteName: `Extra${i}`, domain: `extra${i}.com`, username: 'u', password: 'P' + i });
  return { v, bank, shop };
}

test('the list a page may see has names only, never a password or a code', async () => {
  const { v } = await vaultWithLogins();
  const { matches, others } = listSiteCredentials(v, 'https://evil.com/login');
  assert.equal(matches.length, 0);
  assert.equal(others.length, 2);
  const text = JSON.stringify({ matches, others });
  for (const secret of ['BANK-PASSWORD', 'SHOP-PASSWORD', TOTP_SECRET]) assert.equal(text.includes(secret), false);
  for (const row of others) assert.deepEqual(Object.keys(row).sort(), ['domain', 'id', 'siteName', 'username']);
});

test('matching logins are listed first and the other list is capped at 8', async () => {
  const { v, bank } = await vaultWithLogins(12);
  const { matches, others } = listSiteCredentials(v, 'https://bank.com/login');
  assert.deepEqual(matches.map((m) => m.id), [bank.id]);
  assert.equal(others.length, 8);
  assert.equal(others.some((o) => o.id === bank.id), false);
});

test('the secret for a matching login comes with a fresh code', async () => {
  const { v, bank } = await vaultWithLogins();
  const cred = await getCredentialSecret(v, 'https://bank.com/login', bank.id);
  assert.equal(cred.password, 'BANK-PASSWORD');
  assert.equal(cred.username, 'me');
  assert.match(cred.totpCode, /^\d{6}$/);
});

test('an unrelated site cannot get the secret of a login it does not match', async () => {
  const { v, bank } = await vaultWithLogins();
  await assert.rejects(
    getCredentialSecret(v, 'https://evil.com/login', bank.id),
    (e) => e.code === 'NO_MATCH' && !String(e.message).includes('BANK-PASSWORD'),
  );
});

test('a login the user picked by hand is allowed on any site', async () => {
  const { v, bank } = await vaultWithLogins();
  const cred = await getCredentialSecret(v, 'https://other-site.com/', bank.id, { picked: true });
  assert.equal(cred.password, 'BANK-PASSWORD');
});

test('an unknown id is refused', async () => {
  const { v } = await vaultWithLogins();
  await assert.rejects(getCredentialSecret(v, 'https://bank.com/', 'nope', { picked: true }), /not found/i);
});

// ---- plain http pages (F35) ----

test('nothing is offered on a plain http page', async () => {
  const { v } = await vaultWithLogins();
  const out = listSiteCredentials(v, 'http://bank.com/login');
  assert.deepEqual(out, { matches: [], others: [], insecure: true });
});

test('no secret is given on a plain http page, even for a login picked by hand', async () => {
  const { v, bank } = await vaultWithLogins();
  await assert.rejects(getCredentialSecret(v, 'http://bank.com/login', bank.id), (e) => e.code === 'INSECURE');
  await assert.rejects(getCredentialSecret(v, 'http://bank.com/login', bank.id, { picked: true }), (e) => e.code === 'INSECURE');
});

test('localhost over http is allowed for development', async () => {
  const v = new Vault(new MemoryStorage());
  await v.setup('1234');
  const dev = await v.addEntry({ siteName: 'Dev', domain: 'localhost', username: 'u', password: 'DEV-PW' });
  assert.equal(listSiteCredentials(v, 'http://localhost:3000/login').matches.length, 1);
  assert.equal((await getCredentialSecret(v, 'http://localhost:3000/login', dev.id)).password, 'DEV-PW');
});

test('https pages and odd urls: only https and local development are secure', async () => {
  const { v, bank } = await vaultWithLogins();
  assert.equal(listSiteCredentials(v, 'https://bank.com/').insecure, undefined);
  for (const url of ['ftp://bank.com/', 'file:///tmp/a.html', 'not a url', '']) {
    assert.equal(listSiteCredentials(v, url).insecure, true, url);
    await assert.rejects(getCredentialSecret(v, url, bank.id, { picked: true }), (e) => e.code === 'INSECURE', url);
  }
});
