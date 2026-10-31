/**
 * OKey UI — component kit (shared by popup & PWA).
 * Thin DOM helpers over the Nebula CSS system. No framework.
 */

export function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'text') el.textContent = String(v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'attrs' && v && typeof v === 'object') for (const [a2, av] of Object.entries(v)) el.setAttribute(a2, String(av));
    else el.setAttribute(k, String(v));
  }
  for (const kid of kids.flat(Infinity)) {
    if (kid == null || kid === false) continue;
    el.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return el;
}

export const clear = (node) => node.replaceChildren();

export function buzz(pattern = 10) {
  try { navigator.vibrate?.(pattern); } catch { /* noop */ }
}

/* ---------- toast ---------- */
let toastBox = null;
export function toast(msg, type = 'info', ms = 2400) {
  if (!toastBox) {
    toastBox = h('div', { class: 'nb-toast-container', role: 'status', 'aria-live': 'polite' });
    document.body.append(toastBox);
  } else {
    document.body.append(toastBox);
  }
  const t = h('div', { class: 'nb-toast nb-toast-' + type }, msg);
  toastBox.append(t);
  setTimeout(() => {
    t.classList.add('nb-toast-exit');
    t.addEventListener('animationend', () => t.remove());
  }, ms);
}

/* ---------- clipboard ---------- */
// How long a copied value stays on the clipboard, and who else clears it.
// `seconds` reads the user's setting live. The extension adds `remote`, because
// its popup closes when the user switches to the site to paste, taking this timer with it.
let clipboardPolicy = { seconds: () => 30, remote: null };
let clipboardTimer = null;

export function setClipboardPolicy(policy) {
  clipboardPolicy = { ...clipboardPolicy, ...policy };
}

function scheduleClipboardClear(text) {
  clearTimeout(clipboardTimer);
  const secs = clipboardPolicy.seconds();
  try { clipboardPolicy.remote?.(text, secs); } catch { /* the page timer below still runs */ }
  clipboardTimer = setTimeout(async () => {
    try {
      // Leave it alone if the user copied something else since.
      if ((await navigator.clipboard.readText()) !== text) return;
    } catch { /* reading may be refused. Clear anyway. */ }
    try { await navigator.clipboard.writeText(''); } catch { /* nothing more to do */ }
  }, secs * 1000);
}

export async function copyValue(text, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    buzz(12);
    toast(label, 'success');
    scheduleClipboardClear(text);
  } catch {
    toast('Copy failed', 'error');
  }
}

/* ---------- modal / confirm ---------- */
let activeClose = null; // closes the dialog that is open right now, if any

/** Close the open dialog. Does nothing when none is open. */
export function closeModal() { activeClose?.(); }

/** Is a dialog open right now? */
export const isModalOpen = () => activeClose !== null;

/**
 * Show one dialog. Opening a new one closes the old one first.
 * @param {Array} children
 * @param {{ onClose?: () => void }} [opts] onClose runs once however it closes:
 *   close(), Escape, a click outside, or another dialog taking its place.
 */
export function openModal(children, { onClose } = {}) {
  closeModal();
  const ov = h('div', { class: 'nb-overlay' });
  const box = h('div', { class: 'nb-modal', role: 'dialog', 'aria-modal': 'true' },
    ...children);
  const onKey = (e) => { if (e.key === 'Escape') done(); };
  let closed = false;
  function done() {
    if (closed) return;
    closed = true;
    document.removeEventListener('keydown', onKey);
    ov.remove();
    if (activeClose === done) activeClose = null;
    onClose?.();
  }
  activeClose = done;
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', (e) => { if (e.target === ov) done(); });
  ov.append(box);
  document.body.append(ov);
  return { close: done, el: box };
}

/** Resolves true on Confirm. Any other way of closing it resolves false. */
export function confirmModal(message, { danger = false, confirmLabel = 'Confirm' } = {}) {
  return new Promise((resolve) => {
    const m = openModal([
      h('div', { style: { lineHeight: '1.55', marginBottom: '16px' }, text: message }),
      h('div', { class: 'nb-row', style: { gap: '10px' } },
        h('button', { class: 'nb-btn nb-btn-ghost nb-spacer', text: 'Cancel', onclick: () => m.close() }),
        h('button', { class: 'nb-btn ' + (danger ? 'nb-btn-danger' : 'nb-btn-primary') + ' nb-spacer', text: confirmLabel,
          onclick: () => { resolve(true); m.close(); } })),
    ], { onClose: () => resolve(false) });
  });
}

