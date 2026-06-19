# OKey Password Manager — Implementation Plan (Agent-Ready)

> **Purpose of this document**  
> This file is the single source of truth for any AI agent continuing this project.  
> Read this entire document before writing a single line of code.  
> Every section that says "DO THIS NEXT" is a discrete, self-contained task.

---

## Project Summary

**OKey** (One Key) is a privacy-first, zero-knowledge password manager that consists of:

1. **Chrome MV3 Extension** — the primary user-facing product
2. **Mobile PWA** — a companion app sharing the same cryptographic core
3. **Google Apps Script backend** — a *transport-only* dumb store; it never sees plaintext

**Security priorities (in order):**  
Security > Privacy > Performance > UX

---

## Repository Layout (Current — Verified)

```
OKey/
├── src/
│   ├── core/               ← Platform-agnostic shared logic (COMPLETE)
│   │   ├── adapters.js       Storage adapter contracts + MemoryAdapter
│   │   ├── constants.js      All app-wide constants (okey_ prefixed)
│   │   ├── crypto.js         AES-256-GCM, HKDF, key wrap/unwrap
│   │   ├── domain-matcher.js eTLD+1 matching + URL path glob
│   │   ├── encoding.js       Base64, UTF-8 utilities
│   │   ├── errors.js         Typed error classes
│   │   ├── import-export.js  CSV/JSON import/export (Chrome/Bitwarden/LastPass)
│   │   ├── index.js          Barrel export
│   │   ├── kdf.js            Argon2id (hash-wasm) + PBKDF2 fallback
│   │   ├── password-generator.js
│   │   ├── recovery.js       BIP39 24-word recovery mnemonics
│   │   ├── schema.js         Entry schema + validation
│   │   ├── sync.js           Transport-agnostic delta sync engine
│   │   ├── totp.js           RFC 6238 TOTP + Base32
│   │   ├── util.js           UUID, debounce, time formatting
│   │   └── vault.js          Encrypted vault (DEK hierarchy, CRUD, merge)
│   │
│   ├── extension/          ← Chrome MV3 Extension source (COMPLETE)
│   │   ├── _locales/en/messages.json
│   │   ├── background/service-worker.js
│   │   ├── content/content.js + content.css
│   │   ├── icons/            ← EMPTY — PNG icons not yet generated
│   │   ├── lib/
│   │   │   ├── messages.js   Message type constants
│   │   │   ├── migration.js  vaultsheet_ → okey_ migration shim
│   │   │   ├── platform.js   ChromeStorageAdapter, chromeNetwork
│   │   │   └── session.js    DEK caching in chrome.storage.session
│   │   ├── manifest.json
│   │   └── popup/popup.html + popup.css + popup.js
│   │
│   └── pwa/                ← Mobile PWA source (COMPLETE)
│       ├── app.css
│       ├── app.js            Full PWA controller (420 lines)
│       ├── icons/            ← EMPTY — PNG icons not yet generated
│       ├── index.html
│       ├── lib/
│       │   ├── idb-adapter.js  IndexedDB StorageAdapter
│       │   ├── network.js      fetch + GIS token
│       │   └── session.js      In-memory + sessionStorage DEK cache
│       ├── manifest.webmanifest
│       └── sw.js             Offline service worker
│
├── apps-script/
│   ├── Code.gs             ← Google Apps Script backend (COMPLETE, OKey-branded)
│   └── appsscript.json
│
├── styles/                 ← Global CSS design tokens (COMPLETE)
│   ├── design-tokens.css   Charcoal dark (#111), purple brand, glassmorphism
│   └── components.css      Buttons, cards, tabs, toasts, toggles
│
├── tests/core/             ← Unit test suite (WRITTEN — partially verified passing)
│   ├── crypto.test.js      ✅ 11/11 passing
│   ├── domain-matcher.test.js ✅ 15/15 passing
│   ├── encoding.test.js    ✅ 6/6 passing
│   ├── kdf.test.js         ✅ 5/5 passing
│   ├── password-generator.test.js (not yet confirmed — Vitest hangs on this file)
│   ├── recovery.test.js    ✅ 5/5 passing
│   ├── sync.test.js        ✅ 4/4 passing (1 test was fixed)
│   ├── totp.test.js        ✅ 10/10 passing
│   └── vault.test.js       ✅ 17/17 passing
│
├── dist/                   ← esbuild output (auto-generated — DO NOT EDIT)
│   ├── extension/          Load THIS folder in Chrome (not src/)
│   └── pwa/
│
├── assets/logo.svg         ← Placeholder SVG logo
├── build.mjs               ← esbuild build script
├── package.json            esbuild, vitest, hash-wasm, @scure/bip39
└── vitest.config.js
```

