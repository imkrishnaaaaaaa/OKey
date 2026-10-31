/** Offscreen document: answers the service worker's "clear the clipboard" message. */
import { clearViaCopy } from './clear-clipboard.js';

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  // Other extension pages get the same broadcast. Only answer our own request.
  if (message?.target !== 'offscreen' || message.type !== 'CLEAR_CLIPBOARD') return false;
  sendResponse({ success: clearViaCopy(document) });
  return false;
});
