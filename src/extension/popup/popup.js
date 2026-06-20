/**
 * OKey Extension — Popup controller
 *
 * The popup runs in a privileged extension context and owns the live Vault
 * (CryptoKeys cannot be transferred between contexts). It talks to the service
 * worker only for cross-context concerns: settings, clipboard auto-clear,
 * current-tab info, and background sync scheduling.
 *
 * Implements the full feature set incl. the 25 UX feedback items.
 */

import { Vault } from '../../core/vault.js';
import { SyncEngine } from '../../core/sync.js';
import {
  generatePassword, generatePassphrase, analyzePassword, passphraseEntropyBits, strengthFromEntropy,
} from '../../core/password-generator.js';
import { generateTOTP, isValidTotpSecret } from '../../core/totp.js';
import { matchDomain, extractDomain, normalizeDomain, getDisplayDomain } from '../../core/domain-matcher.js';
import { formatTimeAgo } from '../../core/util.js';
import { DEFAULT_SETTINGS, STORAGE_KEYS, ENTRY_TYPES, FAVICON, SECURITY } from '../../core/constants.js';
import * as IE from '../../core/import-export.js';
import { ChromeStorageAdapter, chromeNetwork } from '../lib/platform.js';
import { MSG } from '../lib/messages.js';
import {
  cacheDek, getCachedDek, touchSession, clearSession, saveViewState, getViewState, setPopupOpen,
} from '../lib/session.js';

const local = new ChromeStorageAdapter('local');
const vault = new Vault(local);
const sync = new SyncEngine(local, chromeNetwork);

const app = document.getElementById('app');
let settings = { ...DEFAULT_SETTINGS };
let currentSite = { url: '', title: '', domain: '' };
let view = { name: 'loading', tab: 'all', entryId: null };
let totpTimer = null;
let selectMode = false;
const selected = new Set();
let lastActivityTouch = 0;
let syncStatus = 'idle'; // 'idle' | 'syncing' | 'ok' | 'err'

function updateSyncUI(status) {
  syncStatus = status;
  const dot = document.querySelector('.okey-sync-dot');
  if (dot) {
    dot.className = 'okey-sync-dot ' + (status === 'idle' ? '' : status);
  }
}

// ---------- tiny DOM helper ----------
function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v; // only for trusted static SVG markup
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'attrs') for (const [a, av] of Object.entries(v)) e.setAttribute(a, av);
    else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid == null || kid === false) continue;
    e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return e;
}
const clear = (node) => { node.replaceChildren(); };
const ICONS = {
  logo: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="18" height="11" rx="4" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="15.5" r="1.6" fill="currentColor"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m20 20-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plus: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" stroke="currentColor" stroke-width="1.5"/></svg>',
  copy: '<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8" stroke="currentColor" stroke-width="2"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>',
  key: '<svg viewBox="0 0 24 24" fill="none"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3M15.5 7.5L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
  trash: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13h10l1-13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  refresh: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 3v4h-4M6 21v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
};

// ---------- toast ----------
function toast(message, type = 'info') {
  let c = document.querySelector('.vs-toast-container');
  if (!c) { c = h('div', { class: 'vs-toast-container' }); document.body.append(c); }
  const t = h('div', { class: `vs-toast vs-toast-${type}` }, message);
  c.append(t);
  setTimeout(() => { t.classList.add('vs-toast-exit'); t.addEventListener('animationend', () => t.remove()); }, 2600);
}

// ---------- clipboard (with auto-clear) ----------
async function copyValue(text, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    chrome.runtime.sendMessage({ type: MSG.COPY_TO_CLIPBOARD }).catch(() => {});
    toast(`${label} · clears in ${settings.clipboardClearTimeout}s`, 'success');
  } catch {
    toast('Copy failed', 'error');
  }
}

// ---------- favicon (fetch once, cache, refresh weekly — feedback #21) ----------
async function faviconFor(domain) {
  if (!settings.faviconsEnabled || !domain) return null;
  const key = STORAGE_KEYS.FAVICON_CACHE;
  const cache = (await local.get(key))[key] || {};
  const hit = cache[domain];
  if (hit && hit.dataUrl && Date.now() - hit.fetchedAt < FAVICON.REFRESH_AFTER_MS) return hit.dataUrl;
  try {
    const res = await fetch(`${FAVICON.PROVIDER}?domain=${encodeURIComponent(domain)}&sz=${FAVICON.SIZE}`);
    if (!res.ok) throw new Error('favicon http');
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.onerror = reject;
      r.readAsDataURL(blob);
    });
    cache[domain] = { dataUrl, fetchedAt: Date.now() };
    await local.set({ [key]: cache });
    return dataUrl;
  } catch {
    return hit?.dataUrl || null;
  }
}

// ---------- smart initial letter (feedback #22) ----------
function initialLetter(entry) {
  const src = entry.nickname || entry.siteName || '';
  if (src) return src.trim()[0].toUpperCase();
  const d = (entry.domain || '').replace(/^www\./, '');
  if (d) return d[0].toUpperCase();
  return '?';
}

function avatarEl(entry) {
  const av = h('div', { class: 'vs-avatar' }, initialLetter(entry));
  if (settings.faviconsEnabled && entry.domain) {
    faviconFor(entry.domain).then((url) => {
      if (url) { clear(av); av.append(h('img', { src: url, alt: '', attrs: { loading: 'lazy' } })); }
    });
  }
  return av;
}

async function rememberView(patch = {}) {
  await saveViewState({ name: view.name, tab: view.tab, entryId: view.entryId || null, ...patch });
}

async function restoreSavedView(saved) {
  if (saved?.tab) view.tab = saved.tab;
  switch (saved?.name) {
    case 'detail':
      return saved.entryId ? renderDetail(saved.entryId) : renderMain();
    case 'edit':
      return renderEdit(saved.entryId || null, saved.draft || null, saved.scrollTop || 0);
    case 'settings':
      return renderSettings(saved.scrollTop || 0);
    case 'generator':
      return renderGenerator(saved.generator || null);
    case 'main':
    default:
      return renderMain();
  }
}

function bindActivityTracking() {
  const markActive = () => {
    if (!vault.isUnlocked()) return;
    const now = Date.now();
    if (now - lastActivityTouch < 5000) return;
    lastActivityTouch = now;
    touchSession(settings.autoLockTimeout).catch(() => {});
  };
  ['pointerdown', 'keydown', 'input', 'scroll'].forEach((eventName) => {
    window.addEventListener(eventName, markActive, true);
  });
}

