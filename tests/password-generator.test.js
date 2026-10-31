import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wordlist } from '@scure/bip39/wordlists/english';
import { generatePassphrase } from '../src/core/password-generator.js';

test('passphrase with a number ends in one 4-digit group', () => {
  const parts = generatePassphrase({ words: 5, separator: '-', includeNumber: true }).split('-');
  assert.equal(parts.length, 6);
  assert.match(parts[5], /^\d{4}$/);
  const n = Number(parts[5]);
  assert.ok(n >= 1000 && n <= 9999);
});

test('passphrase words use the whole wordlist, not only the first 256', () => {
  const words = Array.from({ length: 40 }, () => generatePassphrase({ words: 5, separator: ' ' }).split(' ')).flat();
  for (const w of words) assert.ok(wordlist.includes(w));
  assert.ok(words.some((w) => wordlist.indexOf(w) >= 256));
});
