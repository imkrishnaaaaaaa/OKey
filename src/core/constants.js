/**
 * OKey — Core: Constants & configuration defaults
 *
 * Single source of truth for tunables shared across the extension and PWA.
 * Platform-agnostic (no chrome.*, no DOM).
 */

export const APP = Object.freeze({
  NAME: 'OKey',
  VERSION: '1.0.0',
  APPSCRIPT_VERSION: '1.0.0',
  SCHEMA_VERSION: '1.0.0',
  /** Bumped when the at-rest vault container format changes. */
  VAULT_FORMAT_VERSION: 2,
  /** Bumped when an individual entry's schema changes. */
  ENTRY_SCHEMA_VERSION: 1,
  MAX_ENTRIES: 10000,
  MAX_SHEETS: 3,
});

/**
 * Key Derivation Function parameters.
 *
 * Argon2id is preferred (memory-hard, GPU/ASIC resistant). PBKDF2 is the
 * fallback when WASM is unavailable. Parameters are persisted per-vault so a
 * vault created on a strong device still verifies on a weaker one.
 */
export const KDF = Object.freeze({
  ARGON2_TIME: 3,            // iterations (t)
  ARGON2_MEMORY_KIB: 65536,  // 64 MiB (m)
  ARGON2_PARALLELISM: 1,     // single lane — deterministic across platforms
  ARGON2_HASH_LENGTH: 32,    // 256-bit output
  PBKDF2_ITERATIONS: 600000, // OWASP 2024 for PBKDF2-HMAC-SHA256
  PBKDF2_HASH: 'SHA-256',
  SALT_LENGTH: 32,
});

/** AES-GCM symmetric encryption constants. */
export const CRYPTO = Object.freeze({
  ALGORITHM: 'AES-GCM',
  KEY_LENGTH: 256,
  IV_LENGTH: 12,   // 96-bit nonce (GCM recommended)
  TAG_LENGTH: 128, // 128-bit auth tag (bits)
  SALT_LENGTH: 32,
});

/** Auto-lock (seconds), clipboard, and session security defaults. */
export const SECURITY = Object.freeze({
  DEFAULT_AUTO_LOCK_SECONDS: 60,
  MIN_AUTO_LOCK_SECONDS: 30,
  MAX_AUTO_LOCK_SECONDS: 1800,
  /** Re-open popup within this window → restore unlocked session without re-typing. */
  SESSION_REUNLOCK_COOLDOWN_MINUTES: 1,
  DEFAULT_CLIPBOARD_CLEAR_SECONDS: 30,
  MIN_CLIPBOARD_CLEAR_SECONDS: 10,
  MAX_CLIPBOARD_CLEAR_SECONDS: 120,
  IDLE_DETECTION_INTERVAL: 15,
  MIN_MASTER_PASSWORD_LENGTH: 4, // 4-digit PIN
  MAX_FAILED_UNLOCKS: 30,
  WARN_FAILED_UNLOCKS: 25,
});

/** Sync timing and retry strategy. */
export const SYNC = Object.freeze({
  DEFAULT_INTERVAL_MINUTES: 1440, // 24h
  MIN_INTERVAL_MINUTES: 15,
  MAX_INTERVAL_MINUTES: 10080,    // 7 days (must be ≥ DEFAULT; previously 60 — bug)
  DEBOUNCE_MS: 10000,
  MAX_RETRIES: 10,
  INITIAL_BACKOFF_MS: 1000,
  MAX_BACKOFF_MS: 300000,
  TOMBSTONE_RETENTION_DAYS: 30,
  ALARM_NAME: 'okey-sync',
  AUTO_LOCK_ALARM: 'okey-auto-lock',
  CLIPBOARD_ALARM: 'okey-clipboard-clear',
});

/** TOTP defaults (RFC 6238). */
export const TOTP = Object.freeze({
  DEFAULT_PERIOD: 30,
  DEFAULT_DIGITS: 6,
  DEFAULT_ALGORITHM: 'SHA-1',
  /** Accept codes ±1 step to tolerate clock skew when validating. */
  VALIDATION_WINDOW: 1,
});

/** Password generator defaults. */
export const PASSWORD_GEN = Object.freeze({
  DEFAULT_LENGTH: 20,
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  DEFAULT_UPPERCASE: true,
  DEFAULT_LOWERCASE: true,
  DEFAULT_NUMBERS: true,
  DEFAULT_SYMBOLS: true,
  SYMBOL_SET: '!@#$%^&*()_+-=[]{}|;:,.<>?',
  PASSPHRASE_DEFAULT_WORDS: 5,
  PASSPHRASE_SEPARATOR: '-',
});

