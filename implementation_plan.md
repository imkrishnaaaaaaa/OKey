# Implementation Plan — Vault Enhancements & Sync Polishing

This plan addresses five enhancements and bug fixes across the Google Sheets backend (Apps Script), Chrome Extension, and PWA components of the **OKey** password manager.

## User Review Required

> [!IMPORTANT]
> **Apps Script Migration**: Adding the `Folder` field requires updating the Google Sheets spreadsheet schema. Existing users who pull the updated extension will need to update their `Code.gs` in their Google Apps Script editor. Running **"Setup sheet"** on their existing sheet will safely add the new column `Folder` without losing any existing entries.

> [!NOTE]
> **Folder Names in Plaintext**: The folder names will be stored in cleartext in the `Folder` column on Google Sheets, just like the `Domain` column. This enables the Apps Script backend to extract the unique list of folder names without decryption keys. The sensitive login credentials (username, password, notes, totp, etc.) remain fully encrypted client-side.

## Open Questions

None. The requirements are clear and follow the existing design patterns.

---

## Proposed Changes

### 1. Apps Script Backend

#### [MODIFY] [Code.gs](file:///d:/Projects/Okey/apps-script/Code.gs)
* Update `ensureSheet` to be defensive: if a sheet exists but is completely empty (0 rows), populate it with headers. If it has data, leave it completely untouched.
* Update `VAULT_COLS` to include `'Folder'` as the 9th column (index 8), shift `'Payload'` to the 10th column (index 9).
* Update `readVault()` to extract `rec.folder` from the 9th column of each row.
* Update `rowValues()` to append `e.folder` in the correct column.
* Add a `getFolders()` handler in the `handle` function under action `'getFolders'` that extracts the unique, sorted list of folders from `OKeyVault` entries (excluding deleted ones) and returns them as a JSON list.

---

### 2. Core Library (Client Engine)

#### [MODIFY] [constants.js](file:///d:/Projects/Okey/src/core/constants.js)
* Add `CACHED_FOLDERS: 'okey_cached_folders'` and `FOLDERS_CACHE_TIME: 'okey_folders_cache_time'` to `STORAGE_KEYS`.

#### [MODIFY] [schema.js](file:///d:/Projects/Okey/src/core/schema.js)
* Add `folder` key to `METADATA_FIELDS` and document it in the `VaultEntry` JSDoc typedef.
* In `createEntry()`, map `folder: clampStr(data.folder, 200)`.

#### [MODIFY] [vault.js](file:///d:/Projects/Okey/src/core/vault.js)
* Add `'folder'` to `META_KEYS` so that it is serialized as cleartext metadata at rest.
* In `_recordToEntry()`, ensure `folder: rec.folder` is mapped when recreating the entry from database records.

#### [MODIFY] [sync.js](file:///d:/Projects/Okey/src/core/sync.js)
* Add `getFolders(force = false)` method:
  * Reads cached folders from storage.
  * If `force === true`, cache is empty, or cache is older than 24 hours (86400000 ms), fetch new folders via the `getFolders` endpoint in Apps Script, cache them, and return.
  * Otherwise, return the cached list.
* Update `addProfile` and `updateProfile` to enforce profile uniqueness:
  * Throw an error if a profile with the same name (case-insensitive) already exists.
  * Throw an error if a profile with the same Apps Script URL already exists.

---

### 3. Extension Front-end (Popup)

#### [MODIFY] [popup.js](file:///d:/Projects/Okey/src/extension/popup/popup.js)
* **Enter key issue**: In `renderLocked()`, update the keydown event listener on the password field to call `e.preventDefault()` when `Enter` is pressed before running `submit()`. This prevents browser defaults in Edge that close the popup panel.
* **Folder Field in Form**: In `renderEdit()`, fetch cached folders using `sync.getFolders()` and build an HTML5 `<datalist>` of existing folder names. Add a `Folder` text input mapped to this datalist, allowing the user to select an existing folder or type a new one. Update the form save logic to collect the `folder` input value.
* **Folder Field in Details**: In `renderDetail()`, display the `Folder` field if the entry has one.
* **Footer Sync Button**: In `renderFooter()`, add a sync icon button using `ICONS.refresh` right next to the last synced label. Clicking it calls `doManualSync()` and adds a `.spinning` class to spin the icon.
* **Sync Dots & State**: Add a global `syncStatus` state variable. When starting sync, update the dot to `.syncing`. On success, set to `.ok` and update last sync label. On error, set to `.err`.
* **Sync Cache Invalidation**: In `doManualSync()`, clear the cached folders from local storage and force a refresh of the folders list using `sync.getFolders(true)`.

#### [MODIFY] [popup.css](file:///d:/Projects/Okey/src/extension/popup/popup.css)
* Add styling for the footer sync button (`okey-footer-sync-btn`).
* Add the `@keyframes okey-spin` rotation animation and the `.spinning` class.

---

### 4. PWA Front-end

#### [MODIFY] [app.js](file:///d:/Projects/Okey/src/pwa/app.js)
* **Enter key issue**: Update the password field keydown event in `renderLocked()` to call `e.preventDefault()` on `Enter`.
* **Folder Field**: In `renderEdit()`, construct the same folder input with `<datalist>` and populate it from `sync.getFolders()`. Update form save logic.
* **Folder Field in Details**: Display `Folder` in `renderDetail()` if it exists.
* **Demand Sync**: Add the `refresh` icon button in `renderMain` header next to settings gear to trigger `doSync()`.
* **Sync Cache Invalidation**: In `doSync()`, clear the cached folders and call `sync.getFolders(true)`.

#### [MODIFY] [app.css](file:///d:/Projects/Okey/src/pwa/app.css)
* Add datalist styling or any necessary folder input adjustments.

---

## Verification Plan

### Automated Tests
* Run `npm run build` to verify compilation.

### Manual Verification
1. **Setup sheet safety**: Insert dummy data into a Sheet and click "Setup Sheet" to verify it does not override any existing sheets or data.
2. **Duplicate Profile Check**: Attempt to add a profile with a duplicate name or duplicate URL and verify that it displays an error.
3. **Folder Field & Dropdown**: Add/Edit items and check that the folder field shows a dropdown suggestion list of existing folder names. Verify that new folder names are saved.
4. **Cache Policy**: Check that folder list is cached. Verify that doing a manual sync clears the cache and fetches the updated folders.
5. **Footer Sync**: Click the Sync button in the extension footer. Verify that the icon spins and the sync dot turns green on success, or red on failure.
6. **Edge Enter key issue**: Lock the vault, type the password, and press Enter. Verify that the extension unlocks instead of closing in Edge.

---

## Status

**All implementation goals have been fully resolved, built, and verified successfully on June 20, 2026.**
* **Build status**: `SUCCESS` (Bundled via esbuild with native support on macOS).
* **Git hygiene**: `.gitignore` created and `node_modules` untracked.