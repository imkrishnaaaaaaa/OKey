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
import { generateTOTP, isValidTotpSecret } from '../../core/totp.js';
import { MSG } from '../lib/messages.js';

const BADGE = 'okey-badge';
const PANEL = 'okey-panel';
const tracked = new WeakSet();
let panelEl = null;
let settings = { autoSubmitEnabled: false, autoFillSingleMatch: false };
let activeSessionCred = null;
let activeSessionTime = 0;
let singleMatchAttempted = false;

async function triggerSingleMatchAutofill() {
  if (singleMatchAttempted || activeSessionCred) return;
  
  const inputs = [...document.querySelectorAll('input')];
  const anchorEl = inputs.find(el => (isUsernameField(el) || isPasswordField(el)) && el.offsetParent !== null && !el.value);
  if (!anchorEl) return;
  
  singleMatchAttempted = true;
  
  const res = await chrome.runtime.sendMessage({ type: MSG.GET_SITE_CREDENTIALS, url: location.href }).catch(() => null);
  if (res && !res.locked && res.matches && res.matches.length === 1) {
    const cred = res.matches[0];
    fillAndRememberCredential(anchorEl, cred);
  }
}

const SVG_KEY =
  '<svg viewBox="0 0 24 24" fill="none" width="14" height="14"><rect x="3" y="10" width="18" height="11" rx="3.5" stroke="#fff" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#fff" stroke-width="2"/></svg>';

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
function isTotpField(el) {
  if (el.tagName !== 'INPUT') return false;
  if (!['text', 'number', 'tel'].includes(el.type)) return false;
  const hay = `${el.name} ${el.id} ${el.autocomplete} ${el.placeholder} ${el.className}`.toLowerCase();
  return /totp|2fa|otp|auth|code|verification|factor|secure|pin/.test(hay) || el.autocomplete === 'one-time-code';
}

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

  // 3. Fallback to document level
  for (const sel of selectors) {
    const btn = document.querySelector(sel);
    if (btn) return btn;
  }
  const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"], [role="button"]');
  for (const btn of buttons) {
    const text = btn.tagName === 'INPUT' ? btn.value : btn.textContent;
    if (keywords.some(regex => regex.test(text))) {
      return btn;
    }
  }

  return null;
}

function submitForm(anchorEl) {
  const btn = findSubmitButton(anchorEl);
  if (btn) {
    if (btn.disabled || btn.getAttribute('aria-disabled') === 'true') {
      btn.disabled = false;
      btn.removeAttribute('disabled');
      btn.setAttribute('aria-disabled', 'false');
    }
    btn.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }));
    btn.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
    btn.click();
    return;
  }

  // Fallback 1: Dispatch Enter keyboard events on the password field or anchorEl
  const form = anchorEl.form || document;
  const pwField = isPasswordField(anchorEl) ? anchorEl : form.querySelector('input[type=password]');
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

