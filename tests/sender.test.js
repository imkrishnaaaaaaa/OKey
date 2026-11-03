import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isExtensionPageSender, isPickerFrameSender, senderPageUrl } from '../src/extension/lib/sender.js';

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

test('the picker frame is extension-owned but gets the site from its tab', () => {
  const picker = { id: ID, tab: { id: 3, url: 'https://example.com/login' }, url: 'chrome-extension://rotating-dynamic-id/picker/picker.html' };
  assert.equal(isPickerFrameSender(picker, ID), true);
  assert.equal(senderPageUrl(picker, ID), 'https://example.com/login');
  assert.equal(senderPageUrl({ id: ID, tab: { id: 3 }, url: 'https://example.com/login' }, ID), 'https://example.com/login');
});

test('a picker look-alike or a non-web tab is not the picker', () => {
  assert.equal(isPickerFrameSender({ id: ID, tab: { id: 3, url: 'https://example.com' }, url: `chrome-extension://${ID}/unlock/unlock.html` }, ID), false);
  assert.equal(isPickerFrameSender({ id: ID, tab: { id: 3, url: 'chrome-extension://x/popup.html' }, url: `chrome-extension://${ID}/picker/picker.html` }, ID), false);
  assert.equal(isPickerFrameSender({ id: ID, tab: { id: 3, url: 'https://example.com' }, url: `chrome-extension://${ID}/picker/other.html` }, ID), false);
  assert.equal(isPickerFrameSender({ id: ID, url: `chrome-extension://${ID}/picker/picker.html` }, ID), false);
});

test('another extension, a missing url or a look-alike scheme is not', () => {
  assert.equal(isExtensionPageSender({ id: 'other', url: 'chrome-extension://other/x.html' }, ID), false);
  assert.equal(isExtensionPageSender({ id: ID }, ID), false);
  assert.equal(isExtensionPageSender({ id: ID, url: 'chrome-extension-evil://x/' }, ID), false);
  assert.equal(isExtensionPageSender(undefined, ID), false);
});
