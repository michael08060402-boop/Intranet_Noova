import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

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


// Desarrollo y Hosting usan las funciones desplegadas en noova-intranet.
auth.languageCode = "es";

export { auth, db, funciones, almacenamiento };
