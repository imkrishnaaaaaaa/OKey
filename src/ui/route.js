/**
 * Screens that live in the address bar (PWA only), so a reload keeps the open
 * item and the Back button goes to the previous one. Pure: no DOM.
 * Screens shown before the vault is open (welcome, lock, ...) are not in the address.
 */

const enc = encodeURIComponent;

/** @returns {string|null} the hash for a screen, or null if it has none */
export function hashFor(view, args = []) {
  switch (view) {
    case 'list': return '#/';
    case 'detail': return `#/item/${enc(args[0])}`;
    case 'edit': return args[0] ? `#/edit/${enc(args[0])}` : '#/new';
    case 'generator': return '#/generator';
    case 'settings': return '#/settings';
    default: return null;
  }
}

/** @returns {{ view: string, args: string[] }} anything unknown means the list */
export function viewFromHash(hash) {
  const [, kind, rawId] = /^#\/([a-z]+)(?:\/(.*))?$/.exec(hash || '') || [];
  let id = '';
  try { id = rawId ? decodeURIComponent(rawId) : ''; } catch { /* a broken escape is no id */ }
  if ((kind === 'item' || kind === 'edit') && id) return { view: kind === 'item' ? 'detail' : 'edit', args: [id] };
  if (kind === 'new') return { view: 'edit', args: [] };
  if (kind === 'generator' || kind === 'settings') return { view: kind, args: [] };
  return { view: 'list', args: [] };
}
