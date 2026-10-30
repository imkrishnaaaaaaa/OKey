/**
 * OKey — Firebase project config.
 *
 * 1. console.firebase.google.com → Add project "okey"
 * 2. Authentication → Sign-in method → enable Google + Email/Password
 * 3. Firestore Database → Create (production mode)
 * 4. Project settings → Web app → copy the config object below
 * 5. Deploy firestore.rules from the repo root
 *
 * Placeholder values keep the app in LOCAL-ONLY mode until you fill them in.
 */
export const FIREBASE_CONFIG = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};
