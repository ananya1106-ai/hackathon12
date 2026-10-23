import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  reload,
  sendPasswordResetEmail,
  ActionCodeSettings,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  onSnapshot,
  runTransaction,
  getDocs,
  where,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  Unsubscribe,
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface FirebaseConnectionStatus {
  isConfigured: boolean;
  isConnected: boolean;
  projectId: string;
  authDomain: string;
  error?: string;
  missingKeys: string[];
}

// 1. Web App configuration values from Vite environment variables or defaults for project 'smartipds'
const env = (typeof import.meta !== 'undefined' && import.meta.env && Object.keys(import.meta.env).length > 0)
  ? (import.meta.env as Record<string, string>)
  : (typeof process !== 'undefined' && process.env ? (process.env as unknown as Record<string, string>) : ({} as Record<string, string>));

export const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY || '',
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN || 'smartipds.firebaseapp.com',
  projectId: env.VITE_FIREBASE_PROJECT_ID || 'smartipds',
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET || 'smartipds.firebasestorage.app',
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: env.VITE_FIREBASE_APP_ID || '',
};

// Required environment variable names for Firebase Web connection
export const REQUIRED_FIREBASE_ENV_VARS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

export const OPTIONAL_FIREBASE_ENV_VARS = [
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
] as const;

// Safe environment variable audit: Identifies only the names of missing or placeholder variables.
// Never prints or exposes the actual variable values.
export const missingEnvVarNames = REQUIRED_FIREBASE_ENV_VARS.filter((varName) => {
  const val = env[varName];
  return !val || val.trim() === '' || val.startsWith('YOUR_') || val.includes('placeholder');
});

export const missingConfigKeys = missingEnvVarNames;
export const isFirebaseConfigured = missingEnvVarNames.length === 0;

export interface SafeFirebaseDiagnostic {
  targetProjectId: string;
  isConfigured: boolean;
  missingEnvVarNames: string[];
  lastErrorCode: string | null;
}

export function getSafeFirebaseDiagnostic(lastErrorCode?: string | null): SafeFirebaseDiagnostic {
  return {
    targetProjectId: firebaseConfig.projectId || 'smartipds',
    isConfigured: isFirebaseConfigured,
    missingEnvVarNames: [...missingEnvVarNames],
    lastErrorCode: lastErrorCode || null,
  };
}

// 2. Initialize Firebase App safely without crashing if config is pending
let app: FirebaseApp;
if (getApps().length > 0) {
  app = getApp();
} else {
  app = initializeApp(
    isFirebaseConfigured
      ? firebaseConfig
      : {
          apiKey: firebaseConfig.apiKey || 'placeholder-api-key-smartipds',
          authDomain: firebaseConfig.authDomain || 'smartipds.firebaseapp.com',
          projectId: 'smartipds',
          storageBucket: 'smartipds.firebasestorage.app',
          appId: firebaseConfig.appId || '1:000000000000:web:0000000000000000000000',
        }
  );
}

// 3. Centralized Auth and Cloud Firestore instances
export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// 4. Standardized Firestore Error Handler
export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('[SmartPDS Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// 5. Verification Test Operation to Cloud Firestore
export async function testFirestoreConnection(): Promise<FirebaseConnectionStatus> {
  const status: FirebaseConnectionStatus = {
    isConfigured: isFirebaseConfigured,
    isConnected: false,
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain,
    missingKeys: missingConfigKeys,
  };

  if (!isFirebaseConfigured) {
    status.error = `Firebase configuration incomplete. Missing: ${missingConfigKeys.join(', ')}`;
    return status;
  }

  try {
    // Attempt real server read on diagnostic test document
    const testDocRef = doc(db, 'test', 'connection');
    await getDocFromServer(testDocRef);
    status.isConnected = true;
    console.log('[SmartPDS Firebase]: Connected successfully to Cloud Firestore (project: smartipds).');
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    status.error = msg;
    if (msg.includes('the client is offline')) {
      console.warn('[SmartPDS Firebase]: Client is offline or database URL unreachable.');
    } else if (msg.includes('permission-denied') || msg.includes('Missing or insufficient permissions')) {
      // Permission denied verifies that the database exists and responded to the request!
      status.isConnected = true;
      console.log('[SmartPDS Firebase]: Cloud Firestore endpoint reached (authenticated rule response).');
    } else {
      console.error('[SmartPDS Firebase]: Connection test failed:', msg);
    }
  }

  return status;
}

/**
 * Generates official ActionCodeSettings for SmartPDS email verification.
 * Dynamically resolves the active deployed application origin (window.location.origin)
 * so verification links return directly to the live app terminal instead of the unhosted Firebase default domain.
 */
export function getActionCodeSettings(): ActionCodeSettings {
  let appUrl = '';
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    appUrl = window.location.origin;
  }
  if (!appUrl) {
    appUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_APP_URL) || 'https://smartipds.firebaseapp.com';
  }

  const cleanBase = appUrl.replace(/\/+$/, '');
  return {
    url: `${cleanBase}/?mode=verifyEmail`,
    handleCodeInApp: false,
  };
}

export {
  app,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  onAuthStateChanged,
  sendEmailVerification,
  applyActionCode,
  checkActionCode,
  reload,
  sendPasswordResetEmail,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  collection,
  query,
  onSnapshot,
  runTransaction,
  getDocs,
  where,
  orderBy,
  limit,
  addDoc,
  deleteDoc,
  serverTimestamp,
};
export type { FirebaseUser, DocumentData, QuerySnapshot, Unsubscribe, ActionCodeSettings };

