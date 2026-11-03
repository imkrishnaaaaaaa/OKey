/**
 * OKey 2.1 — pre-vault screens: Welcome/Auth, Onboarding wizard, Lock.
 * The Keyhole orb carries every screen's state.
 */

import { STORAGE_KEYS, SECURITY } from '../../core/constants.js';
import { firebaseReady, signInGoogle, signInEmail, signUpEmail, signOutUser, googleSignInReady, getCurrentUser } from '../../lib/firebase.js';
import { isExtensionContext } from '../../lib/google-auth.js';
import { h, clear, toast, buzz, pinInput, keyholeOrb } from '../../ui/kit.js';
import { recoveryReveal } from '../../ui/recovery-ui.js';
import { restoreFromBackup } from '../../core/backup-restore.js';
import { I } from '../../ui/icons.js';
import { setView, goHome, trySync, ctx, resetIdle } from '../../ui/app-core.js';
import { cacheDek } from '../../ui/session-neutral.js';

const local = () => ctx.store;

/* ============================ WELCOME / AUTH ============================ */
/**
 * After sign-in: an account that already has a cloud vault restores it on this
 * device. A new account creates one. Returns false (and tells the user) when the
 * account cannot be checked, so we never offer "create" next to an unseen vault.
 */
async function routeAfterSignIn(orb) {
  let next;
  try {
    next = (await ctx.cloudSync.hasCloudVault()) ? 'restore' : 'onboarding';
  } catch {
    toast("Couldn't check your account. Check your connection and try again.", 'error');
    return false;
  }
  buzz([10, 30, 10]);
  orb.success();
  setTimeout(() => setView(next), 520);
  return true;
}

/** Restore a vault from a backup file instead of making a new one. */
function backupButton() {
  return h('button', { class: 'nb-btn nb-btn-ghost nb-btn-block ok-skip', style: { marginTop: '4px' }, text: 'Restore from a backup file',
    onclick: () => setView('restore', { mode: 'backup', back: 'welcome' }) });
}

