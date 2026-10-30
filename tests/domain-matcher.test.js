import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extractDomain, normalizeDomain, matchDomain } from '../src/core/domain-matcher.js';

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
