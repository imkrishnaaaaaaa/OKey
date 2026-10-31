/**
 * OKey 2.0 — unlocked screens: vault list, detail, add/edit, generator, settings.
 */

import { Vault } from '../../core/vault.js';
import { STORAGE_KEYS, ENTRY_TYPES, DEFAULT_SETTINGS } from '../../core/constants.js';
import { matchDomain, normalizeDomain, getDisplayDomain } from '../../core/domain-matcher.js';
import { generatePassword, generatePassphrase, passphraseEntropyBits, strengthFromEntropy } from '../../core/password-generator.js';
import { latestOnly } from '../../ui/latest.js';
import { recoveryReveal } from '../../ui/recovery-ui.js';
import { recoveryCheckDue } from '../../core/recovery-check.js';
import { generateTOTP, isValidTotpSecret, totpOptions, pickTotpParams, parseTotpInput, DEFAULT_TOTP_PARAMS } from '../../core/totp.js';
import { formatTimeAgo } from '../../core/util.js';
import * as IE from '../../core/import-export.js';
import { firebaseReady, googleSignInReady } from '../../lib/firebase.js';
import { h, clear, toast, buzz, openModal, confirmModal, copyValue, pinInput,
         dropdown, switchRow, segmented, strengthMeter } from '../../ui/kit.js';
import { I } from '../../ui/icons.js';
import { setView, saveSettings, trySync, scheduleSync,
         lockNow, rerender, ctx, shell } from '../../ui/app-core.js';
import { cacheDek } from '../../ui/session-neutral.js';

const local = () => ctx.store;
let totpTimer = null;
let recoveryReminderDismissed = false; // "Not now" lasts until the next lock
let currentTab = 'all';
let selected = new Set();
let selectMode = false;

/** Called when the vault locks: forget the list screen's selection and stop the code ticker. */
export function resetVaultViewState() {
  recoveryReminderDismissed = false;
  clearInterval(totpTimer);
  totpTimer = null;
  selected = new Set();
  selectMode = false;
}

function settings() { return ctx.settings; }
function entries() { return ctx.vault.getEntries(); }
function getEntry(id) { return ctx.vault.getEntry(id); }

/* ---------- shared atoms ---------- */
function avatar(entry, hue) {
  const letter = initialLetter(entry);
  return h('div', { class: 'nb-avatar', style: { '--av-hue': String(hue) } }, h('span', { text: letter }));
}
function initialLetter(e) {
  const s2 = e.nickname || e.siteName || (e.domain || '').replace(/^www\./, '') || '?';
  return s2[0].toUpperCase();
}
function hueFor(str) {
  let acc = 0;
  for (const ch of String(str || '?')) acc = (acc * 31 + ch.charCodeAt(0)) % 360;
  return acc;
}
function subText(e) {
  const t = e.nickname || e.siteName || '';
  if (e.domain) {
    const d = getDisplayDomain(e.domain);
    if (!t || t.toLowerCase() !== d.toLowerCase()) return d;
  }
  if (e.entryType === ENTRY_TYPES.TOTP && !e.domain) return 'Authenticator';
  return '';
}

/* ---------- TOTP ticker ---------- */
/** 6 digits show as "123 456", 8 as "1234 5678". */
function spaceCode(code) {
  const half = Math.ceil(code.length / 2);
  return `${code.slice(0, half)} ${code.slice(half)}`;
}

function startTicker() {
  clearInterval(totpTimer);
  async function tick() {
    const nodes = document.querySelectorAll('[data-totp-id]');
    if (!nodes.length) { clearInterval(totpTimer); totpTimer = null; return; }
    for (const node of nodes) {
      // Look the entry up each tick instead of keeping a copy of its secret here.
      // Once the vault locks there is nothing left to find.
      const e = getEntry(node.dataset.totpId);
      const codeEl = node.querySelector('.nb-totp-code-live');
      const prog = node.querySelector('.prog');
      if (!e?.totpSecret || !codeEl) continue;
      try {
        const { code, remaining, period } = await generateTOTP(e.totpSecret, totpOptions(e));
        codeEl.classList.remove('nb-roll'); void codeEl.offsetWidth;
        codeEl.textContent = spaceCode(code);
        codeEl.classList.add('nb-roll');
        if (prog) {
          prog.style.strokeDashoffset = String(2 * Math.PI * 9 * (1 - remaining / period));
          const urgent = remaining < 6;
          prog.setAttribute('stroke', urgent ? 'var(--nb-danger)' : 'var(--nb-cyan)');
          codeEl.style.color = urgent ? 'var(--nb-danger)' : 'var(--nb-cyan)';
        }
      } catch { codeEl.textContent = 'ERR'; }
    }
  }
  tick();
  totpTimer = setInterval(tick, 1000);
}

/* ============================ VAULT LIST ============================ */
// Set by the list screen. A background sync calls it to refresh the cards without
// rebuilding the screen, so the search box and the open tab keep what the user did.
let repaintList = null;
export function refreshVaultList() { repaintList?.(); }

/** The calm right pane of the two-pane layout when nothing is open. */
export function renderEmptyPane(c, root) {
  root.append(h('div', { class: 'ok-empty-pane' },
    h('div', { class: 'ok-empty-art', html: I.shield }),
    h('h3', { text: 'Select a login' }),
    h('p', { text: 'Choose one on the left to see it here, or add a new one with the + button.' })));
}

