/**
 * Google sign-in for the Chrome extension.
 *
 * The web app uses Firebase's popup. An extension page cannot: Firebase's popup
 * loads a script from apis.google.com, which the extension's security policy
 * blocks. Instead the browser opens Google's own sign-in page
 * (chrome.identity.launchWebAuthFlow), Google sends back an ID token in the
 * redirect address, and Firebase signs in with that token.
 *
 * Everything here is pure or takes its parts as arguments, so it can be tested
 * without Chrome. The wiring is in firebase.js.
 */

const PLACEHOLDER = /^YOUR_/;

/** Is this code running inside the extension (popup or worker)? */
export function isExtensionContext(g = globalThis) {
  return !!(g.chrome?.runtime?.id && g.chrome?.identity);
}

/** The web app always has Google sign-in. The extension only once a client id is set. */
export function googleSignInAvailable({ isExtension, clientId }) {
  if (!isExtension) return true;
  return !!clientId && !PLACEHOLDER.test(clientId);
}

export function buildAuthUrl({ clientId, redirectUrl, nonce }) {
  const p = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUrl,
    response_type: 'id_token',
    scope: 'openid email profile',
    nonce,
    prompt: 'select_account',
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${p}`;
}

const base64urlJson = (part) => JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/')));

/**
 * Read the ID token out of the address Google redirected to, and check that its
 * nonce is the one we sent (so a token made for another sign-in is refused).
 * @throws {Error} with a plain message
 */
export function idTokenFromRedirect(redirectUrl, nonce) {
  if (!redirectUrl) throw new Error('Google did not return a sign-in. Try again');
  const params = new URLSearchParams(new URL(redirectUrl).hash.slice(1));
  if (params.get('error')) {
    throw new Error(params.get('error') === 'access_denied' ? 'Google sign-in was cancelled' : 'Google sign-in failed. Try again');
  }
  const token = params.get('id_token');
  if (!token) throw new Error('Google did not return a sign-in. Try again');
  try {
    if (base64urlJson(token.split('.')[1]).nonce !== nonce) throw new Error('nonce');
  } catch {
    throw new Error('The Google sign-in did not match this request. Try again');
  }
  return token;
}

/**
 * @param {object} o
 * @param {string} o.clientId OAuth "Web application" client id
 * @param {string} o.redirectUrl https://<extension id>.chromiumapp.org/
 * @param {string} [o.nonce] random per sign-in (made here when not given)
 * @param {(opts: {url: string, interactive: boolean}) => Promise<string>} o.launchWebAuthFlow chrome.identity.launchWebAuthFlow
 * @param {(idToken: string) => Promise<object>} o.signInWithToken Firebase sign-in with the token
 */
export async function signInGoogleViaWindow({
  clientId, redirectUrl, nonce = crypto.randomUUID(), launchWebAuthFlow, signInWithToken,
}) {
  let responseUrl;
  try {
    responseUrl = await launchWebAuthFlow({ url: buildAuthUrl({ clientId, redirectUrl, nonce }), interactive: true });
  } catch (e) {
    // Closing the window rejects with "The user did not approve access."
    if (/did not approve|cancel/i.test(String(e?.message))) throw new Error('Google sign-in was cancelled');
    throw new Error('Google sign-in failed. Try again, or use email and password');
  }
  const idToken = idTokenFromRedirect(responseUrl, nonce);
  try {
    return await signInWithToken(idToken);
  } catch {
    throw new Error('Google sign-in failed. Try again, or use email and password');
  }
}
