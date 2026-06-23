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
import { DEFAULT_SETTINGS, STORAGE_KEYS, LEGACY_STORAGE_KEYS, ENTRY_TYPES, FAVICON, SECURITY } from '../core/constants.js';
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
let healthTimer = null;
let selectMode = false;
const selected = new Set();

let backendVersionMismatch = false;
let backendCapabilities = {};
let dashboardData = null;

async function loadStartupData() {
  const profile = await sync.getActiveProfile();
  if (!profile?.appsScriptUrl) return;
  try {
    const cached = await store.get([
      STORAGE_KEYS.BACKEND_VERSION_MISMATCH,
      STORAGE_KEYS.BACKEND_CAPABILITIES,
      STORAGE_KEYS.BACKEND_DASHBOARD
    ]);
    backendVersionMismatch = cached[STORAGE_KEYS.BACKEND_VERSION_MISMATCH] || false;
    backendCapabilities = cached[STORAGE_KEYS.BACKEND_CAPABILITIES] || {};
    dashboardData = cached[STORAGE_KEYS.BACKEND_DASHBOARD] || null;
    if (view.name === 'main') {
      renderMain();
    }

    const [ver, cfg, dash, remoteSettings, health] = await Promise.all([
      sync.checkVersion().catch((err) => { console.error("Version check error:", err); return null; }),
      sync._call('config').catch((err) => { console.error("Config check error:", err); return null; }),
      sync.fetchDashboard().catch((err) => { console.error("Dashboard fetch error:", err); return null; }),
      sync.pullSettings().catch((err) => { console.error("Settings pull error:", err); return null; }),
      sync._call('health').catch((err) => { console.error("Health check error:", err); return null; })
    ]);

    if (ver) {
      backendVersionMismatch = ver.mismatch;
      await store.set({ [STORAGE_KEYS.BACKEND_VERSION_MISMATCH]: backendVersionMismatch });
    }
    if (cfg) {
      backendCapabilities = cfg.features || {};
      await store.set({ [STORAGE_KEYS.BACKEND_CAPABILITIES]: backendCapabilities });
    }
    if (dash) {
      dashboardData = dash;
      await store.set({ [STORAGE_KEYS.BACKEND_DASHBOARD]: dashboardData });
    }
    if (remoteSettings) {
      settings = { ...settings, ...remoteSettings };
      await store.set({ [STORAGE_KEYS.SETTINGS]: settings });
      if (typeof applyTheme === 'function') applyTheme(settings.theme);
    }
    if (health) {
      await store.set({ 'okey_backend_health': health });
    }

    if (view.name === 'main') {
      renderMain();
    }
  } catch (e) {
    console.error("Startup sync error:", e);
  }
}

async function refreshDashboardAfterSync() {
  try {
    const dash = await sync.fetchDashboard();
    if (dash) {
      dashboardData = dash;
      await store.set({ [STORAGE_KEYS.BACKEND_DASHBOARD]: dashboardData });
      if (view.name === 'main') {
        renderMain();
      }
    }
  } catch (e) {
    console.error("Failed to refresh dashboard stats after sync:", e);
  }
}

function renderHomeDashboard() {
  if (!dashboardData) return null;
  const lastSyncText = dashboardData.lastSync ? formatTimeAgo(dashboardData.lastSync) : 'Never';
  return h('div', { class: 'okey-home-dashboard vs-glass', style: 'padding:12px; margin: 0 12px 12px 12px; border-radius:12px; font-size:12px; border:1px solid var(--vs-border);' },
    h('div', { style: 'display:grid; grid-template-columns: repeat(4, 1fr); gap:4px; text-align:center; font-weight:bold; margin-bottom: 8px;' },
      h('div', {}, h('div', { style: 'font-size:15px; color:var(--vs-brand);' }, dashboardData.activeEntries ?? 0), h('div', { class: 'vs-faint', style: 'font-size:9px;' }, 'Active')),
      h('div', {}, h('div', { style: 'font-size:15px; color:var(--vs-success);' }, dashboardData.pinnedEntries ?? 0), h('div', { class: 'vs-faint', style: 'font-size:9px;' }, 'Pinned')),
      h('div', {}, h('div', { style: 'font-size:15px; color:var(--vs-warning);' }, dashboardData.folders ?? 0), h('div', { class: 'vs-faint', style: 'font-size:9px;' }, 'Folders')),
      h('div', {}, h('div', { style: 'font-size:15px; color:var(--vs-text-muted);' }, dashboardData.deletedEntries ?? 0), h('div', { class: 'vs-faint', style: 'font-size:9px;' }, 'Deleted'))
    ),
    h('div', { style: 'display:flex; justify-content:space-between; font-size:10px; border-top: 1px solid var(--vs-border); padding-top:6px;' },
      h('span', { class: 'vs-faint' }, `Total Items: ${dashboardData.totalEntries ?? 0}`),
      h('span', { class: 'vs-faint' }, `Synced: ${lastSyncText}`)
    )
  );
}

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
  if (tag === 'input' && e.getAttribute('inputmode') === 'numeric' && e.getAttribute('maxlength') === '4') {
    e.addEventListener('input', () => {
      e.value = e.value.replace(/[^0-9]/g, '').slice(0, 4);
    });
  }
  return e;
}
const clear = (n) => n.replaceChildren();

