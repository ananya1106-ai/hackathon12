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
import { DispatchRecord } from '../types';

const COLLECTION_NAME = 'dispatches';

export const dispatchesRepository = {
  async getAll(): Promise<DispatchRecord[]> {
    if (!isFirebaseConfigured) {
      return [];
    }
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      if (snap.empty) {
        return [];
      }
      return snap.docs.map((d) => d.data() as DispatchRecord);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    }
  },

  subscribe(
    onData: (dispatches: DispatchRecord[]) => void,
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
        const items = snap.docs.map((d) => d.data() as DispatchRecord);
        onData(items);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  async addDispatch(dispatch: DispatchRecord): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, COLLECTION_NAME, dispatch.challanNumber), {
        ...dispatch,
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${dispatch.challanNumber}`);
    }
  },
};
