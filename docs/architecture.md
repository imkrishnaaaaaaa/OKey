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
│  users/{uid}/vault/{meta,settings} + users/{uid}/entries/*  ← ciphertext   │
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
* `wrappedRecovery`, `salt` and `kdfParams` live in `users/{uid}/vault/meta`.
* `wrappedMaster` (the PIN wrap) stays on the device and is never uploaded. A 4-digit PIN has
  10,000 options, so a cloud or backup copy of its wrap could be brute-forced offline. The
  24-word recovery key is 256 bits and cannot be guessed.
* New device: sign in, type the 24 words, pick a new local PIN. The DEK is unwrapped with the
  recovery key and wrapped again under the new PIN, with the same salt and KDF params.

## 4 · Auth flow

States: `signedOut → authenticating → signedIn(noLocalVault? onboarding : vault)`
→ `unlocked ⇄ locked`.

* **Google:** `signInWithPopup(GoogleAuthProvider)` — one tap.
* **Email/password:** `createUserWithEmailAndPassword` /
  `signInWithEmailAndPassword`.
* Auth persists via Firebase's indexedDB persistence; extension popup rehydrates
  on open.
* Sign-out clears session DEK immediately; ciphertext at rest stays.

## 5 · Sync protocol (`core/cloud-sync.js`, `core/cloud.js`)

```
order:   meta check → pull → merge → push → save ledger → move cursor
meta:    CloudSync._syncMeta(uid) runs first, once per account + salt + recoveryVersion
           - other salt in the cloud            → VAULT_EXISTS, nothing is written
           - cloud recoveryVersion is higher    → copy its wrappedRecovery here, never push over it
           - no meta / legacy wrappedMaster / our recoveryVersion is higher → upload ours
pull:    runQuery entries where syncedAt >= cursor, ordered by syncedAt, 500 per page → mergeRemoteRecords()
           syncedAt is set by Firestore (updateTransforms REQUEST_TIME), so no device clock is involved.
           Entries from one commit share a syncedAt: a page must stay bigger than one commit (50 writes).
           The cursor is the last syncedAt seen (okey_sync_cursor_<uid>).
push:    ledger okey_pushed_<uid> (id → "version:updatedAt") says what the cloud holds.
           Only entries that differ from it are sent, in :commit batches of 50 (full-document writes).
failure: any failed step throws before the cursor moves. The next sync repeats the same work.
           There is no offline queue and no realtime listener.
merge:   last-writer-wins by (version, updatedAt)
```

New device: sign in → type the 24 words → choose a local PIN (`restoreFromCloud` →
`Vault.restoreWithRecovery`). A backup file restores the same way (`restoreFromBackup`).

## 6 · Firestore schema

```
users/{uid}                     map
  email: string · createdAt: ts · displayName: string

users/{uid}/vault/meta          doc "meta"
  salt: string(b64) · kdfParams: map · wrappedRecovery: string(b64)
  formatVersion: number · updatedAt: ts   // no wrappedMaster, see §3

users/{uid}/vault/settings      doc "settings"
  <allowlisted settings keys> · updatedAt: ts

users/{uid}/entries/{id}
  // Own collection, not under vault/. Firestore doc paths need an even
  // segment count, so users/{uid}/vault/entries/{id} is not a valid doc path.
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

      match /vault/{docId} {
        allow read, delete: if isOwner(uid);
        allow create, update: if isOwner(uid)
          && !request.resource.data.keys().hasAny(['wrappedMaster']);
      }

      match /entries/{entryId} {
        allow read, delete: if isOwner(uid);
        allow create, update: if isOwner(uid)
          && request.resource.data.get('payload', '').size() <= 102400;
      }
    }
  }
}
```

## 8 · Module boundaries

| Module | Owns | Must not touch |
|---|---|---|
| `core/vault.js` | encrypted state machine | DOM, firebase, chrome.* |
| `core/cloud.js` | Firestore transport (REST, batched commits, paged pulls) | crypto primitives |
| `lib/firebase.js` | SDK init + auth state observable | vault internals |
| `extension/popup` (new UI) | views, motion, user intent | raw storage keys |
| content script | badge targeting + fill | network, storage.local |

## 9 · Failure modes

| Case | Behavior |
|---|---|
| Firebase unreachable | full offline mode; sync throws and the footer shows "Offline, will retry"; the next sync repeats from the same cursor |
| Not configured (no keys) | app runs local-only; cloud UI hidden |
| Wrong PIN | persisted backoff counters; vault wipe guard at 30 attempts (unchanged) |

## 10 · Bundle budget

popup JS ≤ 900 KB including modular Firebase SDK (auth + firestore).
Verified by CI (`7.3`).
