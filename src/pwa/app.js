/**
 * OKey PWA — Mobile app controller
 *
 * A fully functional, installable, offline-capable zero-knowledge vault built
 * on the SAME core as the extension (identical crypto, identical Sheet sync).
 * Crypto runs locally in the page; the DEK lives in RAM + per-tab session.
 */

import { Vault } from '../core/vault.js';
import { SyncEngine } from '../core/sync.js';
import { generatePassword, generatePassphrase, analyzePassword } from '../core/password-generator.js';
import { generateTOTP, isValidTotpSecret } from '../core/totp.js';
import { normalizeDomain, getDisplayDomain } from '../core/domain-matcher.js';
import { formatTimeAgo } from '../core/util.js';
import { DEFAULT_SETTINGS, STORAGE_KEYS, ENTRY_TYPES, FAVICON, SECURITY } from '../core/constants.js';
import * as IE from '../core/import-export.js';
import { IndexedDbAdapter } from './lib/idb-adapter.js';
import { pwaNetwork, setGoogleClientId, getGoogleClientId } from './lib/network.js';
import { cacheDek, getCachedDek, touchSession, clearSession } from './lib/session.js';

const store = new IndexedDbAdapter();
const vault = new Vault(store);
const sync = new SyncEngine(store, pwaNetwork);
const app = document.getElementById('app');

let settings = { ...DEFAULT_SETTINGS };
let view = { name: 'loading', tab: 'all', id: null };
let totpTimer = null;
let idleTimer = null;

// ---------- DOM helper ----------
function h(tag, props = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v);
  }
  for (const kid of kids.flat()) { if (kid == null || kid === false) continue; e.append(kid.nodeType ? kid : document.createTextNode(String(kid))); }
  return e;
}
const clear = (n) => n.replaceChildren();

const I = {
  copy: '⧉', eye: '👁', edit: '✎', trash: '🗑', back: '‹', plus: '+', gear: '⚙', refresh: '↻', star: '★', sync: '⟳', clock: '⏱', user: '👤', key: '🔑',
};

function toast(msg, type = 'info') {
  let c = document.querySelector('.vs-toast-container');
  if (!c) {
    c = h('div', { class: 'vs-toast-container' });
    document.body.append(c);
  } else {
    document.body.append(c); // Always bring toast container to the top of body's DOM
  }
  const t = h('div', { class: `vs-toast vs-toast-${type}` }, msg);
  c.append(t);
  setTimeout(() => { t.classList.add('vs-toast-exit'); t.addEventListener('animationend', () => t.remove()); }, 2600);
}

async function copyValue(text, label = 'Copied') {
  try {
    await navigator.clipboard.writeText(text);
    toast(`${label} · clears in ${settings.clipboardClearTimeout}s`, 'success');
    setTimeout(() => navigator.clipboard.writeText('').catch(() => {}), settings.clipboardClearTimeout * 1000);
  } catch { toast('Copy failed', 'error'); }
}

// favicon (privacy: cached weekly)
async function faviconFor(domain) {
  if (!settings.faviconsEnabled || !domain) return null;
  const cache = (await store.get(STORAGE_KEYS.FAVICON_CACHE))[STORAGE_KEYS.FAVICON_CACHE] || {};
  const hit = cache[domain];
  if (hit?.dataUrl && Date.now() - hit.fetchedAt < FAVICON.REFRESH_AFTER_MS) return hit.dataUrl;
  try {
    const res = await fetch(`${FAVICON.PROVIDER}?domain=${encodeURIComponent(domain)}&sz=${FAVICON.SIZE}`);
    const blob = await res.blob();
    const dataUrl = await new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(r.result); r.onerror = no; r.readAsDataURL(blob); });
    cache[domain] = { dataUrl, fetchedAt: Date.now() };
    await store.set({ [STORAGE_KEYS.FAVICON_CACHE]: cache });
    return dataUrl;
  } catch { return hit?.dataUrl || null; }
}
function initialLetter(e) { const s = e.nickname || e.siteName || e.domain?.replace(/^www\./, '') || '?'; return s[0].toUpperCase(); }
function avatar(e) {
  const a = h('div', { class: 'vs-avatar' }, initialLetter(e));
  if (e.domain) faviconFor(e.domain).then((u) => { if (u) { clear(a); a.append(h('img', { src: u, alt: '' })); } });
  return a;
}

