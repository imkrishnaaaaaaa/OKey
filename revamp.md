# OKEY 2.0 — PRODUCT SPEC ("Nebula")

Status: APPROVED by owner 2026-08-23 · This file replaces the v1 audit entirely.
OKey 2.0 is a new product built around a hardened crypto core — not a reskin.

---

## 0 · Mission

A zero-knowledge password + 2FA manager that looks like a flagship security
product: **Aurora Glass** aesthetics, rich expressive motion, frictionless
Firebase onboarding, E2E-encrypted Firestore sync. Daily-driver reliable,
portfolio-showpiece beautiful.

Success test: opening the extension for the first time should make someone say
"wait, this is a Chrome extension?"

## 1 · Locked decisions

| Decision | Choice |
|---|---|
| Crypto core | KEEP existing (crypto/kdf/vault/totp — tested, audited) |
| Everything else | REBUILD from scratch |
| Backend | **Firebase** — Auth + Firestore. No Node server. No Google Sheets. |
| Auth methods | Continue with Google + email/password |
| Visual direction | **Aurora Glass / Nebula** — frosted glass, drifting aurora, dark-first |
| Light mode | Yes — "Daybreak" variant (soft pearl base, low-opacity aurora) |
| Palette | New: space-charcoal base, violet→indigo→cyan duotone accents |
| Type | Sora (display) · Inter (UI) · JetBrains Mono (secrets/codes) |
| Motion | Rich & expressive (springs, parallax, shimmer, morphs) — reduced-motion collapses all |
| Popup character | Roomy premium ~420×600 |
| Platform order | Extension first, PWA second |
| Features | All v1 features EXCEPT Chart.js analytics/dashboard |
| Branding | Name "OKey" stays; new logo mark for Nebula |

## 2 · Architecture

```
EXTENSION (flagship)                PWA
┌──────────────────────────┐   ┌──────────────────────────┐
│ Nebula UI (new)          │   │ Same Nebula system       │
│ firebase/auth SDK        │   │ mobile-tuned             │
│ cloud.js ── Firestore    │   │                          │
└────────────┬─────────────┘   └──────────┬───────────────┘
             │  shared core (unchanged):  │
             │  vault · crypto · kdf · totp · domain-matcher · schema
             └────────────┬───────────────┘
                    ☁️ FIREBASE
        Auth (Google, email/pw) · Firestore · Security Rules
```

*Deleted:* `apps-script/`, Sheet profiles, GIS token adapter (`pwa/lib/network.js`),
OAuth client-ID settings, `server/` scaffold (Firestore removes the need).

Local-only mode remains first-class: with no Firebase config or while signed
out, the vault works fully offline; cloud surfaces hide gracefully.

## 3 · Data model (Firestore)

Server sees ciphertext + non-sensitive metadata only.

```
users/{uid}                     → { email, createdAt, displayName }
users/{uid}/vault/meta          → { salt, kdfParams, wrappedMaster,
                                    wrappedRecovery, formatVersion, updatedAt }
users/{uid}/vault/settings      → { <allowlisted settings>, updatedAt }
users/{uid}/vault/entries/{id}  → { id, domain, folder, entryType, version,
                                    isDeleted, updatedAt, displayOrder,
                                    isPinned, payload /* AES-GCM b64 */ }
```

Security Rules (docs/architecture.md holds the final text): every read/write
gated by `request.auth.uid == uid`; payloads validated for max size; no
list-all access across users.

## 4 · Sync protocol

* Delta: pull entries with `updatedAt > lastSyncAt`; push local changes with
  `version++`. Last-writer-wins by (version, updatedAt) — identical semantics
  to v1, new transport (`core/cloud.js`).
* Offline queue persists; flushes on reconnect/sign-in.
* Realtime: one Firestore snapshot listener on the active vault's entries
  updates open UIs live (multi-device feels instant).
* Conflict surfacing unchanged (toast + last-writer-wins).

## 5 · Design system — "Nebula"

### Tokens (styles/nebula/tokens.css)
* Base ramp: `#07080f → #0b0d17 → #121422 → #1a1d30 → #232742`
* Glass: `rgba(18,20,34,.55)` + blur(24px) saturate(180%), hairline
  `rgba(255,255,255,.08)` edges + inner top-light `rgba(255,255,255,.06)`
* Accents: cyan `#22d3ee`, violet `#8b5cf6`; gradients between them for hero
  moments; success `#34d399`, danger `#fb7185`, warning `#fbbf24`
