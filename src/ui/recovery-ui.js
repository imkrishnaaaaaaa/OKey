/**
 * The "here are your 24 words" screen, shared by onboarding, "New recovery key"
 * and the reminder. It shows the words, lets the user copy or save them, and
 * only turns the confirm button on after they type three of the words back.
 * A tick box alone proves nothing.
 *
 * Words are blurred until the user presses "Show words". They re-blur after
 * the 3-word check passes and when the window loses focus. Copy and Save
 * are disabled while blurred.
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
 * @returns {{ el: HTMLElement, positions: number[], reblur: () => void }}
 */
export function recoveryReveal(mnemonic, { onConfirmed, confirmLabel = 'I saved it. Continue', positions = pickCheckPositions() }) {
  const words = mnemonic.split(' ');
  const wordEls = words.map((w, i) => h('div', { class: 'ok-word blurred' }, h('b', { text: String(i + 1) }), w));
  const grid = h('div', { class: 'ok-recovery-grid nb-stagger' }, ...wordEls);

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
    reblur();
    onConfirmed();
  });

  // Blur/Show words toggle
  const copyBtn = h('button', { class: 'nb-btn nb-btn-glass nb-spacer', type: 'button', 'aria-label': 'Copy recovery words', disabled: true, onclick: () => copyValue(mnemonic, 'Recovery key copied') },
    h('span', { html: I.copy, style: { width: '15px', height: '15px', display: 'inline-flex' } }), 'Copy');
  const saveBtn = h('button', { class: 'nb-btn nb-btn-glass nb-spacer', type: 'button', 'aria-label': 'Save recovery words', disabled: true, onclick: () => downloadWords(mnemonic) },
    h('span', { html: I.exportIcon, style: { width: '15px', height: '15px', display: 'inline-flex' } }), 'Save file');
  const showBtn = h('button', { class: 'nb-btn nb-btn-glass nb-btn-block', type: 'button', text: 'Show words', onclick: toggleWords });
  copyBtn.disabled = true;
  saveBtn.disabled = true;

  let wordsVisible = false;

  function toggleWords() {
    wordsVisible = !wordsVisible;
    wordEls.forEach((el) => el.classList.toggle('blurred', !wordsVisible));
    showBtn.textContent = wordsVisible ? 'Hide words' : 'Show words';
    copyBtn.disabled = !wordsVisible;
    saveBtn.disabled = !wordsVisible;
  }

  function reblur() {
    if (wordsVisible) {
      wordsVisible = false;
      wordEls.forEach((el) => el.classList.add('blurred'));
      showBtn.textContent = 'Show words';
      copyBtn.disabled = true;
      saveBtn.disabled = true;
    }
  }

  // Re-blur on window blur (if window exists, e.g. not in tests)
  const handleBlur = () => reblur();
  if (typeof window !== 'undefined') window.addEventListener('blur', handleBlur);

  const el = h('div', {},
    grid,
    h('div', { class: 'nb-row', style: { gap: '10px', marginBottom: '14px' } },
      copyBtn,
      saveBtn),
    showBtn,
    h('p', { class: 'nb-muted', style: { fontSize: 'var(--nb-fs-sm)', lineHeight: '1.6', margin: '0 0 10px' },
      text: `To be sure you saved them, type word ${positions.join(', ')} below.` }),
    h('div', { class: 'nb-col', style: { gap: '8px', marginBottom: '16px' } }, ...answers),
    confirm);

  // Cleanup function to remove event listener
  const cleanup = () => { if (typeof window !== 'undefined') window.removeEventListener('blur', handleBlur); };

  return { el, positions, reblur, cleanup };
}