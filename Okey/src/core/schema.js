/**
 * OKey — Core: Entry schema, normalization & validation
 *
 * Defines the canonical vault entry shape and guards the boundary where
 * untrusted input (forms, imports, sync payloads) becomes vault state.
 */

import { APP, ENTRY_TYPES } from './constants.js';
import { ValidationError } from './errors.js';

/**
 * @typedef {Object} VaultEntry
 * @property {string} id              UUID v4
 * @property {string} domain          normalized domain (cleartext metadata, searchable)
 * @property {string} siteName
 * @property {string} nickname
 * @property {string} entryType       'password' | 'totp'
 * @property {string[]} tags
 * @property {string[]} matchPatterns glob URL patterns, e.g. "site.com/login/*"
 * @property {boolean} isFavorite
 * @property {boolean} isPinned
 * @property {number} displayOrder
 * @property {string} createdAt        ISO 8601
 * @property {string} updatedAt        ISO 8601
 * @property {string} lastUsedAt       ISO 8601
 * @property {number} version          monotonically increasing per edit (for sync)
 * @property {boolean} isDeleted       soft-delete tombstone
 * @property {string} username         SENSITIVE
 * @property {string} password         SENSITIVE
 * @property {string} totpSecret       SENSITIVE (Base32)
 * @property {string} notes            SENSITIVE
 * @property {Array<{label:string,value:string,hidden:boolean}>} customFields SENSITIVE
 * @property {number} schemaVersion
 */

/** Sensitive fields — never stored in cleartext, never logged. */
export const SENSITIVE_FIELDS = Object.freeze(['username', 'password', 'totpSecret', 'notes', 'customFields']);

/** Cleartext metadata fields stored alongside ciphertext (searchable/syncable). */
export const METADATA_FIELDS = Object.freeze([
  'id', 'domain', 'entryType', 'version', 'isDeleted', 'updatedAt', 'displayOrder', 'isPinned',
]);

const isString = (v) => typeof v === 'string';
const clampStr = (v, max) => (isString(v) ? v.slice(0, max) : '');

/**
 * Build a fully-formed entry from partial user/import data.
 * @param {Partial<VaultEntry>} data
 * @param {() => string} genId  id generator (injected; uses crypto)
 * @param {() => string} nowIso timestamp generator (injected)
 * @returns {VaultEntry}
 */
export function createEntry(data, genId, nowIso) {
  const ts = nowIso();
  const entryType = data.entryType === ENTRY_TYPES.TOTP ? ENTRY_TYPES.TOTP : ENTRY_TYPES.PASSWORD;
  return {
    id: data.id || genId(),
    domain: clampStr(data.domain, 253).toLowerCase(),
    siteName: clampStr(data.siteName, 200),
    nickname: clampStr(data.nickname, 200),
    entryType,
    tags: sanitizeStringArray(data.tags, 30, 50),
    matchPatterns: sanitizeStringArray(data.matchPatterns, 20, 300),
    isFavorite: !!data.isFavorite,
    isPinned: !!data.isPinned,
    displayOrder: Number.isFinite(data.displayOrder) ? data.displayOrder : 0,
    createdAt: data.createdAt || ts,
    updatedAt: data.updatedAt || ts,
    lastUsedAt: data.lastUsedAt || ts,
    version: Number.isInteger(data.version) && data.version > 0 ? data.version : 1,
    isDeleted: !!data.isDeleted,
    username: clampStr(data.username, 1000),
    password: clampStr(data.password, 10000),
    totpSecret: clampStr(data.totpSecret, 1000).replace(/\s+/g, ''),
    notes: clampStr(data.notes, 20000),
    customFields: sanitizeCustomFields(data.customFields),
    schemaVersion: APP.ENTRY_SCHEMA_VERSION,
  };
}

/** @param {*} arr @param {number} maxItems @param {number} maxLen */
export function sanitizeStringArray(arr, maxItems, maxLen) {
  if (!Array.isArray(arr)) return [];
  return arr.filter(isString).map((s) => s.slice(0, maxLen).trim()).filter(Boolean).slice(0, maxItems);
}

/** @param {*} fields */
export function sanitizeCustomFields(fields) {
  if (!Array.isArray(fields)) return [];
  return fields
    .filter((f) => f && isString(f.label))
    .map((f) => ({ label: f.label.slice(0, 200), value: clampStr(f.value, 10000), hidden: !!f.hidden }))
    .slice(0, 50);
}

/**
 * Validate an entry before persistence. Throws ValidationError on failure.
 * @param {VaultEntry} entry
 */
export function validateEntry(entry) {
  if (!entry || typeof entry !== 'object') throw new ValidationError('Entry must be an object');
  if (!isString(entry.id) || entry.id.length < 8) throw new ValidationError('Entry id is invalid');
  // An entry must be identifiable by at least one of: domain, siteName, nickname.
  if (!entry.domain && !entry.siteName && !entry.nickname) {
    throw new ValidationError('Entry needs a domain, site name, or nickname');
  }
  if (entry.entryType === ENTRY_TYPES.TOTP && !entry.totpSecret) {
    throw new ValidationError('Authenticator entries require a TOTP secret');
  }
  return true;
}
