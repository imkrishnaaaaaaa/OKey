# OKey — Complete Handoff Context

## 🎯 Project Motto
**"Your keys. Your galaxy. Sealed on this device before anything ever leaves it."**

Zero-knowledge password manager: Chrome extension (MV3) + PWA. Local-first, cloud-sync optional, E2E encrypted (AES-256-GCM + Argon2id), no server trust required.

---

## 📍 Current State (as of commit `0adb851`)

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
| **Tests** | **42/42 pass** (crypto, vault, auth, cloud sync, domain-matcher, kdf, schema) |
| **Builds** | Both `dist/extension` (load-unpacked) + `dist/pwa` (localhost) green |
| **Security** | Zero secrets in repo, `firestore.rules` enforces per-UID isolation |

### ⚠️ PENDING / KNOWN GAPS
| Item | Notes |
|------|-------|
| **Real cloud sync verification** | Local test showed "Offline — will retry" — likely Firestore rules/token issue on localhost. Need to verify in Firebase Console → Firestore Data that `users/<uid>/` docs are created. |
| **Multi-device sync test** | Sign in on 2nd device/profile → vault pulls down |
| **Content-script autofill** | Built, never battle-tested on real sites |
| **Deferred** | Vector-clock conflict resolution, biometric unlock, TS migration |

---

## 🗂️ Key Files to Reference

| File | Purpose |
|------|---------|
| `src/lib/firebase-config.js` | **Fill with real Firebase config** (currently placeholders) |
| `firestore.rules` | Security rules — **must match `cloud.js` paths** |
| `src/lib/firebase.js` | Auth bootstrap, `signInGoogle` with redirect fallback |
| `src/core/cloud.js` | Firestore REST store (meta, settings, entries CRUD, delta query) |
| `src/core/cloud-sync.js` | Sync controller (push/pull/moveToCloud/restoreFromCloud) |
| `src/ui/app-core.js` | Shared state, router, `attachCore()`, `mountCore()`, `setView()` |
| `src/ui/nebula-canvas.js` | Living background (pastel washes + specks + parallax) |
| `src/ui/kit.js` | Component kit: `pinInput`, `keyholeOrb`, `dropdown`, `switch`, etc. |
| `src/extension/ui/views-auth.js` | Welcome, onboarding wizard, lock screen (orb integrated) |
| `src/extension/ui/views-vault.js` | Vault list, detail, edit, generator, settings |
| `src/extension/popup/popup.js` | Extension entry: `attachCore` + `mountNebula` + `mountCore` |
| `src/pwa/app.js` | PWA entry (same core, IndexedDbAdapter) |
| `styles/nebula/*.css` | Tokens, aurora backdrop, components, motion, screens, showpiece |
| `tests/*.test.js` | 42 tests — run with `npm test` |

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

# 4. Firebase Console (one-time):
#   - Firestore → Create DB (production mode, asia-south1)
#   - Authentication → Enable Google + Email/Password
#   - Firestore → Rules → paste firestore.rules → Publish
#   - Web app → copy config → paste into src/lib/firebase-config.js

# 5. Build
npm run build

# 6. Test
npm test                 # 42/42 should pass

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

## 🔐 Security Notes

- **E2E encryption**: Vault locked with Argon2id(PIN) → AES-256-GCM DEK
- **Cloud sees only ciphertext** — rules enforce `request.auth.uid == resource.data.uid`
- **API key in `firebase-config.js` is public by design** — rules protect data
- **Regenerate API key** if you ever rotated it (the old commit `50aaddd` had a real key exposed — now purged from history)

---

## 📋 Next Actions for New Agent

1. **Fill `src/lib/firebase-config.js`** with real config
2. **Verify cloud sync**: Run PWA, sign in → create vault → check Firebase Console → Firestore → Data for `users/<uid>/entries/...`
4. If sync fails: compare `cloud.js` paths vs `firestore.rules` paths
5. Run `npm test` — should be 42/42
6. Load `dist/extension` in Chrome → test autofill on real sites
7. Tackle pending items (multi-device, autofill hardening, vector clocks)

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