const I = {
  copy: '⧉', eye: '👁', edit: '✎', trash: '🗑', back: '‹', plus: '+', gear: '⚙', refresh: '↻', star: '★', sync: '⟳', clock: '⏱', user: '👤', key: '🔑', dots: '⋮',
  export: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>',
  import: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.89A.5.5 0 0 0 6.33 14h11.34a.5.5 0 0 0 .42-.56l-1.78-.89A2 2 0 0 1 15 10.76V7h-6v3.76zM15 3H9v4h6V3z"/></svg>',
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
    try { 
      await vault.unlockWithDek(dek); dek.fill(0); resetIdle(); showFloatingLock(); 
      loadStartupData().catch((err) => console.error("loadStartupData error:", err));
      return renderMain(); 
    } catch {}
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
  hideFloatingLock();
  clear(app);
  const pw = h('input', { class: 'vs-input', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, placeholder: 'Create 4-digit master PIN' });
  const pw2 = h('input', { class: 'vs-input', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, placeholder: 'Confirm 4-digit master PIN' });
  pw.addEventListener('input', () => { if (pw.value.length === 4) pw2.focus(); });
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Create vault' });
  btn.addEventListener('click', async () => {
    if (pw.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) return toast(`At least ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} digits required`, 'error');
    if (pw.value !== pw2.value) return toast('PINs do not match', 'error');
    btn.disabled = true; btn.textContent = 'Creating…';
    try {
      const { recoveryMnemonic } = await vault.setup(pw.value);
      cacheDek(vault.exportDek(), settings.autoLockTimeout);
      showFloatingLock();
      renderRecoveryReveal(recoveryMnemonic, () => { resetIdle(); renderMain(); });
    } catch (e) { btn.disabled = false; btn.textContent = 'Create vault'; toast(e.message, 'error'); }
  });
  pw2.addEventListener('input', () => { if (pw2.value.length === 4 && pw.value === pw2.value) btn.click(); });
  app.append(screen('Welcome to OKey',
    h('p', { class: 'vs-muted', text: 'Your 4-digit Master PIN encrypts everything on this device. It is never stored and cannot be recovered. Keep it safe.' }),
    h('div', { class: 'vs-field' }, pw), h('div', { class: 'vs-field' }, pw2), btn,
    h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', style: 'margin-top:16px', text: 'Restore from Google Sheet', onclick: renderRestoreFromSheet })
  ));
}

function renderRestoreFromSheet() {
  hideFloatingLock();
  clear(app);
  const url = h('input', { class: 'vs-input', type: 'text', placeholder: 'Apps Script URL' });
  const pw = h('input', { class: 'vs-input', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, placeholder: 'Master PIN' });
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Connect & Restore' });
  
  pw.addEventListener('input', () => { if (pw.value.length === 4) btn.click(); });
  btn.addEventListener('click', async () => {
    if (!url.value || !pw.value) return toast('Fill all fields', 'error');
    btn.disabled = true; btn.textContent = 'Connecting...';
    try {
      const trimmedUrl = url.value.trim();
      const meta = await sync.fetchMetadata(trimmedUrl);
      if (!meta || !meta.salt) throw new Error('No vault data found on this sheet.');
      
      const profile = await sync.addProfile({ label: 'Restored Vault', appsScriptUrl: trimmedUrl });
      const remoteData = await sync.pullVault();
      
      await vault.restoreFromRemote(pw.value, remoteData.metadata, remoteData.entries);
      cacheDek(vault.exportDek(), settings.autoLockTimeout);
      showFloatingLock();
      toast('Vault restored successfully', 'success');
      resetIdle();
      renderMain();
    } catch (e) {
      const profiles = await sync.getProfiles();
      const p = profiles.find(x => x.appsScriptUrl === url.value.trim());
      if (p) await sync.removeProfile(p.id);
      
      btn.disabled = false; btn.textContent = 'Connect & Restore';
      toast(e.message, 'error');
    }
  });

  app.append(screen('Restore from Sheet',
    h('p', { class: 'vs-faint', style: 'margin-bottom:12px' }, 'Connect to an existing Google Sheet to sync your vault to this device.'),
    h('div', { class: 'vs-field' }, h('label', { class: 'vs-label' }, 'Apps Script URL'), url),
    h('div', { class: 'vs-field' }, h('label', { class: 'vs-label' }, 'Master PIN'), pw),
    btn,
    h('button', { class: 'vs-btn vs-btn-ghost vs-btn-block', style: 'margin-top:8px', text: 'Back', onclick: renderSetup })
  ));
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
  hideFloatingLock();
  clear(app);
  const pw = h('input', { class: 'vs-input', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, placeholder: 'Master PIN', autofocus: true });
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Unlock' });
  const go = async () => {
    btn.disabled = true; btn.textContent = 'Unlocking…';
    try {
      await vault.unlock(pw.value);
      cacheDek(vault.exportDek(), settings.autoLockTimeout);
      resetIdle();
      showFloatingLock();
      renderMain();
      loadStartupData().catch((err) => console.error("loadStartupData error:", err));
      if (settings.autoSyncEnabled && (await sync.getActiveProfile())) {
        sync.sync(vault).then(() => refreshDashboardAfterSync()).catch(() => {});
      }
    }
    catch (e) { btn.disabled = false; btn.textContent = 'Unlock'; toast(e.code === 'DECRYPTION_FAILED' ? e.message : 'Unlock failed', 'error'); }
  };
  pw.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      go();
    }
  });
  pw.addEventListener('input', () => { if (pw.value.length === 4) go(); });
  btn.addEventListener('click', go);
  app.append(screen('OKey', h('div', { class: 'vs-field' }, pw), btn,
    h('button', { class: 'vs-btn vs-btn-ghost vs-btn-block', style: 'margin-top:10px', text: 'Forgot PIN? Recover', onclick: renderRecover }),
    h('button', { class: 'vs-btn vs-btn-ghost vs-btn-block', style: 'margin-top:32px;color:white;border:1px solid var(--vs-danger);background:var(--vs-danger)', text: 'Reset vault & start fresh', onclick: handleStartFresh })));
}