export function renderWelcome(c, root) {
  const orb = keyholeOrb({ size: 108 });
  orb.el.classList.add('nb-bloom');
  const card = h('div', {});
  let emailOpen = false;

  function shake() { card.classList.remove('nb-shake'); void card.offsetWidth; card.classList.add('nb-shake'); setTimeout(() => card.classList.remove('nb-shake'), 450); }

  function buildCard() {
    clear(card);
    if (!firebaseReady()) {
      card.append(
        h('div', { class: 'ok-warn-box', html: I.warn.replace('<svg ', '<svg width="14" height="14" style="vertical-align:-2px;margin-right:6px" ') + '' },
          'Cloud sync isn\'t configured yet — OKey runs fully offline and you can connect an account later in Settings.'),
        h('button', { class: 'nb-btn nb-btn-primary nb-btn-block', text: 'Create my vault',
          onclick: () => setView('onboarding') }),
        backupButton(),
      );
      return;
    }

    const googleBtn = h('button', {
      class: 'nb-btn nb-btn-primary nb-btn-block',
      onclick: async (ev) => {
        const b = ev.currentTarget; b.disabled = true;
        // In the extension the sign-in runs in a new window and this popup closes. Say so first.
        if (isExtensionContext()) toast('A Google window opened. Finish signing in there, then open OKey again.', 'info');
        try {
          await signInGoogle();
          if (!(await routeAfterSignIn(orb))) b.disabled = false;
        } catch (e) { toast(e.message, 'error'); shake(); b.disabled = false; }
      },
    },
      h('span', { html: I.google, style: { width: '18px', height: '18px', display: 'inline-flex' } }),
      'Continue with Google');

    if (!emailOpen) {
      // No Google button where it cannot work (the extension, until its client id is set).
      const google = googleSignInReady();
      card.append(...(google ? [googleBtn] : []),
        h('button', { class: 'nb-btn nb-btn-block ' + (google ? 'nb-btn-glass' : 'nb-btn-primary'), style: { marginTop: google ? '10px' : '0' }, text: 'Continue with email',
          onclick: () => { emailOpen = true; buildCard(); } }));
    } else {
      const email = h('input', { class: 'nb-input', type: 'email', placeholder: 'you@example.com', autocomplete: 'email' });
      const pass = h('input', { class: 'nb-input', type: 'password', placeholder: 'Password', autocomplete: 'current-password', style: { marginTop: '10px' } });
      const errEl = h('div', { class: 'nb-dim', style: { color: 'var(--nb-danger)', minHeight: '18px', fontSize: 'var(--nb-fs-xs)', margin: '8px 0 2px', textAlign: 'center' } });
      let creating = false;
      const submitBtn = h('button', {
        class: 'nb-btn nb-btn-primary nb-btn-block',
        text: 'Sign in',
        onclick: async () => {
          errEl.textContent = '';
          if (!email.value || !pass.value) { shake(); return; }
          submitBtn.disabled = true;
          try {
            creating ? await signUpEmail(email.value.trim(), pass.value)
                     : await signInEmail(email.value.trim(), pass.value);
            if (!(await routeAfterSignIn(orb))) submitBtn.disabled = false;
          } catch (e) { errEl.textContent = e.message; shake(); submitBtn.disabled = false; }
        },
      });
      card.append(email, pass, errEl, submitBtn,
        h('div', { class: 'nb-row', style: { justifyContent: 'center', marginTop: '12px', gap: '4px' } },
          h('span', { class: 'nb-dim', style: { fontSize: 'var(--nb-fs-xs)' }, text: creating ? 'Have an account?' : 'New here?' }),
          h('button', { class: 'nb-btn-ghost', style: { border: 'none', background: 'none', color: 'var(--nb-cyan)', font: 'inherit', fontSize: 'var(--nb-fs-xs)', cursor: 'pointer' },
            text: creating ? 'Sign in' : 'Create account',
            onclick: (ev) => { creating = !creating; ev.currentTarget.textContent = creating ? 'Sign in' : 'Create account'; submitBtn.textContent = creating ? 'Create account' : 'Sign in'; pass.setAttribute('autocomplete', creating ? 'new-password' : 'current-password'); } })),
        h('button', { class: 'nb-btn nb-btn-glass nb-btn-block', style: { marginTop: '10px' }, text: 'Back',
          onclick: () => { emailOpen = false; buildCard(); } }));
    }

    card.append(h('button', { class: 'nb-btn nb-btn-ghost nb-btn-block ok-skip', style: { marginTop: '16px' }, text: 'Use OKey offline for now',
      onclick: () => setView('onboarding') }), backupButton());
  }

  root.append(h('div', { class: 'ok-fullscreen' },
    orb.el,
    h('h1', { class: 'text-hero text-mega', style: { textAlign: 'center', margin: '20px 0 6px' }, text: 'OKey' }),
    h('p', { class: 'nb-muted', style: { textAlign: 'center', margin: '0 0 30px', fontSize: 'var(--nb-fs-sm)', lineHeight: '1.65' },
      text: 'Zero-knowledge passwords & live 2FA.\nSealed on this device before anything ever leaves it.' }),
    card,
  ));
  buildCard();
  // Already signed in (for example the extension finished a Google sign-in while this
  // popup was closed): carry on to restore or onboarding instead of asking again.
  if (firebaseReady()) getCurrentUser().then((u) => { if (u) routeAfterSignIn(orb); }).catch(() => {});
}

/* ============================ RESTORE (new device) ============================ */
/**
 * Open a vault on this device with the 24 words and a new PIN.
 * Default: the signed-in account's cloud vault. `{ mode: 'backup' }`: a backup file
 * instead (`back` says which screen the Back button returns to).
 */
