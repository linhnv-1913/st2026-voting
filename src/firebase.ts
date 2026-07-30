import { getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = getApps().find(firebaseApp => firebaseApp.name === '[DEFAULT]') || initializeApp(firebaseConfig);
const voterApp = getApps().find(firebaseApp => firebaseApp.name === 'voter-browser-session')
  || initializeApp(firebaseConfig, 'voter-browser-session');

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const voterDb = getFirestore(voterApp, firebaseConfig.firestoreDatabaseId);
export const voterAuth = getAuth(voterApp);
