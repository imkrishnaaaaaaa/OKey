/**
 * OKey 2.0 — popup application shell.
 * Owns global state, view routing, auth/sync wiring.
 * Screens live in ./views-auth.js and ./views-vault.js.
 */

import { createCloudSync } from '../lib/cloud-sync-factory.js';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../core/constants.js';
import { sanitizeSettings } from '../core/settings.js';
import { getCachedDek, touchSession, clearSession } from './session-neutral.js';
export { touchSession, clearSession };
export { setSessionBridge } from './session-neutral.js';
import { firebaseReady, onAuthChanged, signOutUser, getCurrentUser } from '../lib/firebase.js';
import { FIREBASE_CONFIG } from '../lib/firebase-config.js';
import { h, clear, toast, buzz, closeModal, setClipboardPolicy, isModalOpen } from './kit.js';
import { hashFor, viewFromHash } from './route.js';
import { createIdleTimer } from './idle.js';
import { I } from './icons.js';
import { renderWelcome, renderOnboarding, renderLock, renderRestore } from '../extension/ui/views-auth.js';
import { renderVaultList, renderDetail, renderEdit, renderGenerator, renderSettings, renderEmptyPane, resetVaultViewState, refreshVaultList }
  from '../extension/ui/views-vault.js';

let local = null; // set by attachCore()

export const ctx = {
  store: null,
  vault: null,
  settings: { ...DEFAULT_SETTINGS },
  user: null,
  cloudSync: null,
  syncStatus: 'idle', // idle | syncing | ok | err | off
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
  ctx.cloudSync = createCloudSync({ store: local, projectId: FIREBASE_CONFIG.projectId, getUser: getCurrentUser });
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
let currentArgs = [];

// Switched on by the PWA entry only. The extension never calls configureShell, so
// its popup keeps one screen at a time and does not touch the address bar.
const layout = { routing: false, twoPane: () => false };
let routingBound = false;
const VIEWS = {
  welcome: renderWelcome, onboarding: renderOnboarding, restore: renderRestore, lock: renderLock,
  list: renderVaultList, detail: renderDetail, edit: renderEdit,
  generator: renderGenerator, settings: renderSettings,
};
const RIGHT_PANE_VIEWS = new Set(['detail', 'edit', 'generator', 'settings']);
const APP_VIEWS = new Set(['list', ...RIGHT_PANE_VIEWS]);
let split = null; // { el, left, right } while two panes are on screen

/**
 * @param {{ routing?: boolean, twoPane?: () => boolean }} opts
 *   routing: unlocked screens get addresses (#/item/<id>) so reload and Back work.
 *   twoPane: true when the window is wide enough for a list and a detail side by side.
 */
export function configureShell({ routing = false, twoPane = () => false } = {}) {
  layout.routing = routing;
  layout.twoPane = twoPane;
  if (routing && !routingBound) {
    routingBound = true;
    addEventListener('popstate', () => {
      if (!ctx.vault?.isUnlocked()) return; // the lock screen has no address
      const { view, args } = viewFromHash(location.hash);
      render(view, args);
    });
  }
}

/** Show a screen, and give it an address when routing is on. */
export function setView(name, ...args) {
  if (layout.routing) {
    const hash = hashFor(name, args);
    if (hash && hash !== location.hash) history.pushState(null, '', hash);
  }
  render(name, args);
}

/** After unlocking: go to the screen in the address (a reload keeps the open item), else the list. */
export function goHome() {
  const { view, args } = layout.routing ? viewFromHash(location.hash) : { view: 'list', args: [] };
  render(view, args);
}

/** The window crossed the two-pane breakpoint: draw the current screen again in the right layout. */
export function relayout() {
  if (APP_VIEWS.has(currentView)) render(currentView, currentArgs);
}

function render(name, args) {
  const fn = VIEWS[name];
  if (!fn) return;
  currentView = name;
  currentArgs = args;
  ctx.selectedId = (name === 'detail' || name === 'edit') ? args[0] ?? null : null;
  const app = document.getElementById('app');
  if (APP_VIEWS.has(name) && layout.twoPane()) return renderSplit(app, name, args, fn);
  split = null;
  clear(app);
  app.classList.remove('nb-view');
  void app.offsetWidth;
  fn(ctx, app, ...args);
  // re-trigger entrance animation
  for (const child of app.children) child.classList?.add('nb-view');
}

/** List on the left (kept, so its search text stays), the chosen screen on the right. */
function renderSplit(app, name, args, fn) {
  if (!split || !app.contains(split.el)) {
    clear(app);
    const left = h('section', { class: 'ok-pane ok-pane-list' });
    const right = h('section', { class: 'ok-pane ok-pane-main' });
    const el = h('div', { class: 'ok-split' }, left, right);
    app.append(el);
    split = { el, left, right };
    renderVaultList(ctx, left);
  } else {
    refreshVaultList(); // marks the selected row and picks up edits
  }
  clear(split.right);
  if (name === 'list') renderEmptyPane(ctx, split.right);
  else fn(ctx, split.right, ...args);
}

// Escape closes the open item in the two-pane layout, unless a dialog wants the key.
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !isModalOpen() && layout.twoPane() && RIGHT_PANE_VIEWS.has(currentView)) setView('list');
});

