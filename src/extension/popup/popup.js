/**
 * OKey 2.0 — popup entry point (extension shell around the shared core).
 */
import { attachCore, mountCore } from '../../ui/app-core.js';
import { setSessionBridge } from '../../ui/session-neutral.js';
import { mountNebula } from '../../ui/nebula-canvas.js';
import { Vault } from '../../core/vault.js';
import { ChromeStorageAdapter, chromeNetwork } from '../lib/platform.js';
import { hardenSession, setPopupOpen, cacheDek, getCachedDek,
         touchSession, clearSession } from '../lib/session.js';

void chromeNetwork;

mountNebula(document.getElementById('nebula'));

const storage = new ChromeStorageAdapter('local');
attachCore({ storage, vault: new Vault(storage) });

setSessionBridge({ cacheDek, getCachedDek, touchSession, clearSession });

mountCore().catch((e) => {
  console.error('OKey boot failure:', e);
  document.getElementById('app')?.append(
    Object.assign(document.createElement('div'), {
      style: 'padding:24px;text-align:center;color:#fb7185;font-family:system-ui',
      textContent: 'OKey failed to start — reload the extension.',
    }),
  );
});