export function renderVaultList(c, root) {
  const unreadable = ctx.vault.takeUndecryptableNotice();
  if (unreadable) toast(`${unreadable} saved item${unreadable > 1 ? 's' : ''} could not be opened. Nothing was deleted.`, 'error');
  const { header, footer } = shell({
    actions: [
      h('button', { class: 'nb-icon-btn', 'aria-label': 'Add login', html: I.plus,
        onclick: () => setView('edit') }),
      h('button', { class: 'nb-icon-btn', 'aria-label': 'Password generator', html: I.wand,
        onclick: () => setView('generator') }),
      h('button', { class: 'nb-icon-btn', 'aria-label': 'Settings', html: I.gear,
        onclick: () => setView('settings') }),
    ],
  });
  const search = h('input', {
    class: 'nb-input', type: 'search',
    placeholder: 'Search vault…', 'aria-label': 'Search vault',
  });
  const searchWrap = h('div', { class: 'ok-search' },
    h('span', { html: I.search }), search);
  const reminderSlot = h('div', {});
  const chipsRow = h('div', { class: 'ok-chips', role: 'tablist' });
  const listEl = h('div', { class: 'nb-stagger' });

  function paintChips() {
    const folders = [...new Set(entries().map((e) => e.folder).filter(Boolean))].sort();
    const defs = [
      { v: 'all', l: 'All' }, { v: 'password', l: 'Logins' },
      { v: 'totp', l: 'Auth' }, { v: 'favorites', l: '★ Favorites' },
      ...folders.map((f) => ({ v: f, l: f })),
    ];
    clear(chipsRow);
    for (const d of defs) {
      chipsRow.append(h('button', {
        class: 'nb-chip', role: 'tab', text: d.l,
        'aria-selected': String(currentTab === d.v),
        onclick: () => { currentTab = d.v; paintChips(); paintList(search.value); },
      }));
    }
  }

  const paintList = latestOnly(async (isCurrent, q) => {
    let items = entries();
    if (currentTab === 'favorites') items = items.filter((e) => e.isFavorite);
    else if (currentTab === 'totp') items = items.filter((e) => e.entryType === 'totp' || (e.totpSecret || '').trim());
    else if (currentTab === 'password') items = items.filter((e) => e.entryType === ENTRY_TYPES.PASSWORD);
    else if (currentTab !== 'all') items = items.filter((e) => e.folder === currentTab);

    if (q) {
      const qs = q.trim().toLowerCase();
      items = items.filter((e) =>
        [e.domain, e.siteName, e.nickname, e.username, ...(e.tags || [])].filter(Boolean).join(' ').toLowerCase().includes(qs));
    }

    /* current-site matches pinned on top */
    const siteMatches = await chromeQueryMatches(items);
    if (!isCurrent()) return; // a newer search is already painting
    clear(listEl);
    if (siteMatches.length) {
      listEl.append(h('div', { class: 'ok-group-title', text: 'For ' + siteMatches.siteLabel }));
      for (const e of siteMatches) listEl.append(entryCard(e, listEl, q));
      listEl.append(h('div', { class: 'ok-group-title', text: 'All items' }));
    }

    if (!items.length) {
      listEl.append(emptyState(q));
      return;
    }
    if (selectMode) listEl.append(selectBar());
    for (const e of items) listEl.append(entryCard(e, listEl, q));
    startTicker();
  });

  search.addEventListener('input', () => paintList(search.value));
  // Arrow keys move through the list. Enter opens the focused row (rows are buttons).
  const rows = () => [...listEl.querySelectorAll('.ok-entry')];
  search.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown') { ev.preventDefault(); rows()[0]?.focus(); }
  });
  listEl.addEventListener('keydown', (ev) => {
    if (ev.key !== 'ArrowDown' && ev.key !== 'ArrowUp') return;
    const all = rows();
    const at = all.indexOf(document.activeElement);
    if (at === 0 && ev.key === 'ArrowUp') { ev.preventDefault(); search.focus(); return; }
    const next = all[ev.key === 'ArrowDown' ? Math.min(at + 1, all.length - 1) : Math.max(at - 1, 0)];
    if (next) { ev.preventDefault(); next.focus(); }
  });
  root.append(header, h('main', { class: 'ok-body' }, reminderSlot, searchWrap, chipsRow, listEl), footer);
  paintChips();
  paintList('');
  showRecoveryReminder(reminderSlot).catch(() => {});
  repaintList = () => { paintChips(); paintList(search.value); };
}

async function chromeQueryMatches(allItems) {
  try {
    const site = await chrome.runtime.sendMessage({ type: 'GET_CURRENT_SITE' });
    if (!site?.url || currentTab !== 'all' || !allItems.length) return [];
    const ranked = matchDomain(site.url, allItems).slice(0, 3);
    if (!ranked.length) return [];
    const out = ranked.map((m) => getEntry(m.id)).filter(Boolean);
    out.siteLabel = getDisplayDomain(site.url);
    return out;
  } catch { return []; }
}

function entryCard(e, listEl, q, confidence) {
  const actions = h('div', { class: 'ok-entry-actions' });
  if (e.username) actions.append(iconBtn(I.user, 'Copy username', (ev) => { ev.stopPropagation(); copyValue(e.username, 'Username copied'); }));
  if (e.password) actions.append(iconBtn(I.key, 'Copy password', (ev) => { ev.stopPropagation(); copyValue(e.password, 'Password copied'); }));

  let totpMini = null;
  if (e.totpSecret && isValidTotpSecret(e.totpSecret)) {
    totpMini = h('button', {
      type: 'button', class: 'ok-totp-mini nb-btn-ghost',
      style: { border: 'none', background: 'none', padding: '0', cursor: 'pointer', borderRadius: '8px' },
      title: 'Click to copy code',
      onclick: async (ev) => {
        ev.stopPropagation();
        const { code } = await generateTOTP(e.totpSecret, totpOptions(e));
        copyValue(code, 'Code copied');
      },
    },
      ringSvg(),
      h('span', { class: 'ok-totp-code-sm nb-totp-code-live', text: '••••••' }),
    );
    totpMini.setAttribute('data-totp-id', e.id);
  }

  const card = h('button', {
    type: 'button', class: 'ok-entry glass hoverable card' + (e.id === ctx.selectedId ? ' selected' : ''),
    onclick: () => {
      if (selectMode) { toggleSelect(e.id); rerender(); }
      else setView('detail', e.id);
    },
  },
    selectMode
      ? h('input', { type: 'checkbox', class: 'nb-checkbox', checked: selected.has(e.id),
          onclick: (ev) => { ev.stopPropagation(); toggleSelect(e.id); rerender(); } })
      : avatar(e, hueFor(e.siteName || e.domain)),
    h('div', { class: 'ok-entry-main' },
      h('div', { class: 'ok-entry-title', text: e.nickname || e.siteName || getDisplayDomain(e.domain) || 'Untitled' }),
      h('div', { class: 'nb-row', style: { gap: '8px' } },
        h('span', { class: 'ok-entry-sub', text: subText(e) }),
        totpMini)),
    confidence ? h('span', { class: 'ok-confidence', text: confidence >= 95 ? 'EXACT' : 'MATCH' }) : null,
    actions,
  );

  let pressTimer = null;
  card.addEventListener('contextmenu', (ev) => { ev.preventDefault(); enterSelect(e); });
  card.addEventListener('pointerdown', () => { pressTimer = setTimeout(() => enterSelect(e), 550); }, { passive: true });
  for (const evName of ['pointerup', 'pointercancel', 'pointerleave'])
    card.addEventListener(evName, () => clearTimeout(pressTimer), { passive: true });

  return card;
}

