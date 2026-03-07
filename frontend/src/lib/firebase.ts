import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "demo",
  authDomain: "demo",
  projectId: "carrosselize",
};

const app = initializeApp(firebaseConfig);

export const functions = getFunctions(app);
const USE_FIREBASE_EMULATORS = import.meta.env.VITE_USE_FIREBASE_EMULATORS === "true";

if (USE_FIREBASE_EMULATORS) {
  connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}
