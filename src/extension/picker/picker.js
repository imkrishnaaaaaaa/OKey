/**
 * OKey Extension — Password picker and add form.
 *
 * This page runs as a cross-origin extension iframe. The host page can neither
 * read the form nor script it. It saves new logins straight to the service
 * worker. It tells the content script only which id to fill, never a password.
 */
import { generatePassword } from '../../core/password-generator.js';
import { isValidTotpSecret } from '../../core/totp.js';
import { MSG } from '../lib/messages.js';
import { PICKER_MSG, frameMessage, isPickerMessage } from '../lib/frame-protocol.js';

const channel = location.hash.slice(1);
const parentOrigin = location.ancestorOrigins?.[0] || '';
const parentTarget = parentOrigin && parentOrigin !== 'null' ? parentOrigin : '*';
const app = document.getElementById('app');

const state = {
  theme: 'light',
  context: { hostname: '', title: '', canGenerate: false },
  matches: [],
  others: [],
  view: 'list',
  query: '',
  notice: '',
  loading: true,
};

function post(type, data = {}) {
  parent.postMessage(frameMessage(type, channel, data), parentTarget);
}

function el(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key === 'on') for (const [name, fn] of Object.entries(value)) node.addEventListener(name, fn);
    else if (value === true) node.setAttribute(key, '');
    else if (value !== false && value != null) node.setAttribute(key, value);
  }
  for (const child of children) {
    if (child == null) continue;
    node.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
  return node;
}

function input(props = {}) {
  return el('input', { class: 'input', ...props });
}

function applyTheme(theme) {
  const mode = theme === 'dark' || theme === 'light' ? theme : 'system';
  document.documentElement.dataset.theme = mode;
}

function cleanTitle(title) {
  return String(title || '').split('|')[0].split('-')[0].trim().slice(0, 80);
}

function topBar() {
  return el('div', { class: 'top' },
    el('div', { class: 'brand', text: 'OKey' }),
    el('button', { class: 'close', type: 'button', 'aria-label': 'Close', text: 'Close', on: { click: () => post(PICKER_MSG.CLOSE) } }),
  );
}

function noticeView(message, retry = false) {
  return el('div', {},
    topBar(),
    el('div', { class: 'notice', text: message }),
    retry
      ? el('div', { class: 'buttons' }, el('button', { class: 'btn btn-primary', type: 'button', text: 'Try again', on: { click: load } }))
      : null,
  );
}

function listView() {
  const search = input({
    id: 'okey-picker-search',
    type: 'search',
    placeholder: 'Search logins',
    autocomplete: 'off',
    value: state.query,
    on: { input: (e) => { state.query = e.target.value; renderList(); } },
  });

  const list = el('div', { class: 'list', id: 'okey-picker-list' });
  const actions = el('div', { class: 'actions' },
    actionButton('Add new login', 'Save this site', 'add'),
    state.context.canGenerate ? actionButton('Generate password', 'Fill and copy a strong password', 'generate') : null,
  );

  const root = el('div', {}, topBar(), search, list, el('div', { class: 'divider' }), actions);
  root._list = list;
  return root;
}

function actionButton(title, sub, kind) {
  return el('button', { class: 'action', type: 'button', on: { click: () => {
    if (kind === 'add') { state.view = 'add'; render(); }
    else post(PICKER_MSG.GENERATE);
  } } },
  el('span', {}, el('strong', { text: title }), el('small', { text: sub })),
  el('span', { class: 'chev', text: '>' }),
  );
}

function filtered() {
  const q = state.query.toLowerCase().trim();
  const keep = (c) => !q
    || (c.siteName || '').toLowerCase().includes(q)
    || (c.domain || '').toLowerCase().includes(q)
    || (c.username || '').toLowerCase().includes(q);
  return { matches: state.matches.filter(keep), others: state.others.filter(keep) };
}

function rows(list, items, picked) {
  for (const cred of items) {
    list.append(el('button', {
      class: 'row',
      type: 'button',
      on: { click: () => post(PICKER_MSG.PICK, { id: cred.id, picked }) },
    },
    el('span', { class: 'row-name', text: cred.siteName || cred.domain || 'Login' }),
    el('span', { class: 'row-user', text: cred.username || '(no username)' }),
    ));
  }
}

function renderList() {
  const list = app.querySelector('#okey-picker-list');
  if (!list) return;
  const { matches, others } = filtered();
  const q = state.query.trim();
  list.replaceChildren();

  if (matches.length) {
    list.append(el('div', { class: 'section', text: `For ${state.context.hostname}` }));
    rows(list, matches, false);
  } else if (!q) {
    list.append(el('div', { class: 'notice', text: 'No saved logins for this site' }));
  }

  if (others.length) {
    list.append(el('div', { class: 'section', text: 'Other logins' }));
    rows(list, q ? others : others.slice(0, 3), true);
  } else if (q && !matches.length) {
    list.append(el('div', { class: 'notice', text: 'No matches' }));
  }
  post(PICKER_MSG.RESIZE, { height: Math.ceil(document.body.scrollHeight) });
}

