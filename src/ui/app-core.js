/**
 * OKey 2.0 — popup application shell.
 * Owns global state, view routing, auth/sync wiring.
 * Screens live in ./views-auth.js and ./views-vault.js.
 */

import { CloudStore } from '../core/cloud.js';
import { CloudSync } from '../core/cloud-sync.js';
import { DEFAULT_SETTINGS, STORAGE_KEYS, SECURITY } from '../core/constants.js';
import { sanitizeSettings } from '../core/settings.js';
import { cacheDek, getCachedDek, touchSession, clearSession } from './session-neutral.js';
export { touchSession, clearSession };
export { setSessionBridge } from './session-neutral.js';
import { firebaseReady, onAuthChanged, signOutUser } from '../lib/firebase.js';
import { FIREBASE_CONFIG } from '../lib/firebase-config.js';
import { h, clear, toast, buzz } from './kit.js';
import { I } from './icons.js';
import { renderWelcome, renderOnboarding, renderLock } from '../extension/ui/views-auth.js';
import { renderVaultList, renderDetail, renderEdit, renderGenerator, renderSettings }
  from '../extension/ui/views-vault.js';

let local = null; // set by attachCore()

export const ctx = {
  store: null,
  vault: null,
  settings: { ...DEFAULT_SETTINGS },
  user: null,
  cloudSync: null,
  syncStatus: 'idle', // idle | syncing | ok | err | off
  lastActivity: 0,
};

/**
 * Platform shells MUST call this before mountCore().
 * @param {{ storage: import('../core/adapters.js').StorageAdapter,
 *           vault: import('../core/vault.js').Vault }} p
 */
export function attachCore({ storage, vault }) {
  if (!storage || !vault) throw new Error('attachCore requires storage and vault');
  ctx.store = storage;
  local = storage;
  ctx.vault = vault;
}

/* ---------- cloud wiring ---------- */
function buildCloud() {
  if (!firebaseReady()) return null;
  const cloud = new CloudStore({
    projectId: FIREBASE_CONFIG.projectId,
    getToken: async () => {
      try {
        const { getAuth } = await import('firebase/auth');
        const token = await getAuth().currentUser?.getIdToken();
        return token || null;
      } catch { return null; }
    },
    // projectId lookup uses config; uid comes from the same auth handle
  });
  const getUid = async () => {
    try {
      const { getAuth } = await import('firebase/auth');
      return getAuth().currentUser?.uid || null;
    } catch { return null; }
  };
  ctx.cloudSync = new CloudSync({
    store: local,
    cloud,
    getUid,
    getLastSyncAt: async () => {
      const uid = await getUid();
      if (!uid) return null;
      const r = await local.get('okey_last_sync_' + uid);
      return r['okey_last_sync_' + uid] || null;
    },
    setLastSyncAt: async (iso) => {
      const uid = await getUid();
      if (!uid) return;
      await local.set({ ['okey_last_sync_' + uid]: iso });
    },
  });
  void cloud._userPath; // keep linters honest about intentional method presence
  return ctx.cloudSync;
}

/* ---------- theme (Bloom is the one and only) ---------- */
export function applyTheme() {
  document.documentElement.setAttribute('data-theme', 'light');
}

export async function saveSettings(patch) {
  ctx.settings = sanitizeSettings(patch, ctx.settings);
  await local.set({ [STORAGE_KEYS.SETTINGS]: ctx.settings });
  if (ctx.user && ctx.cloudSync) {
    ctx.cloudSync.pushSettings(ctx.settings).catch(() => {});
  }
}

/* ---------- view router ---------- */
let currentView = null;
export function setView(name, ...args) {
  currentView = name;
  const app = document.getElementById('app');
  clear(app);
  app.classList.remove('nb-view');
  void app.offsetWidth;
  const views = {
    welcome: renderWelcome, onboarding: renderOnboarding, lock: renderLock,
    list: renderVaultList, detail: renderDetail, edit: renderEdit,
    generator: renderGenerator, settings: renderSettings,
  };
  const fn = views[name];
  if (!fn) return;
  fn(ctx, app, ...args);
  // re-trigger entrance animation
  for (const child of app.children) child.classList?.add('nb-view');
}