// ---------- idle auto-lock ----------
function resetIdle() {
  clearTimeout(idleTimer);
  if (!vault.isUnlocked()) return;
  touchSession(settings.autoLockTimeout);
  idleTimer = setTimeout(() => { vault.lock(); clearSession(); renderLocked(); toast('Vault locked', 'info'); }, settings.autoLockTimeout * 1000);
}
['click', 'keydown', 'touchstart'].forEach((ev) => document.addEventListener(ev, resetIdle, { passive: true }));

// ============================ boot ============================
async function boot() {
  settings = (await store.get(STORAGE_KEYS.SETTINGS))[STORAGE_KEYS.SETTINGS] || { ...DEFAULT_SETTINGS };
  settings = { ...DEFAULT_SETTINGS, ...settings };
  applyTheme(settings.theme);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(() => {});

  const state = await vault.getState();
  if (!state.isSetup) return renderSetup();
  const dek = await getCachedDek(settings.autoLockTimeout);
  if (dek) {
    try { await vault.unlockWithDek(dek); dek.fill(0); resetIdle(); return renderMain(); } catch {}
  }
  renderLocked();
}
function applyTheme(theme) {
  const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : theme;
  document.documentElement.setAttribute('data-theme', resolved);
}
async function saveSettings(patch) {
  settings = { ...settings, ...patch };
  await store.set({ [STORAGE_KEYS.SETTINGS]: settings });
  if (await sync.getActiveProfile()) sync.pushSettings(settings).catch(() => {});
}

// ============================ setup / recovery ============================
function renderSetup() {
  clear(app);
  const pw = h('input', { class: 'vs-input', type: 'password', placeholder: 'Create master password' });
  const pw2 = h('input', { class: 'vs-input', type: 'password', placeholder: 'Confirm master password' });
  const meter = strengthMeter();
  pw.addEventListener('input', () => meter.update(pw.value));
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Create vault' });
  btn.addEventListener('click', async () => {
    if (pw.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) return toast(`At least ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} characters`, 'error');
    if (pw.value !== pw2.value) return toast('Passwords do not match', 'error');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const { recoveryMnemonic } = await vault.setup(pw.value);
      cacheDek(vault.exportDek(), settings.autoLockTimeout);
      renderRecoveryReveal(recoveryMnemonic, () => { resetIdle(); renderMain(); });
    } catch (e) { btn.disabled = false; btn.textContent = 'Create vault'; toast(e.message, 'error'); }
  });
  app.append(screen('Welcome to OKey',
    h('p', { class: 'vs-muted', text: 'Your master password encrypts everything on this device. It is never stored and cannot be recovered — keep it safe.' }),
    h('div', { class: 'vs-field' }, pw, meter.el), h('div', { class: 'vs-field' }, pw2), btn));
}

function renderRecoveryReveal(mnemonic, done) {
  clear(app);
  const grid = h('div', { class: 'okey-recovery-grid' },
    mnemonic.split(' ').map((w, i) => h('div', { class: 'okey-recovery-word' }, h('b', { text: String(i + 1) }), w)));
  const ack = h('input', { type: 'checkbox' });
  const cont = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', disabled: true, text: 'Continue' });
  ack.addEventListener('change', () => (cont.disabled = !ack.checked));
  cont.addEventListener('click', done);
  app.append(screen('Your Recovery Key',
    h('div', { class: 'okey-warn', text: 'These 24 words can recover your vault if you forget your password. Store them offline. Anyone with them can open your vault.' }),
    grid,
    h('div', { class: 'vs-row' },
      h('button', { class: 'vs-btn vs-btn-secondary', text: 'Copy', onclick: () => copyValue(mnemonic, 'Recovery key copied') }),
      h('button', { class: 'vs-btn vs-btn-secondary', text: 'Download', onclick: () => download('okey-recovery-key.txt', mnemonic) })),
    h('label', { class: 'vs-row', style: 'margin:14px 0' }, ack, h('span', { text: "I've saved my recovery key" })), cont));
}

