/**
 * What the service worker tells a web page about saved logins.
 *
 * Two steps, so a page never sees a secret it did not earn:
 *   1. listSiteCredentials: names only (id, site, username). No password, no code.
 *   2. getCredentialSecret: the fill data for ONE login, after the user clicked it.
 *      A login that does not match the page's site is refused unless the user
 *      picked it by hand from the "other logins" list.
 */

import { matchDomain } from '../../core/domain-matcher.js';
import { generateTOTP, isValidTotpSecret, totpOptions } from '../../core/totp.js';

const OTHERS_SHOWN = 8;
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Only https pages, plus local development. On http, anyone on the same network
 * can change the page, so a login must not be offered or filled there.
 */
export function isSecurePage(url) {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' || (u.protocol === 'http:' && LOCAL_HOSTS.has(u.hostname));
  } catch {
    return false;
  }
}

const summary = (e) => ({ id: e.id, siteName: e.siteName || e.domain, domain: e.domain, username: e.username });

/** @param {import('../../core/vault.js').Vault} vault an unlocked vault */
export function listSiteCredentials(vault, url) {
  if (!isSecurePage(url)) return { matches: [], others: [], insecure: true };
  const all = vault.getEntries({ type: 'password' });
  const ranked = matchDomain(url, all);
  const rankedIds = new Set(ranked.map((m) => m.id));
  return {
    matches: ranked.map((m) => all.find((e) => e.id === m.id)).filter(Boolean).map(summary),
    others: all.filter((e) => !rankedIds.has(e.id)).slice(0, OTHERS_SHOWN).map(summary),
  };
}

/**
 * @param {import('../../core/vault.js').Vault} vault an unlocked vault
 * @param {string} url the page asking
 * @param {string} id the login the user clicked
 * @param {{ picked?: boolean }} [opts] picked: the user chose it from "other logins"
 */
export async function getCredentialSecret(vault, url, id, { picked = false } = {}) {
  if (!isSecurePage(url)) throw Object.assign(new Error('OKey does not fill on pages that are not https'), { code: 'INSECURE' });
  const e = vault.getEntries({ type: 'password' }).find((x) => x.id === id);
  if (!e) throw Object.assign(new Error('Login not found'), { code: 'NOT_FOUND' });
  if (!picked && !matchDomain(url, [e]).length) {
    throw Object.assign(new Error('This login does not match this site'), { code: 'NO_MATCH' });
  }
  // Made now, not when the list was drawn, so the code is current when it is filled.
  const totpCode = e.totpSecret && isValidTotpSecret(e.totpSecret)
    ? (await generateTOTP(e.totpSecret, totpOptions(e)).catch(() => ({}))).code || null
    : null;
  return { id: e.id, username: e.username, password: e.password, hasTotp: !!e.totpSecret, totpCode };
}