function addView() {
  const siteName = input({ type: 'text', value: cleanTitle(state.context.title), placeholder: 'Google', autocomplete: 'off' });
  const domain = input({ type: 'text', value: state.context.hostname, placeholder: 'google.com', autocomplete: 'off' });
  const username = input({ type: 'text', placeholder: 'you@example.com', autocomplete: 'username' });
  const password = input({ type: 'text', placeholder: 'Password', autocomplete: 'new-password' });
  const totp = input({ type: 'text', placeholder: 'Base32 secret (optional)', autocomplete: 'off' });
  const error = el('div', { class: 'error' });
  let busy = false;

  const save = el('button', { class: 'btn btn-primary', type: 'button', text: 'Save and fill' });
  save.addEventListener('click', async () => {
    if (busy) return;
    const data = {
      siteName: siteName.value.trim(),
      domain: domain.value.trim().toLowerCase(),
      username: username.value.trim(),
      password: password.value,
      totpSecret: totp.value.replace(/\s+/g, ''),
      entryType: 'password',
    };
    if (!data.siteName && !data.domain) {
      error.textContent = 'Add a site name or domain.';
      return;
    }
    if (data.totpSecret && !isValidTotpSecret(data.totpSecret)) {
      error.textContent = 'The TOTP secret is not valid base32.';
      return;
    }
    busy = true;
    error.textContent = '';
    save.disabled = true;
    save.textContent = 'Saving...';
    const res = await chrome.runtime.sendMessage({ type: MSG.ADD_CREDENTIAL, data }).catch(() => null);
    if (res?.success && res.entry) {
      post(PICKER_MSG.ADDED, { id: res.entry.id });
      return;
    }
    busy = false;
    save.disabled = false;
    save.textContent = 'Save and fill';
    error.textContent = res?.error || 'Could not save. OKey may be locked.';
  });

  const generate = el('button', { class: 'mini', type: 'button', text: 'Generate', on: { click: () => {
    password.value = generatePassword({ length: 20 });
    password.focus();
  } } });

  return el('div', {},
    topBar(),
    field('Site name', siteName),
    field('Domain', domain),
    field('Username or email', username),
    field('Password', el('div', { class: 'input-wrap' }, password, generate)),
    field('TOTP secret (optional)', totp),
    error,
    el('div', { class: 'buttons' },
      el('button', { class: 'btn btn-ghost', type: 'button', text: 'Cancel', on: { click: () => {
        state.view = 'list';
        render();
      } } }),
      save,
    ),
  );
}

function field(label, control) {
  return el('div', { class: 'field' }, el('label', { class: 'label', text: label }), control);
}

function render() {
  if (!channel) {
    app.replaceChildren(noticeView('Could not open OKey. Reload the page and try again.'));
    return;
  }
  if (state.loading) {
    app.replaceChildren(noticeView('Loading OKey'));
    return;
  }
  if (state.notice) {
    app.replaceChildren(noticeView(state.notice, true));
    return;
  }
  const view = state.view === 'add' ? addView() : listView();
  app.replaceChildren(view);
  if (state.view === 'list') renderList();
  post(PICKER_MSG.RESIZE, { height: Math.ceil(document.body.scrollHeight) });
  requestAnimationFrame(() => post(PICKER_MSG.RESIZE, { height: Math.ceil(document.body.scrollHeight) }));
}

async function load() {
  if (!channel) { render(); return; }
  state.loading = true;
  state.notice = '';
  render();
  const res = await chrome.runtime.sendMessage({ type: MSG.GET_SITE_CREDENTIALS }).catch(() => null);
  state.loading = false;
  if (!res) {
    state.notice = 'Could not reach OKey. Try again.';
    render();
    return;
  }
  if (res.settings?.theme) {
    state.theme = res.settings.theme;
    applyTheme(state.theme);
  }
  if (res.insecure) {
    state.notice = 'OKey does not fill on pages that are not https.';
    render();
    return;
  }
  if (!res.success) {
    state.notice = res.error || 'Could not read OKey. Try again.';
    render();
    return;
  }
  if (res.locked) {
    state.notice = 'OKey is locked.';
    render();
    return;
  }
  state.matches = res.matches || [];
  state.others = res.others || [];
  state.view = 'list';
  render();
  requestAnimationFrame(() => document.getElementById('okey-picker-search')?.focus());
}

function onMessage(ev) {
  if (ev.source !== parent) return;
  if (parentOrigin && parentOrigin !== 'null' && ev.origin !== parentOrigin) return;
  if (!isPickerMessage(ev.data, channel, PICKER_MSG.CONTEXT)) return;
  state.context = {
    hostname: String(ev.data.hostname || '').slice(0, 255),
    title: String(ev.data.title || '').slice(0, 300),
    canGenerate: ev.data.canGenerate === true,
  };
  if (ev.data.theme) {
    state.theme = ev.data.theme;
    applyTheme(state.theme);
  }
  load();
}

window.addEventListener('message', onMessage);
window.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  if (state.view === 'add') {
    state.view = 'list';
    render();
  } else {
    post(PICKER_MSG.CLOSE);
  }
});

const sizeObserver = new ResizeObserver(() => {
  post(PICKER_MSG.RESIZE, { height: Math.ceil(document.body.scrollHeight) });
});
sizeObserver.observe(document.body);

if (channel) {
  post(PICKER_MSG.READY);
} else {
  render();
}