// ============================ BOOT ============================
async function boot() {
  await setPopupOpen(true);
  window.addEventListener('pagehide', () => setPopupOpen(false));
  // Heartbeat so SW can tell the popup is open (prevents background-sync races).
  setInterval(() => setPopupOpen(true), 15000);
  bindActivityTracking();

  settings = (await chrome.runtime.sendMessage({ type: MSG.GET_SETTINGS }).catch(() => null))?.settings || { ...DEFAULT_SETTINGS };
  applyTheme(settings.theme);
  currentSite = (await chrome.runtime.sendMessage({ type: MSG.GET_CURRENT_SITE }).catch(() => ({}))) || {};

  chrome.runtime.onMessage.addListener((m) => {
    if (m.type === MSG.VAULT_LOCKED) { vault.lock(); renderLocked({ overlay: true }); }
  });

  const state = await vault.getState();
  if (!state.isSetup) return renderSetup();

  const dek = await getCachedDek(settings.autoLockTimeout);
  if (dek) {
    try {
      await vault.unlockWithDek(dek);
      dek.fill(0);
      const saved = await getViewState();
      if (saved?.tab) view.tab = saved.tab;
      return restoreSavedView(saved); // feedback #1, #15 (no "unlocked" toast), #25
    } catch { /* fall through to locked */ }
  }
  renderLocked();
}

function applyTheme(theme) {
  const resolved = theme === 'system'
    ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : theme;
  document.documentElement.setAttribute('data-theme', resolved);
}

// ============================ SETUP ============================
function renderSetup() {
  view.name = 'setup';
  clear(app);
  app.append(h('div', { class: 'okey-view okey-setup-choice' },
    brandHeader(),
    h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Create new vault', onclick: renderCreateVaultSetup }),
    h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', text: 'Restore existing vault', onclick: renderRestoreVaultSetup }),
    h('p', { class: 'vs-faint', text: 'Restore is for encrypted OKey backups from another device. CSV imports can be added later from Settings.' }),
  ));
}

function renderCreateVaultSetup() {
  view.name = 'setup-create';
  clear(app);
  const pw = h('input', { class: 'vs-input', type: 'password', placeholder: 'Create master password', autofocus: true });
  const pw2 = h('input', { class: 'vs-input', type: 'password', placeholder: 'Confirm master password' });
  const meter = strengthMeter();
  pw.addEventListener('input', () => meter.update(pw.value));
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Create vault' });

  const wrap = h('div', { class: 'okey-view' },
    viewHeader('Create vault', renderSetup),
    h('p', { class: 'vs-muted', text: 'Your master password encrypts everything locally. We never store it and it can never be recovered — keep it safe. Minimum 10 characters.' }),
    h('div', { class: 'vs-field' }, pw, meter.el),
    h('div', { class: 'vs-field' }, pw2),
    btn,
  );
  app.append(wrap);

  btn.addEventListener('click', async () => {
    if (pw.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) return toast(`At least ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} characters`, 'error');
    if (pw.value !== pw2.value) return toast('Passwords do not match', 'error');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const { recoveryMnemonic } = await vault.setup(pw.value);
      await cacheDek(vault.exportDek(), settings.autoLockTimeout);
      renderRecoveryReveal(recoveryMnemonic, () => renderMain());
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Create vault';
      toast(e.message, 'error');
    }
  });
}

function renderRestoreVaultSetup() {
  view.name = 'setup-restore';
  clear(app);
  const file = h('input', { type: 'file', accept: '.json,application/json' });
  const master = h('input', { class: 'vs-input', type: 'password', placeholder: 'Old master password' });
  const recovery = h('textarea', { class: 'vs-textarea', rows: 3, placeholder: 'Or paste 24-word recovery key' });
  const newPw = h('input', { class: 'vs-input', type: 'password', placeholder: 'New master password after recovery' });
  const meter = strengthMeter();
  newPw.addEventListener('input', () => meter.update(newPw.value));
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Restore vault' });
  btn.addEventListener('click', async () => {
    const chosen = file.files[0];
    if (!chosen) return toast('Choose an encrypted OKey backup', 'error');
    btn.disabled = true; btn.textContent = 'Restoring...';
    try {
      const backup = IE.importOkeyBackup(await chosen.text());
      await installOkeyBackup(backup);
      if (master.value) {
        await vault.unlock(master.value);
      } else {
        if (!recovery.value.trim()) throw new Error('Enter the old master password or recovery key');
        if (newPw.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) throw new Error(`New password must be at least ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} characters`);
        await vault.recoverWithMnemonic(recovery.value);
        await vault.changeMasterPassword(newPw.value);
      }
      await cacheDek(vault.exportDek(), settings.autoLockTimeout);
      toast('Vault restored', 'success');
      renderMain();
    } catch (e) {
      await clearRestoredContainer();
      btn.disabled = false; btn.textContent = 'Restore vault';
      toast(e.code === 'DECRYPTION_FAILED' ? 'Backup could not be unlocked' : (e.message || 'Restore failed'), 'error');
    }
  });

  const settingsView = h('div', { class: 'okey-view' },
    viewHeader('Restore vault', renderSetup),
    h('div', { class: 'vs-field' }, label('Encrypted OKey backup'), file),
    h('div', { class: 'vs-field' }, label('Old master password', true), master),
    h('div', { class: 'vs-field' }, label('Recovery key', true), recovery),
    h('div', { class: 'vs-field' }, label('New master password', true), newPw, meter.el),
    btn
  );
  app.append(settingsView);
}

async function installOkeyBackup(backup) {
  if (!backup?.salt || !backup?.kdfParams || !backup?.wrappedMaster || !Array.isArray(backup.records)) {
    throw new Error('Backup is missing required encrypted vault data');
  }
  await local.set({
    [STORAGE_KEYS.VAULT_SALT]: backup.salt,
    [STORAGE_KEYS.KDF_PARAMS]: backup.kdfParams,
    [STORAGE_KEYS.WRAPPED_BY_MASTER]: backup.wrappedMaster,
    [STORAGE_KEYS.WRAPPED_BY_RECOVERY]: backup.wrappedRecovery || null,
    [STORAGE_KEYS.VAULT_DATA]: backup.records,
    [STORAGE_KEYS.VAULT_METADATA]: { formatVersion: backup.version || 2, restoredAt: new Date().toISOString() },
    [STORAGE_KEYS.SETUP_COMPLETE]: true,
  });
}

async function clearRestoredContainer() {
  vault.lock();
  await local.remove([
    STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER,
    STORAGE_KEYS.WRAPPED_BY_RECOVERY, STORAGE_KEYS.VAULT_DATA, STORAGE_KEYS.VAULT_METADATA,
    STORAGE_KEYS.SETUP_COMPLETE,
  ]);
}

