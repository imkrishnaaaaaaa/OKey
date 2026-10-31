/**
 * OKey — Core: Domain extraction & credential matching
 *
 * Extracts a registrable domain (eTLD+1) and ranks stored credentials by how
 * confidently they match the current page. Supports optional glob URL
 * `matchPatterns` for path-scoped matches (e.g. "site.com/admin/*").
 *
 * The registrable domain comes from the Public Suffix List (tldts) with private
 * suffixes on, so hosting domains such as github.io or vercel.app count as
 * suffixes. Without that, one user's site would look like the same site as
 * another user's and be offered their login.
 */

import { parse } from 'tldts';

const PSL = { allowPrivateDomains: true };

/**
 * Registrable domain of a lowercase hostname. IPs and localhost are their own
 * domain. Null when the host is itself a public suffix (github.io, co.uk, com).
 */
function registrable(hostname) {
  if (hostname === 'localhost' || hostname.includes(':') || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return hostname;
  return parse(hostname, PSL).domain;
}

/**
 * Extract the registrable domain (eTLD+1) from a URL or hostname.
 * @param {string} input URL or bare hostname
 * @returns {string|null}
 */
export function extractDomain(input) {
  let hostname = input;
  try {
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(input)) hostname = new URL(input).hostname;
    else hostname = new URL('https://' + input).hostname;
  } catch {
    return null;
  }
  hostname = hostname.toLowerCase().replace(/\.$/, '');
  if (!hostname) return null;
  return registrable(hostname) ?? hostname;
}

/**
 * Normalize a domain string for storage (strip scheme, path, port, leading www).
 * @param {string} input
 * @returns {string}
 */
export function normalizeDomain(input) {
  if (!input) return '';
  let host;
  try {
    host = new URL(input.includes('://') ? input : 'https://' + input).hostname.toLowerCase();
  } catch {
    host = String(input).toLowerCase().replace(/^(https?:\/\/)?/, '').replace(/[/:?#].*$/, '');
  }
  return host.replace(/^www\./, '').replace(/\.$/, '').trim();
}

/** Friendly hostname for display: the subdomain plus the name, without the suffix. */
export function getDisplayDomain(url) {
  try {
    const host = new URL(url.includes('://') ? url : 'https://' + url).hostname.toLowerCase()
      .replace(/^www\./, '').replace(/\.$/, '');
    const { subdomain, domainWithoutSuffix } = parse(host, PSL);
    return subdomain && domainWithoutSuffix ? `${subdomain}.${domainWithoutSuffix}` : host;
  } catch {
    return url;
  }
}

/**
 * Convert a glob pattern ("site.com/login/*") to a RegExp anchored to a
 * scheme-less "host/path" string. `*` matches within a segment span, not `/`
 * unless trailing `/*` (then it spans everything).
 * @param {string} pattern
 * @returns {RegExp}
 */
function globToRegExp(pattern) {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const body = escaped.replace(/\*/g, '.*');
  return new RegExp('^' + body + '$', 'i');
}

/**
 * Match a URL against stored entries; returns matches sorted by confidence desc.
 * @param {string} url current page URL
 * @param {Array<{id:string, domain:string, matchPatterns?:string[]}>} entries
 * @returns {Array<{id:string, domain:string, confidence:number}>}
 */
export function matchDomain(url, entries) {
  let hostname;
  let hostPath;
  try {
    const u = new URL(url.includes('://') ? url : 'https://' + url);
    hostname = u.hostname.toLowerCase();
    hostPath = (hostname + u.pathname).replace(/\/$/, '');
  } catch {
    return [];
  }
  const root = extractDomain(url);
  if (!root) return [];

  const matches = [];
  for (const entry of entries) {
    if (!entry || !entry.domain) continue;
    const entryDomain = normalizeDomain(entry.domain);
    // A dotless entry domain ("com") would match every site under that TLD —
    // only "localhost" is a legitimate dotless host (revamp M8).
    if (!entryDomain.includes('.') && entryDomain !== 'localhost') continue;
    // A login saved on a shared suffix itself ("github.io") would be offered on
    // every site under it. Skip it, like the dotless case above.
    if (registrable(entryDomain) === null) continue;
    let confidence = 0;

    // Highest precedence: explicit path pattern match. The pattern's host
    // part must actually belong to the current site, so "site.com*" can
    // never bless "site.com.evil.com" (revamp M8).
    if (Array.isArray(entry.matchPatterns)) {
      for (const pat of entry.matchPatterns) {
        const normPat = pat.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        const patHost = normPat.split('/')[0].replace(/\*/g, '') || '';
        const patRoot = patHost ? registrable(patHost) : null;
        const sameSite = patRoot && (patRoot === root || hostname.endsWith('.' + patRoot));
        if (sameSite && globToRegExp(normPat).test(hostPath)) {
          confidence = Math.max(confidence, 100);
          break;
        }
      }
    }
    if (hostname === entryDomain || hostname.replace(/^www\./, '') === entryDomain) {
      confidence = Math.max(confidence, 95);
    } else if (root === entryDomain) {
      confidence = Math.max(confidence, 88);
    } else if (hostname.endsWith('.' + entryDomain)) {
      confidence = Math.max(confidence, 80);
    } else if (entryDomain.endsWith('.' + root)) {
      confidence = Math.max(confidence, 70);
    }

    if (confidence > 0) matches.push({ id: entry.id, domain: entry.domain, confidence });
  }
  matches.sort((a, b) => b.confidence - a.confidence || a.domain.localeCompare(b.domain));
  return matches;
}
