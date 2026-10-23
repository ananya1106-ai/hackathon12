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
import { FairPriceShop } from '../types';

const COLLECTION_NAME = 'fair_price_shops';

export const fairPriceShopsRepository = {
  async getAll(): Promise<FairPriceShop[]> {
    if (!isFirebaseConfigured) {
      return [];
    }
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (snap.empty) {
        return [];
      }
      return snap.docs.map((d) => d.data() as FairPriceShop);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    }
  },

  subscribe(
    onData: (shops: FairPriceShop[]) => void,
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
        const items = snap.docs.map((d) => d.data() as FairPriceShop);
        onData(items);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },

  async addShop(shop: FairPriceShop): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await setDoc(doc(db, COLLECTION_NAME, shop.id), {
        ...shop,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${shop.id}`);
    }
  },

  async updateShop(shopId: string, updates: Partial<FairPriceShop>): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await updateDoc(doc(db, COLLECTION_NAME, shopId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${shopId}`);
    }
  },
};