function renderLocked() {
  clear(app);
  const pw = h('input', { class: 'vs-input', type: 'password', placeholder: 'Master password' });
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Unlock' });
  const go = async () => {
    btn.disabled = true; btn.textContent = 'Unlocking…';
    try { await vault.unlock(pw.value); cacheDek(vault.exportDek(), settings.autoLockTimeout); resetIdle(); renderMain(); if (settings.autoSyncEnabled && (await sync.getActiveProfile())) sync.sync(vault).catch(() => {}); }
    catch (e) { btn.disabled = false; btn.textContent = 'Unlock'; toast(e.code === 'DECRYPTION_FAILED' ? 'Incorrect master password' : e.message, 'error'); }
  };
  pw.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      go();
    }
  });
  btn.addEventListener('click', go);
  app.append(screen('OKey', h('div', { class: 'vs-field' }, pw), btn,
    h('button', { class: 'vs-btn vs-btn-ghost vs-btn-block', style: 'margin-top:10px', text: 'Forgot password? Recover', onclick: renderRecover })));
}

function renderRecover() {
  clear(app);
  const ta = h('textarea', { class: 'vs-textarea', placeholder: '24-word recovery key', rows: 3 });
  const np = h('input', { class: 'vs-input', type: 'password', placeholder: 'New master password' });
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Recover' });
  btn.addEventListener('click', async () => {
    if (np.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) return toast('New password too short', 'error');
    btn.disabled = true;
    try { await vault.recoverWithMnemonic(ta.value); await vault.changeMasterPassword(np.value); cacheDek(vault.exportDek(), settings.autoLockTimeout); resetIdle(); toast('Recovered', 'success'); renderMain(); }
    catch (e) { btn.disabled = false; toast(e.code === 'DECRYPTION_FAILED' ? 'Recovery key did not match' : 'Invalid recovery key', 'error'); }
  });
  app.append(screen('Recover vault', h('div', { class: 'vs-field' }, ta), h('div', { class: 'vs-field' }, np), btn,
    h('button', { class: 'vs-btn vs-btn-ghost vs-btn-block', text: 'Back', onclick: renderLocked })));
}

// ============================ main ============================
function renderMain() {
  view.name = 'main';
  clear(app);
  const search = h('input', { class: 'vs-input', type: 'search', placeholder: 'Search…' });
  const syncBtn = iconBtn(I.refresh, 'Sync now', async (ev) => {
    syncBtn.classList.add('spinning');
    await doSync();
    syncBtn.classList.remove('spinning');
  });
  const header = h('header', { class: 'okey-appbar vs-glass' },
    h('div', { class: 'okey-logo' }, '🔑 OKey'),
    h('div', { style: 'display:flex;gap:8px;align-items:center' },
      syncBtn,
      iconBtn(I.gear, 'Settings', renderSettings)));
  const tabs = h('div', { class: 'okey-tabs' },
    ...['all', 'password', 'totp', 'favorites'].map((t) => h('button', { class: 'okey-tab', 'aria-selected': String(view.tab === t), text: { all: 'All', password: 'Logins', totp: 'Auth', favorites: '★' }[t], onclick: () => { view.tab = t; renderMain(); } })));
  const body = h('main', { class: 'okey-body' });
  const fab = h('button', { class: 'okey-fab', html: '+', title: 'Add', onclick: () => renderEdit(null) });
  app.append(header, h('div', { class: 'okey-searchbar' }, search), tabs, body, fab);
  search.addEventListener('input', () => list(body, search.value));
  list(body, '');
}
function list(body, q) {
  clear(body);
  let entries = q ? vault.search(q) : vault.getEntries(view.tab === 'favorites' ? { favoritesOnly: true } : view.tab === 'all' ? {} : { type: view.tab });
  if (!entries.length) return body.append(h('div', { class: 'okey-empty', text: q ? 'No matches' : 'No items yet. Tap + to add.' }));
  entries.forEach((e) => {
    const actions = h('div', { class: 'okey-entry-actions' });
    if (e.username) actions.append(iconBtn(I.user, 'Copy username', (ev) => { ev.stopPropagation(); copyValue(e.username, 'Username copied'); }));
    if (e.password) actions.append(iconBtn(I.key, 'Copy password', (ev) => { ev.stopPropagation(); copyValue(e.password, 'Password copied'); }));
    if (e.totpSecret) actions.append(iconBtn(I.clock, 'Copy code', async (ev) => {
      ev.stopPropagation();
      const { code } = await generateTOTP(e.totpSecret);
      copyValue(code, 'Code copied');
    }));

    const row = h('div', { class: 'okey-entry', onclick: () => renderDetail(e.id) },
      avatar(e),
      h('div', { class: 'okey-entry-main' },
        h('div', { class: 'okey-entry-title', text: e.nickname || e.siteName || getDisplayDomain(e.domain) || 'Untitled' }),
        h('div', { class: 'okey-entry-sub', text: e.username || getDisplayDomain(e.domain) || (e.entryType === ENTRY_TYPES.TOTP ? 'Authenticator' : '') })),
      actions
    );
    body.append(row);
  });
}