export function renderRestore(c, root, opts = {}) {
  const fromFile = opts.mode === 'backup';
  const orb = keyholeOrb({ size: 78 });
  const file = fromFile ? h('input', { type: 'file', accept: '.json,application/json', class: 'nb-input', 'aria-label': 'Backup file' }) : null;
  const words = h('textarea', {
    class: 'nb-textarea', rows: 4, spellcheck: 'false', autocomplete: 'off',
    placeholder: 'Type or paste your 24 recovery words',
  });
  const pin = pinInput({ autoFocus: false, onChange: (n) => orb.fill(n) });
  const confirmPin = pinInput({ autoFocus: false, onSubmit: () => go() });
  const btn = h('button', { class: 'nb-btn nb-btn-primary nb-btn-block', text: 'Restore my vault', onclick: () => go() });
  let busy = false;

  async function go() {
    if (busy) return;
    if (fromFile && !file.files?.[0]) return toast('Choose your backup file first', 'error');
    if (!words.value.trim()) return toast('Enter your 24 recovery words', 'error');
    if (pin.value.length !== 4) return toast('Choose a 4-digit PIN', 'error');
    if (confirmPin.value !== pin.value) {
      toast('PINs do not match', 'error'); confirmPin.shake(); confirmPin.reset(); return;
    }
    busy = true; btn.disabled = true; btn.textContent = 'Restoring…';
    try {
      if (fromFile) await restoreFromBackup(ctx.vault, await file.files[0].text(), words.value, pin.value);
      else await ctx.cloudSync.restoreFromCloud(ctx.vault, words.value, pin.value);
      await cacheDek(ctx.vault.exportDek(), ctx.settings.autoLockTimeout);
      resetIdle();
      buzz([10, 30, 10]);
      orb.success();
      toast('Vault restored', 'success');
      setTimeout(() => { setView('list'); trySync().catch(() => {}); }, 650);
    } catch (e) {
      busy = false; btn.disabled = false; btn.textContent = 'Restore my vault';
      orb.fail();
      toast(e.code === 'DECRYPTION_FAILED'
        ? (fromFile ? "Those words don't open this backup. Check them and try again." : "Those words don't open this account's vault. Check them and try again.")
        : e.message || 'Restore failed', 'error');
    }
  }

  root.append(h('div', { class: 'ok-fullscreen' },
    h('div', { class: 'nb-col', style: { alignItems: 'center', marginTop: '5vh' } },
      orb.el,
      h('h2', { class: 'text-hero', style: { fontSize: 'var(--nb-fs-2xl)', margin: '18px 0 8px' }, text: fromFile ? 'Restore from a backup' : 'Welcome back' }),
      h('p', { class: 'nb-muted', style: { textAlign: 'center', fontSize: 'var(--nb-fs-sm)', lineHeight: '1.6', margin: '0 0 18px', maxWidth: '320px' },
        text: fromFile
          ? 'Choose your OKey backup file, enter the 24 recovery words it was made with, then choose a PIN for this device.'
          : 'This account already has a vault. Enter your 24 recovery words to open it here, then choose a PIN for this device.' })),
    ...(fromFile ? [h('div', { class: 'nb-label', text: 'Backup file' }), file, h('div', { style: { height: '14px' } })] : []),
    h('div', { class: 'nb-label', text: 'Recovery words' }),
    words,
    h('div', { class: 'nb-label', style: { marginTop: '16px' }, text: 'New PIN for this device' }),
    pin.el,
    h('div', { class: 'nb-label', style: { marginTop: '16px' }, text: 'Confirm PIN' }),
    confirmPin.el,
    h('div', { style: { height: '18px' } }),
    btn,
    fromFile
      ? h('button', { class: 'nb-btn nb-btn-ghost nb-btn-block', style: { marginTop: '10px' }, text: 'Back',
        onclick: () => setView(opts.back || 'welcome') })
      : h('button', { class: 'nb-btn nb-btn-ghost nb-btn-block', style: { marginTop: '10px' }, text: 'Use a different account',
        onclick: async () => { await signOutUser(); setView('welcome'); } }),
  ));
}

