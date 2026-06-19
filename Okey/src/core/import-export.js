/**
 * OKey — Core: Import / Export
 *
 * Parsers return PARTIAL entry data; the Vault normalizes & validates them via
 * createEntry/validateEntry. Exports are plaintext by design (user-initiated
 * backup) and are hardened against CSV formula injection.
 */

import { ENTRY_TYPES } from './constants.js';
import { parseOtpAuthUri } from './totp.js';
import { normalizeDomain } from './domain-matcher.js';
import { nowIso } from './util.js';

// ---- CSV parsing ----

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (q && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else q = !q;
    } else if (ch === ',' && !q) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseCsv(csv) {
  const lines = csv.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
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
      entryType: r.totp ? ENTRY_TYPES.PASSWORD : ENTRY_TYPES.PASSWORD,
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
      return {
        siteName: it.name || '',
        domain: uri ? normalizeDomain(uri) : '',
        username: login.username || '',
        password: login.password || '',
        totpSecret: login.totp || '',
        entryType: login.totp ? ENTRY_TYPES.PASSWORD : ENTRY_TYPES.PASSWORD,
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

/** OKey native encrypted backup of a single vault's records (ciphertext stays encrypted). */
export function importOkeyBackup(jsonText) {
  const data = JSON.parse(jsonText);
  if (data.format !== 'okey') throw new Error('Not an OKey backup file');
  return data; // { format, version, exportedAt, salt, kdfParams, wrappedMaster, wrappedRecovery, records }
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
        totp: e.totpSecret || null,
      },
      fields: (e.customFields || []).map((f) => ({ name: f.label, value: f.value, type: f.hidden ? 1 : 0 })),
    }));
  return JSON.stringify({ encrypted: false, folders: [], items }, null, 2);
}

/** Encrypted native backup — records stay ciphertext; only the user's secrets can open them. */
export function exportOkeyBackup({ salt, kdfParams, wrappedMaster, wrappedRecovery, records }) {
  return JSON.stringify(
    { format: 'okey', version: 2, exportedAt: nowIso(), salt, kdfParams, wrappedMaster, wrappedRecovery, records },
    null,
    2,
  );
}
