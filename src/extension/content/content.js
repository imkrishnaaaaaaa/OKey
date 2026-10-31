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

import { findFillTargets } from './fill-targets.js';
import { isOtpFieldLike, isNewPasswordField } from './field-kinds.js';
import { createFillGuard } from './fill-guard.js';
import { latestOnly } from '../../ui/latest.js';
import { generatePassword } from '../../core/password-generator.js';
import { isValidTotpSecret } from '../../core/totp.js';
import { MSG } from '../lib/messages.js';

const BADGE = 'okey-badge';
const PANEL = 'okey-panel';
const tracked = new WeakMap(); // el → reposition fn
const repositionRegistry = new Set(); // all active reposition fns for global reposition
let panelEl = null;
let settings = { autoSubmitEnabled: false, autoFillSingleMatch: false };
let activeSessionCred = null;
const guard = createFillGuard(); // fill each box once, submit once per session
let activeSessionTime = 0;
let singleMatchAttempted = false;

/** A field is only "visible" if laid out, opaque, and not 1px-hidden. */
function isVisiblyFillable(el) {
  if (!el.offsetParent && getComputedStyle(el).position !== 'fixed') return false;
  const r = el.getBoundingClientRect();
  if (r.width < 20 || r.height < 8) return false;
  const style = getComputedStyle(el);
  if (Number(style.opacity) === 0 || style.visibility === 'hidden' || style.display === 'none') return false;
  return true;
}

async function triggerSingleMatchAutofill() {
  if (singleMatchAttempted || activeSessionCred) return;

  const inputs = [...document.querySelectorAll('input')];
  const anchorEl = inputs.find(el => (isUsernameField(el) || isPasswordField(el)) && isVisiblyFillable(el) && !el.value);
  if (!anchorEl) return;

  singleMatchAttempted = true;

  const res = await chrome.runtime.sendMessage({ type: MSG.GET_SITE_CREDENTIALS }).catch(() => null);
  if (res && !res.locked && res.matches && res.matches.length === 1) {
    // Never silently fill an invisible field (revamp H8).
    if (isVisiblyFillable(anchorEl)) {
      fillAndRememberCredential(anchorEl, res.matches[0], false);
    }
  }
}

const SVG_KEY =
  '<svg viewBox="0 0 24 24" fill="none" width="13" height="13">' +
  '<path d="M8.3 10.6V7.2a3.7 3.7 0 0 1 7.4 0v3.4" stroke="#6d5efc" stroke-width="1.9" stroke-linecap="round"/>' +
  '<circle cx="12" cy="15.4" r="5.6" stroke="#6d5efc" stroke-width="2"/>' +
  '<circle cx="12" cy="14.4" r="1.2" fill="#6d5efc"/>' +
  '</svg>';

function isPasswordField(el) {
  return el.tagName === 'INPUT' && el.type === 'password';
}
function isUsernameField(el) {
  if (el.tagName !== 'INPUT') return false;
  if (!['text', 'email', 'tel', ''].includes(el.type)) return false;
  const aria = el.getAttribute('aria-label') || '';
  const jsname = el.getAttribute('jsname') || '';
  const hay = `${el.name} ${el.id} ${el.autocomplete} ${el.placeholder} ${aria} ${jsname}`.toLowerCase();
  return /user|email|login|account|phone|mobile|identifier/.test(hay) || el.autocomplete === 'username';
}
function isTotpField(el) { return isOtpFieldLike(el); }

function isButtonLike(el) {
  if (el.tagName !== 'INPUT') return false;
  if (el.type === 'password') return false;
  if (['submit', 'button', 'image', 'reset'].includes(el.type)) return true;
  const val = (el.value || '').trim().toLowerCase();
  if (!val) return false;
  const buttonKeywords = ['login', 'log in', 'signin', 'sign in', 'submit', 'continue', 'next', 'proceed', 'go', 'ok', 'verify', 'confirm'];
  return buttonKeywords.includes(val) || /log\s*in|sign\s*in|submit|continue|next|proceed|verify|confirm/i.test(val);
}

