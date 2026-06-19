/**
 * OKey — Core: Domain extraction & credential matching
 *
 * Extracts a registrable domain (eTLD+1) and ranks stored credentials by how
 * confidently they match the current page. Supports optional glob URL
 * `matchPatterns` for path-scoped matches (e.g. "site.com/admin/*").
 *
 * A full Public Suffix List is ~240KB; instead we ship a compact set of common
 * multi-level suffixes which covers the long tail of real-world logins without
 * the bundle cost. Unknown suffixes fall back to the last two labels.
 */

/** Common multi-level public suffixes (registrable domain = suffix + 1 label). */
const MULTI_LEVEL_SUFFIXES = new Set([
  'co.uk', 'org.uk', 'me.uk', 'gov.uk', 'ac.uk', 'co.jp', 'or.jp', 'ne.jp', 'co.kr',
  'com.au', 'net.au', 'org.au', 'gov.au', 'edu.au', 'co.nz', 'org.nz', 'govt.nz',
  'com.br', 'com.cn', 'com.tr', 'com.mx', 'com.ar', 'com.sg', 'com.hk', 'com.tw',
  'co.in', 'co.za', 'co.id', 'co.il', 'com.sa', 'com.ua', 'co.th', 'or.th',
]);

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
  // IPv4 / IPv6 / localhost → return as-is.
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(':') || hostname === 'localhost') {
    return hostname;
  }
  const parts = hostname.split('.');
  if (parts.length <= 2) return hostname;
  const lastTwo = parts.slice(-2).join('.');
  if (MULTI_LEVEL_SUFFIXES.has(lastTwo) && parts.length >= 3) return parts.slice(-3).join('.');
  return lastTwo;
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

/** Friendly hostname for display. */
export function getDisplayDomain(url) {
  try {
    return new URL(url.includes('://') ? url : 'https://' + url).hostname.replace(/^www\./, '');
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
    let confidence = 0;

    // Highest precedence: explicit path pattern match.
    if (Array.isArray(entry.matchPatterns)) {
      for (const pat of entry.matchPatterns) {
        const normPat = pat.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '');
        if (globToRegExp(normPat).test(hostPath)) {
          confidence = Math.max(confidence, 100);
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
