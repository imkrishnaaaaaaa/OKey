/**
 * OKey Extension — MV3 Service Worker
 *
 * Stateless and event-driven (the SW may terminate at any time). It owns:
 *   - install/update
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
import { sanitizeSettings } from '../../core/settings.js';
import { Vault } from '../../core/vault.js';
import { CloudStore } from '../../core/cloud.js';
import { matchDomain, extractDomain } from '../../core/domain-matcher.js';
import { generateTOTP, isValidTotpSecret } from '../../core/totp.js';
import { ChromeStorageAdapter, chromeNetwork } from '../lib/platform.js';
import { getCachedDek, clearSession, isPopupOpen, hardenSession, touchSession, checkAndClearSessionIfExpired, cacheDek } from '../lib/session.js';

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

async function route(message, sender) {
  // Content scripts are untrusted callers: verify the sender is OUR extension
  // and comes from a real tab before serving secrets or accepting writes.
  if (CONTENT_ONLY_TYPES.has(message.type) && !isTrustedContentSender(sender)) {
    return { success: false, error: 'Rejected sender' };
  }

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
      // Trust only the tab the request actually came from — never a
      // client-supplied URL (revamp H6).
      return getSiteCredentials(sender.tab?.url || sender.origin || '');
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
    case MSG.ADD_CREDENTIAL:
      return addCredential(message.data);
    case MSG.UNLOCK_VAULT:
      return unlockVault(message.pin);
    case MSG.SET_ACTIVE_FILLING_SESSION:
      return setActiveFillingSession(message.cred, sender);
    case MSG.GET_ACTIVE_FILLING_SESSION:
      return getActiveFillingSession(sender);
    case MSG.CLEAR_ACTIVE_FILLING_SESSION:
      return clearActiveFillingSession(sender);
    default:
      return { success: false, error: `Unknown message: ${message.type}` };
  }
}

/** Message types that may only come from content scripts in a tab. */
const CONTENT_ONLY_TYPES = new Set([
  MSG.GET_SITE_CREDENTIALS,
  MSG.ADD_CREDENTIAL,
  MSG.SET_ACTIVE_FILLING_SESSION,
  MSG.GET_ACTIVE_FILLING_SESSION,
  MSG.CLEAR_ACTIVE_FILLING_SESSION,
]);

function isTrustedContentSender(sender) {
  return sender?.id === chrome.runtime.id && typeof sender?.tab?.id === 'number';
}

// ---- Settings ----
async function getSettings() {
  const s = await local.get(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(s[STORAGE_KEYS.SETTINGS] || {}) };
}

async function updateSettings(patch) {
  // Allowlist + clamp: settings arrive from popup/content scripts and (via
  // sync) ultimately from the cloud — treat all of it as untrusted.
  const merged = sanitizeSettings(patch, await getSettings());
  await local.set({ [STORAGE_KEYS.SETTINGS]: merged });
  if (patch?.syncIntervalMinutes) await scheduleSyncAlarm();

  // Broadcast settings update to content scripts in tabs
  try {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: MSG.UPDATE_SETTINGS, settings: merged }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn("Failed to broadcast settings to tabs:", err);
  }

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
 * Return credentials for the requesting tab's URL. Only when unlocked; only
 * fields needed to fill. TOTP codes are computed HERE — the raw secret never
 * leaves the extension's trusted context (revamp A7).
 */
async function getSiteCredentials(url) {
  const vault = await openTransientVault('mini');
  const settings = await getSettings();
  if (!vault) return { success: true, locked: true, matches: [], others: [], settings };
  const all = vault.getEntries({ type: 'password' });
  const ranked = matchDomain(url, all);
  const rankedIds = new Set(ranked.map((m) => m.id));
  const toCred = async (e) => ({
    id: e.id,
    siteName: e.siteName || e.domain,
    domain: e.domain,
    username: e.username,
    password: e.password,
    hasTotp: !!e.totpSecret,
    totpCode: e.totpSecret && isValidTotpSecret(e.totpSecret)
      ? (await generateTOTP(e.totpSecret).catch(() => ({}))).code || null
      : null,
  });
  const matches = await Promise.all(
    ranked.map((m) => all.find((e) => e.id === m.id)).filter(Boolean).map(toCred)
  );
  const others = await Promise.all(all.filter((e) => !rankedIds.has(e.id)).slice(0, 8).map(toCred));
  vault.lock();
  return { success: true, locked: false, matches, others, settings };
}

async function addCredential(data) {
  const vault = await openTransientVault('mini');
  if (!vault) {
    throw new Error('OKey vault is locked');
  }
  try {
    const entry = await vault.addEntry(data);
    vault.lock();
    // Never echo the TOTP secret (or any other secret beyond fill needs)
    // back into the page context.
    const safeEntry = {
      id: entry.id,
      siteName: entry.siteName || entry.domain,
      domain: entry.domain,
      username: entry.username,
      password: entry.password,
      hasTotp: !!entry.totpSecret,
    };
    backgroundSync().catch(console.error);
    return { success: true, entry: safeEntry };
  } catch (err) {
    vault.lock();
    return { success: false, error: err.message };
  }
}

