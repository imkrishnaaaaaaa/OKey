/**
 * OKey Extension — Content script (autofill)
 *
 * Injects an unobtrusive OKey badge into username AND password fields,
 * positioned via getBoundingClientRect and scaled to the input (feedback
 * #16–19). Credentials are fetched from the service worker on demand (never
 * proactively); filling a credential fills both the username and password.
 *
 * Bundled to a classic IIFE — no runtime ES imports in the page context.
 */

import { generatePassword } from '../../core/password-generator.js';
import { MSG } from '../lib/messages.js';

const BADGE = 'okey-badge';
const PANEL = 'okey-panel';
const tracked = new WeakSet();
let panelEl = null;

const SVG_KEY =
  '<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="3" y="10" width="18" height="11" rx="3.5" stroke="#fff" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#fff" stroke-width="2"/></svg>';

function isPasswordField(el) {
  return el.tagName === 'INPUT' && el.type === 'password';
}
function isUsernameField(el) {
  if (el.tagName !== 'INPUT') return false;
  if (!['text', 'email', 'tel', ''].includes(el.type)) return false;
  const hay = `${el.name} ${el.id} ${el.autocomplete} ${el.placeholder}`.toLowerCase();
  return /user|email|login|account|phone|mobile/.test(hay) || el.autocomplete === 'username';
}

function attach(el) {
  if (tracked.has(el) || el.dataset.okeyIgnore) return;
  if (!isPasswordField(el) && !isUsernameField(el)) return;
  tracked.add(el);

  const badge = document.createElement('div');
  badge.className = BADGE;
  badge.innerHTML = SVG_KEY;
  badge.title = 'OKey';
  document.body.appendChild(badge);

  const reposition = () => {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 12 || el.offsetParent === null) { badge.style.display = 'none'; return; }
    const size = r.height < 30 ? 16 : 20; // scale to input (feedback #18)
    badge.style.width = badge.style.height = `${size}px`;
    badge.style.left = `${window.scrollX + r.right - size - 6}px`;
    badge.style.top = `${window.scrollY + r.top + (r.height - size) / 2}px`;
    // Generate-on-empty only for password fields (feedback #19)
    badge.dataset.mode = isPasswordField(el) && !el.value ? 'generate' : 'fill';
    badge.style.display = document.activeElement === el || el.value === '' || isUsernameField(el) ? 'flex' : 'flex';
  };

  const show = () => { reposition(); badge.style.display = 'flex'; };
  const hideSoon = () => setTimeout(() => { if (document.activeElement !== el && !badge.matches(':hover')) badge.style.display = 'none'; }, 150);

  el.addEventListener('focus', show);
  el.addEventListener('blur', hideSoon);
  el.addEventListener('input', reposition); // hide generate when typed (feedback #19)
  window.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);

  badge.addEventListener('mousedown', (e) => e.preventDefault());
  badge.addEventListener('click', async (e) => {
    e.stopPropagation();
    if (badge.dataset.mode === 'generate') return fillGenerated(el);
    openPanel(el, badge);
  });

  reposition();
  badge.style.display = 'none';
}

function fillGenerated(passwordEl) {
  const pw = generatePassword({ length: 20 });
  setValue(passwordEl, pw);
  // mirror into a confirm-password field if present
  const confirm = [...passwordEl.form?.querySelectorAll('input[type=password]') || []].find((x) => x !== passwordEl);
  if (confirm) setValue(confirm, pw);
  toast('Strong password filled & copied');
  navigator.clipboard?.writeText(pw).catch(() => {});
}

async function openPanel(anchorEl, badge) {
  closePanel();
  const res = await chrome.runtime.sendMessage({ type: MSG.GET_SITE_CREDENTIALS, url: location.href }).catch(() => null);
  panelEl = document.createElement('div');
  panelEl.className = PANEL;

  if (!res || res.locked) {
    panelEl.appendChild(row('🔒 OKey is locked', 'Click the toolbar icon to unlock', null));
  } else {
    if (res.matches.length) {
      panelEl.appendChild(header(`For ${location.hostname.replace(/^www\./, '')}`));
      res.matches.forEach((c) => panelEl.appendChild(credRow(c, anchorEl)));
    } else {
      panelEl.appendChild(header('No saved logins for this site'));
    }
    if (res.others.length) {
      panelEl.appendChild(header('Other logins'));
      res.others.forEach((c) => panelEl.appendChild(credRow(c, anchorEl)));
    }
  }
  const r = badge.getBoundingClientRect();
  panelEl.style.left = `${Math.max(8, window.scrollX + r.right - 280)}px`;
  panelEl.style.top = `${window.scrollY + r.bottom + 6}px`;
  document.body.appendChild(panelEl);
  setTimeout(() => document.addEventListener('click', onDocClick, { once: true }), 0);
}

function onDocClick(e) { if (panelEl && !panelEl.contains(e.target)) closePanel(); }
function closePanel() { panelEl?.remove(); panelEl = null; }

function header(text) {
  const d = document.createElement('div');
  d.className = 'okey-panel-header';
  d.textContent = text;
  return d;
}
function row(title, sub, onclick) {
  const d = document.createElement('div');
  d.className = 'okey-panel-row';
  d.innerHTML = `<div class="okey-panel-title"></div><div class="okey-panel-sub"></div>`;
  d.querySelector('.okey-panel-title').textContent = title;
  d.querySelector('.okey-panel-sub').textContent = sub || '';
  if (onclick) d.addEventListener('click', onclick);
  return d;
}
function credRow(cred, anchorEl) {
  const d = row(cred.siteName || cred.domain, cred.username || '(no username)', () => {
    fillCredential(anchorEl, cred);
    closePanel();
  });
  return d;
}

/** Fill both username and password fields related to the anchor input. */
function fillCredential(anchorEl, cred) {
  const form = anchorEl.form || document;
  const pwField = isPasswordField(anchorEl) ? anchorEl : form.querySelector('input[type=password]');
  const userField = isUsernameField(anchorEl) ? anchorEl
    : [...form.querySelectorAll('input')].find(isUsernameField);
  if (userField && cred.username) setValue(userField, cred.username);
  if (pwField && cred.password) setValue(pwField, cred.password);
  toast('Filled by OKey');
}

/** Set a value in a way frameworks (React/Vue) detect. */
function setValue(el, value) {
  const proto = Object.getPrototypeOf(el);
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
  setter ? setter.call(el, value) : (el.value = value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function toast(text) {
  const t = document.createElement('div');
  t.className = 'okey-toast';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

// ---- scan & observe ----
function scan(root = document) {
  root.querySelectorAll?.('input').forEach(attach);
}
const mo = new MutationObserver((muts) => {
  for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) scan(n);
});

function bindContentActivityTracking() {
  let lastTouch = 0;
  const touch = () => {
    const now = Date.now();
    if (now - lastTouch < 10000) return; // throttle to once every 10 seconds
    lastTouch = now;
    chrome.runtime.sendMessage({ type: MSG.TOUCH_SESSION }).catch(() => {});
  };
  ['pointerdown', 'keydown', 'input', 'scroll'].forEach((name) => {
    window.addEventListener(name, touch, true);
  });
}

if (document.body) {
  scan();
  mo.observe(document.body, { childList: true, subtree: true });
  bindContentActivityTracking();
} else {
  document.addEventListener('DOMContentLoaded', () => {
    scan();
    mo.observe(document.body, { childList: true, subtree: true });
    bindContentActivityTracking();
  });
}
