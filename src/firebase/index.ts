import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

import serviceAccount from "./serviceAccountKey.json" with { type: "json" };
import pkg from 'firebase-admin';
const { credential } = pkg;

const firebaseApp = initializeApp({
  credential: credential.cert(serviceAccount as any),
});

const firebaseAuthApp = getAuth(firebaseApp);

export { firebaseApp, firebaseAuthApp };