/** Favicon caching policy (privacy: fetch once, cache locally, refresh weekly). */
export const FAVICON = Object.freeze({
  ENABLED: true,
  SIZE: 32,
  REFRESH_AFTER_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  PROVIDER: 'https://www.google.com/s2/favicons',
});

/** User settings synced via the Sheet (non-sensitive). */
export const DEFAULT_SETTINGS = Object.freeze({
  autoLockTimeout: SECURITY.DEFAULT_AUTO_LOCK_SECONDS,
  sessionReunlockCooldown: SECURITY.SESSION_REUNLOCK_COOLDOWN_MINUTES,
  clipboardClearTimeout: SECURITY.DEFAULT_CLIPBOARD_CLEAR_SECONDS,
  biometricEnabled: false,
  autoSyncEnabled: true,
  syncIntervalMinutes: SYNC.DEFAULT_INTERVAL_MINUTES,
  showRecents: true,
  recentsMaxCount: 10,
  faviconsEnabled: true,
  theme: 'system',
  passwordGeneratorDefaults: {
    length: PASSWORD_GEN.DEFAULT_LENGTH,
    uppercase: PASSWORD_GEN.DEFAULT_UPPERCASE,
    lowercase: PASSWORD_GEN.DEFAULT_LOWERCASE,
    numbers: PASSWORD_GEN.DEFAULT_NUMBERS,
    symbols: PASSWORD_GEN.DEFAULT_SYMBOLS,
  },
});

/**
 * Storage keys (clean-slate `okey_` namespace).
 * A migration shim maps any legacy `vaultsheet_` keys on first run.
 */
export const STORAGE_KEYS = Object.freeze({
  VAULT_DATA: 'okey_vault',
  VAULT_SALT: 'okey_salt',
  KDF_PARAMS: 'okey_kdf_params',
  WRAPPED_BY_MASTER: 'okey_wrapped_master',
  WRAPPED_BY_RECOVERY: 'okey_wrapped_recovery',
  VAULT_METADATA: 'okey_metadata',
  SETTINGS: 'okey_settings',
  SHEETS_CONFIG: 'okey_sheets',
  OFFLINE_QUEUE: 'okey_offline_queue',
  LAST_SYNC_AT: 'okey_last_sync',
  RECENTS: 'okey_recents',
  THEME: 'okey_theme',
  SETUP_COMPLETE: 'okey_setup_complete',
  FAVICON_CACHE: 'okey_favicon_cache',
  BIOMETRIC_CRED_ID: 'okey_biometric_cred_id',
  BIOMETRIC_WRAPPED: 'okey_biometric_wrapped',
  SCHEMA_MIGRATED: 'okey_schema_migrated',
  CACHED_FOLDERS: 'okey_cached_folders',
  FOLDERS_CACHE_TIME: 'okey_folders_cache_time',
  FAILED_UNLOCK_ATTEMPTS: 'okey_failed_unlocks',
  BACKEND_VERSION_MISMATCH: 'okey_backend_version_mismatch',
  BACKEND_CAPABILITIES: 'okey_backend_capabilities',
  BACKEND_DASHBOARD: 'okey_backend_dashboard',
  BACKEND_ANALYTICS: 'okey_backend_analytics',
  ANALYTICS_CACHE_TIME: 'okey_analytics_cache_time',
});

/** Legacy → new storage-key map for one-time migration of test data. */
export const LEGACY_STORAGE_KEYS = Object.freeze({
  vaultsheet_vault: STORAGE_KEYS.VAULT_DATA,
  vaultsheet_salt: STORAGE_KEYS.VAULT_SALT,
  vaultsheet_kdf_params: STORAGE_KEYS.KDF_PARAMS,
  vaultsheet_metadata: STORAGE_KEYS.VAULT_METADATA,
  vaultsheet_settings: STORAGE_KEYS.SETTINGS,
  vaultsheet_sheets: STORAGE_KEYS.SHEETS_CONFIG,
  vaultsheet_offline_queue: STORAGE_KEYS.OFFLINE_QUEUE,
  vaultsheet_last_sync: STORAGE_KEYS.LAST_SYNC_AT,
  vaultsheet_recents: STORAGE_KEYS.RECENTS,
  vaultsheet_theme: STORAGE_KEYS.THEME,
  vaultsheet_setup_complete: STORAGE_KEYS.SETUP_COMPLETE,
});

export const ENTRY_TYPES = Object.freeze({
  PASSWORD: 'password',
  TOTP: 'totp',
});

/** Sheet tab names (clean-slate OKey branding). */
export const SHEET_NAMES = Object.freeze({
  VAULT: 'OKeyVault',
  META: 'OKeyMeta',
  SETTINGS: 'OKeySettings',
  ORDER: 'OKeyOrder',
  CONFLICTS: 'OKeyConflicts',
});
