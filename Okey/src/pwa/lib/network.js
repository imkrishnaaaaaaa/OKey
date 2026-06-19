/**
 * OKey PWA — Network adapter (Google Identity Services token)
 *
 * Sync to the Apps Script backend needs an OAuth bearer token. On the web we
 * use Google Identity Services (GIS). Sync is OPTIONAL — the PWA is a fully
 * functional local zero-knowledge vault without it. Configure a GIS client id
 * to enable cross-device sync.
 */

const GIS_SRC = 'https://accounts.google.com/gsi/client';
const SCOPE = 'https://www.googleapis.com/auth/userinfo.email';

let tokenClient = null;
let cachedToken = null;
let tokenExpiry = 0;

/** Set/get the GIS OAuth client id (persisted in localStorage). */
export function setGoogleClientId(id) {
  localStorage.setItem('okey_gis_client_id', id || '');
  tokenClient = null;
}
export function getGoogleClientId() {
  return localStorage.getItem('okey_gis_client_id') || '';
}

function loadGis() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.oauth2) return resolve();
    const s = document.createElement('script');
    s.src = GIS_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
}

export const pwaNetwork = {
  fetch: (url, init) => fetch(url, init),
  async getAuthToken() {
    const clientId = getGoogleClientId();
    if (!clientId) return null;
    if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;
    await loadGis();
    return new Promise((resolve) => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (resp) => {
          if (resp.access_token) {
            cachedToken = resp.access_token;
            tokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000;
            resolve(cachedToken);
          } else resolve(null);
        },
        error_callback: () => resolve(null),
      });
      tokenClient.requestAccessToken({ prompt: '' });
    });
  },
};
