# OKey — Complete Handoff Context

## 🎯 Project Motto
**"Your keys. Your galaxy. Sealed on this device before anything ever leaves it."**

Zero-knowledge password manager: Chrome extension (MV3) + PWA. Local-first, cloud-sync optional, E2E encrypted (AES-256-GCM + Argon2id), no server trust required.

---

## 📍 Current State (after the review round in `conversation.md`; changes are not committed yet)

### ✅ COMPLETED
| Area | Status |
|------|--------|
| **Visual retheme** | "Bloom" — Purple & White consumer aesthetic, Nunito font, pill controls, soft shadows, ambient pastel canvas (`nebula-canvas.js`) |
| **Auth** | Firebase Auth (Google + email/password), popup→redirect fallback, humanized errors |
| **Storage** | Local-first (IndexedDB PWA / chrome.storage.local extension), E2E encrypted vault |
| **Cloud sync** | Firestore REST (signed ID tokens), per-user ciphertext, `firestore.rules` locked to UID |
| **Sheets backend** | **Fully purged** — `apps-script/`, `migration.js`, `vaultsheet_*` keys gone |
| **Boot fixes** | `setSessionBridge` import, `unlock.html` autofocus removed |
| **Auth hardening** | popup→redirect retry, humanized error codes (popup-blocked, network, unauthorized-domain) |
| **UI/UX** | Keyhole orb (breathes, fills per PIN digit, bursts on unlock), depth cards, smooth transitions |
| **Tests** | All pass with `npm test` (crypto, vault, cloud sync, restore, domain-matcher, kdf, schema, totp, import-export) |
| **Builds** | Both `dist/extension` (load-unpacked) + `dist/pwa` (localhost) green |
| **Security** | Zero secrets in repo, `firestore.rules` enforces per-UID isolation |

### ⚠️ PENDING / KNOWN GAPS
| Item | Notes |
|------|-------|
| **Firebase console steps** | Publish `firestore.rules`, limit the web API key. See "Console steps" below |
| **Extension, real Chrome** | Not run by the reviewer or the worker: autofill on real sites, the offscreen clipboard clear, `use_dynamic_url`, and Google sign-in in the popup (`conversation.md` F43, F46) |
| **Multi-device sync, real devices** | Covered by tests on an in-memory Firestore and a live project check, but not by two real devices |
| **Deferred** | Biometric unlock, TypeScript migration, extension iframe picker, sync tie-breaks. See `todo.md` |

---

## 🗂️ Key Files to Reference

| File | Purpose |
|------|---------|
| `src/lib/firebase-config.js` | Firebase web config for project `okey-manager` (the web API key is public by design) |
| `firestore.rules` | Security rules — **must match `cloud.js` paths** |
| `src/lib/firebase.js` | Auth bootstrap, `signInGoogle` with redirect fallback |
| `src/core/cloud.js` | Firestore REST store (meta, settings, batched entry commits, paged pulls by `syncedAt`) |
| `src/core/cloud-sync.js` | Sync controller (push/pull/moveToCloud/restoreFromCloud) |
| `src/ui/app-core.js` | Shared state, router, `attachCore()`, `mountCore()`, `setView()` |
| `src/ui/nebula-canvas.js` | Living background (pastel washes + specks + parallax) |
| `src/ui/kit.js` | Component kit: `pinInput`, `keyholeOrb`, `dropdown`, `switch`, etc. |
| `src/extension/ui/views-auth.js` | Welcome, onboarding wizard, lock screen (orb integrated) |
| `src/extension/ui/views-vault.js` | Vault list, detail, edit, generator, settings |
| `src/extension/popup/popup.js` | Extension entry: `attachCore` + `mountNebula` + `mountCore` |
| `src/pwa/app.js` | PWA entry (same core, IndexedDbAdapter) |
| `styles/nebula/*.css` | Tokens, aurora backdrop, components, motion, screens, showpiece |
| `tests/*.test.js` | Run with `npm test` |

---

## 🚀 Setup & Run (New Machine)

```bash
# 1. Clone
git clone https://github.com/imkrishnaaaaaaa/OKey.git
cd OKey

# 2. Install deps
npm ci

# 3. Add real Firebase config
# Edit src/lib/firebase-config.js with your project's values

# 4. Firebase Console (one-time). Full checklist in "Console steps" below.

# 5. Build
npm run build

# 6. Test
npm test                 # every test should pass

# 7. Extension
#   chrome://extensions → Load unpacked → dist/extension

# 8. PWA (local)
python3 -m http.server 8903 -d dist/pwa
# open http://localhost:8903
```

---

## 🏗️ Architecture Snapshot

```
┌─────────────────────────────────────────────────────────────┐
│                    SHARED CORE (src/)                       │
│  crypto.js  kdf.js  vault.js  totp.js  domain-matcher.js   │
│  cloud.js  cloud-sync.js  constants.js  settings.js        │
└──────────────────────────┬──────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        ▼                  ▼                  ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│  EXTENSION    │   │     PWA       │   │  CONTENT SCRIPT│
│  (MV3)        │   │  (PWA)        │   │  (injected)    │
├───────────────┤   ├───────────────┤   ├───────────────┤
│ popup.js      │   │ app.js        │   │ content.js     │
│ service-worker│   │ sw.js         │   │ content.css    │
│ manifest.json │   │ index.html    │   │                │
│ views-auth.js │   │ app.css       │   │                │
│ views-vault.js│   │ manifest.json │   │                │
└───────────────┘   └───────────────┘   └───────────────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
              ┌───────────────────────┐
              │   FIRESTORE (E2E)     │
              │  users/{uid}/         │
              │   meta, settings,     │
              │   entries, vault      │
              └───────────────────────┘
```

