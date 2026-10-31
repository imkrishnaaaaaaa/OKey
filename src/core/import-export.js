/**
 * OKey — Core: Import / Export
 *
 * Parsers return PARTIAL entry data; the Vault normalizes & validates them via
 * createEntry/validateEntry. Exports are plaintext by design (user-initiated
 * backup) and are hardened against CSV formula injection.
 */

import { ENTRY_TYPES } from './constants.js';
import { parseOtpAuthUri, parseTotpInput, normalizeTotpParams, hasCustomTotp, buildOtpAuthUri } from './totp.js';
import { normalizeDomain } from './domain-matcher.js';
import { nowIso } from './util.js';
import { ValidationError } from './errors.js';

/** The backup file format this version writes and reads. */
const BACKUP_VERSION = 2;

// ---- CSV parsing ----

/**
 * Parse CSV text into rows of cells, one character at a time, so a quoted cell
 * can hold commas, quotes ("") and line breaks. Blank lines are skipped.
 */
function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cur = '';
  let q = false;
  const endRow = () => {
    row.push(cur);
    cur = '';
    if (row.some((c) => c.trim())) rows.push(row);
    row = [];
  };
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cur); cur = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      endRow();
    } else cur += ch;
  }
  if (cur || row.length) endRow();
  return rows;
}

function parseCsv(csv) {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.toLowerCase().trim());
  return rows.slice(1).map((values) => {
    const row = {};
    headers.forEach((h, i) => (row[h] = (values[i] || '').trim()));
    return row;
  });
}

const tag = (...t) => t.filter(Boolean);

// ---- Importers (→ partial entries) ----

/** Chrome passwords CSV: name,url,username,password. */
export function importChrome(csv) {
  return parseCsv(csv)
    .map((r) => ({
      siteName: r.name || '',
      domain: normalizeDomain(r.url || ''),
      username: r.username || '',
      password: r.password || '',
      entryType: ENTRY_TYPES.PASSWORD,
      tags: tag('imported', 'chrome'),
      notes: r.url && r.url !== `https://${normalizeDomain(r.url)}` ? `Original URL: ${r.url}` : '',
    }))
    .filter((e) => e.domain || e.siteName);
}

/** LastPass CSV: url,username,password,totp,extra,name,grouping,fav. */
export function importLastPass(csv) {
  return parseCsv(csv)
    .map((r) => ({
      siteName: r.name || '',
      domain: normalizeDomain(r.url || ''),
      username: r.username || '',
      password: r.password || '',
      totpSecret: r.totp || '',
      entryType: ENTRY_TYPES.PASSWORD,
      tags: tag('imported', 'lastpass', r.grouping),
      notes: r.extra || '',
      isFavorite: r.fav === '1',
    }))
    .filter((e) => e.domain || e.siteName);
}

/** Zoho Vault CSV: SecretName,SecretURL,UserName,Password,Notes,Tags. */
export function importZohoVault(csv) {
  return parseCsv(csv)
    .map((r) => ({
      siteName: r.secretname || r.name || '',
      domain: normalizeDomain(r.secreturl || r.url || ''),
      username: r.username || '',
      password: r.password || '',
      entryType: ENTRY_TYPES.PASSWORD,
      tags: tag('imported', 'zoho', ...(r.tags ? r.tags.split(';').map((t) => t.trim()) : [])),
      notes: r.notes || '',
    }))
    .filter((e) => e.domain || e.siteName);
}

/** Bitwarden unencrypted JSON export. */
export function importBitwarden(jsonText) {
  const data = JSON.parse(jsonText);
  if (data.encrypted) throw new Error('Encrypted Bitwarden exports are not supported — export as unencrypted JSON');
  return (data.items || [])
    .filter((it) => it.type === 1 || it.login)
    .map((it) => {
      const login = it.login || {};
      const uri = (login.uris || [])[0]?.uri || '';
      // Bitwarden stores an otpauth:// URI here when the account is not 6 digits / 30 s / SHA-1.
      let totp = { secret: login.totp || '', params: null };
      try { totp = parseTotpInput(login.totp); } catch { /* keep the raw text */ }
      return {
        siteName: it.name || '',
        domain: uri ? normalizeDomain(uri) : '',
        username: login.username || '',
        password: login.password || '',
        totpSecret: totp.secret,
        ...(totp.params || {}),
        entryType: ENTRY_TYPES.PASSWORD,
        tags: tag('imported', 'bitwarden'),
        notes: it.notes || '',
        isFavorite: !!it.favorite,
        customFields: (it.fields || []).map((f) => ({ label: f.name || '', value: f.value || '', hidden: f.type === 1 })),
      };
    })
    .filter((e) => e.domain || e.siteName);
}