function renderRecoveryReveal(mnemonic, done) {
  clear(app);
  const words = mnemonic.split(' ');
  const grid = h('div', { class: 'okey-recovery-grid' },
    words.map((w, i) => h('div', { class: 'okey-recovery-word' }, h('b', { text: String(i + 1) }), w)));
  const ack = h('input', { type: 'checkbox', class: 'okey-checkbox' });
  const cont = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', disabled: true, text: 'Continue' });
  ack.addEventListener('change', () => (cont.disabled = !ack.checked));

  app.append(h('div', { class: 'okey-view' },
    h('div', { class: 'okey-view-title', text: 'Your Recovery Key' }),
    h('div', { class: 'okey-warn', text: 'These 24 words are the ONLY way to recover your vault if you forget your master password. Write them down and store them offline. Anyone with these words can access your vault.' }),
    grid,
    h('div', { class: 'vs-row' },
      h('button', { class: 'vs-btn vs-btn-secondary', text: 'Copy', onclick: () => copyValue(mnemonic, 'Recovery key copied') }),
      h('button', { class: 'vs-btn vs-btn-secondary', text: 'Download', onclick: () => download('okey-recovery-key.txt', mnemonic) }),
    ),
    h('label', { class: 'vs-row', style: 'margin:14px 0' }, ack, h('span', { text: "I've saved my recovery key somewhere safe" })),
    cont,
  ));
  cont.addEventListener('click', done);
}

// ============================ LOCKED ============================
function renderLocked({ overlay = false } = {}) {
  clearInterval(totpTimer);
  document.getElementById('okey-lock-overlay')?.remove();
  const useOverlay = overlay && app.childElementCount > 0;
  const pw = h('input', { class: 'vs-input okey-lock-input', type: 'password', placeholder: 'Master password', autofocus: true });
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Unlock' });
  const submit = async () => {
    if (!pw.value) return;
    btn.disabled = true; btn.textContent = 'Unlocking…';
    try {
      await vault.unlock(pw.value);
      await cacheDek(vault.exportDek(), settings.autoLockTimeout);
      const overlayEl = document.getElementById('okey-lock-overlay');
      if (overlayEl) {
        overlayEl.remove();
      } else {
        await restoreSavedView(await getViewState());
      }
      maybeSyncOnUnlock();
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Unlock';
      toast(e.code === 'DECRYPTION_FAILED' ? 'Incorrect master password' : e.message, 'error');
      pw.select();
    }
  };
  pw.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit();
    }
  });
  btn.addEventListener('click', submit);

  const lockCard = h('div', { class: useOverlay ? 'okey-lock-card vs-glass' : 'okey-view okey-lock-full' },
    brandHeader(),
    h('div', { class: 'vs-field' }, pw),
    btn,
    h('button', { class: 'vs-btn vs-btn-ghost vs-btn-block', style: 'margin-top:10px', text: 'Forgot password? Use recovery key', onclick: renderRecover }),
  );
  if (useOverlay) document.body.append(h('div', { class: 'okey-lock-overlay', id: 'okey-lock-overlay' }, lockCard));
  else { clear(app); app.append(lockCard); }
  requestAnimationFrame(() => pw.focus());
}

// ============================ RECOVER ============================
function renderRecover() {
  clear(app);
  const ta = h('textarea', { class: 'vs-textarea', placeholder: 'Enter your 24-word recovery key, separated by spaces', rows: 4 });
  const np = h('input', { class: 'vs-input', type: 'password', placeholder: 'New master password' });
  const meter = strengthMeter();
  np.addEventListener('input', () => meter.update(np.value));
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Recover & set new password' });
  btn.addEventListener('click', async () => {
    if (np.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) return toast(`New password: ${SECURITY.MIN_MASTER_PASSWORD_LENGTH}+ characters`, 'error');
    btn.disabled = true; btn.textContent = 'Recovering…';
    try {
      await vault.recoverWithMnemonic(ta.value);
      await vault.changeMasterPassword(np.value);
      await cacheDek(vault.exportDek(), settings.autoLockTimeout);
      toast('Vault recovered', 'success');
      renderMain();
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Recover & set new password';
      toast(e.code === 'DECRYPTION_FAILED' ? 'Recovery key did not match this vault' : (e.message || 'Invalid recovery key'), 'error');
    }
  });
  app.append(h('div', { class: 'okey-view' },
    viewHeader('Recover vault', renderLocked),
    h('div', { class: 'vs-field' }, ta),
    h('div', { class: 'vs-field' }, np, meter.el),
    btn,
  ));
}

// ============================ MAIN ============================
function renderMain() {
  view.name = 'main';
  view.entryId = null;
  rememberView();
  clear(app);

  const search = h('input', { class: 'vs-input', type: 'search', placeholder: 'Search…' });
  const header = h('div', { class: 'okey-header vs-glass' },
    h('div', { class: 'okey-logo' }, h('span', { class: 'okey-logo-mark', html: ICONS.logo }), 'OKey'),
    h('div', { class: 'okey-search' }, h('span', { html: ICONS.search }), search),
    iconBtn(ICONS.plus, 'Add', () => renderEdit(null)),
    iconBtn(ICONS.gear, 'Settings', renderSettings),
  );

  const tabs = h('div', { class: 'okey-tabs' },
    ...['all', 'password', 'totp', 'favorites'].map((t) =>
      h('button', { class: 'okey-tab', 'aria-selected': String(view.tab === t),
        onclick: () => { view.tab = t; renderMain(); }, text: tabLabel(t) })));

  const body = h('div', { class: 'okey-body' });
  const footer = renderFooter();

  app.append(header, tabs, body, footer);
  search.addEventListener('input', () => renderList(body, search.value));
  renderList(body, '');
}

function tabLabel(t) { return { all: 'All', password: 'Logins', totp: 'Auth', favorites: '★' }[t]; }

