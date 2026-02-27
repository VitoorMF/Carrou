import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
  apiKey: "demo",
  authDomain: "demo",
  projectId: "carrosselize",
};

const app = initializeApp(firebaseConfig);

export const functions = getFunctions(app);

// ⚠️ ISSO É CRÍTICO
connectFunctionsEmulator(functions, "127.0.0.1", 5001);