export function rerender() { if (currentView) setView(currentView); }

/* ---------- sync ---------- */
let syncTimer = null;
export function setSyncStatus(s) {
  ctx.syncStatus = s;
  document.dispatchEvent(new CustomEvent('okey-sync-status'));
}

export async function trySync(reason = '') {
  if (!ctx.cloudSync || !ctx.user || !ctx.vault.isUnlocked()) return;
  clearTimeout(syncTimer);
  setSyncStatus('syncing');
  try {
    await ctx.cloudSync.sync(vault);
    await ctx.cloudSync.pullSettings(ctx.settings, {
      apply: (merged) => { ctx.settings = merged; local.set({ [STORAGE_KEYS.SETTINGS]: merged }); applyTheme(merged.theme); },
    }).catch(() => {});
    setSyncStatus('ok');
    if (reason === 'manual') toast('Synced', 'success');
    if (currentView === 'list') rerender();
  } catch (e) {
    setSyncStatus(e.code === 'NOT_SIGNED_IN' ? 'off' : 'err');
  }
}

export function scheduleSync(delay = 6000) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => trySync(), delay);
}

/* ---------- shared chrome for unlocked screens ---------- */
export function chrome({ active = '', title = null, back = null, actions = [] } = {}) {
  const acctChip = buildAcctChip();
  const header = h('header', { class: 'ok-header' },
    back
      ? h('button', { class: 'nb-icon-btn', 'aria-label': 'Back', html: I.back, onclick: back })
      : h('div', { class: 'ok-logo' }, h('span', { html: I.logo }), 'OKey'),
    title ? h('div', { class: 'nb-spacer nb-col', style: { alignItems: 'flex-start' } },
      h('span', { style: { fontFamily: 'var(--nb-font-display)', fontWeight: '700', fontSize: 'var(--nb-fs-lg)' }, text: title })) : h('div', { class: 'nb-spacer' }),
    ...actions,
  );
  // The account chip lives on the vault home only — sub-screens are tight.
  if (!title) header.append(acctChip);

  const dot = h('span', { class: 'ok-dot' });
  const footer = h('footer', { class: 'ok-footer' },
    dot,
    h('button', {
      class: 'nb-btn-ghost nb-icon-btn', style: { width: '26px', height: '26px' },
      'aria-label': 'Sync now', html: I.refresh,
      onclick: (ev) => { ev.currentTarget.classList.add('nb-spin'); trySync('manual').finally(() => ev.currentTarget.classList.remove('nb-spin')); },
    }),
    h('span', { class: 'sync-label', text: syncLabel() }),
    h('div', { class: 'nb-spacer' }),
    h('button', { class: 'nb-icon-btn', style: { width: '28px', height: '28px' }, 'aria-label': 'Lock vault', html: I.lock,
      onclick: () => lockNow() }),
  );
  document.removeEventListener('okey-sync-status', header._syncSub || (() => {}));
  header._syncSub = () => paintDot(dot);
  document.addEventListener('okey-sync-status', header._syncSub);
  paintDot(dot);
  return { header, footer };
}

function paintDot(dot) {
  dot.className = 'ok-dot' + ({ ok: ' ok', syncing: ' syncing', err: ' err' }[ctx.syncStatus] || '');
}
function syncLabel() {
  return { ok: 'Synced', syncing: 'Syncing…', err: 'Offline — will retry', off: 'Local only' }[ctx.syncStatus]
    || (ctx.user ? 'Signed in' : 'Local only');
}

