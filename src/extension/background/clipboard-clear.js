/**
 * Clears the clipboard from the service worker, which cannot touch it itself.
 * An offscreen document (reason CLIPBOARD) does the copy, then it is closed again.
 *
 * Why not run a script in the active tab: that needs host permission for every
 * site, which the extension does not have, so it failed without a sound.
 *
 * @param {{ offscreen: object, runtime: object }} api chrome.offscreen and chrome.runtime
 * @returns {() => Promise<void>}
 */
export function createClipboardCleaner({ offscreen, runtime }) {
  return async function clearClipboard() {
    try {
      try {
        await offscreen.createDocument({
          url: 'offscreen/offscreen.html',
          reasons: ['CLIPBOARD'],
          justification: 'Clear a copied password from the clipboard after the time the user chose.',
        });
      } catch (e) {
        // Only one offscreen document may exist. If it is already there, use it.
        if (!/single offscreen document/i.test(String(e?.message))) throw e;
      }
      await runtime.sendMessage({ target: 'offscreen', type: 'CLEAR_CLIPBOARD' });
    } catch {
      /* nothing more can be done from here */
    } finally {
      await offscreen.closeDocument().catch(() => {});
    }
  };
}