function findSubmitButton(anchorEl) {
  const selectors = [
    'button[jsname="LgbsSe"]', 'button.VfPpkd-LgbsSe',
    'button[type="submit"]', 'input[type="submit"]',
    'button[id*="login" i]', 'button[id*="signin" i]', 'button[id*="submit" i]', 'button[id*="next" i]', 'button[id*="continue" i]',
    'input[type="button"][value*="Login" i]', 'input[type="button"][value*="Sign" i]', 'input[type="button"][value*="Next" i]', 'input[type="button"][value*="Continue" i]',
    'button.btn-primary', 'button.button-primary', 'button.submit', 'button.login'
  ];
  const keywords = [/log\s*in/i, /sign\s*in/i, /next/i, /continue/i, /submit/i, /confirm/i, /verify/i];

  // 1. Search up the DOM tree (up to 5 levels) to check the closest containers
  let parent = anchorEl.parentElement;
  for (let i = 0; i < 5 && parent; i++) {
    // Check standard submit or matching selectors in the parent container
    for (const sel of selectors) {
      const btn = parent.querySelector(sel);
      if (btn) return btn;
    }
    // Check all buttons inside the parent for matching text
    const buttons = parent.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
    for (const btn of buttons) {
      const text = btn.tagName === 'INPUT' ? btn.value : btn.textContent;
      if (keywords.some(regex => regex.test(text))) {
        return btn;
      }
    }
    parent = parent.parentElement;
  }

  // 2. Fallback to anchorEl.form if exists
  const form = anchorEl.form;
  if (form) {
    for (const sel of selectors) {
      const btn = form.querySelector(sel);
      if (btn) return btn;
    }
    const buttons = form.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
    for (const btn of buttons) {
      const text = btn.tagName === 'INPUT' ? btn.value : btn.textContent;
      if (keywords.some(regex => regex.test(text))) {
        return btn;
      }
    }
  }

  // No page-wide search: a button far from this form is not this form's button.
  return null;
}

function submitForm(anchorEl) {
  const btn = findSubmitButton(anchorEl);
  if (btn) {
    // A disabled button is the site saying "not yet". Never force it open.
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') return;
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    btn.click();
    return;
  }

  // Fallback 1: Dispatch Enter keyboard events on the password field or anchorEl
  const pwField = isPasswordField(anchorEl) ? anchorEl : anchorEl.form?.querySelector('input[type=password]');
  const targetInput = pwField || anchorEl;
  if (targetInput) {
    const opts = { bubbles: true, cancelable: true, key: 'Enter', code: 'Enter', keyCode: 13, which: 13 };
    targetInput.dispatchEvent(new KeyboardEvent('keydown', opts));
    targetInput.dispatchEvent(new KeyboardEvent('keypress', opts));
    targetInput.dispatchEvent(new KeyboardEvent('keyup', opts));
  }

  // Fallback 2: Submit HTML form
  if (anchorEl.form) {
    anchorEl.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    try { anchorEl.form.submit(); } catch (e) { console.warn("OKey form.submit() failed:", e); }
  }
}

/** Auto-submit at most once per fill session, and remember it for later pages of the session. */
function submitOnce(el) {
  if (!settings.autoSubmitEnabled || !guard.canSubmit()) return;
  guard.markSubmitted();
  if (activeSessionCred) {
    chrome.runtime.sendMessage({ type: MSG.SET_ACTIVE_FILLING_SESSION, cred: activeSessionCred, submitted: true }).catch(() => {});
  }
  setTimeout(() => submitForm(el), 150);
}

function repositionAll() {
  repositionRegistry.forEach((fn) => { try { fn(); } catch (e) {} });
}

