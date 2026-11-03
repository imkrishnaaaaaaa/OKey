/**
 * Who sent a message to the service worker?
 *
 * A content script runs inside a web page, so its sender.url is that page
 * (https://...). An extension page (the popup, or the unlock/picker frame that a
 * content script embeds) has a chrome-extension:// url, which a web page cannot fake.
 * Some messages must only come from extension pages: they unlock the vault or
 * change settings, and a content script is exposed to hostile pages.
 */
export function isExtensionPageSender(sender, extensionId) {
  return sender?.id === extensionId
    && typeof sender?.url === 'string'
    && sender.url.startsWith('chrome-extension://');
}

/**
 * The picker frame is an extension page in a web tab. Its own URL is not the
 * page URL, so callers that need the site must use the tab URL instead.
 */
export function isPickerFrameSender(sender, extensionId) {
  if (!isExtensionPageSender(sender, extensionId)) return false;
  try {
    const path = new URL(sender.url).pathname;
    const tabUrl = new URL(sender.tab?.url || '');
    return path === '/picker/picker.html'
      && typeof sender.tab?.id === 'number'
      && (tabUrl.protocol === 'https:' || tabUrl.protocol === 'http:');
  } catch {
    return false;
  }
}

/** The web page behind a trusted message. Never a client-supplied URL. */
export function senderPageUrl(sender, extensionId) {
  if (isPickerFrameSender(sender, extensionId)) return sender.tab.url;
  return sender.url || sender.origin || '';
}
