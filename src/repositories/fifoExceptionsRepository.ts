import {
  db,
  isFirebaseConfigured,
  collection,
  getDocs,
  setDoc,
  doc,
  updateDoc,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  Unsubscribe,
  serverTimestamp,
} from '../lib/firebase';
import { FifoException } from '../types';

const COLLECTION_NAME = 'fifo_exceptions';

export const fifoExceptionsRepository = {
  async getAll(): Promise<FifoException[]> {
    if (!isFirebaseConfigured) {
      return [];
    }
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (snap.empty) {
        return [];
      }
      return snap.docs.map((d) => d.data() as FifoException);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    }
  },

  subscribe(
    onData: (exceptions: FifoException[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!isFirebaseConfigured) {
      return () => {};
    }

    return onSnapshot(
      collection(db, COLLECTION_NAME),
      (snap) => {
        if (snap.empty) {
          onData([]);
          return;
        }
        const items = snap.docs.map((d) => d.data() as FifoException);
        onData(items);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  async addException(exc: FifoException): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, COLLECTION_NAME, exc.id), {
        ...exc,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${exc.id}`);
    }
  },

  async updateException(
    excId: string,
    updates: Partial<FifoException>
  ): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await updateDoc(doc(db, COLLECTION_NAME, excId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${excId}`);
    }
  },
};