function attach(el) {
  if (tracked.has(el) || el.dataset.okeyIgnore) return;
  if (isButtonLike(el)) return;

  // NEVER badge one-time-code inputs — filling happens as part of the
  // credential fill, and a lock icon on an OTP box is pure noise (owner ask).
  if (isTotpField(el)) { el.dataset.okeyIgnore = '1'; return; }

  // Usernames only matter inside forms that also hold a password —
  // this excludes search bars, newsletter boxes, comment fields.
  if (!isPasswordField(el) && !hasPasswordSibling(el)) return;

  tracked.set(el, null); // placeholder; updated below

  // Prevent browser's native password/autofill manager popup from overlapping.
  // Keep what the page said (field-kinds reads it back), and never touch a box
  // that asks for passkeys: overwriting "username webauthn" hides passkey suggestions.
  const pageAutocomplete = el.getAttribute('autocomplete') || '';
  el.dataset.okeyAutocomplete = pageAutocomplete;
  if (!/webauthn/i.test(pageAutocomplete)) {
    el.setAttribute('autocomplete', isPasswordField(el) ? 'new-password' : 'off');
  }

  const badge = document.createElement('div');
  badge.className = BADGE;
  badge.innerHTML = SVG_KEY;
  badge.title = 'OKey';

  if (document.body) {
    document.body.appendChild(badge);
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      try { document.body.appendChild(badge); reposition(); } catch (e) {}
    });
  }

  const reposition = () => {
    const r = el.getBoundingClientRect();
    if (r.width < 40 || r.height < 12 || el.offsetParent === null) { badge.style.display = 'none'; return; }
    const size = r.height < 30 ? 18 : 22; // scale to input — sized for circle badge
    badge.style.width = badge.style.height = `${size}px`;
    badge.style.left = `${window.scrollX + r.right - size - 6}px`;
    badge.style.top = `${window.scrollY + r.top + (r.height - size) / 2}px`;
    // Generate-on-empty only for password fields (feedback #19)
    badge.dataset.mode = isPasswordField(el) && !el.value ? 'generate' : 'fill';
    
    const shouldShow = document.activeElement === el || el.value === '' || isUsernameField(el) || isTotpField(el);
    badge.style.display = shouldShow ? 'flex' : 'none';

    // Visibility discipline: quiet until the field earns attention.
    const focused = document.activeElement === el || el.contains(document.activeElement);
    const hovered = el.matches(':hover') || badge.matches(':hover');
    const peekGenerate = isPasswordField(el) && !el.value && formInteracted(el);
    badge.classList.toggle('okey-badge-live', focused || hovered || peekGenerate);

    // Single-match autofill still respects visibility rules upstream.
    if (settings.autoFillSingleMatch && !singleMatchAttempted && !activeSessionCred) {
      triggerSingleMatchAutofill();
    }
  };

  // Register in global registry so repositionAll() can reach this badge
  tracked.set(el, reposition);
  repositionRegistry.add(reposition);

  const show = () => { reposition(); };
  const hideSoon = () => setTimeout(() => reposition(), 150);

  el.addEventListener('focus', show);
  el.addEventListener('blur', hideSoon);
  el.addEventListener('input', reposition); // hide generate when typed (feedback #19)
  window.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);

  // ResizeObserver for reliable dynamic layout rendering in SPAs
  const ro = new ResizeObserver(() => { reposition(); });
  ro.observe(el);

  // When the input leaves the page (single-page apps do this constantly), drop
  // everything we attached for it, or listeners and observers pile up.
  const removalObserver = new MutationObserver(() => {
    if (!document.contains(el)) {
      repositionRegistry.delete(reposition);
      el.removeEventListener('focus', show);
      el.removeEventListener('blur', hideSoon);
      el.removeEventListener('input', reposition);
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
      ro.disconnect();
      removalObserver.disconnect();
      badge.remove();
      tracked.delete(el); // so the same input can be attached again if the page re-inserts it
    }
  });
  removalObserver.observe(document, { childList: true, subtree: true });

  badge.addEventListener('mousedown', (e) => e.preventDefault());
  badge.classList.add('okey-badge');
  badge.addEventListener('click', async (e) => {
    e.stopPropagation();
    // Only a real click. The page can call badge.click() itself, and that must not open the picker.
    if (!e.isTrusted) return;
    openPanel(el, badge);
  });

  reposition();
  badge.style.display = 'none';

  // Auto-fill dynamic multi-step fields if active session exists
  if (activeSessionCred && (Date.now() - activeSessionTime < 60000) && isVisiblyFillable(el)) {
    if (isPasswordField(el) && !el.value && !isNewPasswordField(el) && guard.canFill(el)) {
      guard.markFilled(el);
      setValue(el, activeSessionCred.password);
      submitOnce(el);
    }
  }
}