function renderList(body, query) {
  clear(body);
  let entries = query ? vault.search(query) : vault.getEntries(
    view.tab === 'favorites' ? { favoritesOnly: true } : view.tab === 'all' ? {} : { type: view.tab });
  if (query && view.tab === 'totp') entries = entries.filter((e) => e.totpSecret);

  // Current-site recommendations (only on All tab, no query) — feedback smart detection
  if (!query && view.tab === 'all' && currentSite.url) {
    const matches = matchDomain(currentSite.url, vault.getEntries());
    if (matches.length) {
      body.append(h('div', { class: 'okey-section-title', text: `For ${getDisplayDomain(currentSite.url)}` }));
      matches.slice(0, 4).forEach((m) => {
        const e = vault.getEntry(m.id);
        if (e) body.append(entryRow(e, m.confidence));
      });
      body.append(h('div', { class: 'okey-section-title', text: 'All items' }));
    }
  }

  // Select-mode toolbar (feedback #20)
  body.append(selectToolbar(body, query));

  if (!entries.length) { body.append(h('div', { class: 'okey-empty', text: query ? 'No matches' : 'No items yet. Tap + to add one.' })); return; }
  entries.forEach((e) => body.append(entryRow(e)));
  startGlobalTotpTicker();
}

function selectToolbar(body, query) {
  const toggle = h('button', { class: 'vs-btn vs-btn-ghost vs-btn-sm', text: selectMode ? 'Done' : 'Select',
    onclick: () => { selectMode = !selectMode; selected.clear(); renderList(body, query); } });
  const row = h('div', { class: 'vs-row', style: 'padding:2px 4px' }, h('div', { class: 'vs-spacer' }), toggle);
  if (selectMode) {
    const del = h('button', { class: 'vs-btn vs-btn-danger vs-btn-sm', text: `Delete (${selected.size})`, disabled: !selected.size,
      onclick: async () => {
        if (confirm(`Are you sure you want to delete ${selected.size} selected item${selected.size === 1 ? '' : 's'}? This cannot be undone.`)) {
          await vault.deleteEntries([...selected]);
          selectMode = false; selected.clear();
          toast('Deleted', 'success'); renderList(body, query); scheduleSync();
        }
      } });
    const exp = h('button', { class: 'vs-btn vs-btn-secondary vs-btn-sm', text: `Export (${selected.size})`, disabled: !selected.size,
      onclick: () => {
        const selectedEntries = [...selected].map(id => vault.getEntry(id)).filter(Boolean);
        download('okey-selected-export.csv', IE.exportCsv(selectedEntries));
        selectMode = false; selected.clear();
        toast('Exported CSV', 'success'); renderList(body, query);
      } });
    row.insertBefore(del, row.firstChild);
    row.insertBefore(exp, del.nextSibling);
  }
  return row;
}

function startGlobalTotpTicker() {
  clearInterval(totpTimer);
  async function tick() {
    const containers = document.querySelectorAll('.okey-row-totp-container');
    if (!containers.length) {
      clearInterval(totpTimer);
      return;
    }
    for (const container of containers) {
      const secret = container.dataset.secret;
      const codeSpan = container.querySelector('.okey-row-totp-code');
      const bar = container.querySelector('.okey-row-totp-progress-bar');
      if (!secret || !codeSpan) continue;
      try {
        const { code, remaining, period } = await generateTOTP(secret);
        codeSpan.textContent = code.replace(/(\d{3})(\d{3})/, '$1 $2');
        if (bar) {
          const pct = (remaining / period) * 100;
          bar.style.transform = `scaleX(${pct / 100})`;
          if (remaining < 6) {
            bar.style.background = 'var(--vs-danger)';
            codeSpan.style.color = 'var(--vs-danger)';
          } else {
            bar.style.background = 'var(--vs-brand)';
            codeSpan.style.color = 'var(--vs-brand)';
          }
        }
      } catch {
        codeSpan.textContent = 'ERROR';
      }
    }
  }
  tick();
  totpTimer = setInterval(tick, 1000);
}

function entryRow(entry, confidence) {
  const sub = entry.username || getDisplayDomain(entry.domain) || (entry.entryType === ENTRY_TYPES.TOTP ? 'Authenticator' : '');
  const actions = h('div', { class: 'okey-entry-actions' });
  if (entry.username) actions.append(iconBtn(ICONS.user, 'Copy username', (ev) => { ev.stopPropagation(); copyValue(entry.username, 'Username copied'); }));
  if (entry.password) actions.append(iconBtn(ICONS.key, 'Copy password', (ev) => { ev.stopPropagation(); copyValue(entry.password, 'Password copied'); }));
  if (entry.totpSecret) actions.append(iconBtn(ICONS.clock, 'Copy code', async (ev) => {
    ev.stopPropagation();
    const { code } = await generateTOTP(entry.totpSecret);
    copyValue(code, 'Code copied');
  })); // feedback #24

  let totpEl = null;
  if (entry.totpSecret) {
    const codeSpan = h('span', { class: 'okey-row-totp-code vs-mono', text: '••••••' });
    const progressBar = h('div', { class: 'okey-row-totp-progress-bar' });
    const progressEl = h('div', { class: 'okey-row-totp-progress' }, progressBar);
    totpEl = h('div', { class: 'okey-row-totp-container', attrs: { 'data-secret': entry.totpSecret }, onclick: (ev) => {
      ev.stopPropagation();
      copyValue(codeSpan.textContent.replace(/\s/g, ''), 'Code copied');
    } }, codeSpan, progressEl);
  }

  const row = h('div', { class: 'okey-entry' },
    selectMode ? h('input', { type: 'checkbox', class: 'okey-checkbox', checked: selected.has(entry.id),
      onclick: (ev) => { ev.stopPropagation(); selected.has(entry.id) ? selected.delete(entry.id) : selected.add(entry.id); renderMain(); } }) : avatarEl(entry),
    h('div', { class: 'okey-entry-main' },
      h('div', { class: 'okey-entry-title' }, entry.nickname || entry.siteName || getDisplayDomain(entry.domain) || 'Untitled'),
      h('div', { class: 'okey-entry-sub' }, sub)),
    confidence ? h('span', { class: 'okey-confidence', text: confidence >= 95 ? 'EXACT' : 'MATCH' }) : null,
    totpEl,
    actions,
  );
  row.addEventListener('click', () => { if (!selectMode) renderDetail(entry.id); });
  return row;
}

