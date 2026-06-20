# OKey — Future Features & Improvements

Below is the list of planned features, UI/UX changes, and branding tasks to be implemented in a subsequent phase:

- **Settings and security:**
- once we are unlocked the extension / PWA we shoudl ahve options to change the master password and upon changes we need to encrypt those messages again and need to sync. If no passwords present now then only changes the master password.
- while unlocking if user dont have master key and recovery he can't proceed further with this we should have option to start fresh also, so it basically clears everythings and make it into stange of first time usages and cleared all saved details.
- Add lock floating button at the bottom right like floating upon clicking it it locks the extensions and closes the extension.
- The copy icons will be siaplayed on hover but in PWA how this works?? How can user able to copy them??  Lets discuss and suggets me idea on ore case

- **Folders Navigation & Filtering:**
  - Add a sidebar or dropdown folder selector in the add item.
  - Filter the vault items list by selected folders. o basically we need to have api which can fectch the folder names and it need to be used in folder section while saving the new item.
  - Since we already discussed that we'll be caching thesse and refresh once in a day.
  - Display folder names/labels directly in list views.

- **Display Formatting & UI Improvements:**
  - Customize the presentation of passwords and TOTP codes.
  - So when we have the cached folders list we need to use this as filter. Currently we have All , logins, Auth, *, and so on we need to hav the folders list and after clicking it need to work as intented. The current size looks perfect and the next folders houlwd be scrollable (horizontally). At the top, horizontal pill-shaped tabs (All, Personal, Work, Social, Media…)
  - Fine-tune color schemes and layout spacing for premium dark mode contrast.
  - Clicking setup  sheets doesn't show any load or anything but api calls mis being made but user doesn't know can we have a loader on setup sheets button text or shwo somehow. So when we do the setup sheet it need to clear the existing columns names and etc rewrite it and sync the latest data. will this cause any problem or clicking setup shhet should mak sure every pw in shhet is stored locally then setup the shhet and then resync all the current existing sheet data. think do what is proper

  - **Passwords Disapply**
    - need major improvements in dispalying of passwords. The look is okayis but need t major imporvents like:

    1. Should have a clear distinguidh between the list of passowrd to password, have a lighter shade of main purple color.
    2. need change on how the passwords are being shown, the individual pitems height need to be little more and the Dispaly Name should be priority to show if not availabe use use the name and below that we have domain the is same color how about having some dimmed color.


- **New Branding & Logos:**
  - Create and configure new custom outline lock logos (an "O"-shaped lock outline) to replace the current generic shield icon.
  - Update logo image files in `assets/`, `src/extension/icons/`, and `src/pwa/icons/`.
  - Update Chrome extension `manifest.json` and PWA `manifest.webmanifest` icon declarations.

- **Improvements from AppScript Code changes:**
  - **Version Control & Compatibility Guard:** Use the `version` API to compare the Apps Script backend version with the local Extension/PWA version. If there's a mismatch, show a warning/error popup advising the user to update their deployed Apps Script code.
  - **Live Vault Dashboard & Status:** Use the `dashboard` and `health` APIs to show a "Vault Status" view. Display total entries, active items, last sync timestamp, and a real-time "Connected" indicator.
  - **Rich Analytics & Insights View:** Use the `analytics` API to display a visual breakdown (e.g., charts or stats) showing entry types (passwords vs notes) and folder distribution to help users understand their data.
  - **Cross-Device Settings Sync:** Leverage the `settings` and `saveSettings` APIs so user preferences (auto-lock timeout, theme, clipboard clear intervals) are synced automatically across the Chrome Extension and PWA.
  - **Custom Drag-and-Drop Order:** Utilize the `getOrder` and `saveOrder` APIs to let users manually reorder their pinned or favorite passwords, persisting this custom layout across all devices.
  - **Smart Folder Caching & Autocomplete:** Use the `getFolders` API to fetch a lightweight list of unique folders to provide smart autocomplete and fast filtering UI without needing to parse the entire vault payload.
  - **Global Cryptographic Metadata:** Use `metadata` and `saveMetadata` to safely store global variables like Argon2 parameters, salts, and wrapped keys, allowing cross-device recovery independent of individual password entries.