---

## 🧰 Console steps (done by the project owner, nothing deploys these)

There is no `firebase.json`, so the rules are published by hand.

1. **Firestore**: create the database (production mode, region `asia-south1`).
2. **Rules**: Firestore → Rules → paste the whole of `firestore.rules` → Publish. Do this again after every change to that file. The current file has an `entries` block (one doc per entry at `users/{uid}/entries/{id}`) and refuses any write to `vault/*` that contains `wrappedMaster`.
3. **Authentication**: Sign-in method → turn on Google and Email/Password. Settings → Authorized domains: `localhost` is there by default, add the domain you serve the PWA from.
4. **Limit the web API key**: Google Cloud Console → APIs & Services → Credentials → the browser key for `okey-manager`.
   - Application restrictions: websites (HTTP referrers). Add `localhost:*`, your PWA domain, and the extension origin `chrome-extension://<extension id>/*`.
   - API restrictions: keep only Identity Toolkit API, Token Service API and Cloud Firestore API.
   - The key is public by design, so this limits abuse and cost, it does not protect data. The rules protect data.
5. **App Check** (optional, later): makes requests prove they come from the real app.
6. **Test account**: if you made an email/password account just for local testing, delete it from Authentication → Users when you are done.

### Google sign-in inside the Chrome extension (one-time, extension only)

The web app already has Google sign-in. In the extension the button stays hidden until this is done (email and password work meanwhile).

The extension id is fixed by the `key` field in `src/extension/manifest.json`: **`fmegecgpmghgnlbjfanplfnmeoodkcpk`**. So the redirect address is **`https://fmegecgpmghgnlbjfanplfnmeoodkcpk.chromiumapp.org/`** and it does not change when you reload or re-add the extension. (The matching private key was not kept, it is not needed for loading unpacked. If you ever publish to the Chrome Web Store, the store gives its own id: add that id's redirect address too.)

1. Google Cloud Console, project `okey-manager` → APIs & Services → **OAuth consent screen**. If it is in "Testing", add the Google accounts you will sign in with as test users.
2. APIs & Services → **Credentials** → Create credentials → **OAuth client ID** → Application type **Web application** → name "OKey extension" → under **Authorized redirect URIs** add `https://fmegecgpmghgnlbjfanplfnmeoodkcpk.chromiumapp.org/` → Create.
3. Copy the **Client ID** (it ends in `.apps.googleusercontent.com`). Paste it into `GOOGLE_EXTENSION_CLIENT_ID` in `src/lib/firebase-config.js`. It is public by design, like the Firebase key.
4. `npm run build`, then `chrome://extensions` → reload OKey.
5. If sign-in later says "Google sign-in failed" and Google's own page worked, Firebase is refusing the token: Firebase Console → Authentication → Sign-in method → Google → "Safelist client IDs from external projects" → add the same Client ID.

**What you should see when it works:** open the popup → "Continue with Google" is there. Click it → a toast says a Google window opened, and the popup closes (that is normal). Pick your account in the Google window, it closes by itself. Open the OKey popup again: it moves on by itself to "Welcome back" (if the account already has a vault) or to creating a PIN (a new account).

---

## 🔄 How sync and restore work (short)

- **Sync order:** meta check, pull, merge, push, save ledger, move cursor. Details in `docs/architecture.md` §5.
- **Server clock:** every entry write sets `syncedAt` on the server. The cursor is the last `syncedAt` seen, so device clocks do not matter.
- **Ledger:** `okey_pushed_<uid>` remembers what the cloud holds per entry, so only changed entries are sent, in commits of 50.
- **Recovery key:** `recoveryVersion` says which recovery wrap is newer. The higher number wins on every device, so an old device cannot undo a new key.
- **New device:** sign in, type the 24 words, choose a PIN. A backup file works the same way ("Restore from a backup file").
- **No offline queue:** a failed sync stops before the cursor moves and the next one repeats it.

---

## 🔐 Security Notes

- **E2E encryption**: Vault locked with Argon2id(PIN) → AES-256-GCM DEK
- **The PIN wrap never leaves the device.** Cloud meta and the backup file hold only the 24-word recovery wrap. A 4-digit PIN can be guessed offline, the 24 words cannot. A new device needs sign-in, the 24 words, then a new local PIN. Lost words plus a lost device means the vault is gone.
- **Cloud sees only ciphertext** — rules enforce `request.auth.uid == resource.data.uid`
- **API key in `firebase-config.js` is public by design** — rules protect data
- **Regenerate API key** if you ever rotated it (the old commit `50aaddd` had a real key exposed — now purged from history)

---

## 📋 Next Actions for New Agent

1. **Verify cloud sync**: Run PWA, sign in → create vault → check Firebase Console → Firestore → Data for `users/<uid>/entries/...`
2. If sync fails: compare `cloud.js` paths vs `firestore.rules` paths, and check the rules are published
3. Run `npm test` — every test should pass
4. Load `dist/extension` in Chrome → test autofill on real sites
5. Tackle pending items (autofill hardening, see `conversation.md` for the open review findings)

---

## 📌 MD Files to Read

| File | Why |
|------|-----|
| `revamp.md` | Current spec/architecture (source of truth) |
| `checklist.md` | Progress tracker (30/30 done) |
| `docs/architecture.md` | Detailed HLD |
| `todo.md` | Deferred items |
| `firestore.rules` | Security model |

---

**That's the full picture. The codebase is clean, tested, and ready for the final cloud sync verification. Good luck.**