/** Any text containing otpauth:// URIs (e.g. Google Authenticator export). */
export function importOtpAuthUris(text) {
  const matches = String(text).match(/otpauth:\/\/totp\/[^\s"']+/g) || [];
  return matches
    .map((uri) => {
      try {
        const p = parseOtpAuthUri(uri);
        return {
          siteName: p.issuer || p.account || '',
          domain: p.issuer ? normalizeDomain(p.issuer) : '',
          username: p.account || '',
          totpSecret: p.secret,
          ...normalizeTotpParams(p),
          entryType: ENTRY_TYPES.TOTP,
          tags: tag('imported', 'authenticator'),
          notes: p.issuer ? `Issuer: ${p.issuer}` : '',
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

/**
 * Read an OKey backup file (made by exportOkeyBackup). Checks everything the
 * restore will rely on before any of it is used, and says what is wrong in plain
 * words. It never returns a half-valid file.
 * @returns {{ version: number, salt: string, kdfParams: object|null, wrappedRecovery: string, records: object[] }}
 * @throws {ValidationError}
 */
export function importOkeyBackup(jsonText) {
  let data;
  try {
    data = JSON.parse(jsonText);
  } catch {
    throw new ValidationError('This file is not valid JSON, so it is not an OKey backup');
  }
  if (!data || typeof data !== 'object' || data.format !== 'okey') {
    throw new ValidationError('This is not an OKey backup file');
  }
  if (!Number.isInteger(data.version) || data.version > BACKUP_VERSION) {
    throw new ValidationError('This backup was made by a newer version of OKey. Update OKey and try again');
  }
  const damaged = (what) => new ValidationError(`This backup file is damaged (missing ${what})`);
  if (typeof data.salt !== 'string' || !data.salt) throw damaged('the salt');
  if (typeof data.wrappedRecovery !== 'string' || !data.wrappedRecovery) throw damaged('the recovery key part');
  if (!Array.isArray(data.records)) throw damaged('the records');
  if (data.records.some((r) => !r || typeof r.id !== 'string' || typeof r.payload !== 'string')) throw damaged('some records');
  return {
    version: data.version,
    salt: data.salt,
    kdfParams: data.kdfParams && typeof data.kdfParams === 'object' ? data.kdfParams : null,
    wrappedRecovery: data.wrappedRecovery,
    records: data.records,
  };
}

// ---- Exporters ----

/** Neutralize spreadsheet formula injection in CSV cells. */
function csvCell(value) {
  let s = value == null ? '' : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // defuse =cmd(), +, -, @ leading chars
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Plaintext CSV export of decrypted entries. */
export function exportCsv(entries) {
  const headers = ['Site Name', 'Domain', 'Username', 'Password', 'TOTP Secret', 'Notes', 'Tags', 'Type'];
  const rows = entries
    .filter((e) => !e.isDeleted)
    .map((e) =>
      [e.siteName, e.domain, e.username, e.password, e.totpSecret, e.notes, (e.tags || []).join('; '), e.entryType]
        .map(csvCell)
        .join(','),
    );
  return [headers.join(','), ...rows].join('\n');
}

/** Bare secret for default settings, otpauth:// URI otherwise, so digits/period/algorithm survive. */
function bitwardenTotp(e) {
  if (!e.totpSecret) return null;
  if (!hasCustomTotp(e)) return e.totpSecret;
  return buildOtpAuthUri({
    secret: e.totpSecret, issuer: e.siteName || e.domain || 'OKey', account: e.username || 'account',
    digits: e.totpDigits, period: e.totpPeriod, algorithm: e.totpAlgorithm,
  });
}

/** Bitwarden-compatible plaintext JSON export. */
export function exportBitwardenJson(entries) {
  const items = entries
    .filter((e) => !e.isDeleted)
    .map((e) => ({
      type: 1,
      name: e.siteName || e.domain || 'Untitled',
      notes: e.notes || null,
      favorite: !!e.isFavorite,
      login: {
        uris: e.domain ? [{ match: null, uri: `https://${e.domain}` }] : [],
        username: e.username || null,
        password: e.password || null,
        totp: bitwardenTotp(e),
      },
      fields: (e.customFields || []).map((f) => ({ name: f.label, value: f.value, type: f.hidden ? 1 : 0 })),
    }));
  return JSON.stringify({ encrypted: false, folders: [], items }, null, 2);
}

/**
 * Encrypted native backup. Records stay ciphertext. The key is wrapped by the
 * 24 recovery words only: a 4-digit PIN wrap in a file could be brute-forced
 * offline, so wrappedMaster is never written here.
 */
export function exportOkeyBackup({ salt, kdfParams, wrappedRecovery, records }) {
  return JSON.stringify(
    { format: 'okey', version: BACKUP_VERSION, exportedAt: nowIso(), salt, kdfParams, wrappedRecovery, records },
    null,
    2,
  );
}