// ---- Background sync ----
// Runs only when the user is signed in (Firebase auth rehydrates in this
// context) AND the vault session is alive. Fails closed otherwise.
let _cloudSyncChain = Promise.resolve({ pushed: 0 });
async function backgroundSync() {
  if (await isPopupOpen()) return { success: false, skipped: 'popup-open' };
  const vault = await openTransientVault('extension', { touch: false });
  if (!vault) return { success: false, skipped: 'locked' };
  try {
    const { getAuth } = await import('firebase/auth');
    const uid = getAuth().currentUser?.uid || null;
    const token = await getAuth().currentUser?.getIdToken().catch(() => null);
    if (!uid || !token) return { success: false, skipped: 'signed-out' };
    const { FIREBASE_CONFIG } = await import('../../lib/firebase-config.js');
    const cloud = new CloudStore({ projectId: FIREBASE_CONFIG.projectId, getToken: async () => token });
    const records = await vault.exportRecords();
    await cloud.pushEntries(uid, records.slice(-50)); // ponytail: bg sync pushes latest 50; full delta runs on next popup unlock
    broadcast(MSG.SYNC_COMPLETE, {});
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err && err.message || err).slice(0, 120) };
  } finally {
    vault.lock();
  }
}
void _cloudSyncChain;

/** Build a transient Vault from the session DEK, or null if locked. */
async function openTransientVault(type = 'extension', opts = {}) {
  const dek = await getCachedDek(type, opts);
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

// ---- Unlock rate limiting (revamp M4) ----
// Escalating delay before Argon2 runs; state lives in RAM-only session storage.
const UNLOCK_MAX_ATTEMPTS = 5;
const UNLOCK_BASE_DELAY_MS = 2000;
const UNLOCK_MAX_DELAY_MS = 60000;

async function getUnlockAttempts() {
  const s = await chrome.storage.session.get('okey_unlock_attempts');
  return Number(s.okey_unlock_attempts) || 0;
}

async function unlockVault(pin) {
  const attempts = await getUnlockAttempts();
  const delayMs = Math.min(UNLOCK_BASE_DELAY_MS * 2 ** Math.min(attempts, 6), UNLOCK_MAX_DELAY_MS);
  if (attempts > 0 && delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));

  const settings = await getSettings();
  const vault = new Vault(local);
  try {
    await vault.unlock(pin);
    await chrome.storage.session.remove('okey_unlock_attempts');
    const dek = vault.exportDek();
    await cacheDek(dek, settings.autoLockTimeout);
    dek.fill(0);
    vault.lock();
    return { success: true };
  } catch (err) {
    await chrome.storage.session.set({ okey_unlock_attempts: attempts + 1 });
    return { success: false, error: err.message };
  }
}

// ---- Alarms ----
async function onAlarm(alarm) {
  switch (alarm.name) {
    case SYNC.AUTO_LOCK_ALARM:
      const cleared = await checkAndClearSessionIfExpired();
      if (cleared) {
        broadcast(MSG.VAULT_LOCKED);
      }
      break;
    case SYNC.CLIPBOARD_ALARM:
      await clearClipboard();
      break;
    case SYNC.ALARM_NAME:
      await backgroundSync();
      break;
  }
}

/**
 * Clear the clipboard only if the user hasn't copied something else since we
 * copied for them (revamp M9). Read-back is best effort — restricted tabs and
 * unfocused windows fail silently, in which case we keep the old behavior of
 * clearing anyway.
 */
async function clearClipboard() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const [{ result: current } = {}] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => navigator.clipboard.readText().catch(() => null),
    });
    const ours = (await chrome.storage.session.get('okey_copied_value')).okey_copied_value;
    if (ours && current && current !== ours) return; // user copied their own thing — leave it
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => navigator.clipboard.writeText('').catch(() => {}),
    });
  } catch {
    /* tab may be a restricted page */
  } finally {
    await chrome.storage.session.remove('okey_copied_value');
  }
}

// ---- Idle / OS lock ----
async function onIdle(state) {
  // Both 'locked' (OS screen lock) and 'idle' (no interaction for the
  // detection interval) must purge the session (revamp H7).
  if (state === 'locked' || state === 'idle') {
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

// ---- Active Filling Session Storage ----
// chrome.storage.session is memory-only and hidden from content scripts —
// plaintext credentials never touch disk (revamp H5).
async function fillSessionKey(tabId) {
  return `okey_fill_session_${tabId}`;
}

async function setActiveFillingSession(cred, sender) {
  const tabId = sender?.tab?.id;
  if (!tabId) return { success: false, error: 'No tab ID found' };
  const key = await fillSessionKey(tabId);
  await chrome.storage.session.set({ [key]: { cred, timestamp: Date.now() } });
  return { success: true };
}

async function getActiveFillingSession(sender) {
  const tabId = sender?.tab?.id;
  if (!tabId) return { success: false, error: 'No tab ID found' };
  const key = await fillSessionKey(tabId);
  const s = await chrome.storage.session.get(key);
  const data = s[key];
  if (data && (Date.now() - data.timestamp < 60000)) {
    return { success: true, session: data };
  }
  if (data) {
    await chrome.storage.session.remove(key);
  }
  return { success: true, session: null };
}

async function clearActiveFillingSession(sender) {
  const tabId = sender?.tab?.id;
  if (!tabId) return { success: false, error: 'No tab ID found' };
  await chrome.storage.session.remove(await fillSessionKey(tabId));
  return { success: true };
}

// Cleanup active filling sessions when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  fillSessionKey(tabId).then((key) => chrome.storage.session.remove(key)).catch(() => {});
});
