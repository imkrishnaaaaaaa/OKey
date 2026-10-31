import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickCheckPositions, checkWords, recoveryCheckDue } from '../src/core/recovery-check.js';
import { Vault } from '../src/core/vault.js';
import { generateRecoveryMnemonic } from '../src/core/recovery.js';
import { STORAGE_KEYS } from '../src/core/constants.js';
import { MemoryStorage } from './helpers.js';

// ---- pure helpers ----

test('three different positions between 1 and 24, in order', () => {
  for (let i = 0; i < 200; i++) {
    const p = pickCheckPositions();
    assert.equal(p.length, 3);
    assert.equal(new Set(p).size, 3);
    assert.deepEqual([...p].sort((a, b) => a - b), p);
    assert.ok(p.every((n) => Number.isInteger(n) && n >= 1 && n <= 24));
  }
});

test('positions vary between calls', () => {
  const seen = new Set(Array.from({ length: 50 }, () => pickCheckPositions().join(',')));
  assert.ok(seen.size > 10);
});

test('the check accepts the right words, ignoring case and spaces, and rejects a wrong one', () => {
  const words = generateRecoveryMnemonic();
  const list = words.split(' ');
  const positions = [4, 11, 19];
  const right = positions.map((n) => list[n - 1]);
  assert.equal(checkWords(words, positions, right), true);
  assert.equal(checkWords(words, positions, right.map((w) => `  ${w.toUpperCase()} `)), true);
  assert.equal(checkWords(words, positions, [right[0], 'zebra', right[2]]), false);
  assert.equal(checkWords(words, positions, [right[0], right[1]]), false, 'a missing answer fails');
  assert.equal(checkWords(words, positions, ['', '', '']), false);
});

test('the reminder is due when never checked or after 90 days', () => {
  const day = 86_400_000;
  const now = Date.parse('2030-06-01T00:00:00Z');
  assert.equal(recoveryCheckDue(null, now), true);
  assert.equal(recoveryCheckDue(undefined, now), true);
  assert.equal(recoveryCheckDue(new Date(now - 89 * day).toISOString(), now), false);
  assert.equal(recoveryCheckDue(new Date(now - 91 * day).toISOString(), now), true);
  assert.equal(recoveryCheckDue('not a date', now), true);
});

// ---- vault methods ----

const PIN = '4242';
async function vaultWithWords() {
  const storage = new MemoryStorage();
  const v = new Vault(storage);
  const { recoveryMnemonic } = await v.setup(PIN);
  return { storage, v, words: recoveryMnemonic };
}

test('verifyRecoveryWords says yes for the real words and no for others, and changes nothing', async () => {
  const { storage, v, words } = await vaultWithWords();
  const before = JSON.stringify([...storage.map]);
  assert.equal(await v.verifyRecoveryWords(words), true);
  assert.equal(await v.verifyRecoveryWords(generateRecoveryMnemonic()), false);
  assert.equal(await v.verifyRecoveryWords('not twenty four words'), false);
  assert.equal(JSON.stringify([...storage.map]), before);
});

test('a prepared recovery key changes nothing until it is committed', async () => {
  const { storage, v, words: oldWords } = await vaultWithWords();
  const before = JSON.stringify([...storage.map]);
  const { recoveryMnemonic: newWords, commit } = await v.prepareRecoveryKey();
  assert.equal(JSON.stringify([...storage.map]), before, 'nothing written yet');
  assert.equal(await v.verifyRecoveryWords(oldWords), true, 'old words still work');
  assert.equal(await v.verifyRecoveryWords(newWords), false, 'new words not active yet');

  await commit();
  assert.equal(await v.verifyRecoveryWords(newWords), true);
  assert.equal(await v.verifyRecoveryWords(oldWords), false, 'old words stop working');
  assert.equal(storage.map.get(STORAGE_KEYS.RECOVERY_VERSION), 2, 'so sync knows this wrap is newer');
});

test('new words really open the vault, and the old ones do not', async () => {
  const { storage, v, words: oldWords } = await vaultWithWords();
  await v.addEntry({ siteName: 'X', domain: 'x.com', password: 'p' });
  const { recoveryMnemonic: newWords, commit } = await v.prepareRecoveryKey();
  await commit();
  v.lock();
  await assert.rejects(new Vault(storage).recoverWithMnemonic(oldWords), /did not match/);
  const again = new Vault(storage);
  await again.recoverWithMnemonic(newWords);
  assert.equal(again.getEntries().length, 1);
});

test('regenerateRecovery still works as prepare plus commit', async () => {
  const { v, words: oldWords } = await vaultWithWords();
  const { recoveryMnemonic } = await v.regenerateRecovery();
  assert.equal(await v.verifyRecoveryWords(recoveryMnemonic), true);
  assert.equal(await v.verifyRecoveryWords(oldWords), false);
});
