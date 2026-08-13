// lib/firebase.js
// Central Firebase initialization. Import `auth`, `db`, `storage` from here everywhere else.
// Requires env vars — see SETUP.md for how to create/populate .env.local

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Avoid re-initializing on Next.js hot reload / server+client double init
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);

// Firestore's default transport tries a fast streaming connection first and
// only falls back to long-polling after that attempt times out — on many
// networks (ISP-level restrictions, corporate/antivirus firewalls, common in
// India) that times out slowly, making every Firestore call feel sluggish.
// experimentalAutoDetectLongPolling skips straight to whichever transport
// actually works, avoiding that stall.
//
// initializeFirestore() can only be called once per app (unlike
// getFirestore()), so on Next.js hot reload — where this module can
// re-execute against the same already-initialized app — we fall back to
// getFirestore() instead of throwing.
let db;
try {
  db = initializeFirestore(app, {
    experimentalAutoDetectLongPolling: true,
    useFetchStreams: false,
  });
} catch {
  db = getFirestore(app);
}
export { db };

export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
