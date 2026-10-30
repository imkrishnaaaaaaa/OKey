/**
 * OKey Extension — Unlock iframe controller.
 *
 * Runs as an extension page inside a cross-origin iframe: page scripts can
 * neither read the PIN input nor forge chrome.runtime messages. Talks to the
 * service worker directly; tells the host page only "unlocked".
 */

const pin = document.getElementById('pin');
const err = document.getElementById('err');
const go = document.getElementById('go');

pin.addEventListener('input', () => {
  pin.value = pin.value.replace(/[^0-9]/g, '').slice(0, 4);
  if (pin.value.length === 4) submit();
});

pin.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });
go.addEventListener('click', submit);

async function submit() {
  if (pin.value.length < 4) return;
  go.disabled = true;
  err.textContent = '';
  try {
    const res = await chrome.runtime.sendMessage({ type: 'UNLOCK_VAULT', pin: pin.value });
    if (res?.success) {
      parent.postMessage({ type: 'okey-unlock-success' }, '*');
      return;
    }
    err.textContent = res?.error || 'Incorrect PIN';
    shake();
  } catch {
    err.textContent = 'Could not reach OKey';
    shake();
  } finally {
    go.disabled = false;
    pin.value = '';
    pin.focus();
  }
}

function shake() {
  pin.classList.remove('shake');
  void pin.offsetWidth; // restart animation
  pin.classList.add('shake');
}

pin.focus();
