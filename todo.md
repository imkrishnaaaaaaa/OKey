# OKey — Remaining / Future Work

Completed items move to `revamp.md` § Roadmap. Current open list:

- [x] **New Branding & Logos** (done in revamp): new "O"-shaped outline lock mark.
  - Master SVGs: `assets/okey-mark.svg` (mono), `assets/okey-icon-tile.svg`, `assets/okey-icon-maskable.svg`.
  - Regenerated: `src/extension/icons/icon-{16,32,48,128}.png`, `src/pwa/icons/icon-{192,512,maskable-512}.png`.
  - In-app SVG logo swapped everywhere: PWA appbar/hero, popup header, content-script badge, unlock iframe.
- [ ] **Biometric/WebAuthn quick-unlock** — progressive enhancement on top of PIN.
- [ ] **TypeScript conversion** (`checkJs` first, then per-module).
- [ ] **Sync vector clocks + delete tombstone pruning**.
- [ ] **Local diagnostics screen** (failed unlocks, sync errors, cache sizes) — opt-in only.

From the review (see `conversation.md` for the full notes):

- [ ] **Extension picker in an iframe** (F47): move the badge panel and the "Add login" form out of the
      web page's DOM into an extension page, like `unlock.html`, so a page cannot read what is on screen.
- [ ] **Google sign-in in the extension** (F43): built (browser sign-in window, then `signInWithCredential`).
      Needs Krishna's one-time Google OAuth client (steps in `HANDOFF.md`), then a real-Chrome try.
- [ ] **Firebase console steps** (F17): publish `firestore.rules`, limit the web API key, App Check later.
      Checklist is in `HANDOFF.md`.
- [ ] **Sync: same-version edits.** Two devices editing one entry in the same millisecond keep their own
      copy (needs a tie-break such as a device id). Two pushes in the same second: the later one wins, so
      add a Firestore rule that refuses a lower `version` (needs the rules published again).
- [ ] **Two devices making a new recovery key at the same moment** can end on different wraps (needs a
      Firestore precondition, compare-and-set).
- [ ] **Background clipboard clear** is unconditional because checking the clipboard needs the
      `clipboardRead` permission. Decide if that permission is worth it.
- [ ] **`use_dynamic_url`** in `web_accessible_resources` is untested in real Chrome: check that the PIN frame
      still opens on a locked login page.
- [ ] **Rekey needs a cloud step**: `Vault.rekey()` has no UI. If one is added, it needs a "replace the cloud
      vault" step, because a new salt looks like another vault (`VAULT_EXISTS`).