function fillGenerated(passwordEl) {
  const pw = generatePassword({ length: 20 });
  setValue(passwordEl, pw);
  // mirror into a confirm-password field if present
  const confirm = [...passwordEl.form?.querySelectorAll('input[type=password]') || []].find((x) => x !== passwordEl);
  if (confirm) setValue(confirm, pw);
  toast('Strong password filled & copied');
  navigator.clipboard?.writeText(pw).catch(() => {});
  // The worker clears it after the time the user chose (the page cannot, it may be closed by then).
  chrome.runtime.sendMessage({ type: MSG.COPY_TO_CLIPBOARD }).catch(() => {});
}

const openPanel = latestOnly(async (isCurrent, anchorEl, badge) => {
  closePanel();
  const res = await chrome.runtime.sendMessage({ type: MSG.GET_SITE_CREDENTIALS }).catch(() => null);
  // A second click on the badge while this one waited: the newer call builds the panel.
  if (!isCurrent()) return;

  if (res && res.settings) {
    settings = { ...settings, ...res.settings };
  }

  panelEl = document.createElement('div');
  panelEl.className = PANEL;

  const resolvedTheme = settings.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.theme;
  panelEl.setAttribute('data-theme', resolvedTheme || 'dark');

  if (res?.insecure) {
    panelEl.appendChild(header('OKey does not fill on pages that are not https'));
    positionAndShow(badge);
    return;
  }

  if (!res || res.locked) {
    panelEl.appendChild(header('OKey is locked'));

    // Master PIN entry happens in an extension-owned cross-origin iframe:
    // page scripts cannot read or overlay it (revamp H4).
    const container = document.createElement('div');
    container.className = 'okey-panel-lock-container';
    const frame = document.createElement('iframe');
    frame.className = 'okey-unlock-frame';
    frame.src = chrome.runtime.getURL('unlock/unlock.html');
    frame.setAttribute('title', 'OKey unlock');
    frame.style.cssText = 'width:100%;height:150px;border:0;background:transparent;display:block;';
    container.appendChild(frame);
    panelEl.appendChild(container);

    frame.addEventListener('load', () => {
      try { frame.contentWindow.focus(); } catch (e) {}
    });
    const onUnlockMsg = (ev) => {
      if (ev.source !== frame.contentWindow) return;
      if (ev.data?.type === 'okey-unlock-success') {
        window.removeEventListener('message', onUnlockMsg);
        closePanel();
        openPanel(anchorEl, badge);
      }
    };
    window.addEventListener('message', onUnlockMsg);
    positionAndShow(badge);
    return;
  }

  // ---- Unlocked: credential picker ----
  // 1. Search bar container
  const searchContainer = document.createElement('div');
    searchContainer.className = 'okey-panel-search-container';
    searchContainer.style.cssText = 'padding: 6px 10px; border-bottom: 1px solid var(--okey-border, #444); display: flex;';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search logins...';
    searchInput.className = 'okey-panel-search-input';
    searchInput.style.cssText = 'width: 100%; padding: 6px 8px; font-size: 12px; border-radius: 6px; border: 1px solid var(--okey-border, #444); background: var(--okey-bg-elev-2, #222); color: var(--okey-text, #fff); box-sizing: border-box; outline: none; font-family: inherit; transition: border-color 0.15s ease;';

    searchInput.addEventListener('focus', () => {
      searchInput.style.borderColor = 'var(--okey-brand, #00e676)';
    });
    searchInput.addEventListener('blur', () => {
      searchInput.style.borderColor = 'var(--okey-border, #444)';
    });

    searchContainer.appendChild(searchInput);
    panelEl.appendChild(searchContainer);

    // 2. List container
    const listContainer = document.createElement('div');
    listContainer.className = 'okey-panel-list';
    listContainer.style.cssText = 'max-height: 180px; overflow-y: auto;';
    panelEl.appendChild(listContainer);

    const renderList = (query = '') => {
      listContainer.innerHTML = '';
      const q = query.toLowerCase().trim();

      const matchedFiltered = res.matches.filter(c => {
        const name = (c.siteName || '').toLowerCase();
        const dom = (c.domain || '').toLowerCase();
        const user = (c.username || '').toLowerCase();
        return name.includes(q) || dom.includes(q) || user.includes(q);
      });

      const othersFiltered = res.others.filter(c => {
        const name = (c.siteName || '').toLowerCase();
        const dom = (c.domain || '').toLowerCase();
        const user = (c.username || '').toLowerCase();
        return name.includes(q) || dom.includes(q) || user.includes(q);
      });

      if (matchedFiltered.length) {
        listContainer.appendChild(header(`For ${location.hostname.replace(/^www\./, '')}`));
        matchedFiltered.forEach((c) => listContainer.appendChild(credRow(c, anchorEl, false)));
      } else if (!q) {
        listContainer.appendChild(header('No saved logins for this site'));
      }

      if (othersFiltered.length) {
        listContainer.appendChild(header('Other logins'));
        const displayOthers = q ? othersFiltered : othersFiltered.slice(0, 3);
        displayOthers.forEach((c) => listContainer.appendChild(credRow(c, anchorEl, true)));
      }
    };

    renderList('');
    searchInput.addEventListener('input', () => renderList(searchInput.value));

    // 3. Divider and Add Login option
    const div = document.createElement('div');
    div.className = 'okey-panel-divider';
    panelEl.appendChild(div);

    panelEl.appendChild(row('+ Add new login', 'Save credential for this site', () => {
      closePanel();
      openAddModal(anchorEl);
    }));

    if (isPasswordField(anchorEl)) {
      panelEl.appendChild(row('⚡ Generate strong password', 'Create and copy a secure password', () => {
        closePanel();
        fillGenerated(anchorEl);
      }));
    }

    setTimeout(() => searchInput.focus(), 50);

  positionAndShow(badge);
});

