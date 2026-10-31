/**
 * Clear the clipboard from an offscreen document.
 *
 * An offscreen page is never focused, so navigator.clipboard is refused there.
 * The supported way is execCommand('copy') on a hidden box. Copying nothing is a
 * no-op, so the box holds one blank space: that replaces the password on the
 * clipboard with a space.
 *
 * @returns {boolean} true if the browser accepted the copy
 */
export function clearViaCopy(doc) {
  const box = doc.createElement('textarea');
  box.value = ' ';
  Object.assign(box.style, { position: 'fixed', opacity: '0', left: '-9999px' });
  doc.body.append(box);
  try {
    box.select();
    return doc.execCommand('copy');
  } catch {
    return false;
  } finally {
    box.remove();
  }
}
