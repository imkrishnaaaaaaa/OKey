/**
 * Restore a vault from an OKey backup file onto an empty device.
 *
 * The file holds the encrypted records and the key wrapped by the 24 recovery
 * words (never the PIN). So the way in is the same as for a cloud restore: the
 * file, the 24 words, and a new PIN for this device. Nothing is written unless
 * the file is valid, the words open it and the PIN is acceptable.
 */

import { importOkeyBackup } from './import-export.js';

/**
 * @param {import('./vault.js').Vault} vault an empty (not set up) vault
 * @param {string} fileText the text of the backup file
 * @param {string} mnemonic the 24 recovery words
 * @param {string} newPin PIN for this device
 * @throws {ValidationError} for a bad file, bad words or a weak PIN. DecryptionError for the wrong words.
 */
export async function restoreFromBackup(vault, fileText, mnemonic, newPin) {
  const backup = importOkeyBackup(fileText);
  await vault.restoreWithRecovery(
    mnemonic,
    newPin,
    { salt: backup.salt, kdfParams: backup.kdfParams, wrappedRecovery: backup.wrappedRecovery },
    backup.records,
  );
}
