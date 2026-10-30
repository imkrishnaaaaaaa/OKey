/**
 * Platform-neutral session bridge. Extension registers chrome.storage.session
 * impl; PWA registers a sessionStorage impl. Core code only ever sees these.
 */
let impl = {
  cacheDek: async () => {},
  getCachedDek: async () => null,
  touchSession: () => {},
  clearSession: async () => {},
};
export function setSessionBridge(real) { impl = real; }
export const cacheDek = (...a) => impl.cacheDek(...a);
export const getCachedDek = (...a) => impl.getCachedDek(...a);
export const touchSession = (...a) => impl.touchSession(...a);
export const clearSession = (...a) => impl.clearSession(...a);
