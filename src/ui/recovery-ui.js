/**
 * The "here are your 24 words" screen, shared by onboarding, "New recovery key"
 * and the reminder. It shows the words, lets the user copy or save them, and
 * only turns the confirm button on after they type three of the words back.
 * A tick box alone proves nothing.
 */

import { h, copyValue } from './kit.js';
import { I } from './icons.js';
import { pickCheckPositions, checkWords } from '../core/recovery-check.js';

function downloadWords(mnemonic) {
  const blob = new Blob([mnemonic], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = h('a', { href: url, download: 'okey-recovery-key.txt' });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * @param {string} mnemonic the 24 words
 * @param {{ onConfirmed: () => void, confirmLabel?: string, positions?: number[] }} opts
 *   positions: which words to ask for (random unless a test passes some)
 * @returns {{ el: HTMLElement, positions: number[] }}
 */
export function recoveryReveal(mnemonic, { onConfirmed, confirmLabel = 'I saved it. Continue', positions = pickCheckPositions() }) {
  const words = mnemonic.split(' ');
  const grid = h('div', { class: 'ok-recovery-grid nb-stagger' },
    ...words.map((w, i) => h('div', { class: 'ok-word' }, h('b', { text: String(i + 1) }), w)));

  const answers = positions.map((n) => h('input', {
    class: 'nb-input', type: 'text', placeholder: `Word ${n}`, 'aria-label': `Word ${n}`,
    autocomplete: 'off', spellcheck: 'false', autocapitalize: 'off',
  }));
  const confirm = h('button', { class: 'nb-btn nb-btn-primary nb-btn-block', type: 'submit', text: confirmLabel });
  confirm.disabled = true;
  let done = false;
  const refresh = () => { confirm.disabled = !checkWords(mnemonic, positions, answers.map((a) => a.value)); };
  answers.forEach((a) => a.addEventListener('input', refresh));
  confirm.addEventListener('click', () => {
    if (confirm.disabled || done) return;
    done = true;
    onConfirmed();
  });

  const el = h('div', {},
    grid,
    h('div', { class: 'nb-row', style: { gap: '10px', marginBottom: '14px' } },
      h('button', { class: 'nb-btn nb-btn-glass nb-spacer', type: 'button', onclick: () => copyValue(mnemonic, 'Recovery key copied') },
        h('span', { html: I.copy, style: { width: '15px', height: '15px', display: 'inline-flex' } }), 'Copy'),
      h('button', { class: 'nb-btn nb-btn-glass nb-spacer', type: 'button', onclick: () => downloadWords(mnemonic) },
        h('span', { html: I.exportIcon, style: { width: '15px', height: '15px', display: 'inline-flex' } }), 'Save file')),
    h('p', { class: 'nb-muted', style: { fontSize: 'var(--nb-fs-sm)', lineHeight: '1.6', margin: '0 0 10px' },
      text: `To be sure you saved them, type word ${positions.join(', ')} below.` }),
    h('div', { class: 'nb-col', style: { gap: '8px', marginBottom: '16px' } }, ...answers),
    confirm);
  return { el, positions };
}
