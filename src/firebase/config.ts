import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { connectFunctionsEmulator, getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: "AIzaSyCkDteifQXXi-F45m3BE_aRjCbLNhxKJKw",
  authDomain: "noova-intranet.firebaseapp.com",
  projectId: "noova-intranet",
  storageBucket: "noova-intranet.firebasestorage.app",
  messagingSenderId: "29412803376",
  appId: "1:29412803376:web:86088d07d2883305fd3ef5",
  measurementId: "G-27VRDW1F0S",
};

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const almacenamiento = getStorage(app);
const funciones = getFunctions(app, "us-east1");


// Solo Functions se ejecuta localmente; sesión y cursos usan noova-intranet.
// El modo development evita incorporar el emulador a la web publicada.
if (process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_FUNCTIONS_EMULATOR === "true" && typeof window !== "undefined") {
  const estadoLocal = globalThis as typeof globalThis & { noovaFuncionesEmuladas?: WeakSet<object> };
  estadoLocal.noovaFuncionesEmuladas ??= new WeakSet<object>();
  if (!estadoLocal.noovaFuncionesEmuladas.has(funciones)) {
    connectFunctionsEmulator(funciones, "127.0.0.1", 5001);
    estadoLocal.noovaFuncionesEmuladas.add(funciones);
  }
}
auth.languageCode = "es";

export { auth, db, funciones, almacenamiento };