* Daybreak light: pearl ramp `#eef0fb → #ffffff…`, aurora at 35% opacity,
  glass `rgba(255,255,255,.6)`
* Type scale: 12/13/15/17/20/24/32; display headings in Sora SemiBold,
  tight tracking; UI in Inter; codes/passwords in JetBrains Mono
* Radii: 10/14/20/28; spacing 4-based

### Signature elements
* **AuroraBackdrop**: fixed layer with 3 blurred gradient blobs
  (violet/indigo/cyan) drifting on 26s/34s/42s loops + subtle grain overlay.
  Present on every screen behind glass panels.
* **GlassCard**: frosted panel, 1px light edge, soft shadow, hover lift.
* **GlowRing**: focus/hover ring using accent glow instead of solid outline.

### Components (all custom, zero native chrome)
Buttons (primary glow-fill / ghost / danger), text inputs (glass wells with
floating labels), custom dropdown menus, segmented controls, switches,
checkboxes, range sliders, bottom-sheet modals, toasts, skeleton shimmer,
strength meter, word-grid recovery card, TOTP progress ring (morphing),
avatar tiles with generated gradients.

### Motion spec
* Springs: `--spring: cubic-bezier(.34,1.56,.64,1)` for entrances;
  `--glide: cubic-bezier(.32,.72,0,1)` for transitions.
* View changes: crossfade + 12px rise, 320ms; back = reverse.
* Lists: 40ms staggered rise-fade per row (cap 12 rows).
* Numbers: rolling digit transition on TOTP codes and stat values.
* Unlock: PIN cells pulse sequentially on success, brief aurora flare, then
  crossfade into vault.
* Copy: checkmark morph on the icon + haptic.
* All of it collapses under `prefers-reduced-motion`.

## 6 · Screens (extension first, roomy 420×600)

1. **Welcome/Auth** — animated logo bloom → "Continue with Google" +
   email/password toggle → error shake states.
2. **Onboarding wizard** — Create PIN (segmented) → Confirm → Recovery-key
   reveal (word grid, copy/download, ack) → 3-slide feature tour (dots,
   springy slide transitions) → Enter vault.
3. **Vault list** — glass header (logo, account chip, lock), search well,
   filter chips (All/Logins/Auth/Favorites/Folders), roomy entry cards with
   gradient avatars, inline TOTP rings, long-press multi-select.
4. **Detail** — hero header card, grouped glass fields, reveal/copy with
   micro-animations, timestamps footer.
5. **Add/Edit** — floating-label wells, progressive disclosure ("More
   options"), generator button with morph.
6. **Generator** — big mono output card, segmented Password/Passphrase,
   styled slider, option switches, history chips.
7. **Settings** — account card (photo, email, sign out, "Move to cloud"),
   security group (auto-lock presets as segmented control, clipboard),
   autofill group, import/export, about. ALL controls custom-drawn.

PWA: same system, mobile layout (bottom nav, sheets), second phase.

## 7 · Content-script fixes (owner-reported bugs)

* **Badges only where they belong:** badge attaches ONLY to password fields
  and username fields *inside forms that contain a password field*. Never on
  OTP/2FA inputs (autocomplete=one-time-code or heuristic), never on search/
  newsletter/contact boxes, never more than one badge visible per form region.
* **Visibility discipline:** badges fade in on focus/interaction (empty
  password fields may peek), fade out on blur. No permanent icon farm.
* **TOTP handling:** filling a credential auto-fills its TOTP code into the
  detected one-time-code field; the picker row exposes the live code for copy.
  No lock icon on OTP boxes, ever.
* Picker panel rebuilt as a Nebula glass card with the same motion language.

## 8 · Quality gates

* All 35 v1 crypto/vault/domain tests stay green; add Firestore store tests
  (mocked) + auth state-machine tests.
* CI: build both targets + tests.
* Manual: load unpacked walkthrough (auth-mocked local mode + real Firebase
  once owner supplies keys), Playwright screenshot pass on every screen.
* Bundle watch: popup JS ≤ 900 KB (Firebase SDK included).

## 9 · Execution order (checklist.md drives)

Foundation (spec/docs/purge Sheets) → Firebase layer → Nebula design system →
Extension screens → Content-script fixes → PWA rebuild → Tests/CI →
Verify & polish. Small tasks, each marked done before the next begins.