async function handleStartFresh() {
  if (confirm('Warning: This will permanently delete all saved passwords and configuration on this device. (This does not delete your Google Sheets data, and you can reconnect later.) Are you sure you want to start fresh?')) {
    vault.lock();
    clearSession();
    const keys = [...Object.values(STORAGE_KEYS), ...Object.keys(LEGACY_STORAGE_KEYS)];
    await store.remove(keys);
    toast('Vault reset successfully', 'success');
    renderSetup();
  }
}

function renderRecover() {
  clear(app);
  const ta = h('textarea', { class: 'vs-textarea', placeholder: '24-word recovery key', rows: 3 });
  const np = h('input', { class: 'vs-input', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, placeholder: 'New master PIN' });
  np.addEventListener('input', () => { if (np.value.length === 4) btn.click(); });
  const btn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Recover & set new PIN' });
  btn.addEventListener('click', async () => {
    if (np.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) return toast('New PIN too short', 'error');
    btn.disabled = true;
    try { await vault.recoverWithMnemonic(ta.value); await vault.changeMasterPassword(np.value); cacheDek(vault.exportDek(), settings.autoLockTimeout); resetIdle(); toast('Recovered successfully', 'success'); renderMain(); }
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
      iconBtn(I.dots, 'Menu', renderMainMenu)));
  const folders = [...new Set(vault.getEntries().map(x => x.folder).filter(Boolean))].sort();
  const tabsList = ['all', 'password', 'totp', 'favorites', ...folders];
  const tabLabels = { all: 'All', password: 'Logins', totp: 'Auth', favorites: '★' };

  const tabs = h('div', { class: 'okey-tabs' },
    ...tabsList.map((t) => h('button', {
      class: 'okey-tab',
      'aria-selected': String(view.tab === t),
      text: tabLabels[t] || t,
      onclick: () => { view.tab = t; renderMain(); }
    })));
  const body = h('main', { class: 'okey-body' });
  const fab = h('button', { class: 'okey-fab', html: '+', title: 'Add', onclick: () => renderEdit(null) });
  
  const updateBanner = backendVersionMismatch
    ? h('div', { class: 'okey-warn', style: 'margin: 8px 12px; font-weight: 600;', text: 'WARNING: Apps Script backend version mismatch. Please update your Google Sheet Apps Script code.' })
    : null;
  const dashPanel = renderHomeDashboard();

  app.append(...[header, updateBanner, dashPanel, h('div', { class: 'okey-searchbar' }, search), tabs, body, fab].filter(Boolean));
  search.addEventListener('input', () => list(body, search.value));
  list(body, '');
}
function selectToolbar(body, q) {
  const toggle = h('button', { class: 'vs-btn vs-btn-ghost vs-btn-sm', text: selectMode ? 'Done' : 'Select',
    onclick: () => { selectMode = !selectMode; selected.clear(); list(body, q); } });
  const row = h('div', { class: 'vs-row', style: 'padding:2px 4px;margin-bottom:8px' }, h('div', { class: 'vs-spacer' }), toggle);
  if (selectMode) {
    const del = h('button', { class: 'vs-btn vs-btn-danger vs-btn-sm', text: `Delete (${selected.size})`, disabled: !selected.size,
      onclick: async () => {
        if (confirm(`Are you sure you want to delete ${selected.size} selected item${selected.size === 1 ? '' : 's'}? This cannot be undone.`)) {
          await vault.deleteEntries([...selected]);
          selectMode = false; selected.clear();
          toast('Deleted', 'success'); list(body, q); scheduleSync();
        }
      } });
    const exp = h('button', { class: 'vs-btn vs-btn-secondary vs-btn-sm', text: `Export (${selected.size})`, disabled: !selected.size,
      onclick: () => {
        const selectedEntries = [...selected].map(id => vault.getEntry(id)).filter(Boolean);
        download('okey-selected-export.csv', IE.exportCsv(selectedEntries));
        selectMode = false; selected.clear();
        toast('Exported CSV', 'success'); list(body, q);
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

function list(body, q) {
  clear(body);
  let entries = vault.getEntries();
  if (view.tab === 'favorites') {
    entries = entries.filter((e) => e.isFavorite);
  } else if (view.tab === 'totp') {
    entries = entries.filter((e) => e.entryType === 'totp' || (e.totpSecret && typeof e.totpSecret === 'string' && e.totpSecret.trim().length > 0));
  } else if (view.tab === 'password') {
    entries = entries.filter((e) => e.entryType === 'password');
  } else if (view.tab !== 'all') {
    entries = entries.filter((e) => e.folder === view.tab);
  }

  if (q) {
    const queryStr = q.trim().toLowerCase();
    entries = entries.filter((e) =>
      [e.domain, e.siteName, e.nickname, e.username, ...(e.tags || [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(queryStr)
    );
  }
  body.append(selectToolbar(body, q));
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

    let totpEl = null;
    if (e.totpSecret) {
      const codeSpan = h('span', { class: 'okey-row-totp-code vs-mono', text: '••••••' });
      const progressBar = h('div', { class: 'okey-row-totp-progress-bar' });
      const progressEl = h('div', { class: 'okey-row-totp-progress' }, progressBar);
      totpEl = h('div', { class: 'okey-row-totp-container', attrs: { 'data-secret': e.totpSecret }, onclick: (ev) => {
        ev.stopPropagation();
        copyValue(codeSpan.textContent.replace(/\s/g, ''), 'Code copied');
      } }, codeSpan, progressEl);
    }

    const row = h('div', { class: 'okey-entry' },
      selectMode ? h('input', { type: 'checkbox', class: 'okey-checkbox', checked: selected.has(e.id),
        onclick: (ev) => { ev.stopPropagation(); selected.has(e.id) ? selected.delete(e.id) : selected.add(e.id); list(body, q); } }) : avatar(e),
      h('div', { class: 'okey-entry-main' },
        h('div', { class: 'okey-entry-title', text: e.nickname || e.siteName || getDisplayDomain(e.domain) || 'Untitled' }),
        h('div', { class: 'okey-entry-sub', text: e.username || getDisplayDomain(e.domain) || (e.entryType === ENTRY_TYPES.TOTP ? 'Authenticator' : '') }),
        totpEl),
      actions
    );

    let pressTimer;
    const startPress = () => {
      pressTimer = setTimeout(() => {
        if (!selectMode) {
          selectMode = true;
          selected.clear();
          selected.add(e.id);
          list(body, q);
        }
      }, 600);
    };
    const cancelPress = () => clearTimeout(pressTimer);

    row.addEventListener('touchstart', startPress, { passive: true });
    row.addEventListener('touchend', cancelPress, { passive: true });
    row.addEventListener('touchcancel', cancelPress, { passive: true });
    row.addEventListener('mousedown', startPress);
    row.addEventListener('mouseup', cancelPress);
    row.addEventListener('mouseleave', cancelPress);

    row.addEventListener('click', () => {
      if (selectMode) {
        selected.has(e.id) ? selected.delete(e.id) : selected.add(e.id);
        list(body, q);
      } else {
        renderDetail(e.id);
      }
    });

    body.append(row);
  });
  startGlobalTotpTicker();
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
  const pinBtn = iconBtn(I.pin, e.isPinned ? 'Unpin' : 'Pin', async () => {
    await vault.updateEntry(id, { isPinned: !e.isPinned }); toast(e.isPinned ? 'Unpinned' : 'Pinned', 'success'); scheduleSync(); renderDetail(id);
  });
  if (e.isPinned) pinBtn.style.color = 'var(--vs-brand)';

  app.append(h('div', { class: 'okey-view' },
    appbar(e.nickname || e.siteName || getDisplayDomain(e.domain), renderMain,
      iconBtn(e.isFavorite ? '★' : '☆', 'Favorite', async () => { await vault.updateEntry(id, { isFavorite: !e.isFavorite }); scheduleSync(); renderDetail(id); }),
      pinBtn,
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
  const e = editing ? vault.getEntry(id) : { siteName: '', domain: '', folder: '', username: '', password: '', totpSecret: '', notes: '', tags: [], displayOrder: 0, customFields: [], entryType: ENTRY_TYPES.PASSWORD };
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
  const displayOrder = inp('Display order', String(e.displayOrder || 0), false, '0');
  displayOrder.input.type = 'number';
  const customWrap = h('div', {});
  (e.customFields || []).forEach((c) => customWrap.append(customRow(c)));
  const save = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: editing ? 'Save' : 'Add item' });
  save.addEventListener('click', async () => {
    const chosenFolder = folderSelect.value === '__new__' ? newFolderInput.value.trim() : folderSelect.value.trim();
    const data = { siteName: siteName.value.trim(), domain: normalizeDomain(domain.value.trim()), username: username.value.trim(),
      password: pw.value, totpSecret: totp.value.replace(/\s+/g, ''), notes: notes.value,
      folder: chosenFolder,
      tags: (tags.value || '').split(',').map((x) => x.trim()).filter(Boolean),
      displayOrder: Number(displayOrder.value) || 0,
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
    displayOrder.field,
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

function renderChangeMasterPassword() {
  clear(app);
  view.name = 'change-password';
  const currentPw = h('input', { class: 'vs-input', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, placeholder: 'Current master PIN' });
  const newPw = h('input', { class: 'vs-input', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, placeholder: 'New master PIN' });
  const confirmNewPw = h('input', { class: 'vs-input', type: 'password', inputmode: 'numeric', pattern: '[0-9]*', maxlength: 4, placeholder: 'Confirm new master PIN' });
  const meter = strengthMeter();
  
  currentPw.addEventListener('input', () => { if (currentPw.value.length === 4) newPw.focus(); });
  newPw.addEventListener('input', () => {
    meter.update(newPw.value);
    if (newPw.value.length === 4) confirmNewPw.focus();
  });
  confirmNewPw.addEventListener('input', () => {
    if (confirmNewPw.value.length === 4 && newPw.value === confirmNewPw.value) submitBtn.click();
  });

  const submitBtn = h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Change PIN' });
  submitBtn.addEventListener('click', async () => {
    if (newPw.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) {
      return toast(`New PIN must be at least ${SECURITY.MIN_MASTER_PASSWORD_LENGTH} digits`, 'error');
    }
    if (newPw.value !== confirmNewPw.value) {
      return toast('New PINs do not match', 'error');
    }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating…';
    try {
      const probe = new Vault(store);
      await probe.unlock(currentPw.value);
      probe.lock();

      await vault.changeMasterPassword(newPw.value);
      cacheDek(vault.exportDek(), settings.autoLockTimeout);

      if (await sync.getActiveProfile()) {
        const c = await store.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
        await sync.pushKeyMaterial({ salt: c[STORAGE_KEYS.VAULT_SALT], kdfParams: c[STORAGE_KEYS.KDF_PARAMS], wrappedMaster: c[STORAGE_KEYS.WRAPPED_BY_MASTER], wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY] }).catch(() => {});
      }

      toast('Master PIN changed successfully', 'success');
      renderSettings();
      await doSync();
    } catch (e) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Change PIN';
      toast(e.code === 'DECRYPTION_FAILED' ? 'Incorrect current master PIN' : e.message, 'error');
    }
  });

  app.append(h('div', { class: 'okey-view' },
    appbar('Change PIN', renderSettings),
    h('div', { class: 'vs-field' }, h('label', { class: 'vs-label', text: 'Current PIN' }), currentPw),
    h('div', { class: 'vs-field' }, h('label', { class: 'vs-label', text: 'New PIN' }), newPw, meter.el),
    h('div', { class: 'vs-field' }, h('label', { class: 'vs-label', text: 'Confirm New PIN' }), confirmNewPw),
    submitBtn
  ));
  requestAnimationFrame(() => currentPw.focus());
}

// ============================ settings ============================
async function populateHealthWidget(healthWidget) {
  const profile = await sync.getActiveProfile();
  if (!profile?.appsScriptUrl) {
    const dot = healthWidget.querySelector('.okey-health-dot');
    const text = healthWidget.querySelector('.okey-health-status-text');
    const details = healthWidget.querySelector('.okey-health-details');
    if (dot && text && details) {
      dot.style.background = '#9ca3af';
      text.textContent = 'Offline (No vault connected)';
      details.style.display = 'none';
    }
    return;
  }

  const cached = await store.get('okey_backend_health');
  const res = cached['okey_backend_health'];
  const dot = healthWidget.querySelector('.okey-health-dot');
  const text = healthWidget.querySelector('.okey-health-status-text');
  const details = healthWidget.querySelector('.okey-health-details');
  if (dot && text && details) {
    if (res && res.status === 'ok') {
      dot.style.background = 'var(--vs-success)';
      text.textContent = 'Active (Connected)';
      details.style.display = 'block';
      clear(details);
      details.append(
        h('div', {}, `Apps Script: v${res.version || '1.0.0'}`),
        h('div', {}, `Spreadsheet Count: ${res.vaultEntries ?? 0} entries`),
        h('div', { style: 'overflow:hidden; text-overflow:ellipsis; white-space:nowrap;', title: res.sheetUrl }, `Sheet URL: ${res.sheetUrl || 'N/A'}`)
      );
    } else {
      dot.style.background = '#9ca3af';
      text.textContent = 'Connection status cached at sync/launch';
      details.style.display = 'none';
    }
  }
}

function renderSettings() {
  view.name = 'settings';

  clear(app);
  const themeSel = h('select', { class: 'vs-select' }, ...['system', 'dark', 'light'].map((t) => h('option', { value: t, selected: settings.theme === t }, t)));
  themeSel.addEventListener('change', () => { saveSettings({ theme: themeSel.value }); applyTheme(themeSel.value); });
  const clientId = h('input', { class: 'vs-input', value: getGoogleClientId(), placeholder: 'Google OAuth Client ID' });
  const sheetUrl = h('input', { class: 'vs-input', placeholder: 'Apps Script /exec URL' });

  sync.getActiveProfile().then((profile) => {
    if (profile?.appsScriptUrl) sheetUrl.value = profile.appsScriptUrl;
  }).catch(console.error);

  // Health check status widget
  const healthWidget = h('div', { class: 'okey-health-widget vs-glass', style: 'padding: 8px 12px; margin-top: 8px; border-radius: 8px; font-size: 11px; border: 1px solid var(--vs-border);' },
    h('div', { style: 'display:flex; align-items:center; gap:6px; font-weight:600;' },
      h('span', { class: 'okey-health-dot', style: 'width:8px; height:8px; border-radius:50%; background:#9ca3af;' }),
      h('span', { class: 'okey-health-status-text', text: 'Checking connection...' })
    ),
    h('div', { class: 'okey-health-details vs-faint', style: 'margin-top: 6px; display:none; line-height: 1.4;' })
  );

  const miniAutoLockOptions = [
    { text: '1m', value: 60 },
    { text: '5m', value: 300 },
    { text: '10m', value: 600 },
    { text: '30m', value: 1800 },
    { text: '1h', value: 3600 },
    { text: '2h', value: 7200 },
    { text: '6h', value: 21600 }
  ];
  const miniLockVal = settings.miniAutoLockTimeout || 300;
  const miniLockSel = h('select', { class: 'vs-select', style: 'width:90px' },
    ...miniAutoLockOptions.map((opt) => h('option', { value: opt.value, selected: Number(miniLockVal) === opt.value }, opt.text))
  );
  miniLockSel.addEventListener('change', () => saveSettings({ miniAutoLockTimeout: Number(miniLockSel.value) }));
  const miniLock = h('div', { class: 'okey-setting' }, h('div', { class: 'okey-setting-main', text: 'Mini-view auto-lock' }), miniLockSel);

  app.append(h('div', { class: 'okey-view' }, appbar('Settings', renderMain),
    group('Security',
      numberSetting('Auto-lock (seconds)', settings.autoLockTimeout, SECURITY.MIN_AUTO_LOCK_SECONDS, SECURITY.MAX_AUTO_LOCK_SECONDS, (v) => saveSettings({ autoLockTimeout: v })),
      miniLock,
      numberSetting('Clipboard clear (seconds)', settings.clipboardClearTimeout, SECURITY.MIN_CLIPBOARD_CLEAR_SECONDS, SECURITY.MAX_CLIPBOARD_CLEAR_SECONDS, (v) => saveSettings({ clipboardClearTimeout: v })),
      h('div', { class: 'okey-setting' }, h('div', { class: 'okey-setting-main', text: 'Change master PIN' }), h('button', { class: 'vs-btn vs-btn-secondary vs-btn-sm', text: 'Change', onclick: renderChangeMasterPassword })),
      h('div', { class: 'okey-setting' }, h('div', { class: 'okey-setting-main', text: 'Theme' }), themeSel)),
    group('Autofill Preferences',
      toggleRow('Auto-fill on single match', settings.autoFillSingleMatch, (v) => saveSettings({ autoFillSingleMatch: v })),
      toggleRow('Auto-submit after fill', settings.autoSubmitEnabled, (v) => saveSettings({ autoSubmitEnabled: v })),
      h('div', { class: 'vs-faint', style: 'margin-top: 8px; font-size: 11px; line-height: 1.4;' },
        'Tip: To prevent browser autofill popups from overlapping with OKey, disable the browser\'s built-in "Offer to save passwords" and "Autofill" settings.'
      )),
    group('Sync (optional)',
      h('div', { class: 'vs-field' }, h('label', { class: 'vs-label', text: 'Google OAuth Client ID' }), clientId),
      h('div', { class: 'vs-field' }, h('label', { class: 'vs-label', text: 'Apps Script URL' }), sheetUrl),
      h('button', { class: 'vs-btn vs-btn-primary vs-btn-block', text: 'Connect & sync', onclick: async (ev) => {
        const b = ev.currentTarget;
        b.disabled = true; b.textContent = 'Syncing...';
        try {
          setGoogleClientId(clientId.value.trim());
          const existing = await sync.getActiveProfile();
          if (existing) await sync.updateProfile(existing.id, { appsScriptUrl: sheetUrl.value.trim() });
          else await sync.addProfile({ label: 'My Vault', appsScriptUrl: sheetUrl.value.trim() });
          await doSync();
        } catch (e) { toast(e.message, 'error'); }
        finally { b.disabled = false; b.textContent = 'Connect & sync'; }
      } }),
      healthWidget),
    group('Recovery', h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', text: 'Regenerate recovery key', onclick: async () => {
      const { recoveryMnemonic } = await vault.regenerateRecovery(); renderRecoveryReveal(recoveryMnemonic, renderSettings);
    } })),
    group('Backup',
      h('div', { class: 'okey-warn', style: 'font-weight: 600; margin-bottom: 12px;' }, 'WARNING: This JSON file contains your real, unencrypted passwords. Store it securely and delete the file immediately after use.'),
      h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', style: 'margin-bottom:8px', onclick: async () => {
        const recs = await vault.exportRecords();
        const c = await store.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
        download('okey-backup.json', IE.exportOkeyBackup({ salt: c[STORAGE_KEYS.VAULT_SALT], kdfParams: c[STORAGE_KEYS.KDF_PARAMS], wrappedMaster: c[STORAGE_KEYS.WRAPPED_BY_MASTER], wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY], records: recs }));
      } }, h('span', { html: I.export }), 'Encrypted OKey backup (.json)'),
      h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', style: 'margin-bottom:8px', onclick: () => download('okey-export.json', IE.exportBitwardenJson(vault.getEntries())) }, h('span', { html: I.export }), 'Plaintext JSON (Bitwarden)'),
      h('div', { class: 'vs-row' },
        h('button', { class: 'vs-btn vs-btn-secondary vs-spacer', onclick: () => download('okey-export.csv', IE.exportCsv(vault.getEntries())) }, h('span', { html: I.export }), 'Plaintext CSV'),
        h('label', { class: 'vs-btn vs-btn-secondary vs-spacer', style: 'margin:0;cursor:pointer;' }, h('span', { html: I.import }), 'Import', h('input', { type: 'file', accept: '.csv,.json,.txt', style: 'display:none', onchange: importFile })))),
    group('Vault',
      h('button', { class: 'vs-btn vs-btn-secondary vs-btn-block', text: 'Password generator', onclick: renderGenerator }),
      h('button', { class: 'vs-btn vs-btn-ghost vs-btn-block', style: 'margin-top:8px', text: 'Lock now', onclick: () => { vault.lock(); clearSession(); renderLocked(); } }),
      h('div', { class: 'vs-faint', style: 'text-align:center;margin-top:12px', text: 'OKey 1.0.0 · zero-knowledge · Argon2id' }))));

  populateHealthWidget(healthWidget).catch(console.error);
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
function scheduleSync() { clearTimeout(syncDebounce); syncDebounce = setTimeout(() => sync.getActiveProfile().then((p) => p && sync.sync(vault).then(() => refreshDashboardAfterSync()).catch(() => {})), 8000); }
async function doSync() {
  toast('Syncing…', 'info');
  try {
    const remoteMeta = await sync.fetchMetadata();
    const c = await store.get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_MASTER, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
    
    if (remoteMeta && remoteMeta.salt) {
      if (remoteMeta.salt !== c[STORAGE_KEYS.VAULT_SALT]) {
        return toast('Vault mismatch! Sheet belongs to a different vault.', 'error');
      }
    } else {
      await sync.pushKeyMaterial({ salt: c[STORAGE_KEYS.VAULT_SALT], kdfParams: c[STORAGE_KEYS.KDF_PARAMS], wrappedMaster: c[STORAGE_KEYS.WRAPPED_BY_MASTER], wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY] });
    }

    const r = await sync.sync(vault);
    
    // Pull settings and health check after sync
    try {
      const remote = await sync.pullSettings();
      if (remote) {
        settings = { ...settings, ...remote };
        await store.set({ [STORAGE_KEYS.SETTINGS]: settings });
        if (typeof applyTheme === 'function') applyTheme(settings.theme);
      }
    } catch (e) {
      console.error("Failed to pull settings after sync:", e);
    }
    
    try {
      const health = await sync._call('health');
      if (health) {
        await store.set({ 'okey_backend_health': health });
      }
    } catch (e) {
      console.error("Failed to get health after sync:", e);
    }

    await store.remove([STORAGE_KEYS.CACHED_FOLDERS, STORAGE_KEYS.FOLDERS_CACHE_TIME]);
    await sync.getFolders(true).catch(() => {});
    await refreshDashboardAfterSync().catch(() => {});
    toast(`Synced · ↑${r.pushed} ↓${r.pulled} (${vault.getEntries().length})`, 'success');
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
  const bars = [1, 2, 3, 4].map(() => h('span', { class: 'vs-strength-bar' }));
  const el = h('div', { class: 'vs-strength', 'data-level': '0' }, ...bars);
  return { el, update: (pw) => el.setAttribute('data-level', String(analyzePassword(pw).level)) };
}
function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = h('a', { href: url, download: name }); document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function showFloatingLock() {
  if (document.getElementById('okey-lock-fab')) return;
  const lockBtn = h('button', {
    id: 'okey-lock-fab',
    class: 'okey-lock-fab',
    title: 'Lock now',
    text: '🔒',
    onclick: () => {
      vault.lock();
      clearSession();
      renderLocked();
      toast('Vault locked', 'info');
    }
  });
  document.body.append(lockBtn);
}

function hideFloatingLock() {
  document.getElementById('okey-lock-fab')?.remove();
}

// ============================ POPUP MENU ============================
function renderMainMenu(ev) {
  const existing = document.getElementById('okey-modal');
  if (existing) existing.remove();
  const menu = h('div', { class: 'okey-menu-popover vs-glass' },
    h('button', { class: 'okey-menu-item', text: 'Dashboard', onclick: () => { document.getElementById('okey-modal')?.remove(); renderDashboard(); } }),
    h('button', { class: 'okey-menu-item', text: 'Analytics', onclick: () => { document.getElementById('okey-modal')?.remove(); renderAnalytics(); } }),
    h('button', { class: 'okey-menu-item', text: 'Settings', onclick: () => { document.getElementById('okey-modal')?.remove(); renderSettings(); } })
  );
  
  const rect = ev.currentTarget.getBoundingClientRect();
  menu.style.position = 'absolute';
  menu.style.top = `${rect.bottom + 8}px`;
  menu.style.right = `${document.body.clientWidth - rect.right}px`;
  menu.style.zIndex = '1000';

  const ov = h('div', { class: 'vs-overlay', style: 'background:transparent', id: 'okey-modal', onclick: (e) => { if (e.target === ov) ov.remove(); } }, menu);
  document.body.append(ov);
}

// ============================ DASHBOARD & ANALYTICS ============================
async function renderDashboard() {
  view.name = 'dashboard';
  clear(app);
  
  const content = h('div', { class: 'okey-section-title', style: 'margin: 20px', text: 'Loading dashboard...' });
  app.append(h('div', { class: 'okey-view' },
    appbar('Dashboard', renderMain),
    content
  ));

  try {
    const data = await sync.fetchDashboard();
    clear(content);
    content.append(
      h('div', { class: 'okey-stat-grid' },
        statBox('Total Items', data.totalEntries || 0),
        statBox('Active Items', data.activeEntries || 0),
        statBox('Folders', data.folders || 0),
        statBox('Deleted', data.deletedEntries || 0)
      ),
      h('div', { class: 'vs-faint', style: 'margin-top:16px; text-align:center', text: `Last Backend Sync: ${data.lastSync ? formatTimeAgo(data.lastSync) : 'Never'}` })
    );
  } catch (e) {
    clear(content);
    content.append(h('div', { class: 'vs-faint', style: 'margin-top: 20px', text: 'Unable to fetch dashboard: ' + e.message }));
  }
}

async function renderAnalytics() {
  view.name = 'analytics';
  clear(app);
  
  const content = h('div', { class: 'okey-section-title', style: 'margin: 20px', text: 'Loading analytics...' });
  app.append(h('div', { class: 'okey-view' },
    appbar('Analytics', renderMain),
    content
  ));

  try {
    let cachedData = null;
    const cached = await store.get([STORAGE_KEYS.BACKEND_ANALYTICS, STORAGE_KEYS.ANALYTICS_CACHE_TIME]);
    const cacheTime = cached[STORAGE_KEYS.ANALYTICS_CACHE_TIME] || 0;
    const now = Date.now();
    if (cached[STORAGE_KEYS.BACKEND_ANALYTICS] && (now - cacheTime) < 3 * 60 * 1000) {
      cachedData = cached[STORAGE_KEYS.BACKEND_ANALYTICS];
    }

    let data;
    if (cachedData) {
      data = cachedData;
    } else {
      data = await sync.fetchAnalytics();
      await store.set({
        [STORAGE_KEYS.BACKEND_ANALYTICS]: data,
        [STORAGE_KEYS.ANALYTICS_CACHE_TIME]: now
      });
    }

    clear(content);
    const types = data.entryTypes || {};
    const folders = data.folders || {};

    const typeCanvas = h('canvas', { style: 'max-width:100%; max-height:180px;' });
    const folderCanvas = h('canvas', { style: 'max-width:100%; max-height:180px;' });

    content.append(
      h('div', { class: 'okey-section-title', text: 'Entry Types' }),
      h('div', { style: 'margin: 12px 0; display:flex; justify-content:center;' }, typeCanvas),
      h('div', { class: 'okey-section-title', style: 'margin-top:20px', text: 'Folder Distribution' }),
      h('div', { style: 'margin: 12px 0;' }, folderCanvas)
    );

    const ChartModule = await import('chart.js/auto');
    const Chart = ChartModule.Chart || ChartModule.default;

    const typeLabels = Object.keys(types);
    const typeValues = Object.values(types);
    const folderLabels = Object.keys(folders);
    const folderValues = Object.values(folders);

    if (typeLabels.length > 0) {
      new Chart(typeCanvas, {
        type: 'doughnut',
        data: {
          labels: typeLabels,
          datasets: [{
            data: typeValues,
            backgroundColor: ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: 'bottom', labels: { color: 'var(--vs-text)' } }
          }
        }
      });
    } else {
      typeCanvas.replaceWith(h('div', { class: 'vs-faint', style: 'text-align:center; padding:10px;', text: 'No type data available' }));
    }

    if (folderLabels.length > 0) {
      new Chart(folderCanvas, {
        type: 'bar',
        data: {
          labels: folderLabels,
          datasets: [{
            label: 'Items',
            data: folderValues,
            backgroundColor: '#2563eb',
            borderWidth: 1
          }]
        },
        options: {
          indexAxis: 'y',
          responsive: true,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: { ticks: { color: 'var(--vs-text)' }, grid: { color: 'var(--vs-border)' } },
            y: { ticks: { color: 'var(--vs-text)' }, grid: { color: 'var(--vs-border)' } }
          }
        }
      });
    } else {
      folderCanvas.replaceWith(h('div', { class: 'vs-faint', style: 'text-align:center; padding:10px;', text: 'No folder data available' }));
    }

  } catch (e) {
    clear(content);
    content.append(h('div', { class: 'vs-faint', style: 'margin-top: 20px', text: 'Unable to fetch analytics: ' + e.message }));
  }
}

function statBox(lbl, val) {
  return h('div', { class: 'okey-stat-box vs-glass' },
    h('div', { class: 'okey-stat-val', text: val }),
    h('div', { class: 'okey-stat-lbl', text: lbl })
  );
}

boot();
