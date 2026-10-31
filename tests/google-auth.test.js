import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  googleSignInAvailable, isExtensionContext, buildAuthUrl, idTokenFromRedirect, signInGoogleViaWindow,
} from '../src/lib/google-auth.js';

const REDIRECT = 'https://fmegecgpmghgnlbjfanplfnmeoodkcpk.chromiumapp.org/';
const CLIENT = '123-abc.apps.googleusercontent.com';

/** A fake Google id token whose payload carries the nonce. */
const jwt = (nonce) => `h.${Buffer.from(JSON.stringify({ nonce, email: 'me@example.com' })).toString('base64url')}.s`;

test('the extension hides Google sign-in until a client id is set; the web app always has it', () => {
  assert.equal(googleSignInAvailable({ isExtension: false, clientId: 'YOUR_EXTENSION_CLIENT_ID' }), true);
  assert.equal(googleSignInAvailable({ isExtension: true, clientId: 'YOUR_EXTENSION_CLIENT_ID' }), false);
  assert.equal(googleSignInAvailable({ isExtension: true, clientId: '' }), false);
  assert.equal(googleSignInAvailable({ isExtension: true, clientId: CLIENT }), true);
});

test('an extension context is one with chrome.runtime.id and chrome.identity', () => {
  assert.equal(isExtensionContext({}), false);
  assert.equal(isExtensionContext({ chrome: undefined }), false);
  assert.equal(isExtensionContext({ chrome: { runtime: {} } }), false);
  assert.equal(isExtensionContext({ chrome: { runtime: { id: 'x' } } }), false, 'no identity API');
  assert.equal(isExtensionContext({ chrome: { runtime: { id: 'x' }, identity: {} } }), true);
});

test('the sign-in address carries the client, the redirect, the token type and a nonce', () => {
  const url = new URL(buildAuthUrl({ clientId: CLIENT, redirectUrl: REDIRECT, nonce: 'n0nce' }));
  assert.equal(url.origin + url.pathname, 'https://accounts.google.com/o/oauth2/v2/auth');
  assert.equal(url.searchParams.get('client_id'), CLIENT);
  assert.equal(url.searchParams.get('redirect_uri'), REDIRECT);
  assert.equal(url.searchParams.get('response_type'), 'id_token');
  assert.equal(url.searchParams.get('nonce'), 'n0nce');
  assert.match(url.searchParams.get('scope'), /openid/);
  assert.equal(url.searchParams.get('prompt'), 'select_account');
});

test('the token is read from the redirect, and only if its nonce is ours', () => {
  const good = `${REDIRECT}#id_token=${jwt('n0nce')}&state=x`;
  assert.equal(idTokenFromRedirect(good, 'n0nce'), jwt('n0nce'));
  assert.throws(() => idTokenFromRedirect(good, 'other'), /did not match|try again/i);
  assert.throws(() => idTokenFromRedirect(`${REDIRECT}#error=access_denied`, 'n0nce'), /cancelled/i);
  assert.throws(() => idTokenFromRedirect(`${REDIRECT}#state=x`, 'n0nce'), /did not return/i);
  assert.throws(() => idTokenFromRedirect(undefined, 'n0nce'), /did not return/i);
  assert.throws(() => idTokenFromRedirect(`${REDIRECT}#id_token=not-a-jwt`, 'n0nce'), /try again/i);
});

function run(over = {}) {
  const seen = {};
  const promise = signInGoogleViaWindow({
    clientId: CLIENT,
    redirectUrl: REDIRECT,
    nonce: 'n0nce',
    launchWebAuthFlow: async (opts) => { seen.opts = opts; return `${REDIRECT}#id_token=${jwt('n0nce')}`; },
    signInWithToken: async (t) => { seen.token = t; return { uid: 'u1', email: 'me@example.com' }; },
    ...over,
  });
  return { seen, promise };
}

test('a good flow opens an interactive window and signs in with the token', async () => {
  const { seen, promise } = run();
  assert.deepEqual(await promise, { uid: 'u1', email: 'me@example.com' });
  assert.equal(seen.opts.interactive, true);
  assert.match(seen.opts.url, /accounts\.google\.com/);
  assert.equal(seen.token, jwt('n0nce'));
});

test('closing the window shows a plain "cancelled" message', async () => {
  const { promise } = run({ launchWebAuthFlow: async () => { throw new Error('The user did not approve access.'); } });
  await assert.rejects(promise, { message: 'Google sign-in was cancelled' });
  const { promise: p2 } = run({ launchWebAuthFlow: async () => { throw new Error('Authorization page could not be loaded.'); } });
  await assert.rejects(p2, /failed|try again/i);
});

test('a token that Firebase refuses is a plain message, not a raw error', async () => {
  const { promise } = run({ signInWithToken: async () => { throw Object.assign(new Error('INVALID_IDP_RESPONSE'), { code: 'auth/invalid-credential' }); } });
  await assert.rejects(promise, (e) => /Google sign-in failed/.test(e.message) && !/INVALID_IDP/.test(e.message));
});
