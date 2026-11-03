import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PICKER_MSG, createChannel, frameMessage, isPickerMessage, isExtensionOrigin } from '../src/extension/lib/frame-protocol.js';

test('a frame message needs the current channel and a known type', () => {
  const channel = createChannel();
  const msg = frameMessage(PICKER_MSG.PICK, channel, { id: 'abc', picked: false });
  assert.equal(isPickerMessage(msg, channel, PICKER_MSG.PICK), true);
  assert.equal(isPickerMessage(msg, channel), true);
  assert.equal(isPickerMessage(msg, createChannel(), PICKER_MSG.PICK), false);
  assert.equal(isPickerMessage({ ...msg, type: PICKER_MSG.ADDED }, channel, PICKER_MSG.PICK), false);
  assert.equal(isPickerMessage(null, channel), false);
});

test('channels are fresh and extension origins are strict', () => {
  assert.notEqual(createChannel(), createChannel());
  assert.equal(isExtensionOrigin('chrome-extension://abcdefghijklmnop'), true);
  assert.equal(isExtensionOrigin('chrome-extension://rotating-dynamic-id'), true);
  assert.equal(isExtensionOrigin('chrome-extension://evil/path'), false);
  assert.equal(isExtensionOrigin('https://example.com'), false);
  assert.equal(isExtensionOrigin('chrome-extension-evil://abc'), false);
  assert.equal(isExtensionOrigin(undefined), false);
});

test('the picker is a web-accessible extension page in the build', () => {
  const manifest = JSON.parse(readFileSync(new URL('../src/extension/manifest.json', import.meta.url), 'utf8'));
  const resources = manifest.web_accessible_resources.flatMap((r) => r.resources);
  assert.ok(resources.includes('picker/picker.html'));
  const html = readFileSync(new URL('../src/extension/picker/picker.html', import.meta.url), 'utf8');
  assert.match(html, /picker\.js/);
});

test('the host page cannot receive the add form fields', () => {
  const picker = readFileSync(new URL('../src/extension/picker/picker.js', import.meta.url), 'utf8');
  assert.doesNotMatch(picker, /postMessage\([^)]*password/);
  const content = readFileSync(new URL('../src/extension/content/content.js', import.meta.url), 'utf8');
  assert.match(content, /ev\.source !== frame\.contentWindow/);
  assert.match(content, /ev\.origin !== panelFrameOrigin/);
  assert.match(content, /setTimeout\(showPickerError, 2000\)/);
  assert.doesNotMatch(content, /okey-add-password/);
});
