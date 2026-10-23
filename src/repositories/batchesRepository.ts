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
  deleteDoc,
} from '../lib/firebase';
import { Batch, BatchStatus } from '../types';
import { calculateAgeDays } from '../data/mockData';

const COLLECTION_NAME = 'batches';

export const batchesRepository = {
  async getAll(): Promise<Batch[]> {
    if (!isFirebaseConfigured) {
      return [];
    }
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (snap.empty) {
        return [];
      }
      return snap.docs.map((d) => {
        const data = d.data() as Batch;
        return {
          ...data,
          stockAgeDays: calculateAgeDays(data.receivedDate),
        };
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    }
  },

  subscribe(
    onData: (batches: Batch[]) => void,
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
        const items = snap.docs.map((d) => {
          const data = d.data() as Batch;
          return {
            ...data,
            stockAgeDays: calculateAgeDays(data.receivedDate),
          };
        });
        onData(items);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  async addBatch(batch: Batch): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, COLLECTION_NAME, batch.id), {
        ...batch,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${batch.id}`);
    }
  },

  async updateBatchStatus(
    batchId: string,
    newStatus: BatchStatus,
    reason: string,
    user: string
  ): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      const batchRef = doc(db, COLLECTION_NAME, batchId);
      const newMovement = {
        id: `MOV-ST-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        action: 'STATUS_CHANGE' as const,
        referenceId: `STAT-CHG-${batchId}`,
        user,
        notes: `Status changed to ${newStatus}. Reason: ${reason}`,
      };

      await updateDoc(batchRef, {
        status: newStatus,
        statusReason: reason,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${batchId}`);
    }
  },

  async updateBatchMetadata(
    batchId: string,
    updates: { depotLocation?: string; notes?: string; moisturePercentage?: number }
  ): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await updateDoc(doc(db, COLLECTION_NAME, batchId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${batchId}`);
    }
  },

  async deleteBatch(batchId: string): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, batchId));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${batchId}`);
    }
  },
};
