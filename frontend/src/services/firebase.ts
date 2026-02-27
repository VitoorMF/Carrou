import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

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