/* ============================ ONBOARDING WIZARD ============================ */
const TOUR = [
  { art: I.shield, h: 'Vault-grade encryption', p: 'Every secret is sealed with AES-256-GCM under a key derived from your PIN with Argon2id. Not even your cloud provider can read them.' },
  { art: I.cloud, h: 'Synced, invisibly', p: 'Changes travel to your private encrypted space the moment you make them. On a new device, sign in and enter your 24-word recovery key.' },
  { art: I.wand, h: 'Built for flow', p: 'One tap copies passwords and live 2FA codes. Autofill badges appear only where they matter. Auto-lock has your back.' },
];

export function renderOnboarding(c, root) {
  const stage = h('div', { class: 'ok-fullscreen' });
  root.append(stage);
  go(0);

  function go(step) {
    clear(stage);
    if (step === 0) pinStep(true);
    else if (step === 1) pinStep(false);
    else if (step === 2) recovery();
    else tour(0);
  }

  /* steps 0+1: PIN create / confirm — orb ring fills digit by digit */
  let firstPin = '';
  let mnemonic = ''; // the recovery words from setup(), shown once on step 2

  function pinStep(isCreate) {
    const orb = keyholeOrb({ size: 78 });
    const pin = pinInput({
      autoFocus: true,
      onChange: (n) => { orb.fill(n); cta.disabled = n !== 4; },
      onSubmit,
    });
    const cta = h('button', { class: 'nb-btn nb-btn-primary nb-btn-block',
      text: isCreate ? 'Continue' : 'Create vault', disabled: true,
      onclick: () => { if (pin.value.length === 4) onSubmit(); } });

    function onSubmit() {
      if (pin.value.length !== 4) return;
      if (isCreate) { firstPin = pin.value; buzz(8); go(1); return; }
      if (pin.value !== firstPin) { toast('PINs do not match', 'error'); orb.fail(); pin.shake(); pin.reset(); return; }
      done();
    }

    // The 4th digit submits on its own, and so does Enter. Without this a fast
    // typist creates the vault twice (two keys, two sets of recovery words).
    let creating = false;
    async function done() {
      if (creating) return;
      creating = true;
      cta.disabled = true; cta.textContent = 'Sealing…';
      try {
        ({ recoveryMnemonic: mnemonic } = await ctx.vault.setup(firstPin));
        buzz([10, 30, 10]);
        await cacheDek(ctx.vault.exportDek(), ctx.settings.autoLockTimeout);
        orb.success();
        setTimeout(() => go(2), 700);
      } catch (e) { toast(e.message || 'Setup failed', 'error'); orb.fail(); creating = false; cta.disabled = false; cta.textContent = 'Create vault'; }
    }

    stage.append(
      h('div', { class: 'nb-col', style: { alignItems: 'center', marginTop: '9vh' } },
        orb.el,
        h('h2', { class: 'text-hero', style: { fontSize: 'var(--nb-fs-2xl)', margin: '22px 0 8px' }, text: isCreate ? 'Create your PIN' : 'Confirm it' }),
        h('p', { class: 'nb-muted', style: { textAlign: 'center', fontSize: 'var(--nb-fs-sm)', lineHeight: '1.6', margin: '0 0 26px', maxWidth: '300px' },
          text: isCreate
            ? 'Four digits unlock your vault on this device. It is never stored anywhere and cannot be recovered.'
            : 'Type the same four digits once more.' })),
      pin.el,
      h('div', { style: { height: '18px' } }),
      cta);
  }

  /* step 2: recovery key reveal. "Continue" turns on only after 3 of the words are typed back. */
  function recovery() {
    const { el } = recoveryReveal(mnemonic, {
      confirmLabel: 'I saved it. Continue',
      onConfirmed: async () => {
        await local().set({ [STORAGE_KEYS.LAST_RECOVERY_CHECK_AT]: new Date().toISOString() });
        go(3);
      },
    });
    stage.append(
      h('div', { style: { marginTop: '7vh' } },
        h('h2', { class: 'text-hero', style: { fontSize: 'var(--nb-fs-2xl)', textAlign: 'center', margin: '0 0 8px' }, text: 'Your recovery key' }),
        h('p', { class: 'nb-muted', style: { textAlign: 'center', fontSize: 'var(--nb-fs-sm)', lineHeight: '1.6', margin: '0 0 14px' },
          text: 'You need these 24 words if you forget your PIN, and to set up OKey on a new device. Without them a lost device means a lost vault. Write them down, offline.' })),
      el,
    );
  }

  /* step 3: feature tour */
  function tour(i) {
    const slide = TOUR[i];
    const dots = h('div', { class: 'ok-dots' },
      ...TOUR.map((_, j) => h('button', {
        class: 'ok-dot-i', 'aria-current': String(j === i), 'aria-label': 'Slide ' + (j + 1),
        onclick: () => tour(j),
      })));
    const artCls = i === 0 ? 'nb-slide-next' : 'nb-slide-prev';
    stage.append(h('div', { class: 'ok-tour-stage ' + artCls },
      h('div', { class: 'ok-tour-art', html: slide.art }),
      h('h3', { class: 'ok-tour-h', text: slide.h }),
      h('p', { class: 'ok-tour-p', text: slide.p }),
      ),
      dots,
      h('button', { class: 'nb-btn nb-btn-primary nb-btn-block',
        text: i < TOUR.length - 1 ? 'Next' : "Let's go",
        onclick: () => (i < TOUR.length - 1 ? tour(i + 1) : finish()) }),
      h('button', { class: 'nb-btn nb-btn-ghost nb-btn-block', style: { marginTop: '8px' }, text: 'Skip',
        onclick: () => finish() }),
    );

    async function finish() {
      if (ctx.user && ctx.cloudSync) {
        try { await ctx.cloudSync.moveToCloud(ctx.vault); toast('Vault synced to your account', 'success'); }
        catch (e) {
          if (e.code === 'VAULT_EXISTS') toast(e.message, 'error');
          else toast('Cloud sync will retry automatically', 'info');
        }
      }
      resetIdle();
      setView('list');
      trySync().catch(() => {});
    }
  }

}