export function rerender() { if (currentView) render(currentView, currentArgs); }

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
    await ctx.cloudSync.sync(ctx.vault);
    await ctx.cloudSync.pullSettings(ctx.settings, {
      apply: (merged) => { ctx.settings = merged; local.set({ [STORAGE_KEYS.SETTINGS]: merged }); applyTheme(merged.theme); },
    }).catch(() => {});
    setSyncStatus('ok');
    if (reason === 'manual') toast('Synced', 'success');
    if (currentView === 'list') refreshVaultList();
  } catch (e) {
    setSyncStatus(e.code === 'NOT_SIGNED_IN' ? 'off' : 'err');
  }
}

export function scheduleSync(delay = 6000) {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => trySync(), delay);
}

/* ---------- shared chrome for unlocked screens ---------- */
// One listener for the whole app, repainting whichever header is on screen now.
// A listener per header would pile up and keep every old screen alive.
let syncDot = null;
document.addEventListener('okey-sync-status', () => { if (syncDot) paintDot(syncDot); });

export function shell({ active = '', title = null, back = null, actions = [] } = {}) {
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
  syncDot = dot;
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
      const m = openMenuShell(menu);
      e.stopPropagation();
    },
  },
    ctx.user.photoURL
      ? h('img', { class: 'ok-acct-img', src: ctx.user.photoURL, alt: '' })
      : h('span', { class: 'ok-acct-img', text: initial }),
    h('span', { class: 'ok-acct-mail', text: ctx.user.email }));
}

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
  resetIdle.cancel();
  await clearSession();
  ctx.vault.lock();
  closeModal(); // a dialog opened while unlocked (export, import) must not outlive the lock
  resetVaultViewState();
  setView('lock');
}

/* ---------- idle auto-lock ---------- */
export const resetIdle = createIdleTimer({
  isUnlocked: () => ctx.vault.isUnlocked(),
  timeoutMs: () => ctx.settings.autoLockTimeout * 1000,
  onTouch: () => touchSession(ctx.settings.autoLockTimeout),
  onLock: () => lockNow(),
});
['pointerdown', 'keydown'].forEach((ev) =>
  document.addEventListener(ev, () => { resetIdle(); }, { passive: true }));

/* ---------- boot (platform shells call mountCore) ---------- */
export async function mountCore() {
  local = ctx.store;
  const s = await local.get(STORAGE_KEYS.SETTINGS);
  ctx.settings = sanitizeSettings(s[STORAGE_KEYS.SETTINGS], { ...DEFAULT_SETTINGS });
  applyTheme();
  setClipboardPolicy({ seconds: () => ctx.settings.clipboardClearTimeout });

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
      goHome();
      trySync().catch(() => {});
      return;
    } catch { /* fall through */ }
  }
  setView('lock');
}
