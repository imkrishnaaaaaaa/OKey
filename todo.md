# OKey - Remaining / Future Work

Direction agreed on 2026-10-31:

- Premium consumer product first. Zero-knowledge, local-first, free and open source.
- Milestone 1 is security and trust.
- Milestone 2 is PWA and Android release. APK path is Capacitor. Ship sideloaded APK first, then Google Play.
- PWA hosting is Cloudflare Pages. Free tier, global CDN, custom domain later.
- True enterprise features are out of scope for now. No SSO, SCIM, admin console, or compliance work until the consumer product is strong.
- "Passkeys" below means unlocking OKey with the device. Storing website passkeys is not in scope.

Completed items move to `revamp.md` section Roadmap.

---

## Milestone 1 - Security and trust

- [ ] **Threat model and disclosure policy.** Add `SECURITY.md` with a private reporting path, supported versions, and a short threat model. Cover page scripts, locked vault, cloud compromise, lost device, and recovery key loss.
- [ ] **Biometric/WebAuthn quick unlock.** Add device unlock on top of the PIN. PIN stays as the fallback. Support Android biometrics through Capacitor and browser WebAuthn on the PWA and extension where possible. Do not store website passkeys.
- [ ] **Vault Health dashboard.** Run fully on device. Show weak passwords, reused passwords, old passwords, missing 2FA, and entries with no domain. Link each row to the entry.
- [ ] **Opt-in breach check.** Use the HIBP Pwned Passwords range API with k-anonymity. Only a short SHA-1 prefix leaves the device. Cache results locally. Default off. Explain the tradeoff before the first check.
- [ ] **In-app account deletion.** Ask for re-authentication. Delete cloud entries, vault docs, user doc, and the Firebase Auth user. Clear local vault and sessions. Add a clear "this cannot be undone" screen.
- [ ] **Rekey screen.** Add UI for `Vault.rekey()`. Include the cloud replace step. A new salt currently looks like another vault (`VAULT_EXISTS`), so the flow needs a compare-and-set or an explicit replace confirmation.
- [ ] **Device list.** Store device name and last seen time in Firestore. Show devices in Settings. Start read-only. Remote revoke needs a backend, so plan that separately.
- [ ] **Sync hardening.**
  - [ ] Add a device id tie-break for same-version edits.
  - [ ] Add a Firestore rule that refuses a lower `version`.
  - [ ] Add a compare-and-set for two devices making a new recovery key at the same time.
  - [ ] Add tombstone pruning after the retention window.
- [ ] **Firebase console hardening.** Publish `firestore.rules`, restrict the web API key, and add App Check. Checklist is in `HANDOFF.md`.
- [ ] **Extension security leftovers.** Finish Google sign-in in the extension with Krishna's OAuth client. Decide the background clipboard clear permission. The picker and add form now run in a dynamic-URL extension iframe; real Chrome check passed.
- [ ] **Release security.** Add PWA security headers, signed release checksums, and a dependency audit in CI.

---

## Milestone 2 - PWA and APK release

- [ ] **Cloudflare Pages deploy.** Serve `dist/pwa` over HTTPS. Add a custom domain when ready. Keep `okey.pages.dev` as the free default.
- [ ] **Store-grade manifest.** Add `id`, `lang`, `dir`, `display_override`, `launch_handler`, screenshots, shortcuts, and monochrome icons. Keep the maskable icon.
- [ ] **Install and update UX.** Add a custom install prompt. Show a "new version available" toast when the service worker changes. Show offline state clearly.
- [ ] **Capacitor Android scaffold.** Add the Android project, app id, version, icons, splash screen, back button handling, and deep links.
- [ ] **Signed APK and AAB.** Build a debug APK, then a signed release APK and AAB. Keep signing keys out of the repo.
- [ ] **Native secure storage and biometrics.** Use Android Keystore for the session key and Android biometrics for quick unlock. This is the main reason for choosing Capacitor.
- [ ] **Store documents and assets.** Add a privacy policy, terms page, README, LICENSE file, store screenshots, and a feature graphic.
- [ ] **Release pipeline.** GitHub Actions builds web, extension, and Android artifacts. Attach checksums to each release.
- [ ] **Chrome Web Store pack.** Package zip, screenshots, permission justifications, privacy practices, and a single-purpose statement.
- [ ] **Google Play pack.** AAB, data safety form, content rating, privacy policy URL, and store listing.
- [ ] **Ship order.** Sideload APK first for testing, then publish to Play after checks pass.

---

## Milestone 3 - Premium extras

- [ ] **Secure sharing and emergency access.** Design first. Needs key exchange and a threat model before code. No server may see plaintext.
- [ ] **More item types.** Attachments, secure notes, cards, and identities. Keep payload size limits.
- [ ] **QR scan for 2FA.** Scan `otpauth://` QR codes in the PWA and Android app.
- [ ] **Accessibility audit.** Target WCAG 2.2 AA. Check contrast, focus, keyboard, screen reader labels, and reduced motion.
- [ ] **i18n framework.** Extract strings, keep English as the default, add more languages later.
- [ ] **Opt-in diagnostics screen.** Failed unlocks, sync errors, cache sizes, and app version. Local only. Never log secrets.
- [ ] **More importers and duplicate cleanup.** Add more password manager formats. Detect and merge duplicates.
- [ ] **Password history.** Keep encrypted old passwords per entry with a retention setting.

---

## Engineering and docs

- [ ] **TypeScript conversion.** Start with `checkJs`, then convert one module at a time.
- [ ] **New README.** Explain what OKey is, the security model, how to run, build, and test.
- [ ] **Refresh `docs/architecture.md`.** Match the current code and the Capacitor target.
- [ ] **One version number.** `package.json` is `1.0.0`, `APP.VERSION` is `2.3.0`, and the manifest is `1.0.0`. Pick one source of truth.
- [ ] **Mark stale claims.** Fix old "Nebula dark" and "Bloom light" notes in `revamp.md`, `HANDOFF.md`, and `checklist.md`.
- [ ] **Design polish leftovers.** Finish any design finding still open in `conversation.md`, and get Krishna's popup and phone screenshots for F60.

---

## Out of scope for now

- SSO, SAML, SCIM, admin console, org policies, audit export, and compliance programs.
- Storing website passkeys.
- A native iOS app. The PWA covers iOS for now.
