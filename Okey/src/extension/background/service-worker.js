/**
 * OKey Extension — MV3 Service Worker
 *
 * Stateless and event-driven (the SW may terminate at any time). It owns:
 *   - install/update + legacy storage migration
 *   - auto-lock, clipboard-clear, and 24h background-sync alarms
 *   - idle / OS-lock → purge the session DEK
 *   - content-script queries (current site, matched credentials)
 *   - background sync (only when no popup is open and the DEK is cached)
 *
 * Crypto keys live only in RAM of whichever context unlocked the vault. The SW
 * reconstructs a transient Vault from the session-cached DEK when needed.
 */

import { MSG } from '../lib/messages.js';
import { SYNC, SECURITY, STORAGE_KEYS, DEFAULT_SETTINGS } from '../../core/constants.js';
import { Vault } from '../../core/vault.js';
import { SyncEngine } from '../../core/sync.js';
import { matchDomain, extractDomain } from '../../core/domain-matcher.js';
import { ChromeStorageAdapter, chromeNetwork } from '../lib/platform.js';
import { migrateLegacyStorage } from '../lib/migration.js';
import { getCachedDek, clearSession, isPopupOpen, hardenSession, touchSession } from '../lib/session.js';

const local = new ChromeStorageAdapter('local');

// ---- Event registration (synchronous, top-level) ----
chrome.runtime.onInstalled.addListener(onInstalled);
chrome.runtime.onStartup.addListener(hardenSession);
chrome.runtime.onMessage.addListener(onMessage);
chrome.alarms.onAlarm.addListener(onAlarm);
chrome.idle.setDetectionInterval(SECURITY.IDLE_DETECTION_INTERVAL);
chrome.idle.onStateChanged.addListener(onIdle);

// ---- Install / update ----
async function onInstalled(details) {
  await hardenSession();
  await migrateLegacyStorage();
  if (details.reason === 'install') {
    const cur = await local.get(STORAGE_KEYS.SETTINGS);
    if (!cur[STORAGE_KEYS.SETTINGS]) await local.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS });
  }
  await scheduleSyncAlarm();
}

async function scheduleSyncAlarm() {
  const settings = await getSettings();
  await chrome.alarms.create(SYNC.ALARM_NAME, {
    periodInMinutes: clampInterval(settings.syncIntervalMinutes),
  });
}

// ---- Message router ----
function onMessage(message, sender, sendResponse) {
  (async () => {
    try {
      sendResponse(await route(message, sender));
    } catch (err) {
      sendResponse({ success: false, error: err.message, code: err.code });
    }
  })();
  return true; // async
}

async function route(message) {
  switch (message.type) {
    case MSG.GET_SETTINGS:
      return { success: true, settings: await getSettings() };
    case MSG.UPDATE_SETTINGS:
      return updateSettings(message.settings);
    case MSG.COPY_TO_CLIPBOARD:
      return scheduleClipboardClear();
    case MSG.GET_CURRENT_SITE:
      return getCurrentSite();
    case MSG.GET_SITE_CREDENTIALS:
      return getSiteCredentials(message.url);
    case MSG.TRIGGER_SYNC:
      return backgroundSync();
    case MSG.LOCK_VAULT:
      await clearSession();
      broadcast(MSG.VAULT_LOCKED);
      return { success: true };
    case MSG.TOUCH_SESSION:
      const settings = await getSettings();
      await touchSession(settings.autoLockTimeout);
      return { success: true };
    case MSG.RESCHEDULE_SYNC:
      await scheduleSyncAlarm();
      return { success: true };
    default:
      return { success: false, error: `Unknown message: ${message.type}` };
  }
}

// ---- Settings ----
async function getSettings() {
  const s = await local.get(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(s[STORAGE_KEYS.SETTINGS] || {}) };
}

async function updateSettings(patch) {
  const merged = { ...(await getSettings()), ...patch };
  await local.set({ [STORAGE_KEYS.SETTINGS]: merged });
  if (patch.syncIntervalMinutes) await scheduleSyncAlarm();
  return { success: true, settings: merged };
}