function enterSelect(e) {
  if (!selectMode) {
    selectMode = true; selected.clear(); selected.add(e.id);
    buzz(20);
  } else {
    toggleSelect(e.id);
  }
  rerender();
}
function toggleSelect(id) {
  selected.has(id) ? selected.delete(id) : selected.add(id);
}

function selectBar() {
  const del = h('button', { class: 'nb-btn nb-btn-danger nb-btn-sm', text: 'Delete (' + selected.size + ')', disabled: !selected.size,
    onclick: async () => {
      const okD = await confirmModal('Delete ' + selected.size + ' item' + (selected.size === 1 ? '' : 's') + '? This cannot be undone.', { danger: true, confirmLabel: 'Delete' });
      if (!okD) return;
      buzz(30);
      await ctx.vault.deleteEntries([...selected]);
      selectMode = false; selected.clear();
      toast('Deleted', 'success'); scheduleSync(); rerender();
    } });
  const exp = h('button', { class: 'nb-btn nb-btn-glass nb-btn-sm', text: 'Export (' + selected.size + ')', disabled: !selected.size,
    onclick: () => {
      const sel = [...selected].map((id2) => getEntry(id2)).filter(Boolean);
      downloadFile('okey-selected-export.csv', IE.exportCsv(sel));
      selectMode = false; selected.clear(); toast('Exported CSV', 'success'); rerender();
    } });
  const doneB = h('button', { class: 'nb-btn nb-btn-ghost nb-btn-sm', text: 'Done', onclick: () => { selectMode = false; selected.clear(); rerender(); } });
  return h('div', { class: 'nb-row', style: { margin: '2px 0 12px', gap: '8px' } }, del, exp, h('div', { class: 'nb-spacer' }), doneB);
}

function emptyState(q) {
  if (q) return okEmpty(I.search, 'No matches', 'Nothing in your vault matches “' + q + '”.', null);
  if (currentTab === 'favorites') return okEmpty(I.star, 'No favorites yet', 'Star an item and it will wait here.', null);
  return okEmpty(I.plus, 'Your vault is empty', 'Add your first login — it stays encrypted on this device until you connect an account.', { label: 'Add your first item', go: () => setView('edit', null) });
}
function okEmpty(artIcon, title, sub, cta) {
  return h('div', { class: 'ok-empty' },
    h('div', { class: 'ok-empty-art', html: artIcon }),
    h('h3', { text: title }),
    h('p', { text: sub }),
    cta ? h('button', { class: 'nb-btn nb-btn-primary', text: cta.label, onclick: cta.go }) : null);
}

function iconBtn(svg, title, onclick) {
  return h('button', { type: 'button', class: 'nb-icon-btn', title, 'aria-label': title, html: svg, onclick });
}
function ringSvg(size = 22) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', size === 22 ? 'ok-ring-sm' : 'ok-ring');
  svg.innerHTML = '<circle cx="12" cy="12" r="9" fill="none" stroke="rgba(255,255,255,.12)" stroke-width="2.6"/>' +
    '<circle class="prog" cx="12" cy="12" r="9" fill="none" stroke="var(--nb-cyan)" stroke-width="2.6" stroke-linecap="round" transform="rotate(-90 12 12)" stroke-dasharray="' + (2 * Math.PI * 9) + '" stroke-dashoffset="0"/>';
  return svg;
}
function downloadFile(name, content) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/plain' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ============================ DETAIL ============================ */
export function renderDetail(c, root, id) {
  const e = getEntry(id);
  if (!e) { setView('list'); return; }
  ctx.vault.touchEntry(id);

  const fields = h('div', {});
  const addField = (label, value, copyable) => {
    if (!value) return;
    fields.append(h('div', { class: 'ok-field-card glass' },
      h('div', { class: 'ok-field-label', text: label }),
      h('div', { class: 'ok-field-value' },
        h('span', { class: 'val', text: value }),
        copyable ? copyBtn(value, label) : null)));
  };

  addField('Username', e.username, true);
  if (e.password) {
    let shown = false;
    const val = h('span', { class: 'val nb-mono', text: '••••••••••' });
    const eye = iconBtn(I.eye, 'Reveal password', () => {
      shown = !shown;
      val.textContent = shown ? e.password : '••••••••••';
      eye.innerHTML = shown ? I.eyeOff : I.eye;
      eye.title = shown ? 'Hide' : 'Reveal password';
    });
    fields.append(h('div', { class: 'ok-field-card glass' },
      h('div', { class: 'ok-field-label', text: 'Password' }),
      h('div', { class: 'ok-field-value' }, val, eye,
        copyBtn(e.password, 'Password'))));
  }
  if (e.totpSecret && isValidTotpSecret(e.totpSecret)) {
    const code = h('span', { class: 'ok-totp-code-lg nb-mono nb-totp-code-live', text: '••••••' });
    const ring = ringSvg(34);
    const wrap = h('div', { class: 'ok-field-card glass', attrs: { 'data-totp-id': id } },
      h('div', { class: 'ok-field-label', text: 'One-time code' }),
      h('div', { class: 'ok-totp-big' }, ring, code,
        h('div', { class: 'nb-spacer' }),
        iconBtn(I.copy, 'Copy code', async () => {
          const { code: c2 } = await generateTOTP(e.totpSecret, totpOptions(e));
          copyValue(c2, 'Code copied');
        })));
    fields.append(wrap);
  }
  addField('Website', e.domain, true);
  addField('Folder', e.folder, false);
  (e.customFields || []).forEach((f) => f.label && addField(f.label, f.value, true));
  if (e.tags?.length) addField('Tags', e.tags.join(', '), false);
  fields.append(h('p', { class: 'nb-dim', style: { fontSize: 'var(--nb-fs-xs)', margin: '10px 4px' },
    text: 'Updated ' + formatTimeAgo(e.updatedAt) + ' · used ' + formatTimeAgo(e.lastUsedAt) }));

  const star = iconBtn(I.star, e.isFavorite ? 'Unfavorite' : 'Favorite', async () => {
    await ctx.vault.updateEntry(id, { isFavorite: !e.isFavorite });
    buzz(8); toast(e.isFavorite ? 'Unfavorited' : 'Favorited', 'success');
    scheduleSync(); setView('detail', id);
  });
  if (e.isFavorite) star.style.color = 'var(--nb-warning)';
  const pinB = iconBtn(I.pinIcon, e.isPinned ? 'Unpin' : 'Pin to top', async () => {
    await ctx.vault.updateEntry(id, { isPinned: !e.isPinned });
    buzz(8); scheduleSync(); setView('detail', id);
  });
  if (e.isPinned) pinB.style.color = 'var(--nb-cyan)';
  const del = iconBtn(I.trash, 'Delete', async () => {
    const name = e.nickname || e.siteName || getDisplayDomain(e.domain) || 'this item';
    const okD = await confirmModal('Delete “' + name + '”? This cannot be undone.', { danger: true, confirmLabel: 'Delete' });
    if (!okD) return;
    buzz(30);
    await ctx.vault.deleteEntry(id);
    toast('Deleted', 'success'); scheduleSync(); setView('list');
  });

  const { header, footer } = shell({
    back: () => setView('list'),
    title: e.nickname || e.siteName || getDisplayDomain(e.domain) || 'Item',
    actions: [star, pinB, del],
  });

  // The main action sits above the footer, and the footer is always last.
  root.append(header,
    h('main', { class: 'ok-body nb-view' }, fields),
    h('div', { style: { position: 'relative', zIndex: 5, padding: '4px 16px 10px' } },
      h('button', { class: 'nb-btn nb-btn-glass nb-btn-block', text: 'Edit item',
        onclick: () => setView('edit', id) })),
    footer);
  startTicker();
}

