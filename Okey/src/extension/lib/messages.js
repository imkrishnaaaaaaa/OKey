/**
 * OKey Extension — Message types for popup ↔ service worker ↔ content script.
 */
export const MSG = Object.freeze({
  // Vault lifecycle (status is derived from session presence)
  VAULT_LOCKED: 'VAULT_LOCKED',
  LOCK_VAULT: 'LOCK_VAULT',

  // Settings
  GET_SETTINGS: 'GET_SETTINGS',
  UPDATE_SETTINGS: 'UPDATE_SETTINGS',

  // Clipboard
  COPY_TO_CLIPBOARD: 'COPY_TO_CLIPBOARD',

  // Sync
  TRIGGER_SYNC: 'TRIGGER_SYNC',
  RESCHEDULE_SYNC: 'RESCHEDULE_SYNC',
  SYNC_COMPLETE: 'SYNC_COMPLETE',
  SYNC_ERROR: 'SYNC_ERROR',

  // Site detection / autofill
  GET_CURRENT_SITE: 'GET_CURRENT_SITE',
  GET_SITE_CREDENTIALS: 'GET_SITE_CREDENTIALS',
  FILL_CREDENTIAL: 'FILL_CREDENTIAL',
  OPEN_POPUP: 'OPEN_POPUP',
  TOUCH_SESSION: 'TOUCH_SESSION',
});
