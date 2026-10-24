import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

// Firebase web config is public by design (identifies the project, not a secret).
// Read from env when present, else fall back to the project defaults.
const env = import.meta.env;
const firebaseConfig = {
  apiKey:            env.VITE_FIREBASE_API_KEY             || "AIzaSyD0xwoK_oDJm1QmJG61TuAnuWpG6SzCBsk",
  authDomain:        env.VITE_FIREBASE_AUTH_DOMAIN         || "homie-7ac90.firebaseapp.com",
  projectId:         env.VITE_FIREBASE_PROJECT_ID          || "homie-7ac90",
  storageBucket:     env.VITE_FIREBASE_STORAGE_BUCKET      || "homie-7ac90.firebasestorage.app",
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || "486106210033",
  appId:             env.VITE_FIREBASE_APP_ID              || "1:486106210033:web:ea2eb0601eca522481d350",
  measurementId:     env.VITE_FIREBASE_MEASUREMENT_ID      || "G-GXXPRYQXPT",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

/** Open the Google popup and return the Firebase ID token (a signed JWT). */
export async function signInWithGoogle() {
  const result = await signInWithPopup(auth, googleProvider);
  return await result.user.getIdToken();
}