function copyBtn(value, label) {
  return iconBtn(I.copy, 'Copy ' + label.toLowerCase(), () => copyValue(value, label + ' copied'));
}

/* ============================ ADD / EDIT ============================ */
export function renderEdit(c, root, id) {
  clearInterval(totpTimer);
  const editing = !!id;
  const base = editing ? getEntry(id) : {
    siteName: '', domain: '', folder: '', username: '', password: '', totpSecret: '',
    notes: '', tags: [], matchPatterns: [], customFields: [], displayOrder: 0,
    entryType: ENTRY_TYPES.PASSWORD,
  };
  const e = base || { ...DEFAULT_SETTINGS };

  /* core fields */
  const siteName = floatInput('Site name *', e.siteName, 'e.g. GitHub');
  const domain = floatInput('Domain *', e.domain, 'github.com');
  const username = floatInput('Username / email', e.username, 'you@example.com');

  const pw = h('input', { class: 'nb-input', type: 'password', value: e.password || '', placeholder: 'Password', autocomplete: 'new-password' });
  let pwShown = false;
  const eye = iconBtn(I.eye, 'Show', () => {
    pwShown = !pwShown; pw.type = pwShown ? 'text' : 'password';
    eye.innerHTML = pwShown ? I.eyeOff : I.eye; eye.title = pwShown ? 'Hide' : 'Show';
  });
  const gen = iconBtn(I.wand, 'Generate strong password', () => {
    pw.value = generatePassword(settings().passwordGeneratorDefaults);
    pw.type = 'text'; pwShown = true;
    eye.innerHTML = I.eyeOff; eye.title = 'Hide';
    meter.update(pw.value); buzz(8);
    gen.style.display = 'none';
    toast('Generated — copy it before saving elsewhere', 'success');
  });
  gen.style.display = pw.value ? 'none' : '';
  const meter = strengthMeter();
  meter.update(pw.value);
  pw.addEventListener('input', () => { meter.update(pw.value); gen.style.display = pw.value ? 'none' : ''; });

  const totp = floatInput('TOTP secret or otpauth:// link (optional)', e.totpSecret, 'Base32 or otpauth://…');

  /* advanced drawer */
  const folders = [...new Set(entries().map((x) => x.folder).filter(Boolean))].sort();
  const folderDd = dropdown({
    options: [{ value: '', label: '(None)' }, ...folders.map((f) => ({ value: f, label: f })), { value: '__new__', label: '+ New folder…' }],
    value: e.folder || '',
    onchange: () => {},
  });
  const newFolder = h('input', { class: 'nb-input', placeholder: 'New folder name', style: { marginTop: '8px', minHeight: '42px' }, hidden: true });
  folderDd.el.addEventListener('click', () => setTimeout(() => { newFolder.hidden = folderDd.value !== '__new__'; if (!newFolder.hidden) newFolder.focus(); }, 0));
  const notes = h('textarea', { class: 'nb-textarea', rows: 3, placeholder: 'Private notes…' });
  notes.value = e.notes || '';
  const tagsIn = h('input', { class: 'nb-input', value: (e.tags || []).join(', '), placeholder: 'work, finance…' });
  const patternsIn = h('input', { class: 'nb-input', value: (e.matchPatterns || []).join(', '), placeholder: 'site.com/login/*' });
  const customWrap = h('div', {});
  (e.customFields || []).forEach((cf) => customWrap.append(customRow(cf)));

  const moreOpen = !!(e.notes || (e.tags || []).length || (e.matchPatterns || []).length || (e.customFields || []).length);
  const details = h('details', { open: moreOpen },
    h('summary', { class: 'nb-btn nb-btn-ghost nb-btn-block', style: { marginBottom: '12px' }, text: 'More options' }),
    labeledField('Notes', notes),
    labeledField('Tags', tagsIn),
    labeledField('Folder', folderDd.el, newFolder),
    labeledField('Match URLs', patternsIn),
    labeledField('Custom fields', customWrap,
      h('button', { class: 'nb-btn nb-btn-ghost nb-btn-sm', text: '+ Add field', onclick: () => customWrap.append(customRow()) })),
  );

  const save = h('button', { class: 'nb-btn nb-btn-primary nb-btn-block nb-breathe',
    text: editing ? 'Save changes' : 'Add to vault',
    onclick: async () => {
      let folderVal = folderDd.value;
      if (folderVal === '__new__') {
        const name = newFolder.value.trim();
        if (!name) { toast('Name your new folder first', 'error'); save.disabled = false; return; }
        folderVal = name;
      }
      let typedTotp;
      try { typedTotp = parseTotpInput(totp.value); }
      catch { return toast('That otpauth link is not valid', 'error'); }
      const data = {
        siteName: siteName.value.trim(),
        domain: normalizeDomain(domain.value.trim()),
        username: username.value.trim(),
        password: pw.value,
        totpSecret: typedTotp.secret,
        // A link brings its own settings. An unchanged secret keeps the entry's. A new bare secret gets the defaults.
        ...(typedTotp.params || (typedTotp.secret === e.totpSecret ? pickTotpParams(e) : DEFAULT_TOTP_PARAMS)),
        notes: notes.value,
        tags: splitList(tagsIn.value),
        matchPatterns: splitList(patternsIn.value),
        folder: folderVal === '__new__' ? '' : folderVal,
        displayOrder: e.displayOrder || 0,
        customFields: [...customWrap.querySelectorAll('.ok-cf-row')].map((r) => ({
          label: r.children[0].value.trim(), value: r.children[1].value, hidden: false,
        })).filter((x) => x.label),
        entryType: typedTotp.secret && !pw.value ? ENTRY_TYPES.TOTP : ENTRY_TYPES.PASSWORD,
      };
      if (!data.siteName && !data.domain) return toast('Give it a name or a domain', 'error');
      if (data.totpSecret && !isValidTotpSecret(data.totpSecret)) return toast('That TOTP secret is not valid Base32', 'error');
      save.disabled = true;
      try {
        if (editing) await ctx.vault.updateEntry(id, data);
        else await ctx.vault.addEntry(data);
        buzz([10, 20, 10]);
        toast(editing ? 'Saved' : 'Added to vault', 'success');
        scheduleSync();
        editing ? setView('detail', id) : setView('list');
      } catch (err2) { save.disabled = false; toast(err2.message, 'error'); }
    } });

  const { header, footer } = shell({
    back: editing ? () => setView('detail', id) : () => setView('list'),
    title: editing ? 'Edit item' : 'New item',
  });

  root.append(header,
    h('main', { class: 'ok-body nb-view' },
      siteName.el, domain.el, username.el,
      fieldWrap('Password', pw, [eye, gen]), meter.el,
      h('div', { style: { height: '4px' } }),
      totp.el,
      h('div', { style: { height: '10px' } }),
      details,
      h('div', { style: { height: '8px' } }),
      save),
    footer);
}