// ============================ DETAIL ============================
function renderDetail(id) {
  const entry = vault.getEntry(id);
  if (!entry) return renderMain();
  view.name = 'detail'; view.entryId = id;
  rememberView();
  vault.touchEntry(id);
  clear(app);

  const fields = h('div', {});
  fields.append(detailField('Username', entry.username, true));
  fields.append(passwordField(entry.password));
  if (entry.totpSecret) fields.append(totpField(entry.totpSecret));
  if (entry.domain) fields.append(detailField('Website', entry.domain, true));
  if (entry.notes) fields.append(detailField('Notes', entry.notes, false));
  (entry.customFields || []).forEach((f) => fields.append(detailField(f.label, f.value, true)));
  if (entry.tags?.length) fields.append(detailField('Tags', entry.tags.join(', '), false));
  fields.append(h('div', { class: 'vs-faint', style: 'font-size:11px;margin-top:10px',
    text: `Updated ${formatTimeAgo(entry.updatedAt)} · used ${formatTimeAgo(entry.lastUsedAt)}` }));

  const star = iconBtn(ICONS.star, entry.isFavorite ? 'Unfavorite' : 'Favorite', async () => {
    await vault.updateEntry(id, { isFavorite: !entry.isFavorite }); toast(entry.isFavorite ? 'Removed favorite' : 'Favorited', 'success'); renderDetail(id); scheduleSync();
  });
  if (entry.isFavorite) star.style.color = 'var(--vs-warning)';

  app.append(h('div', { class: 'okey-view' },
    h('div', { class: 'okey-view-header vs-glass' },
      iconBtn(ICONS.back, 'Back', renderMain),
      avatarEl(entry),
      h('div', { class: 'okey-view-title', text: entry.nickname || entry.siteName || getDisplayDomain(entry.domain) }),
      star,
      iconBtn(ICONS.trash, 'Delete', async () => { if (confirm('Delete this item?')) { await vault.deleteEntry(id); toast('Deleted', 'success'); renderMain(); scheduleSync(); } }),
    ),
    fields,
    h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', style: 'margin-top:12px', text: 'Edit', onclick: () => renderEdit(id) }),
  ));
}

function detailField(label, value, copyable) {
  if (!value) return null;
  const val = h('span', { class: 'val', text: value });
  return h('div', { class: 'okey-detail-field' },
    h('div', { class: 'okey-detail-label', text: label }),
    h('div', { class: 'okey-detail-value' }, val,
      copyable ? iconBtn(ICONS.copy, 'Copy', () => copyValue(value, `${label} copied`)) : null));
}

function passwordField(password) {
  if (!password) return null;
  let shown = false;
  const val = h('span', { class: 'val vs-mono', text: '••••••••••' });
  const eye = iconBtn(ICONS.eye, 'Reveal', () => { shown = !shown; val.textContent = shown ? password : '••••••••••'; });
  return h('div', { class: 'okey-detail-field' },
    h('div', { class: 'okey-detail-label', text: 'Password' }),
    h('div', { class: 'okey-detail-value' }, val, eye, iconBtn(ICONS.copy, 'Copy', () => copyValue(password, 'Password copied'))));
}

function totpField(secret) {
  const code = h('span', { class: 'okey-totp-code', text: '••••••' });
  const ring = h('svg', { class: 'okey-totp-ring', viewBox: '0 0 36 36' });
  ring.innerHTML = '<circle cx="18" cy="18" r="15" fill="none" stroke="var(--vs-bg-elev-3)" stroke-width="3"/><circle class="prog" cx="18" cy="18" r="15" fill="none" stroke="var(--vs-brand)" stroke-width="3" stroke-linecap="round" transform="rotate(-90 18 18)"/>';
  const prog = ring.querySelector('.prog');
  const C = 2 * Math.PI * 15;
  prog.style.strokeDasharray = String(C);

  async function tick() {
    if (!isValidTotpSecret(secret)) { code.textContent = 'invalid'; return; }
    const { code: c, remaining, period } = await generateTOTP(secret);
    code.textContent = c.replace(/(\d{3})(\d{3})/, '$1 $2');
    prog.style.strokeDashoffset = String(C * (1 - remaining / period));
  }
  clearInterval(totpTimer);
  tick();
  totpTimer = setInterval(tick, 1000);

  return h('div', { class: 'okey-detail-field' },
    h('div', { class: 'okey-detail-label', text: 'One-time code' }),
    h('div', { class: 'okey-detail-value okey-totp' }, ring, code, h('div', { class: 'vs-spacer' }),
      iconBtn(ICONS.copy, 'Copy code', async () => { const { code: c } = await generateTOTP(secret); copyValue(c, 'Code copied'); })));
}

