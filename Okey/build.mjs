/**
 * OKey — Build pipeline (esbuild)
 *
 * Produces two self-contained, CSP-friendly targets:
 *   dist/extension  → load unpacked in Chrome (MV3)
 *   dist/pwa        → deploy as a static PWA
 *
 * Everything (incl. the Argon2 WASM, inlined as base64 by hash-wasm, and the
 * BIP-39 wordlist) is bundled — no remote fetches, so the strict CSP holds.
 *
 * Usage:  node build.mjs [extension|pwa] [--watch]
 */
import * as esbuild from 'esbuild';
import { cp, mkdir, rm, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const watch = args.includes('--watch');
const only = args.find((a) => a === 'extension' || a === 'pwa');

const shared = {
  bundle: true,
  format: 'esm',
  target: ['chrome110', 'firefox115', 'safari16'],
  sourcemap: true,
  legalComments: 'none',
  logLevel: 'info',
  define: { 'process.env.NODE_ENV': '"production"' },
};

async function copyTree(from, to) {
  if (existsSync(from)) await cp(from, to, { recursive: true });
}

async function buildExtension() {
  const out = path.join(ROOT, 'dist/extension');
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  const ctx = await esbuild.context({
    ...shared,
    entryPoints: {
      'background/service-worker': 'src/extension/background/service-worker.js',
      'popup/popup': 'src/extension/popup/popup.js',
    },
    outdir: out,
    splitting: false,
  });

  // Content scripts must be classic (IIFE) — no ESM imports at runtime.
  const contentCtx = await esbuild.context({
    ...shared,
    format: 'iife',
    entryPoints: { 'content/content': 'src/extension/content/content.js' },
    outdir: out,
  });

  await ctx.rebuild();
  await contentCtx.rebuild();

  await copyTree('src/extension/manifest.json', path.join(out, 'manifest.json'));
  await copyTree('src/extension/_locales', path.join(out, '_locales'));
  await copyTree('src/extension/icons', path.join(out, 'icons'));
  await copyTree('src/extension/popup/popup.html', path.join(out, 'popup/popup.html'));
  await copyTree('src/extension/popup/popup.css', path.join(out, 'popup/popup.css'));
  await copyTree('src/extension/content/content.css', path.join(out, 'content/content.css'));
  await copyTree('styles', path.join(out, 'styles'));

  if (watch) {
    await ctx.watch();
    await contentCtx.watch();
    console.log('[build] watching extension…');
  } else {
    await ctx.dispose();
    await contentCtx.dispose();
    console.log('[build] extension → dist/extension');
  }
}

async function buildPwa() {
  const out = path.join(ROOT, 'dist/pwa');
  await rm(out, { recursive: true, force: true });
  await mkdir(out, { recursive: true });

  const appCtx = await esbuild.context({
    ...shared,
    entryPoints: { app: 'src/pwa/app.js' },
    outdir: out,
  });
  // Service worker as classic script for broad compatibility.
  const swCtx = await esbuild.context({
    ...shared,
    format: 'iife',
    entryPoints: { sw: 'src/pwa/sw.js' },
    outdir: out,
  });

  await appCtx.rebuild();
  await swCtx.rebuild();

  await copyTree('src/pwa/index.html', path.join(out, 'index.html'));
  await copyTree('src/pwa/app.css', path.join(out, 'app.css'));
  await copyTree('src/pwa/manifest.webmanifest', path.join(out, 'manifest.webmanifest'));
  await copyTree('src/pwa/icons', path.join(out, 'icons'));
  await copyTree('styles', path.join(out, 'styles'));

  if (watch) {
    await appCtx.watch();
    await swCtx.watch();
    console.log('[build] watching pwa…');
  } else {
    await appCtx.dispose();
    await swCtx.dispose();
    console.log('[build] pwa → dist/pwa');
  }
}

const jobs = [];
if (!only || only === 'extension') jobs.push(buildExtension());
if (!only || only === 'pwa') jobs.push(buildPwa());
await Promise.all(jobs);
if (!watch) console.log('[build] done.');