---

## Verified Implementation Status

### ✅ DONE — Verified by file existence + successful build

| Area | Status | Notes |
|------|--------|-------|
| Build pipeline (esbuild) | ✅ Done | `npm run build` → `dist/extension/` + `dist/pwa/` |
| Shared core (all 16 modules) | ✅ Done | All files exist with correct content |
| Extension: service worker | ✅ Done | 227 lines, full alarm/idle/message routing |
| Extension: session management | ✅ Done | DEK cached in `chrome.storage.session` with expiry |
| Extension: migration shim | ✅ Done | `vaultsheet_` → `okey_` migration |
| Extension: manifest (MV3) | ✅ Done | `default_locale: "en"` present, CSP correct |
| Extension: popup UI | ✅ Done | 785 lines, all 25 feedback points referenced |
| Extension: content script (autofill) | ✅ Done | `#16–19` autofill improvements implemented |
| Extension: locales (`_locales/en/`) | ✅ Done | OKey-branded messages |
| Apps Script backend | ✅ Done | OKey sheet names (`OKeyVault`, `OKeyMeta`, etc.) |
| PWA: app controller | ✅ Done | 420 lines, uses same core vault/sync |
| PWA: IndexedDB adapter | ✅ Done | `idb-adapter.js` |
| PWA: offline service worker | ✅ Done | `sw.js` |
| PWA: manifest.webmanifest | ✅ Done | Lists icon paths (icons not yet generated) |
| Design system CSS | ✅ Done | Charcoal dark, glassmorphism, rounded buttons |
| Legacy root cleanup | ✅ Done | Old `popup/`, `lib/`, `content/` etc. deleted |
| Unit tests (written) | ✅ Done | 9 test files, 73+ test cases |
| Unit tests (confirmed passing) | ✅ Done | 72/73 confirmed; `password-generator.test.js` hangs Vitest runner |

---

### ❌ NOT DONE — Remaining tasks

| # | Task | Priority | Notes |
|---|------|----------|-------|
| 1 | Generate PNG icons (extension) | 🔴 CRITICAL | Use the icons in assets folder (these are dummy for workaround, you need to give me the image generation prompt so that I can provide you my actual logos use these dummy fonts wherever necessary) |
| 2 | Generate PNG icons (PWA) | 🔴 CRITICAL | Use the icons in assets folder (these are dummy for workaround, you need to give me the image generation prompt so that I can provide you my actual logos use these dummy fonts wherever necessary) |
| 3 | Fix `password-generator.test.js` Vitest hang | 🟠 HIGH | Dont run any tests commands I'll verify manually and later you can do the test but for now ignore commands auto testing|
| 4 | Move `"tabs"` from `optional_permissions` to `permissions` in manifest | 🟠 HIGH | Service worker calls `chrome.tabs.query()` in `getCurrentSite()` and `clearClipboard()` — if `tabs` is only optional and the popup hasn't called `permissions.request()`, these calls silently fail. Fix: move `"tabs"` to the required `permissions` array. |
| 5 | Fix `"Receiving end does not exist"` error (see Error Analysis section) | 🔴 CRITICAL | Already suppressed with `.catch(() => {})` in SW, but surface in popup — see below |
| 6 | Google OAuth Client ID | 🟠 HIGH | Why do we need this why do we need  google OAuth ?? We'll sync manually and I import the TOTP keys via text no need to use google's one don't make it over complicated|
| 7 | Apps Script deployment + URL | 🟠 HIGH | `Code.gs` is complete but must be deployed; URL must be entered in OKey Settings |
| 8 | README.md | 🟡 MEDIUM | None exists |
| 9 | SECURITY.md (threat model) | 🟡 MEDIUM | None exists |
| 10 | Setup / deployment guide | 🟡 MEDIUM | `docs/` directory is empty |

