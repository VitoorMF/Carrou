import { initializeApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBG-z5U4pfXpz-5Y785AsxYM6Hnai4fWcI",
    authDomain: "carrosselize.firebaseapp.com",
    projectId: "carrosselize",
    storageBucket: "carrosselize.firebasestorage.app",
    messagingSenderId: "656222229396",
    appId: "1:656222229396:web:4901851e571374acb47581"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
const USE_FIREBASE_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

if (USE_FIREBASE_EMULATORS) {
    const emulatorHost = "127.0.0.1";
    const globalKey = "__carrosselize_emulators_connected__";
    const globalState = globalThis as Record<string, unknown>;

    if (!globalState[globalKey]) {
        connectFirestoreEmulator(db, emulatorHost, 8080);
        connectStorageEmulator(storage, emulatorHost, 9199);
        globalState[globalKey] = true;
    }
}
