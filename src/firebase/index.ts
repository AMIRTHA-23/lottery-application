import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

function initializeServices() {
    const isConfigured = getApps().length > 0;
    if (isConfigured) return;

    initializeApp(firebaseConfig);
}

initializeServices();

export * from './provider';
export * from './client-provider';
export * from './non-blocking-login';
export * from './non-blocking-updates';
export * from './firestore/use-collection';
export * from './firestore/use-doc';

export const useAuth = () => getAuth();
export const useFirestore = () => getFirestore();
export const useStorage = () => getStorage();