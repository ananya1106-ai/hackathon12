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
} from '../lib/firebase';
import { CommodityType } from '../types';

export interface StockTransactionRecord {
  id: string; // e.g. TX-2026-10293
  timestamp: string;
  date: string;
  action: 'RECEIPT' | 'DISPATCH' | 'STATUS_CHANGE' | 'ADJUSTMENT';
  batchId: string;
  commodity: CommodityType;
  variety: string;
  quantityBags: number;
  quantityQtl: number;
  referenceId: string; // e.g. Challan #, Inward Gate Pass #, or Adj #
  user: string;
  role?: string;
  notes?: string;
  depotLocation?: string;
}

const COLLECTION_NAME = 'stock_transactions';

export const stockTransactionsRepository = {
  async getAll(): Promise<StockTransactionRecord[]> {
    if (!isFirebaseConfigured) {
      return [];
    }
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as StockTransactionRecord);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    }
  },

  subscribe(
    onData: (txs: StockTransactionRecord[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!isFirebaseConfigured) {
      onData([]);
      return () => {};
    }

    const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snap) => {
        const items = snap.docs.map((d) => d.data() as StockTransactionRecord);
        onData(items);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  async recordTransaction(tx: StockTransactionRecord): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, COLLECTION_NAME, tx.id), {
        ...tx,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${tx.id}`);
    }
  },
};