// ============================ detail ============================
function renderDetail(id) {
  const e = vault.getEntry(id);
  if (!e) return renderMain();
  view.id = id; vault.touchEntry(id);
  clear(app);
  const fields = h('div', {});
  if (e.username) fields.append(field('Username', e.username, true));
  if (e.password) fields.append(pwField(e.password));
  if (e.totpSecret) fields.append(totpField(e.totpSecret));
  if (e.domain) fields.append(field('Website', e.domain, true));
  if (e.folder) fields.append(field('Folder', e.folder, false));
  if (e.notes) fields.append(field('Notes', e.notes, false));
  (e.customFields || []).forEach((f) => fields.append(field(f.label, f.value, true)));
  app.append(h('div', { class: 'okey-view' },
    appbar(e.nickname || e.siteName || getDisplayDomain(e.domain), renderMain,
      iconBtn(e.isFavorite ? '★' : '☆', 'Favorite', async () => { await vault.updateEntry(id, { isFavorite: !e.isFavorite }); scheduleSync(); renderDetail(id); }),
      iconBtn(I.trash, 'Delete', async () => { if (confirm('Delete this item?')) { await vault.deleteEntry(id); scheduleSync(); renderMain(); } })),
    fields,
    h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', style: 'margin-top:12px', text: 'Edit', onclick: () => renderEdit(id) })));
}
function field(label, value, copyable) {
  return h('div', { class: 'okey-detail-field' }, h('div', { class: 'okey-detail-label', text: label }),
    h('div', { class: 'okey-detail-value' }, h('span', { class: 'val', text: value }),
      copyable ? iconBtn(I.copy, 'Copy', () => copyValue(value, `${label} copied`)) : null));
}
function pwField(password) {
  let shown = false;
  const val = h('span', { class: 'val vs-mono', text: '••••••••' });
  return h('div', { class: 'okey-detail-field' }, h('div', { class: 'okey-detail-label', text: 'Password' }),
    h('div', { class: 'okey-detail-value' }, val,
      iconBtn(I.eye, 'Reveal', () => { shown = !shown; val.textContent = shown ? password : '••••••••'; }),
      iconBtn(I.copy, 'Copy', () => copyValue(password, 'Password copied'))));
}
function totpField(secret) {
  const code = h('span', { class: 'okey-totp-code', text: '••••••' });
  const remain = h('span', { class: 'vs-faint' });
  async function tick() {
    if (!isValidTotpSecret(secret)) { code.textContent = 'invalid'; return; }
    const { code: c, remaining } = await generateTOTP(secret);
    code.textContent = c.replace(/(\d{3})(\d{3})/, '$1 $2'); remain.textContent = `${remaining}s`;
  }
  clearInterval(totpTimer); tick(); totpTimer = setInterval(tick, 1000);
  return h('div', { class: 'okey-detail-field' }, h('div', { class: 'okey-detail-label', text: 'One-time code' }),
    h('div', { class: 'okey-detail-value okey-totp' }, code, remain, h('div', { class: 'vs-spacer' }),
      iconBtn(I.copy, 'Copy code', async () => { const { code: c } = await generateTOTP(secret); copyValue(c, 'Code copied'); })));
}

// ============================ add / edit ============================
function renderEdit(id) {
  clearInterval(totpTimer);
  const editing = !!id;
  const e = editing ? vault.getEntry(id) : { siteName: '', domain: '', folder: '', username: '', password: '', totpSecret: '', notes: '', tags: [], customFields: [], entryType: ENTRY_TYPES.PASSWORD };
  clear(app);
  const siteName = inp('Site name', e.siteName, true, 'e.g. GitHub');
  const domain = inp('Domain', e.domain, true, 'github.com');

  // Folder dropdown configuration
  const activeFolders = [...new Set(vault.getEntries().map(x => x.folder).filter(Boolean))].sort();
  const folderSelect = h('select', { class: 'vs-select', style: 'width:100%' },
    h('option', { value: '', text: '(None)' }),
    ...activeFolders.map(fld => h('option', { value: fld, text: fld, selected: e.folder === fld })),
    h('option', { value: '__new__', text: '+ Create new folder...', selected: e.folder && !activeFolders.includes(e.folder) })
  );
  const newFolderInput = h('input', {
    class: 'vs-input',
    placeholder: 'New folder name',
    style: e.folder && !activeFolders.includes(e.folder) ? 'margin-top:8px;display:block' : 'margin-top:8px;display:none',
    value: e.folder && !activeFolders.includes(e.folder) ? e.folder : ''
  });
  folderSelect.addEventListener('change', () => {
    if (folderSelect.value === '__new__') {
      newFolderInput.style.display = 'block';
      newFolderInput.focus();
    } else {
      newFolderInput.style.display = 'none';
      newFolderInput.value = '';
    }
  });
  const folderField = h('div', { class: 'vs-field' },
    h('label', { class: 'vs-label' }, 'Folder', h('span', { class: 'vs-optional', text: ' (optional)' })),
    folderSelect,
    newFolderInput
  );

  const username = inp('Username / email', e.username, false);
  const pw = h('input', { class: 'vs-input', value: e.password, placeholder: 'Password' });
  const gen = iconBtn(I.refresh, 'Generate', () => { pw.value = generatePassword(settings.passwordGeneratorDefaults); });
  const totp = inp('TOTP secret', e.totpSecret, false, 'Base32 (optional)');
  const notes = h('textarea', { class: 'vs-textarea', placeholder: 'Notes (optional)' }); notes.value = e.notes || '';
  const tags = inp('Tags', (e.tags || []).join(', '), false, 'comma separated');
  const customWrap = h('div', {});
  (e.customFields || []).forEach((c) => customWrap.append(customRow(c)));
  const save = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: editing ? 'Save' : 'Add item' });
  save.addEventListener('click', async () => {
    const chosenFolder = folderSelect.value === '__new__' ? newFolderInput.value.trim() : folderSelect.value.trim();
    const data = { siteName: siteName.value.trim(), domain: normalizeDomain(domain.value.trim()), username: username.value.trim(),
      password: pw.value, totpSecret: totp.value.replace(/\s+/g, ''), notes: notes.value,
      folder: chosenFolder,
      tags: (tags.value || '').split(',').map((x) => x.trim()).filter(Boolean),
      customFields: [...customWrap.querySelectorAll('.okey-custom-row')].map((r) => ({ label: r.children[0].value.trim(), value: r.children[1].value, hidden: false })).filter((c) => c.label),
      entryType: totp.value.trim() && !pw.value ? ENTRY_TYPES.TOTP : ENTRY_TYPES.PASSWORD };
    if (!data.siteName && !data.domain) return toast('Add a site name or domain', 'error');
    if (data.totpSecret && !isValidTotpSecret(data.totpSecret)) return toast('Invalid TOTP secret', 'error');
    try { if (editing) await vault.updateEntry(id, data); else await vault.addEntry(data); toast('Saved', 'success'); scheduleSync(); editing ? renderDetail(id) : renderMain(); }
    catch (err) { toast(err.message, 'error'); }
  });
  app.append(h('div', { class: 'okey-view' }, appbar(editing ? 'Edit item' : 'Add item', editing ? () => renderDetail(id) : renderMain),
    siteName.field, domain.field, folderField, username.field,
    h('div', { class: 'vs-field' }, h('label', { class: 'vs-label', text: 'Password' }), h('div', { class: 'vs-input-group' }, pw, h('div', { class: 'vs-input-affix' }, gen))),
    totp.field,
    h('div', { class: 'vs-field' }, h('label', { class: 'vs-label' }, 'Notes', h('span', { class: 'vs-optional', text: '(optional)' })), notes),
    tags.field,
    h('div', { class: 'vs-field' }, h('label', { class: 'vs-label' }, 'Custom fields', h('span', { class: 'vs-optional', text: '(optional)' })), customWrap,
      h('button', { class: 'vs-btn vs-btn-ghost vs-btn-sm', text: '+ Add field', onclick: () => customWrap.append(customRow()) })),
    save));
}
function customRow(c = { label: '', value: '' }) {
  return h('div', { class: 'okey-custom-row' }, h('input', { class: 'vs-input', placeholder: 'Label', value: c.label || '' }),
    h('input', { class: 'vs-input', placeholder: 'Value', value: c.value || '' }), iconBtn(I.trash, 'Remove', (ev) => ev.currentTarget.parentElement.remove()));
}