function onDocClick(e) { if (panelEl && !panelEl.contains(e.target)) closePanel(); }
// Clean up panel
function closePanel() {
  panelEl?.remove();
  panelEl = null;
  document.removeEventListener('click', onDocClick);
}

/** Anchor the panel under the badge and mount it. */
function positionAndShow(badge) {
  if (!panelEl) return;
  const r = badge.getBoundingClientRect();
  panelEl.style.left = `${Math.max(8, window.scrollX + r.right - 280)}px`;
  panelEl.style.top = `${window.scrollY + r.bottom + 6}px`;
  document.body.appendChild(panelEl);
  // Stays until closePanel. A one-time listener was used up by the first click
  // INSIDE the panel, after which a click outside no longer closed it.
  setTimeout(() => { if (panelEl) document.addEventListener('click', onDocClick); }, 0);
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function closeAddModal() {
  const overlay = document.querySelector('.okey-overlay');
  if (overlay) overlay.remove();
}

function openAddModal(anchorEl) {
  closeAddModal();

  const overlay = document.createElement('div');
  overlay.className = 'okey-overlay';

  const modal = document.createElement('div');
  modal.className = 'okey-modal';

  const resolvedTheme = settings.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.theme;
  modal.setAttribute('data-theme', resolvedTheme || 'dark');

  const titleVal = document.title.split('|')[0].split('-')[0].trim() || location.hostname;
  const domainVal = location.hostname.replace(/^www\./, '');
  const usernameVal = '';
  const passwordVal = '';

  modal.innerHTML = `
    <h3 class="okey-modal-title">Add Login to OKey</h3>
    
    <div class="okey-modal-field">
      <label class="okey-modal-label">Site Name</label>
      <input type="text" class="okey-modal-input" id="okey-add-sitename" value="${escapeHtml(titleVal)}" placeholder="e.g. Google">
    </div>
    
    <div class="okey-modal-field">
      <label class="okey-modal-label">Domain</label>
      <input type="text" class="okey-modal-input" id="okey-add-domain" value="${escapeHtml(domainVal)}" placeholder="e.g. google.com">
    </div>
    
    <div class="okey-modal-field">
      <label class="okey-modal-label">Username / Email</label>
      <input type="text" class="okey-modal-input" id="okey-add-username" value="${escapeHtml(usernameVal)}" placeholder="Enter username or email" autocomplete="new-password">
    </div>
    
    <div class="okey-modal-field">
      <label class="okey-modal-label">Password</label>
      <div class="okey-modal-input-group">
        <input type="text" class="okey-modal-input" id="okey-add-password" value="${escapeHtml(passwordVal)}" placeholder="Password" autocomplete="new-password">
        <button type="button" class="okey-modal-affix-btn" id="okey-add-gen">Generate</button>
      </div>
    </div>

    <div class="okey-modal-field">
      <label class="okey-modal-label">TOTP Secret <span style="font-weight:normal;opacity:0.6;">(optional)</span></label>
      <input type="text" class="okey-modal-input" id="okey-add-totp" placeholder="Base32 secret">
    </div>
    
    <div class="okey-modal-buttons">
      <button type="button" class="okey-modal-btn okey-modal-btn-secondary" id="okey-add-cancel">Cancel</button>
      <button type="button" class="okey-modal-btn okey-modal-btn-primary" id="okey-add-save">Save & Autofill</button>
    </div>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeAddModal();
    }
  });

  modal.querySelector('#okey-add-gen').addEventListener('click', (e) => {
    if (!e.isTrusted) return;
    const pwInput = modal.querySelector('#okey-add-password');
    pwInput.value = generatePassword(settings.passwordGeneratorDefaults || { length: 20 });
  });

  modal.querySelector('#okey-add-cancel').addEventListener('click', () => {
    closeAddModal();
  });

  modal.querySelector('#okey-add-save').addEventListener('click', async (e) => {
    // A page script must not be able to fill this form and press Save to plant a login.
    if (!e.isTrusted) return;
    const siteName = modal.querySelector('#okey-add-sitename').value.trim();
    const domain = modal.querySelector('#okey-add-domain').value.trim();
    const username = modal.querySelector('#okey-add-username').value.trim();
    const password = modal.querySelector('#okey-add-password').value;
    const totpSecret = modal.querySelector('#okey-add-totp').value.replace(/\s+/g, '');

    if (!siteName && !domain) {
      alert('Please provide a Site Name or Domain.');
      return;
    }

    if (totpSecret && !isValidTotpSecret(totpSecret)) {
      alert('Invalid TOTP secret (must be base32).');
      return;
    }

    const data = {
      siteName,
      domain: domain.toLowerCase(),
      username,
      password,
      totpSecret,
      entryType: 'password'
    };

    const res = await chrome.runtime.sendMessage({ type: MSG.ADD_CREDENTIAL, data }).catch(() => null);

    if (res && res.success && res.entry) {
      closeAddModal();
      // The user just made this login by hand, so it is allowed even if its domain differs.
      fillAndRememberCredential(anchorEl, res.entry, true);
      toast('Saved & filled by OKey');
    } else {
      alert(res?.error || 'Failed to save credential. Please ensure OKey is unlocked.');
    }
  });
}

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
  // Rows fill, save or generate, so only a real click may trigger them.
  if (onclick) d.addEventListener('click', (e) => { if (e.isTrusted) onclick(e); });
  return d;
}
/**
 * The list the page gets has names only. The secret for ONE login is asked for
 * here, after a click. `picked` is true only for a login the user chose from the
 * "other logins" list, which the service worker otherwise refuses on this site.
 */
async function fetchSecret(id, picked) {
  const res = await chrome.runtime.sendMessage({ type: MSG.GET_CREDENTIAL_SECRET, id, picked }).catch(() => null);
  return res?.success ? res.cred : null;
}

async function fillAndRememberCredential(anchorEl, summary, picked) {
  const cred = await fetchSecret(summary.id, picked);
  if (!cred) { toast('Could not fill. OKey may be locked.'); return; }
  guard.reset(); // the user picked a login: a new session
  activeSessionCred = cred;
  activeSessionTime = Date.now();
  chrome.runtime.sendMessage({ type: MSG.SET_ACTIVE_FILLING_SESSION, cred }).catch(() => {});
  fillCredential(anchorEl, cred);
  startAutofillPolling();
  submitOnce(anchorEl);
}
function credRow(cred, anchorEl, picked) {
  const d = row(cred.siteName || cred.domain, cred.username || '(no username)', () => {
    fillAndRememberCredential(anchorEl, cred, picked);
    closePanel();
  });
  return d;
}

/** Fill the username, password and code boxes that belong to the clicked box. */
function fillCredential(anchorEl, cred) {
  const scope = anchorEl.form || closestContainer(anchorEl, 4);
  const { user, password, totp } = findFillTargets(anchorEl, scope, {
    username: isUsernameField, password: isPasswordField, totp: isTotpField, fillable: isVisiblyFillable,
  });
  if (user && cred.username) { guard.markFilled(user); setValue(user, cred.username); }
  if (password && cred.password && !isNewPasswordField(password)) { guard.markFilled(password); setValue(password, cred.password); }
  if (totp && cred.totpCode) { guard.markFilled(totp); setValue(totp, cred.totpCode); }
  toast('Filled by OKey');
}

function setValue(el, value) {
  el.focus();
  try {
    const nativeSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    const protoSetter = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')?.set;
    const setter = nativeSetter || protoSetter;
    if (setter) {
      setter.call(el, value);
    } else {
      el.value = value;
    }
  } catch (e) {
    el.value = value;
  }
  
  // Dispatch InputEvent for SPA state bindings
  try {
    el.dispatchEvent(new InputEvent('input', { bubbles: true, cancelable: true, data: value, inputType: 'insertText' }));
  } catch (e) {
    // Fallback
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  
  // Simulated KeyboardEvents to trigger SPA state bindings
  const opts = { bubbles: true, cancelable: true };
  el.dispatchEvent(new KeyboardEvent('keydown', opts));
  el.dispatchEvent(new KeyboardEvent('keypress', opts));
  el.dispatchEvent(new KeyboardEvent('keyup', opts));
  
  el.blur();
}

function toast(text) {
  const t = document.createElement('div');
  t.className = 'okey-toast';
  t.textContent = text;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}

let autofillPollInterval = null;
let autofillPollStart = 0;

function startAutofillPolling() {
  if (autofillPollInterval) clearInterval(autofillPollInterval);
  autofillPollStart = Date.now();
  
  autofillPollInterval = setInterval(() => {
    if (Date.now() - autofillPollStart > 60000 || !activeSessionCred) {
      stopAutofillPolling();
      return;
    }
    
    const inputs = document.querySelectorAll('input');
    for (const el of inputs) {
      if (isButtonLike(el)) continue;

      if (isPasswordField(el) && pollFillable(el) && !el.value && !isNewPasswordField(el) && guard.canFill(el)) {
        guard.markFilled(el);
        setValue(el, activeSessionCred.password);
        toast('Autofilled by OKey');
        submitOnce(el);
      }
      else if (isTotpField(el) && pollFillable(el) && !el.value && guard.canFill(el)) {
        if (activeSessionCred.totpCode) {
          guard.markFilled(el);
          setValue(el, activeSessionCred.totpCode);
          toast('Autofilled by OKey');
          submitOnce(el);
          chrome.runtime.sendMessage({ type: MSG.CLEAR_ACTIVE_FILLING_SESSION }).catch(() => {});
          activeSessionCred = null;
          stopAutofillPolling();
        }
      }
    }
  }, 500);
}

function stopAutofillPolling() {
  if (autofillPollInterval) {
    clearInterval(autofillPollInterval);
    autofillPollInterval = null;
  }
}


/* A username field counts only when a password field lives in the same
 * form (or nearest sensible container). Prevents badge spam across pages. */
function hasPasswordSibling(el) {
  const scope = el.form || closestContainer(el, 4);
  return !!scope?.querySelector('input[type="password"]');
}
function closestContainer(el, levels) {
  let n = el.parentElement;
  for (let i = 0; i < levels && n; i++) {
    if (n.querySelector?.('input[type="password"]')) return n;
    n = n.parentElement;
  }
  return null;
}
const interactedForms = new WeakSet();
function markFormInteracted(el) {
  const f = el.form || closestContainer(el, 4) || document.body;
  interactedForms.add(f);
}
window.addEventListener('focusin', (e) => {
  if (e.target?.tagName === 'INPUT') markFormInteracted(e.target);
}, true);
function formInteracted(el) {
  return interactedForms.has(el.form || closestContainer(el, 4) || null);
}

/* polling fills must respect the same visibility bar */
function pollFillable(el) { return isVisiblyFillable(el) && !el.disabled && !el.readOnly; }

// ---- scan & observe ----
function scan(root = document) {
  if (root.tagName === 'INPUT') {
    attach(root);
  }
  root.querySelectorAll?.('input').forEach(attach);
}
const mo = new MutationObserver((muts) => {
  for (const m of muts) for (const n of m.addedNodes) if (n.nodeType === 1) scan(n);
});

function bindContentActivityTracking() {
  let lastTouch = 0;
  const touch = (e) => {
    // A page script can fire these events itself, so only real ones count.
    if (!e.isTrusted) return;
    const now = Date.now();
    if (now - lastTouch < 10000) return; // throttle to once every 10 seconds
    lastTouch = now;
    chrome.runtime.sendMessage({ type: MSG.TOUCH_SESSION }).catch(() => {});
  };
  ['pointerdown', 'keydown', 'input', 'scroll'].forEach((name) => {
    window.addEventListener(name, touch, true);
  });
}

scan();
mo.observe(document.documentElement, { childList: true, subtree: true });
bindContentActivityTracking();

/**
 * Smart reposition: two independent triggers to correct badge positions on slow pages.
 *
 * Trigger 1 — 1000ms timer: fires an intermediate reposition if the page hasn't
 *   finished loading yet (covers inputs that were detected early but layout shifted).
 *
 * Trigger 2 — window `load`: ALWAYS repositions when the page fully loads,
 *   regardless of whether the 1000ms timer already fired. This is the critical
 *   case: input detected + timer fired at 1000ms, then page finishes at 1500ms —
 *   we must reposition again at 1500ms to correct any final layout shift.
 */
(function initSmartReposition() {
  // Already fully loaded — nothing to do
  if (document.readyState === 'complete') return;

  let pageLoaded = false;

  const doReposition = () => {
    // Two rAF frames so the browser has committed the layout paint before we read rect
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        repositionAll();
      });
    });
  };

  // Trigger 2: page fully loaded → ALWAYS reposition (even if timer already fired)
  window.addEventListener('load', () => {
    pageLoaded = true;
    doReposition();
  }, { once: true });

  // Trigger 1: 1000ms fallback → only run if page hasn't finished loading yet
  setTimeout(() => {
    if (!pageLoaded) {
      doReposition();
    }
  }, 1000);
})();

chrome.runtime.sendMessage({ type: MSG.GET_SETTINGS }).then((res) => {
  if (res?.success && res.settings) {
    settings = { ...settings, ...res.settings };
    if (settings.autoFillSingleMatch) {
      triggerSingleMatchAutofill();
    }
  }
}).catch(() => {});

chrome.runtime.sendMessage({ type: MSG.GET_ACTIVE_FILLING_SESSION }).then((res) => {
  if (res?.success && res.session) {
    activeSessionCred = res.session.cred;
    activeSessionTime = res.session.timestamp;
    guard.submitted = res.session.submitted === true; // do not submit again on a later page
    startAutofillPolling();
  }
}).catch(() => {});

chrome.runtime.onMessage.addListener((m) => {
  if (m.type === MSG.UPDATE_SETTINGS && m.settings) {
    settings = { ...settings, ...m.settings };
    
    // Update theme dynamically
    const resolvedTheme = settings.theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : settings.theme;
      
    if (panelEl) {
      panelEl.setAttribute('data-theme', resolvedTheme);
    }
    const modal = document.querySelector('.okey-modal');
    if (modal) {
      modal.setAttribute('data-theme', resolvedTheme);
    }
  }
});
