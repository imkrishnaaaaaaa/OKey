import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isExtensionPageSender } from '../src/extension/lib/sender.js';

const ID = 'abcdefghijklmnop';

test('the popup and the unlock frame are extension pages', () => {
  assert.equal(isExtensionPageSender({ id: ID, url: `chrome-extension://${ID}/popup/popup.html` }, ID), true);
  // The unlock frame sits inside a web page's tab, and may have a rotating "dynamic" address.
  assert.equal(isExtensionPageSender({ id: ID, tab: { id: 3 }, url: 'chrome-extension://rotating-dynamic-id/unlock/unlock.html' }, ID), true);
});

test('a content script is not, because its sender url is the web page', () => {
  assert.equal(isExtensionPageSender({ id: ID, tab: { id: 3 }, url: 'https://evil.com/login' }, ID), false);
  assert.equal(isExtensionPageSender({ id: ID, tab: { id: 3 }, url: 'http://localhost:3000/' }, ID), false);
});

test('another extension, a missing url or a look-alike scheme is not', () => {
  assert.equal(isExtensionPageSender({ id: 'other', url: 'chrome-extension://other/x.html' }, ID), false);
  assert.equal(isExtensionPageSender({ id: ID }, ID), false);
  assert.equal(isExtensionPageSender({ id: ID, url: 'chrome-extension-evil://x/' }, ID), false);
  assert.equal(isExtensionPageSender(undefined, ID), false);
});
