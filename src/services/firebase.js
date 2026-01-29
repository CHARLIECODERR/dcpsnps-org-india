// src/services/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
};

//============Initialize Firebase===============//
// Guard initialization so missing/invalid env vars don't crash the entire app at runtime
let app = null;
let auth = null;
let googleProvider = null;
let db = null;
let storage = null;

try {
  if (!firebaseConfig.apiKey) {
    throw new Error("Missing VITE_FIREBASE_API_KEY (check your environment variables)");
  }

  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  db = getDatabase(app);
  storage = getStorage(app);
} catch (err) {
  // eslint-disable-next-line no-console
  console.error("Firebase initialization failed:", err.message || err);
}

export { app, auth, googleProvider, db, storage };