// ============================ ADD / EDIT ============================
function renderEdit(id, draft = null, scrollTop = 0) {
  clearInterval(totpTimer);
  const editing = !!id;
  const base = editing ? vault.getEntry(id) : {
    domain: currentSite.domain || normalizeDomain(currentSite.url || ''), // feedback #3
    siteName: currentSite.title || '',
    username: '', password: '', totpSecret: '', notes: '', tags: [], matchPatterns: [], customFields: [],
    entryType: ENTRY_TYPES.PASSWORD, isFavorite: false,
  };
  const e = { ...base, ...(draft || {}) };
  view.name = 'edit';
  view.entryId = id || null;
  clear(app);

  const f = {};
  f.siteName = labeledInput('Site name', e.siteName, true, 'e.g. GitHub');
  f.domain = labeledInput('Domain', e.domain, true, 'e.g. github.com'); // one of site/domain required (#4)
  f.username = labeledInput('Username / email', e.username, false);
  const pwInput = h('input', { class: 'vs-input', type: 'text', value: e.password || '', placeholder: 'Password' });
  const genBtn = iconBtn(ICONS.refresh, 'Generate', () => { pwInput.value = generatePassword(settings.passwordGeneratorDefaults); toggleGen(); saveDraft(); });
  const toggleGen = () => { genBtn.style.display = pwInput.value ? 'none' : 'inline-flex'; }; // feedback #19
  pwInput.addEventListener('input', toggleGen); toggleGen();
  f.totp = labeledInput('TOTP secret', e.totpSecret, false, 'Base32 secret (optional)'); // feedback #6 — always present
  f.notes = h('textarea', { class: 'vs-textarea', placeholder: 'Notes (optional)' }); f.notes.value = e.notes || '';
  f.tags = labeledInput('Tags', (e.tags || []).join(', '), false, 'comma separated');
  f.patterns = labeledInput('Match URLs', (e.matchPatterns || []).join(', '), false, 'e.g. site.com/login/*'); // feedback #17

  // Custom fields (#5)
  const customWrap = h('div', {});
  (e.customFields || []).forEach((cf) => customWrap.append(customRow(cf)));
  const addCustom = h('button', { class: 'vs-btn vs-btn-ghost vs-btn-sm', text: '+ Add custom field', onclick: () => { customWrap.append(customRow()); saveDraft(); } });

  const collectDraft = () => ({
    siteName: f.siteName.value,
    domain: f.domain.value,
    username: f.username.value,
    password: pwInput.value,
    totpSecret: f.totp.value,
    notes: f.notes.value,
    tags: splitList(f.tags.value),
    matchPatterns: splitList(f.patterns.value),
    customFields: [...customWrap.querySelectorAll('.okey-custom-row')].map((r) => ({
      label: r.children[0].value, value: r.children[1].value, hidden: false,
    })),
  });
  const saveDraft = () => rememberView({ draft: collectDraft(), scrollTop: app.querySelector('.okey-view')?.scrollTop || 0 });

  const save = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: editing ? 'Save changes' : 'Add item' });
  save.addEventListener('click', async () => {
    const data = {
      siteName: f.siteName.value.trim(), domain: normalizeDomain(f.domain.value.trim()),
      username: f.username.value.trim(), password: pwInput.value, totpSecret: f.totp.value.replace(/\s+/g, ''),
      notes: f.notes.value, tags: splitList(f.tags.value), matchPatterns: splitList(f.patterns.value),
      customFields: [...customWrap.querySelectorAll('.okey-custom-row')].map((r) => ({
        label: r.children[0].value.trim(), value: r.children[1].value, hidden: false })).filter((c) => c.label),
      entryType: f.totp.value.trim() && !pwInput.value ? ENTRY_TYPES.TOTP : ENTRY_TYPES.PASSWORD,
    };
    if (!data.siteName && !data.domain) return toast('Add a site name or domain', 'error');
    if (data.totpSecret && !isValidTotpSecret(data.totpSecret)) return toast('Invalid TOTP secret', 'error');
    try {
      if (editing) await vault.updateEntry(id, data); else await vault.addEntry(data);
      toast('Saved', 'success'); scheduleSync();
      editing ? renderDetail(id) : renderMain();
    } catch (err) { toast(err.message, 'error'); }
  });

  const editView = h('div', { class: 'okey-view' },
    viewHeader(editing ? 'Edit item' : 'Add item', editing ? () => renderDetail(id) : renderMain),
    f.siteName.field, f.domain.field, f.username.field,
    h('div', { class: 'vs-field' }, label('Password'), h('div', { class: 'vs-input-group' }, pwInput, h('div', { class: 'vs-input-affix' }, genBtn))),
    f.totp.field, f.patterns.field,
    h('div', { class: 'vs-field' }, label('Notes', true), f.notes),
    f.tags.field,
    h('div', { class: 'vs-field' }, label('Custom fields', true), customWrap, addCustom),
    save,
  );
  editView.addEventListener('input', saveDraft);
  editView.addEventListener('change', saveDraft);
  customWrap.addEventListener('click', () => setTimeout(saveDraft, 0));
  app.append(editView);
  requestAnimationFrame(() => {
    editView.scrollTop = scrollTop || 0;
    saveDraft();
  });
}

function customRow(cf = { label: '', value: '' }) {
  return h('div', { class: 'okey-custom-row' },
    h('input', { class: 'vs-input', placeholder: 'Label', value: cf.label || '' }),
    h('input', { class: 'vs-input', placeholder: 'Value', value: cf.value || '' }),
    iconBtn(ICONS.trash, 'Remove', (ev) => ev.currentTarget.parentElement.remove()));
}

// ============================ GENERATOR ============================
function renderGenerator(saved = null) {
  clear(app);
  view.name = 'generator';
  view.entryId = null;
  let mode = saved?.mode || 'password';
  const out = h('div', { class: 'okey-generator-output vs-mono' });
  const meter = strengthMeter();
  const len = h('input', { type: 'range', min: '8', max: '64', value: saved?.length || '20', style: 'width:100%' });
  const opts = { uppercase: true, lowercase: true, numbers: true, symbols: true, ...(saved?.opts || {}) };
  const checks = ['uppercase', 'lowercase', 'numbers', 'symbols'].map((k) =>
    toggleRow(k[0].toUpperCase() + k.slice(1), opts[k], (v) => { opts[k] = v; regen(); }));

  function regen() {
    if (mode === 'password') {
      out.textContent = generatePassword({ length: +len.value, ...opts });
      meter.update(out.textContent);
    } else {
      out.textContent = generatePassphrase({ words: Math.max(3, Math.round(+len.value / 4)), capitalize: true });
      meter.set(strengthFromEntropy(passphraseEntropyBits(Math.max(3, Math.round(+len.value / 4)))).level);
    }
    rememberView({ generator: { mode, length: len.value, opts } });
  }
  len.addEventListener('input', regen);

  const modeTabs = h('div', { class: 'okey-tabs' },
    h('button', { class: 'okey-tab', 'aria-selected': String(mode === 'password'), text: 'Password', onclick: (ev) => { mode = 'password'; selTab(ev); regen(); } }),
    h('button', { class: 'okey-tab', 'aria-selected': String(mode === 'passphrase'), text: 'Passphrase', onclick: (ev) => { mode = 'passphrase'; selTab(ev); regen(); } }));
  function selTab(ev) { [...modeTabs.children].forEach((c) => c.setAttribute('aria-selected', String(c === ev.currentTarget))); }

  app.append(h('div', { class: 'okey-view' },
    viewHeader('Password generator', renderMain),
    modeTabs, out, meter.el,
    h('div', { class: 'vs-row', style: 'margin:12px 0' },
      h('button', { class: 'vs-btn vs-btn-secondary', html: ICONS.refresh, onclick: regen }),
      h('button', { class: 'vs-btn vs-btn-primary vs-spacer', text: 'Copy', onclick: () => copyValue(out.textContent, 'Copied') })),
    h('label', { class: 'vs-label', text: 'Length' }), len,
    ...checks,
  ));
  regen();
}

