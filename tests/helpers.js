/**
 * Shared test helpers: in-memory StorageAdapter + fixtures.
 */

export class MemoryStorage {
  constructor() {
    this.map = new Map();
  }
  async get(keys) {
    const list = Array.isArray(keys) ? keys : [keys];
    const out = {};
    for (const k of list) if (this.map.has(k)) out[k] = structuredClone(this.map.get(k));
    return out;
  }
  async set(items) {
    for (const [k, v] of Object.entries(items)) this.map.set(k, structuredClone(v));
  }
  async remove(keys) {
    for (const k of Array.isArray(keys) ? keys : [keys]) this.map.delete(k);
  }
}

/**
 * In-memory stand-in for the Firestore REST endpoint. Plug it into a real
 * CloudStore as `_request`. PATCH and commit writes replace the whole doc, like
 * the real one does without an updateMask. A commit stamps every REQUEST_TIME
 * transform with a fake server clock that moves 1s per commit, so tests control
 * "server time" with no help from the local clock. Queries support one
 * GREATER_THAN(_OR_EQUAL) filter, orderBy on that field, and a limit.
 */
export function memoryFirestore() {
  const docs = new Map(); // '/users/u1/vault/meta' -> fields
  let tick = 0;
  const commitLog = []; // writes per commit, in order
  const serverNow = () => new Date(Date.UTC(2030, 0, 1) + (++tick) * 1000).toISOString();

  async function request(path, init = {}) {
    const method = init.method || 'GET';
    if (path === ':commit') {
      const stamp = serverNow();
      const { writes } = JSON.parse(init.body);
      commitLog.push(writes.length);
      for (const { update, updateTransforms = [] } of writes) {
        const fields = { ...update.fields };
        for (const t of updateTransforms) fields[t.fieldPath] = { timestampValue: stamp };
        docs.set(update.name.replace(/^projects\/[^/]+\/databases\/\([^)]+\)\/documents/, ''), fields);
      }
      return {};
    }
    if (path.endsWith(':runQuery')) {
      const q = JSON.parse(init.body).structuredQuery;
      const prefix = `${path.replace(/:runQuery$/, '')}/${q.from[0].collectionId}/`;
      let rows = [...docs].filter(([p]) => p.startsWith(prefix));
      const f = q.where?.fieldFilter;
      if (f) {
        const field = f.field.fieldPath;
        const want = Object.values(f.value)[0];
        const ok = f.op === 'GREATER_THAN' ? (v) => v > want : (v) => v >= want;
        rows = rows.filter(([, fields]) => fields[field] && ok(Object.values(fields[field])[0]));
      }
      const order = q.orderBy?.[0]?.field.fieldPath;
      if (order) rows.sort(([, x], [, y]) => (Object.values(x[order])[0] < Object.values(y[order])[0] ? -1 : 1));
      if (q.limit) rows = rows.slice(0, q.limit.value);
      return rows.map(([p, fields]) => ({ document: { name: `projects/x/databases/(default)/documents${p}`, fields } }));
    }
    if (method === 'PATCH') { docs.set(path, JSON.parse(init.body).fields); return {}; }
    if (method === 'DELETE') { docs.delete(path); return {}; }
    if (docs.has(path)) return { fields: docs.get(path) };
    if (init.allowMissing) return null;
    throw new Error(`missing doc ${path}`);
  }
  return { docs, request, commitLog };
}

/**
 * Just enough DOM for ui/kit.js: elements with children, listeners, classList
 * and remove(). Installs a global `document`. Not a browser: no layout, no CSS.
 */
export function installFakeDom() {
  class El {
    constructor(tag) {
      this.tag = tag; this.nodeType = 1; this.children = []; this.parent = null;
      this.handlers = {}; this.style = {}; this.attrs = {}; this.dataset = {}; this.className = ''; this.textContent = '';
      const set = new Set();
      this.classList = { add: (c) => set.add(c), remove: (c) => set.delete(c), contains: (c) => set.has(c), toggle: (c, on) => (on ?? !set.has(c) ? set.add(c) : set.delete(c)) };
    }
    setAttribute(k, v) { this.attrs[k] = v; }
    addEventListener(t, f) { (this.handlers[t] ||= []).push(f); }
    removeEventListener(t, f) { this.handlers[t] = (this.handlers[t] || []).filter((x) => x !== f); }
    append(...nodes) { for (const n of nodes) { n.remove?.(); n.parent = this; this.children.push(n); } }
    remove() { if (this.parent) { this.parent.children = this.parent.children.filter((c) => c !== this); this.parent = null; } }
    replaceChildren() { this.children = []; }
    dispatch(type, ev = {}) { for (const f of [...(this.handlers[type] || [])]) f({ target: this, currentTarget: this, ...ev }); }
    click() { this.dispatch('click'); }
    focus() {}
    contains(n) { for (let x = n; x; x = x.parent) if (x === this) return true; return false; }
    get isConnected() { let x = this; while (x.parent) x = x.parent; return x === globalThis.document?.body; }
    findAll(pred, out = []) {
      if (pred(this)) out.push(this);
      for (const c of this.children) c.findAll?.(pred, out);
      return out;
    }
    querySelector() { return new El('stub'); }
    querySelectorAll() { return []; } // the orb SVG parts: tests never look inside
    get offsetWidth() { return 0; }
    find(pred) {
      if (pred(this)) return this;
      for (const c of this.children) { const hit = c.find?.(pred); if (hit) return hit; }
      return null;
    }
  }
  const apps = {};
  const body = new El('body');
  const root = new El('document');
  globalThis.document = {
    body,
    createElement: (t) => new El(t),
    getElementById: (id) => (apps[id] ||= new El('div')),
    querySelectorAll: () => [],
    createTextNode: (text) => ({ nodeType: 3, text }),
    addEventListener: (t, f) => root.addEventListener(t, f),
    removeEventListener: (t, f) => root.removeEventListener(t, f),
    dispatch: (t, ev) => root.dispatch(t, ev),
    dispatchEvent: (ev) => root.dispatch(ev.type, ev),
    listenerCount: (t) => (root.handlers[t] || []).length,
  };
  return document;
}