let acctOpen = false;
function buildAcctChip() {
  if (!ctx.user) {
    return h('button', {
      class: 'ok-acct', title: 'Sign in to sync',
      onclick: () => setView('settings'),
    },
      h('span', { class: 'ok-acct-img', html: I.cloud.replace('<svg ', '<svg width="13" height="13" ') }),
      h('span', { class: 'ok-acct-mail', text: 'Sign in' }));
  }
  const initial = (ctx.user.displayName || ctx.user.email || '?')[0].toUpperCase();
  return h('button', {
    class: 'ok-acct', title: ctx.user.email,
    onclick: async (e) => {
      if (acctOpen) return;
      acctOpen = true;
      const menu = h('div', { class: 'nb-menu', style: { position: 'fixed', top: '52px', right: '14px', left: 'auto', maxWidth: '220px' } },
        h('div', { style: { padding: '8px 12px', fontSize: 'var(--nb-fs-xs)', color: 'var(--nb-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis' }, text: ctx.user.email }),
        h('button', { class: 'nb-option', text: 'Settings', onclick: () => { acctOpen = false; m.close(); setView('settings'); } }),
        h('button', { class: 'nb-option', text: 'Sign out', onclick: async () => {
          acctOpen = false; m.close();
          await signOutUser(); toast('Signed out', 'info');
        } }),
      );
      const m = openMenuShell(menu, (ev) => !acctOpen || (ev.composedPath().includes(e.currentTarget) ? false : (acctOpen = false)));
      e.stopPropagation();
    },
  },
    ctx.user.photoURL
      ? h('img', { class: 'ok-acct-img', src: ctx.user.photoURL, alt: '' })
      : h('span', { class: 'ok-acct-img', text: initial }),
    h('span', { class: 'ok-acct-mail', text: ctx.user.email }));
}

import { openModal } from './kit.js';
function openMenuShell(menu) {
  const ov = h('div', {
    style: { position: 'fixed', inset: '0', zIndex: 900 },
    onclick: () => { acctOpen = false; ov.remove(); },
  }, menu);
  document.body.append(ov);
  return { close: () => { acctOpen = false; ov.remove(); } };
}

export async function lockNow() {
  buzz([10, 30, 10]);
  await clearSession();
  ctx.vault.lock();
  setView('lock');
}

/* ---------- idle auto-lock ---------- */
let idleTimer = null;
function resetIdle() {
  clearTimeout(idleTimer);
  if (!ctx.vault.isUnlocked()) return;
  const now = Date.now();
  if (now - ctx.lastActivity < 4000) return;
  ctx.lastActivity = now;
  touchSession(ctx.settings.autoLockTimeout);
  idleTimer = setTimeout(() => lockNow(), ctx.settings.autoLockTimeout * 1000);
}
['pointerdown', 'keydown'].forEach((ev) =>
  document.addEventListener(ev, () => { resetIdle(); }, { passive: true }));

/* ---------- boot (platform shells call mountCore) ---------- */
export function platformStorage(adapter) {
  return adapter;
}

export async function mountCore() {
  local = ctx.store;
  const s = await local.get(STORAGE_KEYS.SETTINGS);
  ctx.settings = sanitizeSettings(s[STORAGE_KEYS.SETTINGS], { ...DEFAULT_SETTINGS });
  applyTheme();

  onAuthChanged((user) => {
    const was = ctx.user;
    ctx.user = user;
    if (was && !user) {
      toast('Signed out — vault stays local', 'info');
      rerender();
    }
    document.dispatchEvent(new CustomEvent('okey-sync-status'));
  });

  buildCloud();

  const state = await ctx.vault.getState();
  if (!state.isSetup) return setView('welcome');

  const dek = await getCachedDek(ctx.settings.autoLockTimeout);
  if (dek) {
    try {
      await ctx.vault.unlockWithDek(dek);
      dek.fill(0);
      resetIdle();
      setView('list');
      trySync().catch(() => {});
      return;
    } catch { /* fall through */ }
  }
  setView('lock');
}