function customRow(cf = { label: '', value: '' }) {
  return h('div', { class: 'ok-cf-row nb-row', style: { gap: '6px', marginBottom: '6px' } },
    h('input', { class: 'nb-input', placeholder: 'Label', value: cf.label || '', style: { minHeight: '40px' } }),
    h('input', { class: 'nb-input', placeholder: 'Value', value: cf.value || '', style: { minHeight: '40px' } }),
    iconBtn(I.trash, 'Remove', (ev) => ev.currentTarget.parentElement.remove()));
}
function floatInput(label, value, ph) {
  const input = h('input', { class: 'nb-input', type: 'text', value: value || '',
    placeholder: ' ', title: ph || '', autocomplete: 'off' });
  return {
    el: h('div', { class: 'nb-field nb-float' }, input, h('label', { text: label })),
    get value() { return input.value; },
  };
}
function fieldWrap(labelText, input, affix) {
  return h('div', { class: 'nb-field' },
    h('span', { class: 'nb-label', text: labelText }),
    h('div', { style: { position: 'relative' } },
      input,
      h('div', { style: { position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)', display: 'flex', gap: '2px' } }, ...affix)),
    );
}
function labeledField(labelText, ...kids) {
  return h('div', { class: 'nb-field' }, h('span', { class: 'nb-label', text: labelText }), ...kids);
}
function splitList(s2) { return (s2 || '').split(',').map((x) => x.trim()).filter(Boolean); }

/* ============================ GENERATOR ============================ */
export function renderGenerator(c, root) {
  clearInterval(totpTimer);
  let mode = 'password';
  const out = h('div', { class: 'ok-gen-output glass nb-mono' });
  const meter = strengthMeter();
  const len = h('input', { type: 'range', class: 'nb-range', min: '8', max: '64', value: String(settings().passwordGeneratorDefaults.length || 20) });
  const lenVal = h('span', { class: 'nb-mono', style: { color: 'var(--nb-cyan)', fontWeight: '700' }, text: len.value });
  const opts = { ...{ uppercase: true, lowercase: true, numbers: true, symbols: true }, ...(settings().passwordGeneratorDefaults || {}) };

  function paintFill() {
    const pct = ((len.value - len.min) / (len.max - len.min)) * 100;
    len.style.setProperty('--fill', pct + '%');
    lenVal.textContent = len.value;
  }
  function words() { return Math.max(3, Math.round(+len.value / 4)); }
  function regen() {
    paintFill();
    if (mode === 'password') {
      out.textContent = generatePassword({ length: +len.value, ...opts });
      meter.update(out.textContent);
    } else {
      out.textContent = generatePassphrase({ words: words(), capitalize: true });
      meter.el.setAttribute('data-level',
        strengthFromEntropy(passphraseEntropyBits(words())).level);
    }
  }
  len.addEventListener('input', regen);

  const checks = ['uppercase', 'lowercase', 'numbers', 'symbols'].map((k) => {
    const row = switchRow(k[0].toUpperCase() + k.slice(1), opts[k], (v) => { opts[k] = v; regen(); });
    return row;
  });
  const checksWrap = h('div', {});
  const repaintChecks = () => {
    clear(checksWrap);
    mode === 'password' ? checksWrap.append(...checks) : null;
  };

  const seg = segmented(
    [{ value: 'password', label: 'Password' }, { value: 'passphrase', label: 'Passphrase' }],
    mode,
    (v) => { mode = v; repaintChecks(); regen(); });

  const copyBtn2 = h('button', { class: 'nb-btn nb-btn-primary nb-spacer',
    onclick: () => copyValue(out.textContent, 'Copied to clipboard') },
    h('span', { html: I.copy }), 'Copy');
  const regenBtn = iconBtn(I.refresh, 'Regenerate', () => { buzz(8); regen(); });

  const { header, footer } = shell({ title: 'Generator', back: () => setView('list') });
  root.append(header,
    h('main', { class: 'ok-body nb-view' },
      h('div', { style: { margin: '8px 0 14px' } }, seg.el),
      out,
      h('div', { class: 'nb-row', style: { gap: '10px', marginBottom: '6px' } }, regenBtn, copyBtn2),
      meter.el,
      h('div', { class: 'nb-row', style: { marginTop: '18px', marginBottom: '2px' } },
        h('span', { class: 'nb-label', style: { margin: '0' }, text: 'Length' }),
        h('div', { class: 'nb-spacer' }), lenVal),
      len,
      checksWrap),
    footer);
  repaintChecks();
  regen();
}

/* ============================ SETTINGS ============================ */
export function renderSettings(c, root) {
  const body = h('div', { class: 'nb-col nb-stagger', style: { gap: '2px' } });

  /* account card */
  const accountCard = buildAccountCard();
  body.append(accountCard);

  /* security */
  const lockSeg = segmented(
    [30, 60, 300, 900].map((s2) => ({ value: String(s2), label: s2 < 60 ? s2 + 's' : (s2 / 60) + 'm' })),
    String(settings().autoLockTimeout), () => {});
  lockSeg.el.addEventListener('click', () => {
    saveSettings({ autoLockTimeout: Number(lockSeg.value) });
    toast('Auto-lock updated', 'success');
  });
  const clipDd = dropdown({
    options: [10, 20, 30, 60, 120].map((s2) => ({ value: String(s2), label: s2 + ' seconds' })),
    value: String(settings().clipboardClearTimeout),
    onchange: (v) => saveSettings({ clipboardClearTimeout: Number(v) }),
  });

  body.append(h('div', { class: 'ok-group-title', text: 'Security' }),
    h('div', { class: 'ok-group glass' },
      settingRow('Auto-lock after', lockSeg.el),
      settingRow('Clipboard clears in', clipDd.el),
      settingRow('Master PIN', actionBtn('Change PIN', renderChangePin)),
      settingRow('24 recovery words', actionBtn('Check', () => openRecoveryCheck())),
      settingRow('Recovery key', actionBtn('Make new', openNewRecoveryKey))),
  );

  /* sync */
  if (ctx.user && ctx.cloudSync) {
    body.append(h('div', { class: 'ok-group-title', text: 'Sync' }),
      h('div', { class: 'ok-group glass' },
        settingRow('Cloud sync', statusPill()),
        settingRow('Sync now', actionBtn('Run sync', async () => { await trySync('manual'); rerender(); }))),
    );
  } else if (firebaseReady()) {
    body.append(h('div', { class: 'ok-group-title', text: 'Sync' }),
      h('div', { class: 'ok-group glass' },
        h('div', { style: { padding: '13px 14px', fontSize: 'var(--nb-fs-sm)', lineHeight: '1.6', color: 'var(--nb-text-mut)' } },
          'Sign in to mirror your encrypted vault across devices. The cloud only ever sees ciphertext.'),
        googleSignInReady() ? h('div', { style: { padding: '0 14px 14px' } },
          h('button', { class: 'nb-btn nb-btn-primary nb-btn-block',
            onclick: async () => {
              try {
                const { signInGoogle } = await import('../../lib/firebase.js');
                await signInGoogle();
                toast('Signed in — moving vault to cloud…', 'success');
                if (!ctx.vault.isUnlocked()) return;
                await ctx.cloudSync.moveToCloud(ctx.vault);
                toast('Vault is now syncing', 'success');
                trySync().catch(() => {});
                rerender();
              } catch (e2) { toast(e2.message, 'error'); }
            } },
            h('span', { html: I.cloud }), 'Connect cloud sync'))
          : h('div', { class: 'nb-dim', style: { padding: '0 14px 14px', fontSize: 'var(--nb-fs-xs)' },
              text: 'Google sign-in is not set up in this extension yet. Use email and password on the welcome screen, or see HANDOFF.md.' })));
  }

  /* data */
  body.append(h('div', { class: 'ok-group-title', text: 'Your data' }),
    h('div', { class: 'ok-group glass' },
      settingRow('Backup', actionBtn('Encrypted .json', exportEncrypted)),
      settingRow('Export', actionBtn('Bitwarden / CSV', openExport)),
      settingRow('Import', actionBtn('From file…', openImport)),
      // A backup restore replaces this vault's key, so it is only offered while there is nothing in it.
      ...(entries().length === 0 ? [settingRow('Restore', actionBtn('From backup file…', () => setView('restore', { mode: 'backup', back: 'settings' })))] : []),
    ),
    h('div', { class: 'ok-group-title', text: 'Danger zone' }),
    h('div', { class: 'ok-group glass' },
      settingRow('This device', actionBtn('Reset vault…', resetVault, true))));

  const { header, footer } = shell({ title: 'Settings', back: () => setView('list') });
  root.append(header, h('main', { class: 'ok-body nb-view' }, body), footer);
}

/* ---------- settings helpers ---------- */
function settingRow(label, control) {
  return h('div', { class: 'ok-setting-row' },
    h('span', { style: { flex: '1', fontSize: 'var(--nb-fs-sm)' }, text: label }),
    control);
}
function actionBtn(label, onclick, danger = false) {
  return h('button', { class: 'nb-btn nb-btn-sm ' + (danger ? 'nb-btn-danger' : 'nb-btn-glass'), text: label, onclick });
}
function statusPill() {
  const map = { ok: ['Synced', 'var(--nb-success)'], syncing: ['Syncing…', 'var(--nb-warning)'], err: ['Offline — retrying', 'var(--nb-danger)'], idle: ['Signed in', 'var(--nb-cyan)'] };
  const [text, color] = map[ctx.syncStatus] || map.idle;
  return h('span', { class: 'ok-confidence', style: { color }, text });
}

function buildAccountCard() {
  if (!ctx.user || !firebaseReady()) {
    return h('div', { class: 'glass card', style: { padding: '16px', borderRadius: 'var(--nb-r-lg)', display: 'flex', alignItems: 'center', gap: '12px' } },
      h('div', { class: 'ok-acct-img', style: { width: '38px', height: '38px' }, html: I.cloud.replace('<svg ', '<svg width="18" height="18" ') }),
      h('div', { class: 'nb-col', style: { gap: '2px' } },
        h('b', { style: { fontSize: 'var(--nb-fs-sm)' }, text: 'Local vault' }),
        h('span', { class: 'nb-dim', style: { fontSize: 'var(--nb-fs-xs)' }, text: 'This vault lives on this device only.' })),
    );
  }
  return h('div', { class: 'glass card hoverable', style: { padding: '16px', borderRadius: 'var(--nb-r-lg)', display: 'flex', alignItems: 'center', gap: '13px' } },
    ctx.user.photoURL
      ? h('img', { src: ctx.user.photoURL, alt: '', style: { width: '44px', height: '44px', borderRadius: '14px' } })
      : h('div', { class: 'ok-acct-img', style: { width: '44px', height: '44px', fontSize: '18px' }, text: (ctx.user.email || '?')[0].toUpperCase() }),
    h('div', { class: 'nb-col nb-spacer', style: { gap: '2px', minWidth: 0 } },
      h('b', { style: { fontSize: 'var(--nb-fs-md)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        text: ctx.user.displayName || ctx.user.email }),
      h('span', { class: 'nb-dim', style: { fontSize: 'var(--nb-fs-xs)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
        text: ctx.user.email })),
    iconBtn(I.logout, 'Sign out', async () => {
      const okD = await confirmModal('Sign out? Your vault stays on this device; syncing pauses until you sign back in.', { confirmLabel: 'Sign out' });
      if (!okD) return;
      await signOutNow();
      rerender();
    }));
}
async function signOutNow() {
  const { signOutUser } = await import('../../lib/firebase.js');
  await signOutUser();
  toast('Signed out', 'info');
}

/* ---------- recovery key: make new words, check the old ones, remind ---------- */
const markRecoveryChecked = () => local().set({ [STORAGE_KEYS.LAST_RECOVERY_CHECK_AT]: new Date().toISOString() });

/**
 * Make a new 24-word key. The PIN is asked first. The new words are made but NOT
 * saved: the old words keep working until the user types three of the new ones
 * back and presses the button. Closing the window in between changes nothing.
 */
export function openNewRecoveryKey() {
  const pin = pinInput({ autoFocus: true });
  const content = h('div', {},
    h('p', { class: 'nb-muted', style: { fontSize: 'var(--nb-fs-sm)', lineHeight: '1.6', margin: '4px 0 16px' },
      text: 'This makes 24 new words. Once you confirm them, your old words stop working. Your passwords stay as they are. Enter your PIN to continue.' }),
    pin.el);
  const m = openModal([
    h('h3', { style: { fontFamily: 'var(--nb-font-display)', margin: '0 0 10px', textAlign: 'center' }, text: 'New recovery key' }),
    content,
    h('button', { class: 'nb-btn nb-btn-primary nb-btn-block', style: { marginTop: '16px' }, text: 'Continue',
      onclick: async (ev) => {
        const btn = ev.currentTarget;
        if (btn.disabled) return;
        btn.disabled = true;
        try {
          // Same check as Change PIN: a throwaway unlock, so wrong tries are counted.
          const probe = new Vault(local());
          await probe.unlock(pin.value); probe.lock();
          const { recoveryMnemonic, commit } = await ctx.vault.prepareRecoveryKey();
          const { el } = recoveryReveal(recoveryMnemonic, {
            confirmLabel: 'I saved it. Activate the new key',
            onConfirmed: async () => {
              await commit();
              await markRecoveryChecked();
              m.close();
              toast('New recovery key is active. The old words no longer work.', 'success');
              scheduleSync(0);
            },
          });
          btn.remove();
          clear(content);
          content.append(
            h('p', { class: 'nb-muted', style: { fontSize: 'var(--nb-fs-sm)', lineHeight: '1.6', margin: '0 0 12px' },
              text: 'Write these down, offline. Until you press the button below, your old words still work.' }),
            el);
        } catch (e) {
          btn.disabled = false;
          pin.reset();
          toast(e.code === 'DECRYPTION_FAILED' ? 'Wrong PIN' : e.message, 'error');
        }
      } }),
  ]);
}

/** Type the 24 words to find out whether they still open this vault. */
function openRecoveryCheck({ onChecked } = {}) {
  const box = h('textarea', { class: 'nb-textarea', rows: 4, spellcheck: 'false', autocomplete: 'off', placeholder: 'Type or paste your 24 words' });
  const msg = h('div', { style: { minHeight: '20px', fontSize: 'var(--nb-fs-sm)', margin: '8px 0', color: 'var(--nb-danger)' } });
  const m = openModal([
    h('h3', { style: { fontFamily: 'var(--nb-font-display)', margin: '0 0 10px', textAlign: 'center' }, text: 'Check my 24 words' }),
    h('p', { class: 'nb-muted', style: { fontSize: 'var(--nb-fs-sm)', lineHeight: '1.6', margin: '4px 0 12px' },
      text: 'OKey never keeps your words. Type them to see that you still have the right ones.' }),
    box, msg,
    h('button', { class: 'nb-btn nb-btn-primary nb-btn-block', text: 'Check',
      onclick: async () => {
        if (await ctx.vault.verifyRecoveryWords(box.value)) {
          await markRecoveryChecked();
          m.close();
          toast('Your words work.', 'success');
          onChecked?.();
        } else {
          msg.textContent = "Those words don't open this vault. Check the order and spelling, or make new words.";
        }
      } }),
    h('button', { class: 'nb-btn nb-btn-ghost nb-btn-block', style: { marginTop: '8px' }, text: 'I lost them. Make new words.',
      onclick: () => { m.close(); openNewRecoveryKey(); } }),
  ]);
}

/** A small card on the vault list when it is time to check the words again (every 90 days). */
async function showRecoveryReminder(slot) {
  if (recoveryReminderDismissed) return;
  const last = (await local().get(STORAGE_KEYS.LAST_RECOVERY_CHECK_AT))[STORAGE_KEYS.LAST_RECOVERY_CHECK_AT];
  if (!recoveryCheckDue(last) || recoveryReminderDismissed) return;
  const card = h('div', { class: 'ok-group glass', style: { padding: '12px 14px', marginBottom: '10px' } },
    h('div', { style: { fontWeight: '700', fontSize: 'var(--nb-fs-sm)', marginBottom: '4px' }, text: 'Do you still have your 24 words?' }),
    h('div', { class: 'nb-muted', style: { fontSize: 'var(--nb-fs-xs)', lineHeight: '1.5', marginBottom: '10px' },
      text: 'They are the only way to open your vault on a new device.' }),
    h('div', { class: 'nb-row', style: { gap: '8px' } },
      h('button', { class: 'nb-btn nb-btn-primary nb-btn-sm', text: 'Check now', onclick: () => openRecoveryCheck({ onChecked: () => card.remove() }) }),
      h('button', { class: 'nb-btn nb-btn-ghost nb-btn-sm', text: 'Not now', onclick: () => { recoveryReminderDismissed = true; card.remove(); } })));
  slot.append(card);
}

function renderChangePin() {
  let step = 0; const first = { v: '' };
  const pin1 = pinInput({ autoFocus: true });
  const pin2 = pinInput({ autoFocus: false });
  const cur = pinInput({ autoFocus: false });
  let stage = 'current';
  function bodyFor() {
    if (stage === 'current') return [h('p', { class: 'nb-muted nb-mono', style: { textAlign: 'center', margin: '4px 0 16px', fontSize: 'var(--nb-fs-sm)' }, text: 'Confirm your current PIN first' }), cur.el];
    if (stage === 'new') return [h('p', { class: 'nb-muted', style: { textAlign: 'center', margin: '4px 0 16px', fontSize: 'var(--nb-fs-sm)' }, text: 'Choose your new PIN' }), pin1.el];
    return [h('p', { class: 'nb-muted', style: { textAlign: 'center', margin: '4px 0 16px', fontSize: 'var(--nb-fs-sm)' }, text: 'Once more to confirm' }), pin2.el];
  }
  const content = h('div', {}, ...bodyFor());
  const m = openModal([
    h('h3', { style: { fontFamily: 'var(--nb-font-display)', margin: '0 0 10px', textAlign: 'center' }, text: 'Change master PIN' }),
    content,
    h('button', { class: 'nb-btn nb-btn-primary nb-btn-block', style: { marginTop: '16px' }, text: 'Continue',
      onclick: async () => {
        try {
          if (stage === 'current') {
            const probe = new Vault(local());
            await probe.unlock(cur.value); probe.lock();
            stage = 'new';
            clear(content); content.append(...bodyFor()); requestAnimationFrame(() => pin1.cells[0].focus());
          } else if (stage === 'new') {
            if (pin1.value.length < 4) return toast('4 digits needed', 'error');
            first.v = pin1.value;
            stage = 'confirm';
            clear(content); content.append(...bodyFor()); requestAnimationFrame(() => pin2.cells[0].focus());
          } else {
            if (pin2.value !== first.v) { pin2.shake(); return toast('PINs do not match', 'error'); }
            await ctx.vault.changeMasterPassword(pin2.value);
            await cacheDek(ctx.vault.exportDek(), ctx.settings.autoLockTimeout);
            buzz([10, 30, 10]);
            m.close();
            toast('Master PIN changed', 'success');
            scheduleSync();
          }
        } catch (e2) { toast(e2.code === 'DECRYPTION_FAILED' ? 'Wrong PIN' : e2.message, 'error'); }
      } }),
  ]);
}

function exportEncrypted() {
  ctx.vault.exportRecords().then(async (recs) => {
    const c = await local().get([STORAGE_KEYS.VAULT_SALT, STORAGE_KEYS.KDF_PARAMS, STORAGE_KEYS.WRAPPED_BY_RECOVERY]);
    downloadFile('okey-backup.json', IE.exportOkeyBackup({
      salt: c[STORAGE_KEYS.VAULT_SALT], kdfParams: c[STORAGE_KEYS.KDF_PARAMS],
      wrappedRecovery: c[STORAGE_KEYS.WRAPPED_BY_RECOVERY],
      records: recs,
    }));
    toast('Encrypted backup saved', 'success');
  }).catch((e) => toast(e.message || 'Backup failed', 'error'));
}

function openExport() {
  openModal([
    h('h3', { style: { fontFamily: 'var(--nb-font-display)', margin: '0 0 8px' }, text: 'Export vault' }),
    h('div', { class: 'ok-warn-box', style: { fontWeight: '600' }, text: 'These files contain UNENCRYPTED passwords. Store them safely and delete right after importing elsewhere.' }),
    h('button', { class: 'nb-btn nb-btn-glass nb-btn-block', style: { marginBottom: '8px' },
      onclick: () => { downloadFile('okey-export.json', IE.exportBitwardenJson(entries())); toast('Bitwarden JSON saved', 'success'); } },
      h('span', { html: I.exportIcon }), 'Bitwarden JSON'),
    h('button', { class: 'nb-btn nb-btn-ghost nb-btn-block',
      onclick: () => { downloadFile('okey-export.csv', IE.exportCsv(entries())); toast('CSV saved', 'success'); } },
      h('span', { html: I.exportIcon }), 'CSV'),
  ]);
}

function openImport() {
  const file = h('input', { type: 'file', accept: '.csv,.json,.txt' });
  const fmt = dropdown({
    options: [
      { value: 'auto', label: 'Auto-detect' }, { value: 'chrome', label: 'Chrome CSV' },
      { value: 'bitwarden', label: 'Bitwarden JSON' }, { value: 'lastpass', label: 'LastPass CSV' },
      { value: 'zoho', label: 'Zoho Vault CSV' }, { value: 'otp', label: 'Authenticator (otpauth)' },
    ], value: 'auto', onchange: () => {},
  });
  const m = openModal([
    h('h3', { style: { fontFamily: 'var(--nb-font-display)', margin: '0 0 12px' }, text: 'Import logins' }),
    labeledField('Format', fmt.el),
    labeledField('File', file),
    h('button', { class: 'nb-btn nb-btn-primary nb-btn-block', style: { marginTop: '6px' },
      onclick: async () => {
        const f = file.files?.[0];
        if (!f) return toast('Pick a file first', 'error');
        try {
          const text = await f.text();
          const kind = fmt.value === 'auto' ? sniff(text) : fmt.value;
          const parserMap = { chrome: IE.importChrome, bitwarden: IE.importBitwarden, lastpass: IE.importLastPass, zoho: IE.importZohoVault, otp: IE.importOtpAuthUris };
          const items = (parserMap[kind] || IE.importChrome)(text);
          let n = 0;
          for (const it of items) { try { await ctx.vault.addEntry(it); n++; } catch { /* skip dupes */ } }
          m.close();
          toast('Imported ' + n + ' item' + (n === 1 ? '' : 's'), 'success');
          scheduleSync(); setView('list');
        } catch (e2) { toast('Import failed: ' + e2.message, 'error'); }
      } },
      h('span', { html: I.importIcon }), 'Import'),
  ]);
}
function sniff(text) {
  if (/^\s*\{/.test(text)) return 'bitwarden';
  if (text.includes('otpauth://')) return 'otp';
  return 'chrome';
}

async function resetVault() {
  const okD = await confirmModal(
    'Reset the vault on THIS DEVICE only? All local secrets are erased. Cloud copies and backups are untouched.',
    { danger: true, confirmLabel: 'Erase local vault' });
  if (!okD) return;
  buzz(40);
  await lockNow();
  const keys = [...Object.values(STORAGE_KEYS)];
  await local().remove(keys.filter((k) => k !== STORAGE_KEYS.SETTINGS));
  toast('Device vault reset', 'success');
  setView('welcome');
}