/* ---------- segmented PIN ---------- */
export function pinInput({ autoFocus = true, onSubmit, onChange } = {}) {
  const opts = { onSubmit };
  const cells = [0, 1, 2, 3].map((i) =>
    h('input', {
      class: 'nb-pin-cell', type: 'password', inputmode: 'numeric',
      pattern: '[0-9]*', maxlength: 1,
      autocomplete: i === 0 ? 'one-time-code' : 'off',
      'aria-label': 'PIN digit ' + (i + 1),
    }));
  const wrap = h('div', { class: 'nb-pin-group', role: 'group', 'aria-label': 'Master PIN' }, ...cells);
  const focusAt = (i) => cells[Math.max(0, Math.min(3, i))]?.focus();
  const complete = () => { if (cells.every((c) => c.value)) opts.onSubmit?.(); };
  const report = () => onChange?.(cells.filter((c) => c.value).length);

  cells.forEach((cell, i) => {
    cell.addEventListener('input', () => {
      cell.value = cell.value.replace(/[^0-9]/g, '').slice(-1);
      cell.classList.toggle('filled', !!cell.value);
      report();
      if (cell.value && i < 3) return focusAt(i + 1);
      complete();
    });
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && !cell.value && i > 0) { e.preventDefault(); focusAt(i - 1); }
      if (e.key === 'Enter') { e.preventDefault(); complete(); }
    });
    cell.addEventListener('paste', (e) => {
      const text = (e.clipboardData?.getData('text') || '').replace(/[^0-9]/g, '').slice(0, 4);
      if (!text) return;
      e.preventDefault();
      text.split('').forEach((ch, j) => {
        if (cells[j]) { cells[j].value = ch; cells[j].classList.add('filled'); }
      });
      focusAt(text.length);
      report();
      complete();
    });
  });

  if (autoFocus) requestAnimationFrame(() => cells[0].focus());
  return {
    el: wrap, cells,
    get value() { return cells.map((c) => c.value).join(''); },
    setOnSubmit(fn) { opts.onSubmit = fn; },
    reset() { cells.forEach((c) => { c.value = ''; c.classList.remove('filled'); }); focusAt(0); report(); },
    shake() { wrap.classList.remove('nb-shake'); void wrap.offsetWidth; wrap.classList.add('nb-shake'); setTimeout(() => wrap.classList.remove('nb-shake'), 450); },
    pulseSuccess() { cells.forEach((c, i) => setTimeout(() => { c.classList.add('pulse'); setTimeout(() => c.classList.remove('pulse'), 340); }, i * 70)); },
  };
}

/* ---------- Keyhole orb — the app's living identity ---------- */
let orbSeq = 0;
export function keyholeOrb({ size = 96 } = {}) {
  const id = 'orbg' + (++orbSeq);
  const R = 44;
  const CIRC = 2 * Math.PI * R;
  const el = h('div', { class: 'orb', 'data-state': 'idle', style: { width: size + 'px', height: size + 'px' } });
  // SVG must come from markup — createElement lands in the HTML namespace and never renders.
  el.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">'
    + '<defs>'
    + `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">`
    + '<stop offset="0%" stop-color="#9a8af7"/><stop offset="55%" stop-color="#7b68ee"/><stop offset="100%" stop-color="#6a56e0"/>'
    + '</linearGradient>'
    + `<radialGradient id="${id}c" cx="0.5" cy="0.35" r="0.8">`
    + '<stop offset="0%" stop-color="rgba(233,229,255,0.95)"/><stop offset="100%" stop-color="rgba(214,207,255,0.9)"/>'
    + '</radialGradient></defs>'
    + '<circle class="orb-halo" cx="50" cy="50" r="47"/>'
    + `<circle class="orb-track" cx="50" cy="50" r="${R}"/>`
    + `<circle class="orb-ring" cx="50" cy="50" r="${R}" stroke="url(#${id})"`
    + ` style="stroke-dasharray:${CIRC}px;stroke-dashoffset:${CIRC}px"/>`
    + `<circle class="orb-core" cx="50" cy="50" r="33" fill="url(#${id}c)"/>`
    + '<path class="orb-key" d="M50 34a8.6 8.6 0 0 1 3.3 16.5L56.6 66H43.4l3.3-15.5A8.6 8.6 0 0 1 50 34z"/>'
    + '</svg>';
  const ring = el.querySelector('.orb-ring');

  function burst(n = 14) {
    for (let i = 0; i < n; i++) {
      const p = h('span', { class: 'orb-spark' });
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.5;
      const d = 34 + Math.random() * 30;
      p.style.setProperty('--dx', Math.cos(a) * d + 'px');
      p.style.setProperty('--dy', Math.sin(a) * d + 'px');
      p.style.animationDelay = Math.random() * 60 + 'ms';
      el.append(p);
      setTimeout(() => p.remove(), 900);
    }
  }
  return {
    el,
    state(name) { el.dataset.state = name; if (name === 'idle' || name === 'open') ring.style.strokeDashoffset = name === 'open' ? '0px' : CIRC + 'px'; },
    fill(filled, total = 4) {
      el.dataset.state = 'fill';
      ring.style.strokeDashoffset = (CIRC * (1 - Math.min(1, filled / total))) + 'px';
    },
    success() { el.dataset.state = 'unlocking'; burst(); setTimeout(() => { el.dataset.state = 'open'; }, 750); },
    fail() {
      el.classList.remove('orb-fail'); void el.offsetWidth;
      el.classList.add('orb-fail');
      setTimeout(() => el.classList.remove('orb-fail'), 480);
    },
    breathe() { el.dataset.state = 'idle'; ring.style.strokeDashoffset = CIRC + 'px'; },
  };
}