// ---- Clipboard auto-clear ----
async function scheduleClipboardClear() {
  const settings = await getSettings();
  const secs = clampClip(settings.clipboardClearTimeout);
  await chrome.alarms.create(SYNC.CLIPBOARD_ALARM, { delayInMinutes: secs / 60 });
  return { success: true, clearInSeconds: secs };
}

// ---- Current site / autofill credentials ----
async function getCurrentSite() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return { success: true, url: tab?.url || '', title: tab?.title || '', domain: extractDomain(tab?.url || '') };
  } catch {
    return { success: false, error: 'No active tab' };
  }
}

/**
 * Return credentials for a URL for the content script. Only when unlocked; only
 * fields needed to fill. Includes a fallback list of other entries so the user
 * can still pick something when nothing matches the site.
 */
async function getSiteCredentials(url) {
  const vault = await openTransientVault();
  if (!vault) return { success: true, locked: true, matches: [], others: [] };
  const all = vault.getEntries({ type: 'password' });
  const ranked = matchDomain(url, all);
  const rankedIds = new Set(ranked.map((m) => m.id));
  const toCred = (e) => ({
    id: e.id,
    siteName: e.siteName || e.domain,
    domain: e.domain,
    username: e.username,
    password: e.password,
    hasTotp: !!e.totpSecret,
  });
  const matches = ranked.map((m) => toCred(all.find((e) => e.id === m.id))).filter(Boolean);
  const others = all.filter((e) => !rankedIds.has(e.id)).slice(0, 8).map(toCred);
  vault.lock();
  return { success: true, locked: false, matches, others };
}

// ---- Background sync (only when popup closed, vault unlocked) ----
async function backgroundSync() {
  if (await isPopupOpen()) return { success: false, skipped: 'popup-open' };
  const vault = await openTransientVault();
  if (!vault) return { success: false, skipped: 'locked' };
  try {
    const engine = new SyncEngine(local, chromeNetwork);
    const result = await engine.sync(vault);
    broadcast(MSG.SYNC_COMPLETE, { result });
    return { success: true, ...result };
  } catch (err) {
    broadcast(MSG.SYNC_ERROR, { error: err.message });
    return { success: false, error: err.message };
  } finally {
    vault.lock();
  }
}

/** Build a transient Vault from the session DEK, or null if locked. */
async function openTransientVault() {
  const settings = await getSettings();
  const dek = await getCachedDek(settings.autoLockTimeout);
  if (!dek) return null;
  const vault = new Vault(local);
  try {
    await vault.unlockWithDek(dek);
    return vault;
  } catch {
    return null;
  } finally {
    dek.fill(0);
  }
}

// ---- Alarms ----
async function onAlarm(alarm) {
  switch (alarm.name) {
    case SYNC.AUTO_LOCK_ALARM:
      await clearSession();
      broadcast(MSG.VAULT_LOCKED);
      break;
    case SYNC.CLIPBOARD_ALARM:
      await clearClipboard();
      break;
    case SYNC.ALARM_NAME:
      await backgroundSync();
      break;
  }
}

async function clearClipboard() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => navigator.clipboard.writeText('').catch(() => {}),
      });
    }
  } catch {
    /* tab may be a restricted page */
  }
}

// ---- Idle / OS lock ----
async function onIdle(state) {
  if (state === 'locked') {
    await clearSession();
    broadcast(MSG.VAULT_LOCKED);
  }
}

// ---- Helpers ----
function broadcast(type, extra = {}) {
  chrome.runtime.sendMessage({ type, ...extra }).catch(() => {});
}
function clampInterval(m) {
  return Math.min(Math.max(Number(m) || SYNC.DEFAULT_INTERVAL_MINUTES, SYNC.MIN_INTERVAL_MINUTES), SYNC.MAX_INTERVAL_MINUTES);
}
function clampClip(s) {
  return Math.min(Math.max(Number(s) || SECURITY.DEFAULT_CLIPBOARD_CLEAR_SECONDS, SECURITY.MIN_CLIPBOARD_CLEAR_SECONDS), SECURITY.MAX_CLIPBOARD_CLEAR_SECONDS);
}
