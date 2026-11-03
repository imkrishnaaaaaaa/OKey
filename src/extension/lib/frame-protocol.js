/**
 * OKey Extension — Messages between the content script and the picker iframe.
 *
 * The iframe is a cross-origin extension page. The page can neither read it nor
 * post messages that look like they came from it. The channel is not a secret:
 * it only keeps a late message from an old frame out of a new one.
 */
export const PICKER_MSG = Object.freeze({
  READY: 'okey-picker-ready',
  CONTEXT: 'okey-picker-context',
  PICK: 'okey-picker-pick',
  ADDED: 'okey-picker-added',
  GENERATE: 'okey-picker-generate',
  CLOSE: 'okey-picker-close',
  RESIZE: 'okey-picker-resize',
});

export function createChannel() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function frameMessage(type, channel, data = {}) {
  return { ...data, type, channel };
}

export function isPickerMessage(data, channel, type) {
  return !!data
    && data.channel === channel
    && typeof data.type === 'string'
    && (type === undefined || data.type === type);
}

export function isExtensionOrigin(origin) {
  return typeof origin === 'string'
    && /^chrome-extension:\/\/[a-z0-9-]+$/i.test(origin);
}