// ============================ SETTINGS ============================
async function renderSettings(scrollTop = 0) {
  view.name = 'settings';
  view.entryId = null;
  rememberView({ scrollTop });
  clear(app);
  const profiles = await sync.getProfiles();
  const lastSync = (await local.get(STORAGE_KEYS.LAST_SYNC_AT))[STORAGE_KEYS.LAST_SYNC_AT];

  const themeSel = h('select', { class: 'vs-select' },
    ...['system', 'dark', 'light'].map((t) => h('option', { value: t, selected: settings.theme === t }, t)));
  themeSel.addEventListener('change', () => updateSettings({ theme: themeSel.value }).then(() => applyTheme(themeSel.value)));

  const autoLock = numberSetting('Auto-lock (seconds)', settings.autoLockTimeout, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS, (v) => updateSettings({ autoLockTimeout: v }));
  const clip = numberSetting('Clipboard clear (seconds)', settings.clipboardClearTimeout, SECURITY.MIN_CLIPBOARD_CLEAR_SECONDS, SECURITY.MAX_CLIPBOARD_CLEAR_SECONDS, (v) => updateSettings({ clipboardClearTimeout: v }));

  // Connected Sheets (#11, #12)
  const profileList = h('div', {});
  const renderProfiles = (list) => {
    clear(profileList);
    if (!list.length) profileList.append(h('div', { class: 'vs-faint', text: 'No vault connected. Add one to enable sync.' }));
    list.forEach((p) => profileList.append(h('div', { class: `okey-profile ${p.isActive ? 'active' : ''}` },
      h('input', { type: 'radio', name: 'profile', checked: p.isActive, class: 'okey-checkbox', onclick: async () => { await sync.switchProfile(p.id); renderProfiles(await sync.getProfiles()); } }),
      h('div', { class: 'okey-profile-main' }, h('div', { text: p.label }), h('div', { class: 'okey-profile-url', text: p.appsScriptUrl })),
      iconBtn(ICONS.trash, 'Remove', async () => { await sync.removeProfile(p.id); renderProfiles(await sync.getProfiles()); }))));
  };
  renderProfiles(profiles);

  app.append(h('div', { class: 'okey-view' },
    viewHeader('Settings', renderMain),

    settingsGroup('Security',
      autoLock, clip,
      h('div', { class: 'okey-setting' }, h('div', { class: 'okey-setting-main' }, h('div', { text: 'Theme' })), themeSel)),

    settingsGroup('Connected Sheets',
      profileList,
      h('div', { class: 'vs-row', style: 'margin-top:8px' },
        h('button', { class: 'vs-btn vs-btn-secondary vs-spacer', text: 'Add vault sheet', onclick: () => addSheetModal(async () => renderSettings()) }),
        h('button', { class: 'vs-btn vs-btn-primary', text: 'Sync now', onclick: doManualSync })),
      h('div', { class: 'vs-faint', style: 'margin-top:6px', text: lastSync ? `Last synced ${formatTimeAgo(lastSync)}` : 'Never synced' })),

    settingsGroup('Recovery',
      h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', text: 'View / regenerate recovery key', onclick: viewRecovery })),

    settingsGroup('Backup',
      h('div', { class: 'vs-row' },
        h('button', { class: 'vs-btn vs-btn-secondary vs-spacer', text: 'Export', onclick: exportModal }),
        h('button', { class: 'vs-btn vs-btn-secondary vs-spacer', text: 'Import', onclick: importModal }))),

    settingsGroup('Vault',
      h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', text: 'Open password generator', onclick: renderGenerator }),
      h('button', { class: 'vs-btn vs-btn-ghost vs-btn-block', style: 'margin-top:8px', text: 'Lock now', onclick: async () => { await clearSession(); vault.lock(); renderLocked(); } }),
      h('div', { class: 'vs-faint', style: 'text-align:center;margin-top:14px', text: 'OKey 1.0.0 · zero-knowledge · Argon2id' })),
  ));
}

function viewRecovery() {
  const pw = h('input', { class: 'vs-input', type: 'password', placeholder: 'Confirm master password' });
  modal('Recovery key', [
    h('p', { class: 'vs-muted', text: 'Regenerate your 24-word recovery key. The old key will stop working.' }),
    h('div', { class: 'vs-field' }, pw),
    h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Regenerate', onclick: async (ev) => {
      try {
        // Verify password by re-deriving (rekey not needed): unlock check via changeMasterPassword to same? Instead verify by re-unlock.
        const probe = new Vault(local);
        await probe.unlock(pw.value);
        probe.lock();
        const { recoveryMnemonic } = await vault.regenerateRecovery();
        closeModal();
        renderRecoveryReveal(recoveryMnemonic, renderSettings);
      } catch { toast('Incorrect master password', 'error'); }
    } }),
  ]);
}

// ============================ helpers: modals, inputs ============================
function addSheetModal(done) {
  const lbl = h('input', { class: 'vs-input', placeholder: 'Label (e.g. Personal)' });
  const url = h('input', { class: 'vs-input', placeholder: 'Apps Script URL (https://script.google.com/…/exec)' });
  modal('Add vault sheet', [
    h('div', { class: 'vs-field' }, lbl),
    h('div', { class: 'vs-field' }, url),
    h('p', { class: 'vs-faint', text: 'Deploy the OKey Apps Script as a Web App and paste its /exec URL. See SETUP.md.' }),
    h('div', { class: 'vs-row' },
      h('button', { class: 'vs-btn vs-btn-secondary vs-spacer', text: 'Setup new sheet', onclick: async () => {
        try { await sync.addProfile({ label: lbl.value || 'My Vault', appsScriptUrl: url.value.trim() }); await sync.setupSheet(); toast('Sheet structure created', 'success'); closeModal(); done(); }
        catch (e) { toast(e.message, 'error'); }
      } }),
      h('button', { class: 'vs-btn vs-btn-primary vs-spacer', text: 'Save', onclick: async () => {
        try { await sync.addProfile({ label: lbl.value || 'My Vault', appsScriptUrl: url.value.trim() }); toast('Vault added', 'success'); closeModal(); done(); }
        catch (e) { toast(e.message, 'error'); }
      } })),
  ]);
}

function exportModal() {
  modal('Export vault', [
    h('div', { class: 'okey-warn', text: 'CSV and Bitwarden exports are UNENCRYPTED plaintext. Store them securely and delete after use.' }),
    h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', style: 'margin-bottom:8px', text: 'Encrypted OKey backup (.json)', onclick: async () => {
      const recs = await vault.exportRecords();
      const c = await local.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
      download('okey-backup.json', IE.exportOkeyBackup({ salt: c[STORAGE_KEYS.VAULT_SALT], kdfParams: c[STORAGE_KEYS.KDF_PARAMS], wrappedMaster: c[STORAGE_KEYS.WRAPPED_BY_MASTER], wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY], records: recs }));
      closeModal();
    } }),
    h('button', { class: 'vs-btn vs-btn-ghost vs-btn-block', text: 'Plaintext CSV', onclick: () => { download('okey-export.csv', IE.exportCsv(vault.getEntries())); closeModal(); } }),
  ]);
}

