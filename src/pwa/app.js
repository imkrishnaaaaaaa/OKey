/**
 * OKey 2.0 — PWA entry point.
 * Shares the exact application core and Nebula views with the extension;
 * this shell only wires platform storage, sessions, and the service worker.
 */

import { attachCore, mountCore, configureShell, relayout } from '../ui/app-core.js';
import { mountNebula } from '../ui/nebula-canvas.js';
import { Vault } from '../core/vault.js';
import { IndexedDbAdapter } from './lib/idb-adapter.js';
import { cacheDek, getCachedDek, touchSession, clearSession } from './lib/session.js';
import { setSessionBridge } from '../ui/session-neutral.js';

mountNebula(document.getElementById('nebula'));

const storage = new IndexedDbAdapter();
attachCore({ storage, vault: new Vault(storage) });

setSessionBridge({ cacheDek, getCachedDek, touchSession, clearSession });

// Wide windows get a list and a detail side by side; every unlocked screen has an address.
const TWO_PANE = matchMedia('(min-width: 1000px)');
configureShell({ routing: true, twoPane: () => TWO_PANE.matches });
TWO_PANE.addEventListener('change', relayout);

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('./sw.js').catch(() => {});
}

mountCore().catch((e) => {
  console.error('OKey PWA boot failure:', e);
  document.getElementById('app')?.append(
    Object.assign(document.createElement('div'), {
      style: 'padding:32px;text-align:center;color:#fb7185;font-family:system-ui',
      textContent: 'OKey failed to start — reload the page.',
    }),
  );
});