// ============================ generator ============================
function renderGenerator() {
  clear(app);
  const out = h('div', { class: 'okey-generator-output' });
  const meter = strengthMeter();
  const len = h('input', { type: 'range', min: '8', max: '48', value: '20', style: 'width:100%' });
  const opts = { uppercase: true, lowercase: true, numbers: true, symbols: true };
  const regen = () => { out.textContent = generatePassword({ length: +len.value, ...opts }); meter.update(out.textContent); };
  len.addEventListener('input', regen);
  const checks = ['uppercase', 'lowercase', 'numbers', 'symbols'].map((k) => toggleRow(k, opts[k], (v) => { opts[k] = v; regen(); }));
  app.append(h('div', { class: 'okey-view' }, appbar('Generator', renderSettings), out, meter.el,
    h('div', { class: 'vs-row', style: 'margin:12px 0' }, h('button', { class: 'vs-btn vs-btn-secondary', text: I.refresh, onclick: regen }),
      h('button', { class: 'vs-btn vs-btn-primary vs-spacer', text: 'Copy', onclick: () => copyValue(out.textContent, 'Copied') })),
    h('label', { class: 'vs-label', text: 'Length' }), len, ...checks));
  regen();
}

// ============================ settings ============================
async function renderSettings() {
  clear(app);
  const themeSel = h('select', { class: 'vs-select' }, ...['system', 'dark', 'light'].map((t) => h('option', { value: t, selected: settings.theme === t }, t)));
  themeSel.addEventListener('change', () => { saveSettings({ theme: themeSel.value }); applyTheme(themeSel.value); });
  const clientId = h('input', { class: 'vs-input', value: getGoogleClientId(), placeholder: 'Google OAuth Client ID' });
  const sheetUrl = h('input', { class: 'vs-input', value: (await sync.getActiveProfile())?.appsScriptUrl || '', placeholder: 'Apps Script /exec URL' });
  app.append(h('div', { class: 'okey-view' }, appbar('Settings', renderMain),
    group('Security',
      numberSetting('Auto-lock (seconds)', settings.autoLockTimeout, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS, (v) => saveSettings({ autoLockTimeout: v })),
      numberSetting('Clipboard clear (seconds)', settings.clipboardClearTimeout, SECURITY.MIN_CLIPBOARD_CLEAR_SECONDS, SECURITY.MAX_CLIPBOARD_CLEAR_SECONDS, (v) => saveSettings({ clipboardClearTimeout: v })),
      h('div', { class: 'okey-setting' }, h('div', { class: 'okey-setting-main', text: 'Theme' }), themeSel)),
    group('Sync (optional)',
      h('div', { class: 'vs-field' }, h('label', { class: 'vs-label', text: 'Google OAuth Client ID' }), clientId),
      h('div', { class: 'vs-field' }, h('label', { class: 'vs-label', text: 'Apps Script URL' }), sheetUrl),
      h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Connect & sync', onclick: async () => {
        try {
          setGoogleClientId(clientId.value.trim());
          const existing = await sync.getActiveProfile();
          if (existing) await sync.updateProfile(existing.id, { appsScriptUrl: sheetUrl.value.trim() });
          else await sync.addProfile({ label: 'My Vault', appsScriptUrl: sheetUrl.value.trim() });
          await doSync();
        } catch (e) { toast(e.message, 'error'); }
      } })),
    group('Recovery', h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', text: 'Regenerate recovery key', onclick: async () => {
      const { recoveryMnemonic } = await vault.regenerateRecovery(); renderRecoveryReveal(recoveryMnemonic, renderSettings);
    } })),
    group('Backup',
      h('div', { class: 'vs-row' },
        h('button', { class: 'vs-btn vs-btn-secondary vs-spacer', text: 'Export CSV', onclick: () => download('okey-export.csv', IE.exportCsv(vault.getEntries())) }),
        h('label', { class: 'vs-btn vs-btn-secondary vs-spacer' }, 'Import', h('input', { type: 'file', accept: '.csv,.json,.txt', style: 'display:none', onchange: importFile })))),
    group('Vault',
      h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', text: 'Password generator', onclick: renderGenerator }),
      h('button', { class: 'vs-btn vs-btn-ghost vs-btn-block', style: 'margin-top:8px', text: 'Lock now', onclick: () => { vault.lock(); clearSession(); renderLocked(); } }),
      h('div', { class: 'vs-faint', style: 'text-align:center;margin-top:12px', text: 'OKey 1.0.0 · zero-knowledge · Argon2id' }))));
}

