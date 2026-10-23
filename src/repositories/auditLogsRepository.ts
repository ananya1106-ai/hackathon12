import {
  db,
  isFirebaseConfigured,
  collection,
  getDocs,
  setDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  handleFirestoreError,
  OperationType,
  Unsubscribe,
  serverTimestamp,
} from '../lib/firebase';
import { AuditLog } from '../types';

const COLLECTION_NAME = 'audit_logs';

export const auditLogsRepository = {
  async getAll(): Promise<AuditLog[]> {
    if (!isFirebaseConfigured) {
      return [];
    }
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      if (snap.empty) {
        return [];
      }
      return snap.docs.map((d) => d.data() as AuditLog);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    }
  },

  subscribe(
    onData: (logs: AuditLog[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!isFirebaseConfigured) {
      return () => {};
    }

    const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          onData([]);
          return;
        }
        const items = snap.docs.map((d) => d.data() as AuditLog);
        onData(items);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  async addLog(log: AuditLog): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, COLLECTION_NAME, log.id), {
        ...log,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${log.id}`);
    }
  },
};
