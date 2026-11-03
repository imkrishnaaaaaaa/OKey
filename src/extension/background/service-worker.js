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
import { extractDomain } from '../../core/domain-matcher.js';
import { listSiteCredentials, getCredentialSecret, isSecurePage } from './credentials.js';
import { createFillSessions } from '../lib/fill-session.js';
import { createUnlockGate } from './unlock-gate.js';
import { runBackgroundSync } from './background-sync.js';
import { createClipboardCleaner } from './clipboard-clear.js';
import { shouldLockOnIdleState } from '../lib/idle-policy.js';
import { isExtensionPageSender, isPickerFrameSender, senderPageUrl } from '../lib/sender.js';
import { createCloudSync } from '../../lib/cloud-sync-factory.js';
import { ChromeStorageAdapter } from '../lib/platform.js';
import { getCachedDek, clearSession, isPopupOpen, hardenSession, touchPageSession, checkAndClearSessionIfExpired, cacheDek } from '../lib/session.js';

const local = new ChromeStorageAdapter('local');

// ---- Event registration (synchronous, top-level) ----
chrome.runtime.onInstalled.addListener(onInstalled);
chrome.runtime.onStartup.addListener(onStartup);
chrome.runtime.onMessage.addListener(onMessage);
chrome.alarms.onAlarm.addListener(onAlarm);
chrome.idle.setDetectionInterval(SECURITY.IDLE_DETECTION_INTERVAL);
chrome.idle.onStateChanged.addListener(onIdle);

// A browser restart drops alarms in some cases, so make sure the sync alarm exists.
async function onStartup() {
  await hardenSession();
  await scheduleSyncAlarm();
}

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
  // Unlocking, changing settings and reading the active tab are for OKey's own pages only.
  if (EXTENSION_PAGE_ONLY_TYPES.has(message.type) && !isExtensionPageSender(sender, chrome.runtime.id)) {
    return { success: false, error: 'Rejected sender' };
  }
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
      return getSiteCredentials(senderUrl(sender));
    case MSG.GET_CREDENTIAL_SECRET:
      return getSecret(message, sender);
    case MSG.TRIGGER_SYNC:
      return backgroundSync();
    case MSG.LOCK_VAULT:
      await clearSession();
      return { success: true };
    case MSG.TOUCH_SESSION:
      await touchPageSession();
      return { success: true };
    case MSG.RESCHEDULE_SYNC:
      await scheduleSyncAlarm();
      return { success: true };
    case MSG.ADD_CREDENTIAL:
      return addCredential(message.data);
    case MSG.GOOGLE_SIGN_IN:
      return googleSignIn();
    case MSG.UNLOCK_VAULT:
      return unlockVault(message.pin);
    case MSG.SET_ACTIVE_FILLING_SESSION:
      return setActiveFillingSession(message.cred, sender, message.submitted === true);
    case MSG.GET_ACTIVE_FILLING_SESSION:
      return getActiveFillingSession(sender);
    case MSG.CLEAR_ACTIVE_FILLING_SESSION:
      return clearActiveFillingSession(sender);
    default:
      return { success: false, error: `Unknown message: ${message.type}` };
  }
}

/** Message types that may only come from OKey's own pages (popup, unlock frame), never a content script. */
const EXTENSION_PAGE_ONLY_TYPES = new Set([
  MSG.UNLOCK_VAULT,
  MSG.GOOGLE_SIGN_IN,
  MSG.UPDATE_SETTINGS,
  MSG.GET_CURRENT_SITE,
]);

/** Message types that may only come from content scripts in a tab. */
const CONTENT_ONLY_TYPES = new Set([
  MSG.GET_SITE_CREDENTIALS,
  MSG.GET_CREDENTIAL_SECRET,
  MSG.ADD_CREDENTIAL,
  MSG.SET_ACTIVE_FILLING_SESSION,
  MSG.GET_ACTIVE_FILLING_SESSION,
  MSG.CLEAR_ACTIVE_FILLING_SESSION,
]);