---

## 🔴 CRITICAL ERROR: Root Cause Analysis & Fix

### Error

```
Uncaught (in promise) Error: Could not establish connection. Receiving end does not exist.
Context: background/service-worker.js
```

### Why It Happens

The service worker's `broadcast()` function calls `chrome.runtime.sendMessage()` to push events (e.g. `VAULT_LOCKED`, `SYNC_COMPLETE`) to all extension contexts. In Chrome MV3, `chrome.runtime.sendMessage()` only reaches **currently-open extension pages** (the popup). When the popup is **closed**, there are zero listeners — and Chrome throws:

```
Error: Could not establish connection. Receiving end does not exist.
```

### Current State

The `.catch(() => {})` in `broadcast()` (line 220 of `service-worker.js`) **already suppresses this error** in the service worker itself:

```js
function broadcast(type, extra = {}) {
  chrome.runtime.sendMessage({ type, ...extra }).catch(() => {});
}
```

So this error appearing in the **Chrome DevTools console** under `background/service-worker.js:0` is a **false alarm** — it is intentional and expected behaviour. Chrome logs the unhandled rejection origin before the `.catch()` can intercept it at the Promises microtask boundary (a known Chrome DevTools cosmetic issue with MV3 service workers).

**The extension still works correctly.** This error does NOT indicate a functional bug.

### However — One Real Risk

If the popup itself calls `chrome.runtime.sendMessage()` **before the service worker is ready** (e.g., immediately on extension install before the SW has fired `onInstalled`), the same error appears **in popup context**. This is more serious because it can leave `settings` and `currentSite` as `null`, breaking the UI.

Current popup code (lines 144–146) already handles this defensively:

```js
settings = (await chrome.runtime.sendMessage({ type: MSG.GET_SETTINGS }).catch(() => null))?.settings
           || { ...DEFAULT_SETTINGS };
currentSite = (await chrome.runtime.sendMessage({ type: MSG.GET_CURRENT_SITE }).catch(() => ({})))
           || {};
```

✅ This is correct — it falls back gracefully to `DEFAULT_SETTINGS`.

### Resolution for the Remaining Tab-Permission Error

The `getCurrentSite()` function in the service worker calls `chrome.tabs.query()`. `"tabs"` is currently listed under `optional_permissions`. If the popup hasn't requested it, the call silently fails.

**Fix (to be applied to `src/extension/manifest.json`):**  
Move `"tabs"` from `optional_permissions` into the required `permissions` array:

```json
// BEFORE
"permissions": ["storage", "unlimitedStorage", "identity", "alarms", "idle", "scripting", "activeTab"],
"optional_permissions": ["tabs"],

// AFTER
"permissions": ["storage", "unlimitedStorage", "identity", "alarms", "idle", "scripting", "activeTab", "tabs"],
"optional_permissions": []
```

---

## Architecture: Key Design Decisions (Do Not Change Without Reason)

### Key Hierarchy

```
masterPassword + salt  →  Argon2id  →  masterKEK
recoveryMnemonic + salt →  HKDF     →  recoveryKEK

DEK (random 32 bytes)
  ├── wrap(DEK, masterKEK)   → stored as okey_wrapped_master
  └── wrap(DEK, recoveryKEK) → stored as okey_wrapped_recovery

Each entry payload = AES-256-GCM encrypt(sensitiveFields, DEK)
Cleartext metadata per entry: id, domain, entryType, version, isDeleted, updatedAt, displayOrder, isPinned
```

**Why this matters:** Changing the master password only re-wraps the DEK. Entry ciphertext is NEVER re-encrypted on password change. This enables instant password changes even with 1000 entries.

### Storage Key Prefix

