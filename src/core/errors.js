/**
 * OKey — Core: Typed errors
 *
 * Typed error classes let UI layers distinguish recoverable conditions
 * (wrong password) from programmer errors, without leaking sensitive detail.
 */

export class OKeyError extends Error {
  /** @param {string} message @param {string} code */
  constructor(message, code = 'OKEY_ERROR') {
    super(message);
    this.name = 'OKeyError';
    this.code = code;
  }
}

/** Wrong master password / failed authenticated decryption. */
export class DecryptionError extends OKeyError {
  constructor(message = 'Decryption failed — wrong key or tampered data') {
    super(message, 'DECRYPTION_FAILED');
    this.name = 'DecryptionError';
  }
}

/** Vault is locked but an operation required it unlocked. */
export class VaultLockedError extends OKeyError {
  constructor(message = 'Vault is locked') {
    super(message, 'VAULT_LOCKED');
    this.name = 'VaultLockedError';
  }
}

/** Stored data does not match an expected/known format version. */
export class FormatError extends OKeyError {
  constructor(message = 'Unsupported or corrupt data format') {
    super(message, 'FORMAT_ERROR');
    this.name = 'FormatError';
  }
}

/** Validation of caller-supplied data failed. */
export class ValidationError extends OKeyError {
  constructor(message = 'Validation failed') {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

/** Network / transport layer failure during sync. */
export class SyncError extends OKeyError {
  constructor(message = 'Sync failed', code = 'SYNC_ERROR') {
    super(message, code);
    this.name = 'SyncError';
  }
}
