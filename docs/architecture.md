# OKey 2.0 — Architecture

Zero-knowledge vault · Firebase Auth · Firestore sync · Aurora Glass UI.
The server is untrusted: it stores ciphertext plus non-sensitive metadata and
can never read a single secret.

---

## 1 · System overview

```
┌───────────────────────────── Chrome Extension ─────────────────────────────┐
│  popup (Nebula UI)          content script            service worker       │
│  ┌──────────────┐           ┌──────────────┐          ┌─────────────────┐  │
│  │ views/router │           │ smart badges │          │ alarms, lock,   │  │
│  │ auth state   │           │ glass picker │          │ clipboard, sync │  │
│  │ cloud client │           │ autofill     │          │ scheduler       │  │
│  └──────┬───────┘           └──────┬───────┘          └────────┬────────┘  │
│         │        shared core (ES modules, unchanged crypto):             │
│         │  Vault · AES-256-GCM · Argon2id · TOTP · domain-matcher · schema│
└─────────┼──────────────────────────┼───────────────────────────┬─────────┘
          ▼                          ▼                           ▼
    Firebase Auth              web page DOM                chrome.storage.*
    (Google / email+pw)        (untrusted)                 local · session
          │
          ▼
┌───────────────────────────── Firestore ────────────────────────────────────┐
│  users/{uid}/vault/{meta,settings,entries/*}  ← ciphertext + metadata only │
│  Security Rules: request.auth.uid == uid                                   │
└────────────────────────────────────────────────────────────────────────────┘
```

## 2 · Trust boundaries

| Boundary | Threat | Control |
|---|---|---|
| Web page → content script | page reads secrets/PIN | PIN entry in extension iframe; badges never expose secrets; TOTP codes computed SW-side |
| Content script → SW | forged messages | `sender.id === chrome.runtime.id` + tab-scoped URL from `sender.tab.url` |
| Client → Firestore | other users' data | Security Rules keyed on uid; E2E ciphertext regardless |
| Firestore compromise | mass credential theft | payloads are AES-256-GCM envelopes; keys derive on-device only |

## 3 · Crypto data flow

```
master PIN ──Argon2id(salt)──► KEK ──unwrap──► DEK (RAM/sessionStorage only)
                                                 │
entry fields ─────────────AES-256-GCM(DEK)──────►│ payload (b64)
                                                 ▼
                            Firestore entry { metadata…, payload }
recovery key ──HKDF──► recoveryKEK ──unwrap──► same DEK (account recovery)
```

* Changing the master password re-wraps the DEK; entries are never re-encrypted.
* `wrappedMaster`/`wrappedRecovery`/`salt` live in `users/{uid}/vault/meta`.

## 4 · Auth flow

States: `signedOut → authenticating → signedIn(noLocalVault? onboarding : vault)`
→ `unlocked ⇄ locked`.

* **Google:** `signInWithPopup(GoogleAuthProvider)` — one tap.
* **Email/password:** `createUserWithEmailAndPassword` /
  `signInWithEmailAndPassword`.
* Auth persists via Firebase's indexedDB persistence; extension popup rehydrates
  on open.
* Sign-out clears session DEK immediately; ciphertext at rest stays.

## 5 · Sync protocol (`core/cloud.js`)

```
pull:  query entries where updatedAt > lastSyncAt  → mergeRemoteRecords()
push:  entries with version > server copy          → set() with updatedAt=now()
meta:  read on sign-in/restore; written on key changes
realtime: onSnapshot(entries) → live merge into unlocked UIs
offline: writes queue in storage.local; flushed on reconnect/sign-in
last-writer-wins by (version, updatedAt) — identical to v1 semantics
```

## 6 · Firestore schema

```
users/{uid}                     map
  email: string · createdAt: ts · displayName: string

users/{uid}/vault/meta          doc "meta"
  salt: string(b64) · kdfParams: map · wrappedMaster: string(b64)
  wrappedRecovery: string(b64) · formatVersion: number · updatedAt: ts

users/{uid}/vault/settings      doc "settings"
  <allowlisted settings keys> · updatedAt: ts

users/{uid}/vault/entries/{id}
  id: string · domain: string · folder: string · entryType: "password"|"totp"
  version: number · isDeleted: bool · updatedAt: ts
  displayOrder: number · isPinned: bool · payload: string  // GCM b64, ≤100KB
```

## 7 · Security rules (shipped as `firestore.rules`)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    function isOwner(uid) { return request.auth != null && request.auth.uid == uid; }

    match /users/{uid} {
      allow get, update: if isOwner(uid);
      allow create: if isOwner(uid) && request.resource.data.keys().hasOnly(['email','createdAt','displayName']);
      allow delete: if false; // account deletion handled out-of-band

      match /vault/{doc=**} {
        allow read, write: if isOwner(uid);
      }
    }
  }
}
```

## 8 · Module boundaries

| Module | Owns | Must not touch |
|---|---|---|
| `core/vault.js` | encrypted state machine | DOM, firebase, chrome.* |
| `core/cloud.js` | Firestore transport + queues | crypto primitives |
| `lib/firebase.js` | SDK init + auth state observable | vault internals |
| `extension/popup` (new UI) | views, motion, user intent | raw storage keys |
| content script | badge targeting + fill | network, storage.local |

## 9 · Failure modes

| Case | Behavior |
|---|---|
| Firebase unreachable | full offline mode; queue grows; banner chip "Offline — will sync" |
| Not configured (no keys) | app runs local-only; cloud UI hidden |
| Wrong PIN | persisted backoff counters; vault wipe guard at 30 attempts (unchanged) |
| Snapshot listener error | degrade to manual pull + toast |

## 10 · Bundle budget

popup JS ≤ 900 KB including modular Firebase SDK (auth + firestore).
Verified by CI (`7.3`).
