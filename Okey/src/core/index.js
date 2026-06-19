/**
 * OKey — Core: public barrel.
 * Single import surface for platform layers (extension, PWA).
 */
export * from './constants.js';
export * from './errors.js';
export * from './encoding.js';
export * from './crypto.js';
export * from './kdf.js';
export * from './schema.js';
export * from './totp.js';
export * from './password-generator.js';
export * from './domain-matcher.js';
export * from './recovery.js';
export * from './util.js';
export { Vault } from './vault.js';
export { SyncEngine } from './sync.js';
export { MemoryStorageAdapter } from './adapters.js';
export * as importExport from './import-export.js';