function importModal() {
  const file = h('input', { type: 'file', accept: '.csv,.json,.txt' });
  const fmt = h('select', { class: 'vs-select' },
    h('option', { value: 'chrome' }, 'Chrome CSV'), h('option', { value: 'bitwarden' }, 'Bitwarden JSON'),
    h('option', { value: 'lastpass' }, 'LastPass CSV'), h('option', { value: 'zoho' }, 'Zoho Vault CSV'),
    h('option', { value: 'otp' }, 'Authenticator (otpauth)'));
  modal('Import', [
    h('div', { class: 'vs-field' }, label('Format'), fmt),
    h('div', { class: 'vs-field' }, file),
    h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Import', onclick: async () => {
      const f = file.files[0]; if (!f) return toast('Choose a file', 'error');
      const text = await f.text();
      try {
        const parser = { chrome: IE.importChrome, bitwarden: IE.importBitwarden, lastpass: IE.importLastPass, zoho: IE.importZohoVault, otp: IE.importOtpAuthUris }[fmt.value];
        const items = parser(text);
        let n = 0; for (const it of items) { try { await vault.addEntry(it); n++; } catch { /* skip invalid */ } }
        toast(`Imported ${n} item${n === 1 ? '' : 's'}`, 'success'); closeModal(); scheduleSync(); renderMain();
      } catch (e) { toast(`Import failed: ${e.message}`, 'error'); }
    } }),
  ]);
}

function modal(title, children) {
  closeModal();
  const ov = h('div', { class: 'vs-overlay', id: 'okey-modal', onclick: (e) => { if (e.target === ov) closeModal(); } },
    h('div', { class: 'vs-modal' }, h('div', { class: 'okey-view-title', style: 'margin-bottom:10px', text: title }), ...children));
  document.body.append(ov);
}
function closeModal() { document.getElementById('okey-modal')?.remove(); }

// ---------- sync helpers ----------
async function doManualSync() {
  const active = await sync.getActiveProfile();
  if (!active) return toast('Add a vault sheet first', 'error');
  toast('Syncing…', 'info');
  try {
    // ensure key material is on the sheet for device migration
    const c = await local.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
    await sync.pushKeyMaterial({ salt: c[STORAGE_KEYS.VAULT_SALT], kdfParams: c[STORAGE_KEYS.KDF_PARAMS], wrappedMaster: c[STORAGE_KEYS.WRAPPED_BY_MASTER], wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY] });
    await sync.pushSettings(settings).catch(() => {});
    const r = await sync.sync(vault);
    toast(`Synced · ↑${r.pushed} ↓${r.pulled}`, 'success');
    renderMain();
  } catch (e) { toast(`Sync failed: ${e.message}`, 'error'); }
}

let syncDebounce = null;
function scheduleSync() {
  clearTimeout(syncDebounce);
  syncDebounce = setTimeout(async () => { if (await sync.getActiveProfile()) sync.sync(vault).catch(() => {}); }, 8000);
}
async function maybeSyncOnUnlock() { if (settings.autoSyncEnabled && (await sync.getActiveProfile())) sync.sync(vault).catch(() => {}); }

async function updateSettings(patch) {
  settings = { ...settings, ...patch };
  await chrome.runtime.sendMessage({ type: MSG.UPDATE_SETTINGS, settings: patch }).catch(() => {});
  if (await sync.getActiveProfile()) sync.pushSettings(settings).catch(() => {}); // feedback #14
}

// ---------- small UI atoms ----------
function brandHeader() {
  return h('div', { style: 'text-align:center;padding:24px 0 8px' },
    h('div', { class: 'okey-logo', style: 'justify-content:center;font-size:24px' }, h('span', { html: ICONS.logo }), 'OKey'),
    h('div', { class: 'vs-faint', style: 'margin-top:4px', text: 'One key to rule them all' }));
}
function iconBtn(svg, title, onclick) { return h('button', { class: 'vs-icon-btn', title, 'aria-label': title, html: svg, onclick }); }
function viewHeader(title, back) { return h('div', { class: 'okey-view-header vs-glass' }, iconBtn(ICONS.back, 'Back', back), h('div', { class: 'okey-view-title', text: title })); }
function renderFooter() {
  const syncLabel = h('span', { class: 'vs-faint', text: 'Never synced' });
  local.get(STORAGE_KEYS.LAST_SYNC_AT).then((s) => {
    const lastSync = s[STORAGE_KEYS.LAST_SYNC_AT];
    syncLabel.textContent = lastSync ? `Last synced: ${formatTimeAgo(lastSync)}` : 'Never synced';
  });
  return h('div', { class: 'okey-footer vs-glass' }, h('span', { class: 'okey-sync-dot' }),
    h('span', { text: `${vault.getEntries().length} items` }), h('div', { class: 'vs-spacer' }),
    syncLabel);
}
function label(text, optional) { return h('label', { class: 'vs-label' }, text, optional ? h('span', { class: 'vs-optional', text: '(optional)' }) : (text ? h('span', { class: 'vs-required', text: ' *' }) : null)); }
function labeledInput(lbl, value, required, placeholder) {
  const input = h('input', { class: 'vs-input', value: value || '', placeholder: placeholder || '' });
  const field = h('div', { class: 'vs-field' },
    h('label', { class: 'vs-label' }, lbl, required ? h('span', { class: 'vs-required', text: ' *' }) : h('span', { class: 'vs-optional', text: '(optional)' })), input);
  return { input, field, get value() { return input.value; } };
}
function numberSetting(lbl, value, min, max, onchange) {
  const inp = h('input', { class: 'vs-input', type: 'number', value, min, max, style: 'width:90px' });
  inp.addEventListener('change', () => { const v = Math.min(Math.max(+inp.value, min), max); inp.value = v; onchange(v); });
  return h('div', { class: 'okey-setting' }, h('div', { class: 'okey-setting-main' }, h('div', { text: lbl })), inp);
}
function toggleRow(lbl, checked, onchange) {
  const input = h('input', { type: 'checkbox', checked });
  input.addEventListener('change', () => onchange(input.checked));
  return h('div', { class: 'okey-setting' }, h('div', { class: 'okey-setting-main' }, h('div', { text: lbl })),
    h('label', { class: 'vs-toggle' }, input, h('span', { class: 'vs-toggle-track' })));
}
function settingsGroup(title, ...children) { return h('div', { class: 'okey-settings-group' }, h('div', { class: 'okey-section-title', text: title }), ...children); }
function strengthMeter() {
  const bars = [1, 2, 3, 4, 5].map(() => h('span', { class: 'vs-strength-bar' }));
  const el = h('div', { class: 'vs-strength', attrs: { 'data-level': '0' } }, ...bars);
  return { el, update: (pw) => el.setAttribute('data-level', String(analyzePassword(pw).level)), set: (lvl) => el.setAttribute('data-level', String(lvl)) };
}
function splitList(s) { return (s || '').split(',').map((x) => x.trim()).filter(Boolean); }
function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = h('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

boot();