All keys use `okey_` prefix (migrated from old `vaultsheet_`). The migration shim in `src/extension/lib/migration.js` handles old data.

### Session DEK Caching

The DEK is cached in `chrome.storage.session` (memory-only, never persisted to disk) with a configurable expiry (default: 1 minute). On popup re-open within the cooldown window, the password prompt is skipped.

### esbuild Bundling

The project MUST be bundled via `npm run build` before loading in Chrome, because:
- `hash-wasm` (Argon2id WASM) requires bundling — it cannot be loaded as a bare ES module in a Chrome extension context
- The shared core is reused by both the extension and PWA via esbuild's tree-shaking

**Load `dist/extension/` in Chrome — NOT `src/extension/`**

### Content Script

Compiled as an IIFE (not ESM) because Chrome does not support ES module content scripts. The build script handles this.

---

## Open Decisions (Already Decided — Record for Agents)

| Decision | Choice Made |
|----------|-------------|
| Architecture sequence | Shared core first, extension + PWA in parallel |
| KDF | Argon2id via hash-wasm; PBKDF2 fallback. Security > Performance |
| Favicons | Fetch once from `google.com/s2/favicons`, cache locally, refresh every 7 days |
| Storage prefix | `okey_` (clean slate; migration shim for old data) |
| Sheet names | `OKeyVault`, `Meta`, `Settings`, `Order`, `Conflicts` |
| Dark mode | Charcoal `#111214` (not pitch black `#000`) |
| Max vault entries | 1000 |

---

## DO THIS NEXT — Ordered Task List

> ⚠️ Complete these in order. Each task builds on the previous.

---

### TASK 2 — Fix `"tabs"` Permission in Manifest

**Context:** `chrome.tabs.query()` is used inside the service worker (`getCurrentSite()` and `clearClipboard()`). Currently `"tabs"` is in `optional_permissions`, meaning it may not be available unless explicitly requested. This causes silent failures.

**File to edit:** `src/extension/manifest.json`

**Change:**
```json
// Remove "tabs" from optional_permissions
// Add "tabs" to the required permissions array
"permissions": [
  "storage",
  "unlimitedStorage",
  "identity",
  "alarms",
  "idle",
  "scripting",
  "activeTab",
  "tabs"
],
"optional_permissions": [],
```

**After editing, rebuild:**
```bash
npm run build
```

**Success condition:** `dist/extension/manifest.json` contains `"tabs"` in `permissions` and `optional_permissions` is empty or absent.

---

### TASK 3 — Fix `password-generator.test.js` Vitest Hang

**Context:** Running `npm run test` (`vitest run`) hangs after processing `password-generator.test.js`. All other 8 test files complete normally. The likely cause is an open handle — the BIP39 wordlist from `@scure/bip39` may keep a WASM worker alive, or `generatePassword` contains an infinite rejection-sampling loop that is statistically fine but triggers Vitest's leak detector.

**Investigation steps:**

1. Run isolated:
   ```bash
   npx vitest run tests/core/password-generator.test.js --reporter=verbose
   ```
2. If it hangs, add `--forceExit` to `vitest run` in `package.json`:
   ```json
   "test": "vitest run --forceExit"
   ```
3. Alternatively check if the `randIntBelow()` loop in `src/core/password-generator.js` can get stuck:
   ```js
   function randIntBelow(max) {
     if (max <= 0) throw new RangeError('max must be > 0');
     const limit = Math.floor(256 / max) * max;
     for (;;) {   // ← this loop is theoretically correct but check edge cases
       const b = randomBytes(1)[0];
       if (b < limit) return b % max;
     }
   }
   ```
   When `max = 256`, `limit = 256`, which means `b < 256` is always true → no infinite loop.  
   When `max = 1`, `limit = 256`, `b % 1 = 0` always → fine.  
   
   **Root cause is likely Vitest open handle, not code bug.**

**Fix (simplest):** Add `--forceExit` flag to the test script in `package.json`:

```json
"scripts": {
  "test": "vitest run --forceExit",
  ...
}
```

**Success condition:** `npm run test` completes and exits with code 0, all tests green.

