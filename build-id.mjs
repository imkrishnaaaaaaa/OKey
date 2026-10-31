/**
 * Build id for the PWA service worker: a short hash of every built file, so any
 * change to the app gives a new cache name and installed copies pick it up.
 */
import { createHash } from 'node:crypto';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * @param {string} dir folder to hash
 * @param {{ skip?: string[] }} [opts] relative paths to leave out (the worker itself holds the id)
 * @returns {Promise<string>} 12 hex characters. Source maps are ignored.
 */
export async function hashTree(dir, { skip = [] } = {}) {
  const files = [];
  async function walk(rel) {
    for (const entry of await readdir(path.join(dir, rel), { withFileTypes: true })) {
      const r = path.posix.join(rel, entry.name);
      if (entry.isDirectory()) await walk(r);
      else if (!r.endsWith('.map') && !skip.includes(r)) files.push(r);
    }
  }
  await walk('');
  files.sort();
  const hash = createHash('sha256');
  for (const f of files) hash.update(`${f}\0`).update(await readFile(path.join(dir, f))).update('\0');
  return hash.digest('hex').slice(0, 12);
}
