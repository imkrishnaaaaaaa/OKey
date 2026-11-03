/**
 * OKey UI — Icon set (Lucide-style inline SVGs).
 * `html:` only ever receives these static constants — never dynamic data.
 */

const s = (body) => `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

export const I = {
  logo: s('<path d="M8.3 10.6V7.2a3.7 3.7 0 0 1 7.4 0v3.4" stroke="currentColor" stroke-width="1.9" stroke-linecap="round"/><circle cx="12" cy="15.4" r="5.6" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="14.4" r="1.2" fill="currentColor"/><rect x="11.4" y="14.8" width="1.2" height="3" rx=".6" fill="currentColor"/>'),
  search: s('<circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m20 20-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  close: s('<path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  back: s('<path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  plus: s('<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  dots: s('<circle cx="12" cy="5" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="19" r="1.8" fill="currentColor"/>'),
  copy: s('<rect x="9" y="9" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  check: s('<path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'),
  user: s('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/>'),
  key: s('<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3M15.5 7.5 14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  eye: s('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>'),
  eyeOff: s('<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  clock: s('<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  star: s('<path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'),
  trash: s('<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13h10l1-13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'),
  refresh: s('<path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 3v4h-4M6 21v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  exportIcon: s('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m17 8-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  importIcon: s('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m7 10 5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  pinIcon: s('<path d="M12 17v5M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.89A.5.5 0 0 0 6.33 14h11.34a.5.5 0 0 0 .42-.56l-1.78-.89A2 2 0 0 1 15 10.76V7h-6v3.76zM15 3H9v4h6V3z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>'),
  lock: s('<rect x="3" y="11" width="18" height="11" rx="3.5" stroke="currentColor" stroke-width="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="16.2" r="1.5" fill="currentColor"/>'),
  shield: s('<path d="M12 22s8-3.5 8-9.5V5.5L12 2 4 5.5v7C4 18.5 12 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m9 12 2 2 4-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  wand: s('<path d="m15 4 5 5L7 22H2v-5L15 4Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m14 7 3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>'),
  sparkle: s('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/>'),
  warn: s('<path d="M12 9v4m0 4h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
  cloud: s('<path d="M17.5 19a4.5 4.5 0 0 0 .38-8.98A7 7 0 0 0 4.42 12.2 4 4 0 0 0 6 19.93" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  logout: s('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m16 17 5-5-5-5M21 12H9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'),
  gear: s('<circle cx="12" cy="12" r="3.2" stroke="currentColor" stroke-width="2"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.55 1.7 1.7 0 0 0-1.87.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.11 1.7 1.7 0 0 0-.34-1.87l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.7 1.7 0 0 0 1.87.34h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'),
  google: s('<path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.66l3.12-3.12C17.46 1.85 14.96.82 12 .82 7.7.82 3.98 3.28 2.18 6.86l3.66 2.84C6.71 7.03 9.14 5.04 12 5.04Z"/><path fill="#4285F4" d="M23.18 12.26c0-.92-.08-1.58-.26-2.27H12v4.3h6.44c-.13 1.08-.83 2.7-2.39 3.8l3.57 2.77c2.14-1.98 3.56-4.89 3.56-8.6Z"/><path fill="#FBBC05" d="M5.84 14.3A6.63 6.63 0 0 1 5.48 12c0-.8.13-1.58.34-2.3L2.18 6.86A11.22 11.22 0 0 0 .82 12c0 1.81.44 3.53 1.36 5.14l3.66-2.84Z"/><path fill="#34A853" d="M12 23.18c2.96 0 5.45-.98 7.28-2.65l-3.57-2.77c-.95.66-2.23 1.12-3.71 1.12-2.86 0-5.29-1.99-6.16-4.66l-3.66 2.84c1.8 3.58 5.52 6.12 9.82 6.12Z"/>'),
};