/* ============================ LOCK ============================ */
export async function loadLockout() {
  const s = await local().get([STORAGE_KEYS.PIN_UI_FAILURES, STORAGE_KEYS.PIN_LOCKED_UNTIL]);
  return {
    count: Number(s[STORAGE_KEYS.PIN_UI_FAILURES]) || 0,
    until: Number(s[STORAGE_KEYS.PIN_LOCKED_UNTIL]) || 0,
  };
}

async function recordFailure(state) {
  state.count += 1;
  const secs = state.count >= 10 ? 300 : state.count >= 5 ? 30 : 0;
  if (secs) state.until = Date.now() + secs * 1000;
  await local().set({
    [STORAGE_KEYS.PIN_UI_FAILURES]: state.count,
    [STORAGE_KEYS.PIN_LOCKED_UNTIL]: state.until,
  });
  return secs;
}

export async function clearFailures() {
  await local().remove([STORAGE_KEYS.PIN_UI_FAILURES, STORAGE_KEYS.PIN_LOCKED_UNTIL]);
}

export function renderLock(c, root) {
  const state = loadLockout();
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const orb = keyholeOrb({ size: 92 });
  const pin = pinInput({ autoFocus: true, onChange: (n) => orb.fill(n), onSubmit: () => go() });
  const btn = h('button', { class: 'nb-btn nb-btn-primary nb-btn-block', text: 'Unlock', onclick: () => go() });
  const err = h('div', { style: { color: 'var(--nb-danger)', minHeight: '20px', fontSize: 'var(--nb-fs-sm)', textAlign: 'center' } });

  // One attempt at a time: Enter right after the 4th digit is not a second try.
  // After a success it stays busy, because the screen is about to change.
  let busy = false;
  async function go() {
    if (busy) return;
    busy = true;
    let ok = false;
    try { ok = await attempt(); } finally { busy = ok; }
  }

  /** @returns {Promise<boolean>} true when the vault unlocked */
  async function attempt() {
    const st = await state;
    if (Date.now() < st.until) {
      err.textContent = 'Too many attempts — wait ' + Math.ceil((st.until - Date.now()) / 1000) + 's';
      return false;
    }
    if (pin.value.length < 4) return false;
    btn.disabled = true; btn.textContent = 'Unlocking…'; err.textContent = '';
    try {
      await ctx.vault.unlock(pin.value);
      await clearFailures();
      buzz([10, 30, 10]);
      pin.pulseSuccess();
      orb.success();
      root.querySelector('.ok-fullscreen')?.classList.add('nb-flare');
      await cacheDek(ctx.vault.exportDek(), ctx.settings.autoLockTimeout);
      resetIdle();
      setTimeout(() => { goHome(); trySync().catch(() => {}); }, 650);
      return true;
    } catch (e) {
      buzz(60);
      orb.fail();
      if (e.code === 'DECRYPTION_FAILED') {
        const secs = await recordFailure(st);
        err.textContent = 'Incorrect PIN (' + st.count + ')' + (secs ? ' — locked ' + secs + 's' : '');
        pin.shake();
      } else {
        err.textContent = e.message || 'Unlock failed';
      }
      btn.disabled = false; btn.textContent = 'Unlock';
      pin.reset();
      return false;
    }
  }

  root.append(h('div', { class: 'ok-fullscreen', style: { justifyContent: 'center' } },
    orb.el,
    h('h1', { class: 'text-hero', style: { fontSize: 'var(--nb-fs-2xl)', textAlign: 'center', margin: '26px 0 6px', letterSpacing: '-.02em' }, text: greeting }),
    h('p', { class: 'nb-muted', style: { textAlign: 'center', margin: '0 0 26px', fontSize: 'var(--nb-fs-sm)' }, text: 'Enter your master PIN to continue' }),
    pin.el,
    err,
    h('div', { style: { height: '16px' } }),
    btn,
    h('button', { class: 'nb-btn nb-btn-ghost nb-btn-block', style: { marginTop: '10px' }, text: 'Use recovery key',
      onclick: () => renderRecover(c, root) }),
  ));
}