function isTrustedContentSender(sender) {
  if (sender?.id !== chrome.runtime.id || typeof sender?.tab?.id !== 'number') return false;
  // A web page cannot send from our extension origin. Inside a tab the only
  // extension page allowed to ask for site data is the picker frame.
  if (isExtensionPageSender(sender, chrome.runtime.id)) {
    return isPickerFrameSender(sender, chrome.runtime.id);
  }
  return true;
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
 * The page that sent the message. A content script's own URL is the page and is
 * fresher than tab.url during navigation. The picker is an extension page, so
 * its site has to come from the tab.
 */
const senderUrl = (sender) => senderPageUrl(sender, chrome.runtime.id);

/**
 * Names only (no passwords, no codes) for the requesting page. The secret of one
 * login is fetched by getSecret after the user clicks it (credentials.js).
 */
async function getSiteCredentials(url) {
  const settings = await getSettings();
  // Say so before asking for a PIN: nothing will be filled on this page anyway.
  if (!isSecurePage(url)) return { success: true, locked: false, matches: [], others: [], insecure: true, settings };
  const vault = await openTransientVault('mini');
  if (!vault) return { success: true, locked: true, matches: [], others: [], settings };
  try {
    return { success: true, locked: false, ...listSiteCredentials(vault, url), settings };
  } finally {
    vault.lock();
  }
}

/** The fill data for one login the user clicked. TOTP codes are made here, never the raw secret. */
async function getSecret(message, sender) {
  const vault = await openTransientVault('mini');
  if (!vault) return { success: false, locked: true, error: 'OKey is locked' };
  try {
    const cred = await getCredentialSecret(vault, senderUrl(sender), message.id, { picked: message.picked === true });
    return { success: true, cred };
  } catch (err) {
    return { success: false, error: err.message, code: err.code };
  } finally {
    vault.lock();
  }
}

async function addCredential(data) {
  const vault = await openTransientVault('mini');
  if (!vault) {
    throw new Error('OKey vault is locked');
  }
  try {
    const entry = await vault.addEntry(data);
    vault.lock();
    // No secrets go back to the page. To fill it, the content script asks for
    // the secret of this one id (GET_CREDENTIAL_SECRET).
    const safeEntry = {
      id: entry.id,
      siteName: entry.siteName || entry.domain,
      domain: entry.domain,
      username: entry.username,
    };
    backgroundSync().catch(console.error);
    return { success: true, entry: safeEntry };
  } catch (err) {
    vault.lock();
    return { success: false, error: err.message };
  }
}

// ---- Background sync ----
// Runs only while the vault session is alive, the popup is closed and the user
// is signed in. Fails closed otherwise (see background-sync.js).
async function backgroundSync() {
  const result = await runBackgroundSync({
    isPopupOpen,
    openVault: () => openTransientVault('extension', { touch: false }),
    getCloudSync,
  });
  return result;
}

/** Loaded on demand: a Firebase problem must disable sync, not stop the worker from starting. */
async function getCloudSync() {
  const { firebaseReady, getCurrentUser } = await import('../../lib/firebase.js');
  if (!firebaseReady()) return null;
  const { FIREBASE_CONFIG } = await import('../../lib/firebase-config.js');
  return createCloudSync({ store: local, projectId: FIREBASE_CONFIG.projectId, getUser: getCurrentUser });
}

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

/**
 * Google sign-in runs HERE, not in the popup: the popup closes the moment Google's
 * window takes focus, which would end the sign-in half way. The popup finds the
 * signed-in user when it opens again (Firebase keeps it in IndexedDB).
 */
async function googleSignIn() {
  try {
    const { signInGoogleViaBrowserWindow } = await import('../../lib/firebase.js');
    return { success: true, user: await signInGoogleViaBrowserWindow() };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ---- Unlock rate limiting (revamp M4) ----
// Tries run one at a time with a growing wait (see unlock-gate.js).
async function unlockOnce(pin) {
  const settings = await getSettings();
  const vault = new Vault(local);
  try {
    await vault.unlock(pin);
    const dek = vault.exportDek();
    await cacheDek(dek, settings.autoLockTimeout);
    dek.fill(0);
    vault.lock();
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

const unlockVault = createUnlockGate({ storage: chrome.storage.session, tryUnlock: unlockOnce });

// ---- Alarms ----
async function onAlarm(alarm) {
  switch (alarm.name) {
    case SYNC.AUTO_LOCK_ALARM:
      const cleared = await checkAndClearSessionIfExpired();
      if (cleared) {
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
const clearClipboard = createClipboardCleaner({ offscreen: chrome.offscreen, runtime: chrome.runtime });

// ---- Idle / OS lock ----
async function onIdle(state) {
  // Only the OS screen lock purges the session here (see idle-policy.js). Plain
  // inactivity is handled by the auto-lock timers (revamp H7).
  if (shouldLockOnIdleState(state)) {
    await clearSession();
  }
}

// ---- Helpers ----
function clampInterval(m) {
  return Math.min(Math.max(Number(m) || SYNC.DEFAULT_INTERVAL_MINUTES, SYNC.MIN_INTERVAL_MINUTES), SYNC.MAX_INTERVAL_MINUTES);
}
function clampClip(s) {
  return Math.min(Math.max(Number(s) || SECURITY.DEFAULT_CLIPBOARD_CLEAR_SECONDS, SECURITY.MIN_CLIPBOARD_CLEAR_SECONDS), SECURITY.MAX_CLIPBOARD_CLEAR_SECONDS);
}

// ---- Active Filling Session Storage ----
// chrome.storage.session is memory-only and hidden from content scripts —
// plaintext credentials never touch disk (revamp H5). A session is bound to its
// tab AND the page's origin (see lib/fill-session.js).
const fillSessions = createFillSessions(chrome.storage.session);
const senderOrigin = (sender) => sender.origin || (sender.url ? new URL(sender.url).origin : '');

async function setActiveFillingSession(cred, sender, submitted = false) {
  const tabId = sender?.tab?.id;
  if (!tabId) return { success: false, error: 'No tab ID found' };
  await fillSessions.set(tabId, senderOrigin(sender), cred, { submitted });
  return { success: true };
}

async function getActiveFillingSession(sender) {
  const tabId = sender?.tab?.id;
  if (!tabId) return { success: false, error: 'No tab ID found' };
  return { success: true, session: await fillSessions.get(tabId, senderOrigin(sender)) };
}

async function clearActiveFillingSession(sender) {
  const tabId = sender?.tab?.id;
  if (!tabId) return { success: false, error: 'No tab ID found' };
  await fillSessions.clear(tabId);
  return { success: true };
}

// Cleanup active filling sessions when tabs are closed
chrome.tabs.onRemoved.addListener((tabId) => {
  fillSessions.clear(tabId).catch(() => {});
});