function attach(el) {
  if (tracked.has(el) || el.dataset.okeyIgnore) return;
  if (isButtonLike(el)) return;
  if (!isPasswordField(el) && !isUsernameField(el) && !isTotpField(el)) return;
  tracked.add(el);

  // Prevent browser's native password/autofill manager popup from overlapping
  if (isPasswordField(el)) {
    el.setAttribute('autocomplete', 'new-password');
  } else {
    el.setAttribute('autocomplete', 'off');
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
    const size = r.height < 30 ? 16 : 20; // scale to input (feedback #18)
    badge.style.width = badge.style.height = `${size}px`;
    badge.style.left = `${window.scrollX + r.right - size - 6}px`;
    badge.style.top = `${window.scrollY + r.top + (r.height - size) / 2}px`;
    // Generate-on-empty only for password fields (feedback #19)
    badge.dataset.mode = isPasswordField(el) && !el.value ? 'generate' : 'fill';
    
    const shouldShow = document.activeElement === el || el.value === '' || isUsernameField(el) || isTotpField(el);
    badge.style.display = shouldShow ? 'flex' : 'none';

    // Single match autofill check
    if (settings.autoFillSingleMatch && !singleMatchAttempted && !activeSessionCred) {
      triggerSingleMatchAutofill();
    }
  };

  const show = () => { reposition(); };
  const hideSoon = () => setTimeout(() => { if (document.activeElement !== el && !badge.matches(':hover')) badge.style.display = 'none'; }, 150);

  el.addEventListener('focus', show);
  el.addEventListener('blur', hideSoon);
  el.addEventListener('input', reposition); // hide generate when typed (feedback #19)
  window.addEventListener('scroll', reposition, true);
  window.addEventListener('resize', reposition);

  // ResizeObserver for reliable dynamic layout rendering in SPAs
  const ro = new ResizeObserver(() => {
    reposition();
  });
  ro.observe(el);

  badge.addEventListener('mousedown', (e) => e.preventDefault());
  badge.addEventListener('click', async (e) => {
    e.stopPropagation();
    openPanel(el, badge);
  });

  reposition();
  badge.style.display = 'none';

  // Auto-fill dynamic multi-step fields if active session exists
  if (activeSessionCred && (Date.now() - activeSessionTime < 60000)) {
    if (isPasswordField(el) && !el.value) {
      setValue(el, activeSessionCred.password);
      if (settings.autoSubmitEnabled) {
        setTimeout(() => submitForm(el), 150);
      }
    } else if (isTotpField(el) && !el.value) {
      if (activeSessionCred.totpSecret && isValidTotpSecret(activeSessionCred.totpSecret)) {
        generateTOTP(activeSessionCred.totpSecret).then(({ code }) => {
          if (code) {
            setValue(el, code);
            if (settings.autoSubmitEnabled) {
              setTimeout(() => submitForm(el), 150);
            }
          }
        }).catch(console.error);
      }
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
}

async function openPanel(anchorEl, badge) {
  closePanel();
  const res = await chrome.runtime.sendMessage({ type: MSG.GET_SITE_CREDENTIALS, url: location.href }).catch(() => null);
  
  if (res && res.settings) {
    settings = { ...settings, ...res.settings };
  }

  panelEl = document.createElement('div');
  panelEl.className = PANEL;

  const resolvedTheme = settings.theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : settings.theme;
  panelEl.setAttribute('data-theme', resolvedTheme || 'dark');

  if (!res || res.locked) {
    panelEl.appendChild(header('OKey is locked'));

    const container = document.createElement('div');
    container.className = 'okey-panel-lock-container';
    container.style.cssText = 'padding: 12px 10px; display: flex; flex-direction: column; gap: 10px;';

    const labelEl = document.createElement('div');
    labelEl.className = 'okey-panel-sub';
    labelEl.textContent = 'Enter master PIN to unlock';
    labelEl.style.cssText = 'text-align: center; margin-bottom: 4px; font-weight: 500;';
    container.appendChild(labelEl);

    const pinInput = document.createElement('input');
    pinInput.type = 'password';
    pinInput.placeholder = 'Enter PIN';
    pinInput.inputMode = 'numeric';
    pinInput.pattern = '[0-9]*';
    pinInput.maxLength = 4;
    pinInput.style.cssText = `
      width: calc(100% - 24px);
      margin-left: 12px;
      padding: 10px 12px;
      background: var(--okey-bg-elev-2, #222);
      border: 1px solid var(--okey-brand, #00e676);
      border-radius: 8px;
      color: var(--okey-text, #fff);
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      letter-spacing: 0.5em;
      text-align: center;
    `;

    container.appendChild(pinInput);

    const errMsg = document.createElement('div');
    errMsg.style.cssText = 'font-size: 11px; color: var(--okey-danger, #f95766); display: none; text-align: center; margin-top: 4px;';
    container.appendChild(errMsg);

    panelEl.appendChild(container);

    const doUnlock = async () => {
      const pin = pinInput.value;
      if (pin.length < 4) return;
      pinInput.disabled = true;
      errMsg.style.display = 'none';

      const unlockRes = await chrome.runtime.sendMessage({ type: MSG.UNLOCK_VAULT, pin }).catch(() => null);
      if (unlockRes && unlockRes.success) {
        openPanel(anchorEl, badge);
      } else {
        pinInput.disabled = false;
        errMsg.textContent = unlockRes?.error || 'Incorrect PIN';
        errMsg.style.display = 'block';
        pinInput.value = '';
        pinInput.focus();
      }
    };

    pinInput.addEventListener('input', () => {
      pinInput.value = pinInput.value.replace(/[^0-9]/g, '').slice(0, 4);
      if (pinInput.value.length === 4) {
        doUnlock();
      }
    });

    setTimeout(() => pinInput.focus(), 50);
  } else {
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
        matchedFiltered.forEach((c) => listContainer.appendChild(credRow(c, anchorEl)));
      } else if (!q) {
        listContainer.appendChild(header('No saved logins for this site'));
      }

      if (othersFiltered.length) {
        listContainer.appendChild(header('Other logins'));
        const displayOthers = q ? othersFiltered : othersFiltered.slice(0, 3);
        displayOthers.forEach((c) => listContainer.appendChild(credRow(c, anchorEl)));
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
  }

  const r = badge.getBoundingClientRect();
  panelEl.style.left = `${Math.max(8, window.scrollX + r.right - 280)}px`;
  panelEl.style.top = `${window.scrollY + r.bottom + 6}px`;
  document.body.appendChild(panelEl);
  setTimeout(() => document.addEventListener('click', onDocClick, { once: true }), 0);
}

function onDocClick(e) { if (panelEl && !panelEl.contains(e.target)) closePanel(); }
// Clean up panel
function closePanel() { panelEl?.remove(); panelEl = null; }

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function findUsernameValue(anchorEl) {
  const form = anchorEl.form || document;
  const userField = isUsernameField(anchorEl) ? anchorEl
    : [...form.querySelectorAll('input')].find(isUsernameField);
  return userField ? userField.value : '';
}

function findPasswordValue(anchorEl) {
  const form = anchorEl.form || document;
  const pwField = isPasswordField(anchorEl) ? anchorEl
    : form.querySelector('input[type=password]');
  return pwField ? pwField.value : '';
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

  modal.querySelector('#okey-add-gen').addEventListener('click', () => {
    const pwInput = modal.querySelector('#okey-add-password');
    pwInput.value = generatePassword(settings.passwordGeneratorDefaults || { length: 20 });
  });

  modal.querySelector('#okey-add-cancel').addEventListener('click', () => {
    closeAddModal();
  });

  modal.querySelector('#okey-add-save').addEventListener('click', async () => {
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
      fillAndRememberCredential(anchorEl, res.entry);
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
  if (onclick) d.addEventListener('click', onclick);
  return d;
}
function fillAndRememberCredential(anchorEl, cred) {
  activeSessionCred = cred;
  activeSessionTime = Date.now();
  chrome.runtime.sendMessage({ type: MSG.SET_ACTIVE_FILLING_SESSION, cred }).catch(() => {});
  fillCredential(anchorEl, cred);
  startAutofillPolling();
  if (settings.autoSubmitEnabled) {
    setTimeout(() => submitForm(anchorEl), 150);
  }
}
function credRow(cred, anchorEl) {
  const d = row(cred.siteName || cred.domain, cred.username || '(no username)', () => {
    fillAndRememberCredential(anchorEl, cred);
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
  
  const totpEl = [...form.querySelectorAll('input')].find(isTotpField);
  if (totpEl && cred.totpSecret && isValidTotpSecret(cred.totpSecret)) {
    generateTOTP(cred.totpSecret).then(({ code }) => {
      if (code) setValue(totpEl, code);
    }).catch(console.error);
  }
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
      
      if (isPasswordField(el) && el.offsetParent !== null && !el.value) {
        setValue(el, activeSessionCred.password);
        toast('Autofilled by OKey');
        if (settings.autoSubmitEnabled) {
          setTimeout(() => submitForm(el), 150);
        }
      }
      else if (isTotpField(el) && el.offsetParent !== null && !el.value) {
        if (activeSessionCred.totpSecret && isValidTotpSecret(activeSessionCred.totpSecret)) {
          const savedCred = activeSessionCred;
          activeSessionCred = null;
          generateTOTP(savedCred.totpSecret).then(({ code }) => {
            activeSessionCred = savedCred;
            if (code && !el.value) {
              setValue(el, code);
              toast('Autofilled by OKey');
              chrome.runtime.sendMessage({ type: MSG.CLEAR_ACTIVE_FILLING_SESSION }).catch(() => {});
              activeSessionCred = null;
              stopAutofillPolling();
              if (settings.autoSubmitEnabled) {
                setTimeout(() => submitForm(el), 150);
              }
            }
          }).catch((err) => {
            activeSessionCred = savedCred;
            console.error(err);
          });
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

scan();
mo.observe(document.documentElement, { childList: true, subtree: true });
bindContentActivityTracking();

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
