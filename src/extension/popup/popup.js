/**
 * OKey 2.0 — popup entry point (extension shell around the shared core).
 */
import { attachCore, mountCore } from '../../ui/app-core.js';
import { setSessionBridge } from '../../ui/session-neutral.js';
import { mountNebula } from '../../ui/nebula-canvas.js';
import { setClipboardPolicy } from '../../ui/kit.js';
import { MSG } from '../lib/messages.js';
import { Vault } from '../../core/vault.js';
import { ChromeStorageAdapter } from '../lib/platform.js';
import { hardenSession, setPopupOpen, cacheDek, getCachedDek,
         touchSession, clearSession } from '../lib/session.js';

mountNebula(document.getElementById('nebula'));

const storage = new ChromeStorageAdapter('local');
attachCore({ storage, vault: new Vault(storage) });

setSessionBridge({ cacheDek, getCachedDek, touchSession, clearSession });

// Tell the worker the popup is open, so background sync keeps out of the way.
// The flag goes stale after 30 s, so a popup that dies without a goodbye is not stuck "open".
setPopupOpen(true);
const popupHeartbeat = setInterval(() => setPopupOpen(true), 10_000);
addEventListener('pagehide', () => { clearInterval(popupHeartbeat); setPopupOpen(false); });

// The service worker keeps the clear alarm alive after this popup closes.
setClipboardPolicy({ remote: () => chrome.runtime.sendMessage({ type: MSG.COPY_TO_CLIPBOARD }).catch(() => {}) });

mountCore().catch((e) => {
  console.error('OKey boot failure:', e);
  document.getElementById('app')?.append(
    Object.assign(document.createElement('div'), {
      style: 'padding:24px;text-align:center;color:#fb7185;font-family:system-ui',
      textContent: 'OKey failed to start — reload the extension.',
    }),
  );
});
