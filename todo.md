# OKey — Remaining / Future Work

Completed items move to `revamp.md` § Roadmap. Current open list:

- [x] **New Branding & Logos** (done in revamp): new "O"-shaped outline lock mark.
  - Master SVGs: `assets/okey-mark.svg` (mono), `assets/okey-icon-tile.svg`, `assets/okey-icon-maskable.svg`.
  - Regenerated: `src/extension/icons/icon-{16,32,48,128}.png`, `src/pwa/icons/icon-{192,512,maskable-512}.png`.
  - In-app SVG logo swapped everywhere: PWA appbar/hero, popup header, content-script badge, unlock iframe.
- [ ] **OKey Cloud provider UI** — server scaffold done (`server/`); wire client
      provider picker once Neon credentials exist. Auth will be **Firebase
      Authentication** (Google sign-in) per owner decision; server verifies
      Firebase ID tokens (see `server/README.md`).
- [ ] **Biometric/WebAuthn quick-unlock** — progressive enhancement on top of PIN.
- [ ] **TypeScript conversion** (`checkJs` first, then per-module).
- [ ] **Sync vector clocks + delete tombstone pruning**.
- [ ] **Local diagnostics screen** (failed unlocks, sync errors, cache sizes) — opt-in only.