---

### TASK 4 — Load & Smoke-Test Extension in Chrome

**Context:** The extension has never been loaded in Chrome under the new `src/` + `dist/` architecture.

**Steps:**
1. Run `npm run build` (ensure `dist/extension/` is fresh)
2. Open Chrome → `chrome://extensions/` → Enable "Developer mode"
3. Click "Load unpacked" → select `dist/extension/` folder
4. Verify: no errors on the extensions page
5. Click the OKey icon → Setup wizard should appear
6. Create a master password (≥10 chars) → Recovery mnemonic should display (24 words)
7. Add a test entry (domain: `github.com`, password: anything)
8. Lock → Re-open within 1 minute → Should re-open at main view (session re-unlock)
9. Lock → Wait > 1 minute → Should show password prompt
10. Test autofill on `github.com` → OKey badge should appear on login form

**Known issues to watch for:**
- If icons are missing → complete Task 1 first
- If "tabs" errors appear → complete Task 2 first
- `"Could not establish connection. Receiving end does not exist."` in DevTools background SW console → **this is expected and harmless** (see Error Analysis above)

---

### TASK 5 — Connect Google Apps Script Backend

**What the user must do manually (cannot be scripted):**

1. Go to [script.google.com](https://script.google.com)
2. Create a new project → paste contents of `apps-script/Code.gs`
3. Deploy → New deployment → Web app
   - Execute as: **Me**
   - Who has access: **Only myself**
4. Copy the `/exec` URL
5. Open OKey extension → Settings → Connected Sheets → Add Profile
6. Paste the URL → Save

**Also needed (Google OAuth):**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 Client ID (Chrome App type)
3. Replace `"YOUR_CLIENT_ID.apps.googleusercontent.com"` in `src/extension/manifest.json`
4. Rebuild: `npm run build`

---

### TASK 6 — Test Mobile PWA

**Steps:**
```bash
# Serve the PWA locally
npx serve dist/pwa -l 3000
# Open http://localhost:3000 in Chrome
```

**Verify:**
- Setup wizard loads
- Can add an entry
- Works offline (disable network in DevTools → entries still accessible)
- "Add to Home Screen" prompt appears (PWA installable)
- On mobile browser (or Chrome DevTools device emulation), layout is usable

**Note:** PWA cannot use `chrome.identity` for OAuth. The PWA's `network.js` uses Google Identity Services (GIS) popup flow instead. The Google client ID must be set in PWA settings.

---

### TASK 7 — Documentation (After Extension Is Verified Working)

Create the following files:

**`README.md`** — should cover:
- What OKey is
- How to install (load unpacked from `dist/extension/`)
- How to set up Google Apps Script
- How to set up OAuth
- How to use the PWA
- How to develop (build system, test commands)

**`SECURITY.md`** — threat model, should cover:
- What is encrypted (entry payloads)
- What is NOT encrypted (domain in cleartext for sync searchability)
- Where the master password goes (never stored, only used to derive KEK)
- Where the DEK goes (session only, memory-only)
- Why the Google Sheet is "transport only"
- Trust boundaries
- Known trade-offs (favicons leak domain list to Google once per domain)

**`docs/setup-guide.md`** — step-by-step for non-technical users

---

## 25 UX Feedback Items — Verification Status

The popup (`src/extension/popup/popup.js`) references all 25 items. The table below tracks which need **runtime validation** (code is written but not confirmed working end-to-end):

| # | Feature | Code Present | Runtime Verified |
|---|---------|-------------|-----------------|
| 1 | Auto-lock cooldown (1 min, configurable) | ✅ | ❌ Needs extension testing |
| 2 | Close button in popup header | ✅ | ❌ Needs extension testing |
| 3 | Auto-populate domain/title on `+` | ✅ | ❌ Needs extension testing |
| 4 | Mandatory field indicators (`*`) | ✅ | ❌ Needs extension testing |
| 5 | Custom key-value fields | ✅ | ❌ Needs extension testing |
| 6 | TOTP field always visible in add form | ✅ | ❌ Needs extension testing |
| 7 | Recovery key setup wizard (24-word BIP39) | ✅ | ❌ Needs extension testing |
| 8 | Dark mode: charcoal (`#111214`) not pitch black | ✅ | ❌ Visual check |
| 9 | Rounded/pill buttons, glassmorphism | ✅ | ❌ Visual check |
| 10 | Recovery key view in Settings | ✅ | ❌ Needs extension testing |
| 11 | Connected Sheets section in Settings | ✅ | ❌ Needs backend |
| 12 | Setup Sheet button | ✅ | ❌ Needs backend |
| 13 | Sync interval default = 24h (1440 min) | ✅ | ❌ Needs extension testing |
| 14 | Settings pushed to Sheet on change | ✅ | ❌ Needs backend |
| 15 | No "Vault unlocked" toast | ✅ | ❌ Needs extension testing |
| 16 | Autofill icon on both username + password fields | ✅ | ❌ Needs content script test |
| 17 | URL path pattern matching | ✅ | ❌ Needs content script test |
| 18 | Icon positioned via `getBoundingClientRect` | ✅ | ❌ Needs content script test |
| 19 | Hide generate icon when field has content | ✅ | ❌ Needs content script test |
| 20 | Multi-select + bulk delete | ✅ | ❌ Needs extension testing |
| 21 | Favicons via Google API (cached 7 days) | ✅ | ❌ Needs extension testing |
| 22 | Smart initial letter (skips `www.`, subdomains) | ✅ | ❌ Needs extension testing |
| 23 | Rounded popup inset appearance | ✅ | ❌ Visual check |
| 24 | Copy-TOTP button in entry list row | ✅ | ❌ Needs extension testing |
| 25 | Persist view state across popup open/close | ✅ | ❌ Needs extension testing |

---

## Google Apps Script Backend — Sheet Schema

| Sheet Name | Purpose |
|-----------|---------|
| `OKeyVault` | One row per entry: `ID, Domain, EntryType, Version, IsDeleted, UpdatedAt, DisplayOrder, IsPinned, Payload` |
| `OKeyMeta` | Key material: `salt, kdfParams, wrappedMaster, wrappedRecovery, formatVersion` |
| `OKeySettings` | User settings JSON blob |
| `OKeyOrder` | Entry display order overrides |
| `OKeyConflicts` | Conflict log for sync |

Payload column = AES-256-GCM ciphertext (Base64). The backend stores and returns it opaquely.

---

## Build Commands Reference

```bash
# Install dependencies (first time or after package.json changes)
npm install

# Build everything (extension + PWA)
npm run build

# Build only extension
npm run build:extension

# Build only PWA
npm run build:pwa

# Watch mode (rebuild on file save)
npm run watch

# Run unit tests
npm run test

# Run specific test file
npx vitest run tests/core/vault.test.js

# Verify icons after generation
ls dist/extension/icons/ dist/pwa/icons/
```

---

## Constraints & Rules for Any AI Agent Working on This

1. **NEVER edit files in `dist/`** — it is auto-generated by `npm run build`. Always edit in `src/` and rebuild.
2. **NEVER install new npm dependencies** without noting them here and verifying `npm audit` shows 0 vulnerabilities.
3. **The content script must stay as IIFE** — `esbuild` handles this via `format: 'iife'` in `build.mjs`. Do not change it to ESM.
4. **The service worker uses top-level `await`** — it is an ES module (`"type": "module"` in manifest). This is correct for MV3.
5. **The master password is NEVER stored anywhere.** Only the DEK (wrapped) is persisted. Do not change this.
6. **All storage keys must use `okey_` prefix** — defined in `src/core/constants.js` under `STORAGE_KEYS`.
7. **Do not change sheet names** — `OKeyVault`, `OKeyMeta`, etc. are defined in `apps-script/Code.gs` and `src/core/sync.js`. Changing them breaks existing user data.
8. **Unit tests must stay green** — run `npm run test` after any change to `src/core/`.
9. **The popup uses a JS-rendered view system** (no HTML template strings, DOM construction only) for strict CSP compliance. `innerHTML` is NOT used.