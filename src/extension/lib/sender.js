/**
 * Who sent a message to the service worker?
 *
 * A content script runs inside a web page, so its sender.url is that page
 * (https://...). An extension page (the popup, or the unlock frame that a content
 * script embeds) has a chrome-extension:// url, which a web page cannot fake.
 * Some messages must only come from extension pages: they unlock the vault or
 * change settings, and a content script is exposed to hostile pages.
 */
export function isExtensionPageSender(sender, extensionId) {
  return sender?.id === extensionId
    && typeof sender?.url === 'string'
    && sender.url.startsWith('chrome-extension://');
}
