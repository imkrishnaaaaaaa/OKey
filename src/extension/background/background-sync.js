/**
 * One background sync run, with its parts passed in so each case can be tested.
 * It stays out of the way: not while the popup is open (the popup holds the
 * live copy of the vault and would overwrite our changes), not while locked,
 * and never loudly when signed out.
 */

/**
 * @param {object} deps
 * @param {() => Promise<boolean>} deps.isPopupOpen
 * @param {() => Promise<{lock: () => void}|null>} deps.openVault an unlocked vault, or null when locked
 * @param {() => Promise<{sync: (vault: object) => Promise<{pushed:number,pulled:number}>}|null>} deps.getCloudSync null when cloud is not set up
 */
export async function runBackgroundSync({ isPopupOpen, openVault, getCloudSync }) {
  if (await isPopupOpen()) return { success: false, skipped: 'popup-open' };
  const vault = await openVault();
  if (!vault) return { success: false, skipped: 'locked' };
  try {
    const cloudSync = await getCloudSync();
    if (!cloudSync) return { success: false, skipped: 'not-configured' };
    const { pushed, pulled } = await cloudSync.sync(vault);
    return { success: true, pushed, pulled };
  } catch (err) {
    if (err?.message === 'Not signed in') return { success: false, skipped: 'signed-out' };
    return { success: false, error: String((err && err.message) || err).slice(0, 120) };
  } finally {
    vault.lock();
  }
}
