import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractDomain, normalizeDomain, matchDomain, getDisplayDomain } from '../src/core/domain-matcher.js';

test('extractDomain: eTLD+1 basics and multi-level suffixes', () => {
  assert.equal(extractDomain('https://accounts.google.com/signin'), 'google.com');
  assert.equal(extractDomain('https://www.bbc.co.uk/news'), 'bbc.co.uk');
  assert.equal(extractDomain('example.com'), 'example.com');
  assert.equal(extractDomain('https://192.168.1.1/a'), '192.168.1.1');
  assert.equal(extractDomain('not a url'), null);
});

test('normalizeDomain strips scheme/www/path', () => {
  assert.equal(normalizeDomain('https://www.GitHub.com/login'), 'github.com');
  assert.equal(normalizeDomain('app.example.com:8080/x'), 'app.example.com');
});

test('matchDomain confidence ladder', () => {
  const entries = [
    { id: 'exact', domain: 'github.com' },
    { id: 'sub', domain: 'api.github.com' },
    { id: 'other', domain: 'gitlab.com' },
  ];
  const m = matchDomain('https://github.com/login', entries);
  const byId = Object.fromEntries(m.map((x) => [x.id, x.confidence]));
  assert.equal(byId.exact, 95);
  assert.ok(byId.sub >= 70);
  assert.equal(byId.other, undefined);
});

test('M8 bypass: dotless entry domain matches nothing (except localhost)', () => {
  const entries = [{ id: 'tld', domain: 'com' }];
  assert.equal(matchDomain('https://anything.com/login', entries).length, 0);
  const local = [{ id: 'lh', domain: 'localhost' }];
  assert.equal(matchDomain('http://localhost:3000/', local)[0].confidence, 95);
});

test('M8 bypass: glob cannot bless a different site', () => {
  const entries = [{ id: 'evil', domain: 'site.com', matchPatterns: ['site.com*'] }];
  assert.equal(matchDomain('https://site.com.evil.com/login', entries).length, 0);
});

test('glob still matches its own site paths', () => {
  const entries = [{ id: 'ok', domain: 'site.com', matchPatterns: ['site.com/admin/*'] }];
  const m = matchDomain('https://site.com/admin/users', entries);
  assert.equal(m[0].id, 'ok');
  assert.equal(m[0].confidence, 100);
});

// ---- shared hosting domains (F10) ----

test('sites on a shared hosting domain do not match each other', () => {
  const cases = [
    ['https://evil.github.io/', 'alice.github.io'],
    ['https://attacker.vercel.app/', 'myapp.vercel.app'],
    ['https://evil.gov.in/', 'incometax.gov.in'],
  ];
  for (const [url, saved] of cases) {
    assert.equal(matchDomain(url, [{ id: 'x', domain: saved }]).length, 0, `${url} vs ${saved}`);
  }
});

test('a login saved on the shared suffix itself is not offered on its subdomains', () => {
  assert.equal(matchDomain('https://evil.github.io/', [{ id: 'x', domain: 'github.io' }]).length, 0);
});

test('a match pattern on a shared suffix cannot bless other people\'s sites', () => {
  const entries = [{ id: 'p', domain: 'alice.github.io', matchPatterns: ['github.io/*'] }];
  assert.equal(matchDomain('https://evil.github.io/x', entries).length, 0);
});

test('your own site on a shared host still matches, including its subdomains', () => {
  const entries = [{ id: 'me', domain: 'alice.github.io' }];
  assert.equal(matchDomain('https://alice.github.io/login', entries)[0].confidence, 95);
  assert.equal(matchDomain('https://blog.alice.github.io/', entries)[0].confidence, 88);
  assert.equal(extractDomain('https://a.b.alice.github.io/'), 'alice.github.io');
  assert.equal(extractDomain('https://shop.example.com.au/'), 'example.com.au');
});

test('getDisplayDomain keeps its short form', () => {
  assert.equal(getDisplayDomain('https://www.example.com/x'), 'example.com');
  assert.equal(getDisplayDomain('https://app.example.com'), 'app.example');
  assert.equal(getDisplayDomain('https://a.bbc.co.uk'), 'a.bbc');
  assert.equal(getDisplayDomain('https://bbc.co.uk'), 'bbc.co.uk');
});
