// Firebase configuration
// Replace these values with your Firebase project config
// These are PUBLISHABLE keys — safe to include in client code

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBi-H6mBOLSSdtwtrZJu07tf9TADHkOyN4",
  authDomain: "codecupid-cd5c0.firebaseapp.com",
  projectId: "codecupid-cd5c0",
  storageBucket: "codecupid-cd5c0.firebasestorage.app",
  messagingSenderId: "332003984691",
  appId: "1:332003984691:web:05b0c011cd17d60f8e6a46",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