async function importFile(ev) {
  const f = ev.target.files[0]; if (!f) return;
  const text = await f.text();
  try {
    const items = /^\s*\{/.test(text) ? IE.importBitwarden(text) : text.includes('otpauth://') ? IE.importOtpAuthUris(text) : IE.importChrome(text);
    let n = 0; for (const it of items) { try { await vault.addEntry(it); n++; } catch {} }
    toast(`Imported ${n}`, 'success'); scheduleSync(); renderMain();
  } catch (e) { toast(`Import failed: ${e.message}`, 'error'); }
}

// ---------- sync ----------
let syncDebounce = null;
function scheduleSync() { clearTimeout(syncDebounce); syncDebounce = setTimeout(() => sync.getActiveProfile().then((p) => p && sync.sync(vault).catch(() => {})), 8000); }
async function doSync() {
  toast('Syncing…', 'info');
  try {
    const c = await store.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
    await sync.pushKeyMaterial({ salt: c[STORAGE_KEYS.VAULT_SALT], kdfParams: c[STORAGE_KEYS.KDF_PARAMS], wrappedMaster: c[STORAGE_KEYS.WRAPPED_BY_MASTER], wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY] });
    const r = await sync.sync(vault);
    await store.remove([STORAGE_KEYS.CACHED_FOLDERS, STORAGE_KEYS.FOLDERS_CACHE_TIME]);
    await sync.getFolders(true).catch(() => {});
    toast(`Synced · ↑${r.pushed} ↓${r.pulled}`, 'success');
  } catch (e) { toast(`Sync failed: ${e.message}`, 'error'); }
}

