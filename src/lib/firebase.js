/**
 * OKey — Firebase bootstrap
 *
 * Reads config from src/lib/firebase-config.js (owner fills after creating the
 * project — see docs/architecture.md §4). If the file holds placeholder values,
 * the app runs in LOCAL-ONLY mode: full vault functionality, cloud UI hidden.
 *
 * Exposes a tiny auth-state observable so both popup and PWA can react to
 * sign-in/out without touching the SDK directly.
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth, onAuthStateChanged, signInWithPopup, signInWithRedirect,
  getRedirectResult, GoogleAuthProvider,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,
  setPersistence, browserLocalPersistence,
} from 'firebase/auth';
import { FIREBASE_CONFIG } from './firebase-config.js';

const configured = !/^YOUR_/.test(FIREBASE_CONFIG.apiKey || 'YOUR_');

let app = null;
let auth = null;
const listeners = new Set();

if (configured) {
  app = initializeApp(FIREBASE_CONFIG);
  auth = getAuth(app);
  setPersistence(auth, browserLocalPersistence).catch(() => {});
  // If a previous redirect sign-in is completing, surface it through the
  // normal onAuthStateChanged flow. No-op when there is none.
  getRedirectResult(auth).catch(() => {});
  onAuthStateChanged(auth, (user) => {
    for (const fn of listeners) fn(normalize(user));
  });
}

function normalize(user) {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
}

export const firebaseReady = () => configured;

export function onAuthChanged(fn) {
  listeners.add(fn);
  // Fire current state immediately for late subscribers.
  if (!configured) fn(null);
  else fn(normalize(auth.currentUser));
  return () => listeners.delete(fn);
}

export async function signInGoogle() {
  try {
    const cred = await signInWithPopup(auth, new GoogleAuthProvider());
    return normalize(cred.user);
  } catch (e) {
    const code = e?.code || '';
    // Popup blocked or failed mid-flight: one redirect retry, then give up.
    if (code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, new GoogleAuthProvider());
        return normalize(auth.currentUser); // resolves after the round-trip
      } catch (e2) { throw humanizeAuthError(e2); }
    }
    throw humanizeAuthError(e);
  }
}

export async function signInEmail(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return normalize(cred.user);
  } catch (e) {
    throw humanizeAuthError(e);
  }
}

export async function signUpEmail(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return normalize(cred.user);
  } catch (e) {
    throw humanizeAuthError(e);
  }
}

export async function signOutUser() {
  if (auth) await signOut(auth);
}

function humanizeAuthError(e) {
  const code = e?.code || '';
  const map = {
    'auth/invalid-email': 'That email address looks wrong',
    'auth/missing-password': 'Enter your password',
    'auth/weak-password': 'Password must be at least 6 characters',
    'auth/email-already-in-use': 'Account exists — try signing in instead',
    'auth/invalid-credential': 'Wrong email or password',
    'auth/user-not-found': 'No account with that email',
    'auth/wrong-password': 'Wrong email or password',
    'auth/too-many-requests': 'Too many attempts — try again shortly',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled',
    'auth/cancelled-popup-request': 'Google sign-in was cancelled',
    'auth/popup-blocked': 'Your browser blocked the Google window — allow popups and try again',
    'auth/unauthorized-domain': 'This domain isn\'t authorized in the Firebase console yet',
    'auth/operation-not-allowed': 'Enable this sign-in method in the Firebase console',
    'auth/network-request-failed': 'Network trouble — check your connection',
  };
  return new Error(map[code] || 'Sign-in failed — check your connection');
}