/* recovery from lock screen */
function renderRecover(c, root) {
  const ta = h('textarea', { class: 'nb-textarea', rows: 4, placeholder: 'Paste your 24-word recovery key' });
  const np = pinInput({ autoFocus: false });
  const btn = h('button', { class: 'nb-btn nb-btn-primary nb-btn-block', text: 'Recover & set new PIN' });
  np.setOnSubmit(() => { if (np.value.length === 4) btn.click(); });
  btn.addEventListener('click', async () => {
    if (!ta.value.trim()) return toast('Paste your recovery key first', 'error');
    if (np.value.length < SECURITY.MIN_MASTER_PASSWORD_LENGTH) return toast('New PIN needs 4 digits', 'error');
    btn.disabled = true; btn.textContent = 'Recovering…';
    try {
      await ctx.vault.recoverWithMnemonic(ta.value);
      await ctx.vault.changeMasterPassword(np.value);
      await clearFailures(); // the screen's own wait timer, separate from the vault's counter
      buzz([10, 30, 10]);
      await cacheDek(ctx.vault.exportDek(), ctx.settings.autoLockTimeout);
      resetIdle();
      toast('Vault recovered', 'success');
      setView('list');
    } catch (e) {
      btn.disabled = false; btn.textContent = 'Recover & set new PIN';
      toast(e.code === 'DECRYPTION_FAILED' ? 'That key did not match this vault' : e.message, 'error');
    }
  });

  clear(root);
  root.append(h('div', { class: 'ok-fullscreen nb-view' },
    h('button', { class: 'nb-icon-btn', 'aria-label': 'Back', html: I.back, onclick: () => setView('lock') }),
    h('h2', { style: { fontFamily: 'var(--nb-font-display)', margin: '14px 0 16px' }, text: 'Recover with key' }),
    ta,
    h('div', { class: 'nb-label', style: { marginTop: '16px' }, text: 'New master PIN' }),
    np.el,
    h('div', { style: { height: '18px' } }),
    btn,
  ));
}
