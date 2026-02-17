// lib/firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  Auth,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Only initialize Firebase in the browser
let app: FirebaseApp | undefined;
let authInstance: Auth | undefined;

if (typeof window !== 'undefined') {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  authInstance = getAuth(app);
  // Persist auth state in localStorage so tokens auto-refresh
  setPersistence(authInstance, browserLocalPersistence);
}

// Export auth instance (will be undefined during SSR, but that's okay since it's only used client-side)
export const auth = authInstance as Auth;