// ---------- atoms ----------
function screen(title, ...children) { return h('div', { class: 'okey-view okey-centered' }, h('div', { class: 'okey-logo okey-hero', text: title }), ...children); }
function appbar(title, back, ...actions) { return h('header', { class: 'okey-appbar' }, iconBtn(I.back, 'Back', back), h('div', { class: 'okey-appbar-title', text: title }), h('div', { class: 'vs-spacer' }), ...actions); }
function iconBtn(label, title, onclick) { return h('button', { class: 'vs-icon-btn', title, 'aria-label': title, text: label, onclick }); }
function inp(label, value, required, ph) {
  const input = h('input', { class: 'vs-input', value: value || '', placeholder: ph || '' });
  const field = h('div', { class: 'vs-field' }, h('label', { class: 'vs-label' }, label, required ? h('span', { class: 'vs-required', text: ' *' }) : h('span', { class: 'vs-optional', text: '(optional)' })), input);
  return { input, field, get value() { return input.value; } };
}
function numberSetting(label, value, min, max, onchange) {
  const i = h('input', { class: 'vs-input', type: 'number', value, min, max, style: 'width:90px' });
  i.addEventListener('change', () => { const v = Math.min(Math.max(+i.value, min), max); i.value = v; onchange(v); });
  return h('div', { class: 'okey-setting' }, h('div', { class: 'okey-setting-main', text: label }), i);
}
function toggleRow(label, checked, onchange) {
  const input = h('input', { type: 'checkbox', checked });
  input.addEventListener('change', () => onchange(input.checked));
  return h('div', { class: 'okey-setting' }, h('div', { class: 'okey-setting-main', text: label[0].toUpperCase() + label.slice(1) }), h('label', { class: 'vs-toggle' }, input, h('span', { class: 'vs-toggle-track' })));
}
function group(title, ...children) { return h('div', { class: 'okey-settings-group' }, h('div', { class: 'okey-section-title', text: title }), ...children); }
function strengthMeter() {
  const bars = [1, 2, 3, 4, 5].map(() => h('span', { class: 'vs-strength-bar' }));
  const el = h('div', { class: 'vs-strength', 'data-level': '0' }, ...bars);
  return { el, update: (pw) => el.setAttribute('data-level', String(analyzePassword(pw).level)) };
}
function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = h('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

boot();
