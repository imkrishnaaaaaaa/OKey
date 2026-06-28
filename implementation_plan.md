# OKey PWA Flawless UX & Sync — Implementation Plan

## Summary of Findings

Our review of the PWA codebase revealed several critical bugs, alignment issues, and networking limitations that prevent the PWA from working properly:

1. **Critical UX Bug (Blank Labels & Titles):**
   The DOM helper `h(tag, props, ...kids)` in `src/pwa/app.js` is missing two critical properties present in the extension:
   * `k === 'text'` (sets `textContent`)
   * `k === 'attrs'` (sets native attributes)
   
   Because this logic is missing, **every button, input label, PWA header title, selector option, and settings section renders with no text**, showing blank elements and misalignments.

2. **Critical Network Bug (CORS Preflight Block on Apps Script):**
   When making POST requests, the PWA uses `'Content-Type': 'application/json'`. Since this is a non-simple request, browsers send a CORS preflight `OPTIONS` request. Google Apps Script's `script.google.com` backend does not support preflight requests and fails, raising a generic "Network error".
   
3. **Cheap Unicode Icons vs SVG Vectors:**
   The PWA currently defines `I` using low-quality unicode glyphs (e.g. `back: '‹'`, `plus: '+'`, `trash: '🗑'`) instead of the premium SVG vectors used in the extension.

4. **Missing Header and Back Navigation on Setup screens:**
   The PWA has no appbar header on welcome, PIN creation, and restore screens, leaving the user with a degraded experience when trying to go back.

---

## Proposed Changes

### Core Transport Layer
#### [MODIFY] [sync.js](file:///Users/krishna/Documents/Projects/Okey/src/core/sync.js)
Change the request headers in `_call(action, body)` and `fetchMetadata(explicitUrl)` from `'Content-Type': 'application/json'` to `'Content-Type': 'text/plain'`. 
* **Why:** This makes all network requests to Google Apps Script "simple requests", completely bypassing CORS preflight (`OPTIONS`) in the browser. 
* **Backward Compatibility:** Apps Script parses the raw body string using `JSON.parse(e.postData.contents)`, so this change is fully compatible with both the PWA and the extension.

---

### PWA UI & Layout Elements
#### [MODIFY] [app.js](file:///Users/krishna/Documents/Projects/Okey/src/pwa/app.js)

1. **Fix DOM Helper `h`:**
   Add support for `text` and `attrs` properties so that all button labels, titles, and options display correctly:
   ```javascript
   if (k === 'class') e.className = v;
   else if (k === 'html') e.innerHTML = v;
   else if (k === 'text') e.textContent = v;
   else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
   else if (k === 'attrs') for (const [a, av] of Object.entries(v)) e.setAttribute(a, av);
   else if (v !== null && v !== undefined && v !== false) e.setAttribute(k, v);
   ```

2. **Upgrade Icon Assets (`I` object):**
   Replace the raw unicode icons with the exact vector SVGs used by the extension for premium consistency:
   ```javascript
   const I = {
     logo: '<svg viewBox="0 0 24 24" fill="none"><rect x="3" y="10" width="18" height="11" rx="4" stroke="currentColor" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="15.5" r="1.6" fill="currentColor"/></svg>',
     search: '<svg viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m20 20-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
     close: '<svg viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
     back: '<svg viewBox="0 0 24 24" fill="none"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
     plus: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
     gear: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" stroke="currentColor" stroke-width="1.5"/></svg>',
     dots: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/></svg>',
     copy: '<svg viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="2"/><path d="M5 15V5a2 2 0 0 1 2-2h8" stroke="currentColor" stroke-width="2"/></svg>',
     user: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" stroke-width="2"/></svg>',
     key: '<svg viewBox="0 0 24 24" fill="none"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3M15.5 7.5L14 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
     eye: '<svg viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/></svg>',
     clock: '<svg viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
     star: '<svg viewBox="0 0 24 24" fill="none"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.2l1-5.8L3.5 9.2l5.9-.9z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>',
     trash: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m-9 0 1 13h10l1-13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
     refresh: '<svg viewBox="0 0 24 24" fill="none"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 3v4h-4M6 21v-4h4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
   };
   ```

3. **Improve Setup/Restore Screen Navigation:**
   * Modify `renderRestoreFromSheet()` to replace the inline ghost back button with a beautiful appbar header:
     ```javascript
     app.append(h('div', { class: 'okey-view' },
       appbar('Restore from Sheet', renderSetup),
       // fields and Connect & Restore button here...
     ));
     ```
   * Update screen layout to support SVG logo rendering natively in `screen()`:
     ```javascript
     function screen(title, ...children) {
       return h('div', { class: 'okey-view okey-centered' },
         h('div', { class: 'okey-logo okey-hero' }, h('span', { html: I.logo }), 'OKey'),
         h('h2', { style: 'text-align:center; margin-bottom: 24px; font-weight:700;', text: title }),
         ...children
       );
     }
     ```

4. **Align Layouts (FAB, Header, & Views):**
   * Change `renderMain` header to render the real SVG logo:
     ```javascript
     const header = h('header', { class: 'okey-appbar vs-glass' },
       h('div', { class: 'okey-logo' }, h('span', { html: I.logo }), 'OKey'),
       h('div', { class: 'vs-spacer' }),
       syncBtn,
       iconBtn(I.gear, 'Settings', renderSettings) // Replace custom dots menu item with Settings direct access for simpler PWA UX
     );
     ```
   * Replace the dots-menu with a cleaner header layout.

---

### [MODIFY] [app.css](file:///Users/krishna/Documents/Projects/Okey/src/pwa/app.css)

Add necessary css rules for SVG rendering in appbar and logos, custom alignment, and design tweaks for the inputs and headers:
```css
.okey-logo svg {
  width: 24px;
  height: 24px;
  color: var(--vs-brand);
}

.okey-appbar-title {
  font-size: var(--vs-fs-lg);
  font-weight: 700;
  margin-left: 4px;
}
```

---

## Verification Plan

### Manual Verification
1. Build PWA: `node build.mjs pwa`
2. Run local web server: `npx serve dist/pwa`
3. Launch PWA in Chrome at `http://localhost:3000` (or the default port outputted by serve).
4. Verify Welcome Screen: The vector SVG logo and "Welcome to OKey" title should load correctly.
5. Click **"Restore from Google Sheet"**:
   * Verify the premium back-button header is visible and functional.
   * Enter Apps Script URL and Master PIN → click **"Connect & Restore"**.
   * Confirm the vault successfully connects and syncs, bypassing any previous network errors.
6. Verify Settings, Dashboard, and main lists display correctly with the proper vector SVG icon styling.
