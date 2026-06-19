/**
 * OKey Extension — One-time storage migration
 *
 * Renames any legacy `vaultsheet_` keys to the new `okey_` namespace. Runs once
 * on install/update and is a no-op for fresh installs. Values are copied
 * verbatim (still ciphertext for vault data), then the legacy keys are removed.
 */

import { LEGACY_STORAGE_KEYS, STORAGE_KEYS } from '../../core/constants.js';

export async function migrateLegacyStorage() {
  const flag = (await chrome.storage.local.get(STORAGE_KEYS.SCHEMA_MIGRATED))[STORAGE_KEYS.SCHEMA_MIGRATED];
  if (flag) return { migrated: 0 };

  const legacyKeys = Object.keys(LEGACY_STORAGE_KEYS);
  const existing = await chrome.storage.local.get(legacyKeys);
  const toSet = {};
  const toRemove = [];
  let migrated = 0;
  for (const [legacy, modern] of Object.entries(LEGACY_STORAGE_KEYS)) {
    if (existing[legacy] !== undefined) {
      toSet[modern] = existing[legacy];
      toRemove.push(legacy);
      migrated++;
    }
  }
  if (migrated) {
    await chrome.storage.local.set(toSet);
    await chrome.storage.local.remove(toRemove);
  }
  await chrome.storage.local.set({ [STORAGE_KEYS.SCHEMA_MIGRATED]: true });
  return { migrated };
}