/* ---------- custom dropdown ---------- */
export function dropdown({ options, value, onchange, placeholder = 'Select…' }) {
  let open = false;
  const displayLabel = h('span', { style: { flex: '1' }, text: label() });
  const chevron = h('span', { html: '<svg viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' });
  const display = h('button', { type: 'button', class: 'nb-select-display' }, displayLabel, chevron);
  const menu = h('div', { class: 'nb-menu', role: 'listbox', hidden: true });

  function label() {
    const hit = options.find((o) => o.value === value);
    return hit ? hit.label : placeholder;
  }
  function renderMenu() {
    menu.replaceChildren(...options.map((o) =>
      h('button', {
        type: 'button', class: 'nb-option', role: 'option',
        'aria-selected': String(o.value === value),
        onclick: () => { set(o.value); toggle(false); },
      },
        h('span', { class: 'nb-option-check', html: '<svg viewBox="0 0 24 24" fill="none"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>' }),
        o.label)
      ));
  }
  function set(v) { value = v; displayLabel.textContent = label(); renderMenu(); onchange?.(v); }
  // Listen on the document only while the menu is open. A listener that is added
  // once and never removed keeps this whole screen (and any password field on it) alive.
  function onDocClick(e) {
    if (!wrap.isConnected || !wrap.contains(e.target)) toggle(false);
  }
  function toggle(force) {
    open = force ?? !open;
    if (open) {
      renderMenu(); menu.hidden = false; wrap.classList.add('open');
      document.addEventListener('click', onDocClick);
    } else {
      menu.hidden = true; wrap.classList.remove('open');
      document.removeEventListener('click', onDocClick);
    }
  }
  display.addEventListener('click', () => toggle());
  const wrap = h('div', { class: 'nb-select' }, display, menu);
  renderMenu();
  return { el: wrap, get value() { return value; }, set };
}

/* ---------- switch row ---------- */
export function switchRow(labelText, checked, onchange) {
  const input = h('input', { type: 'checkbox' });
  input.checked = !!checked;
  input.addEventListener('change', () => { buzz(8); onchange(input.checked); });
  return h('div', { class: 'nb-row', style: { padding: '13px 0', borderBottom: '1px solid var(--hairline)' } },
    h('div', { class: 'nb-spacer nb-col', style: { gap: '2px' } }, h('span', { text: labelText })),
    h('label', { class: 'nb-switch' }, input, h('span', { class: 'nb-switch-track' })));
}

/* ---------- segmented control ---------- */
export function segmented(options, value, onchange) {
  const buttons = options.map((o) =>
    h('button', {
      type: 'button', class: 'nb-seg-btn', text: o.label,
      'aria-selected': String(o.value === value),
      onclick: () => { buzz(6); set(o.value); },
    }));
  const wrap = h('div', { class: 'nb-seg', role: 'tablist' }, ...buttons);
  function set(v) {
    value = v;
    buttons.forEach((b, i) => b.setAttribute('aria-selected', String(options[i].value === v)));
    onchange?.(v);
  }
  return { el: wrap, get value() { return value; }, set };
}

/* ---------- strength meter ---------- */
export function strengthMeter() {
  const el = h('div', { class: 'nb-strength', 'data-level': '0' },
    h('span'), h('span'), h('span'), h('span'));
  return { el, update: (pw) => el.setAttribute('data-level', String(analyzeLevel(pw))) };
}
import { analyzePassword } from '../core/password-generator.js';
function analyzeLevel(pw) {
  try { return analyzePassword(pw).level; } catch { return 0; }
}
