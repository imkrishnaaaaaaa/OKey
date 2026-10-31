# OKey 2.0 — Execution Checklist

One task at a time. Mark ✅ only when built AND verified (build/tests/screenshot).

## Phase 1 — Foundation
- [x] 1.1 Purge Google Sheets: delete `apps-script/`, sheet profiles in `core/sync.js`, GIS adapter, OAuth client-ID UI, `server/` scaffold ✅ (34 tests green; popup/pwa/sw intentionally reference removed modules until their rebuild tasks land)
- [x] 1.2 Write `docs/architecture.md`: Firestore collections, security rules, auth + sync + crypto data-flow diagrams ✅
- [x] 1.3 Install Firebase SDK; create `src/lib/firebase.js` (config from `firebase-config.js`, graceful unconfigured mode) ✅

## Phase 2 — Cloud layer
- [x] 2.1 `src/core/cloud.js`: Firestore store (meta/settings/entries delta sync, offline queue flush, realtime listener) behind the same surface the UI needs ✅ (REST-based; realtime snapshot listener deferred — delta polling on unlock/focus)
- [x] 2.2 Auth state machine: signedOut → signedIn → vaultReady; sign-in/out events wired to UI hooks ✅ (`lib/firebase.js` observable; app-level transitions land with popup screens in 4.2/4.3)
- [x] 2.3 Security rules file (`firestore.rules`) matching docs/architecture.md
- [x] 2.4 Tests for cloud store (mocked) — sync semantics preserved ✅ (+`core/cloud-sync.js` controller, 8 new tests)

## Phase 3 — Nebula design system (shared CSS)
- [x] 3.1 Download fonts (Sora, Inter, JetBrains Mono woff2); tokens.css with Nebula palette + Daybreak light ✅
- [x] 3.2 AuroraBackdrop + glass utilities + grain overlay ✅ (`styles/nebula/aurora.css`)
- [x] 3.3 Component library CSS v3: buttons, floating-label inputs, custom dropdowns, segmented controls, switches, checkboxes, sliders, sheets/modals, toasts, skeletons, avatars, strength meter ✅ (`styles/nebula/components.css`)
- [x] 3.4 Motion system: springs, view transitions, staggered lists, rolling digits, glow rings; reduced-motion collapse ✅ (`styles/nebula/motion.css`)

## Phase 4 — Extension rebuild (flagship)
- [x] 4.1 New popup shell (420×600 frame) + app scaffolding/view router ✅ (`ui/app-core.js` shared with PWA)
- [x] 4.2 Welcome/Auth screen (Google + email/password, offline fallback, error shakes) ✅
- [x] 4.3 Onboarding wizard (PIN → confirm → recovery grid → 3-slide tour, auto move-to-cloud if signed in) ✅
- [x] 4.4 Lock screen (greeting hero, cell pulse + flare on success, persistent lockout) ✅
- [x] 4.5 Vault list (glass cards, gradient avatars, chips, site-match pinning, inline TOTP rings w/ rolling digits, long-press multi-select) ✅
- [x] 4.6 Detail view (hero header, animated reveals, live TOTP ring) ✅
- [x] 4.7 Add/Edit form (floating labels, custom folder dropdown, progressive disclosure) ✅
- [x] 4.8 Generator (segmented mode, glowing slider, live strength, rolling output) ✅
- [x] 4.9 Settings (account card w/ signout, connect-cloud CTA, segmented auto-lock presets, all-custom controls, encrypted backup/import/export) ✅

## Phase 5 — Content script intelligence
- [x] 5.1 Smart badge targeting: username/password inside password-forms ONLY; OTP fields never badged; badges quiet until focus/hover/empty-pw interaction ✅
- [x] 5.2 TOTP auto-fills with the credential; SW computes codes; secrets never reach page ✅
- [x] 5.3 Picker panel + add-login modal + toasts → Nebula glass redesign ✅

## Phase 6 — PWA rebuild
- [x] 6.1 PWA shell on Nebula system (shares app-core + views; mobile tuning, safe areas) ✅
- [x] 6.2 PWA screens: welcome/auth/onboarding + full flow via shared views ✅

## Phase 7 — Quality & ship
- [x] 7.1 Test suite extended (cloud store + sync controller); 42/42 green; both targets build ✅
- [x] 7.2 Visual pass on shared screens (PWA host): welcome, PIN create/confirm, recovery grid, tour, lock, empty list, populated list w/ live TOTP, detail, edit form, settings — all verified via screenshots ✅ (extension loads the same modules; owner load-unpacked pass pending)
- [x] 7.3 Popup bundle 600 KB incl. Firebase auth SDK (budget 900 KB) ✅
- [x] 7.4 Review fixes landed: shared app-core extraction, session bridge, storage injection, font paths, floating-label collision, TOTP ticker anchors, header crowding, settings crash (firebaseReady import) ✅
- [x] 7.5 Handover notes in final summary + `src/lib/firebase-config.js` comments + `docs/architecture.md` ✅
