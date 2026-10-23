import {
  db,
  isFirebaseConfigured,
  collection,
  getDocs,
  setDoc,
  doc,
  onSnapshot,
  handleFirestoreError,
  OperationType,
  Unsubscribe,
} from '../lib/firebase';
import { CommodityType } from '../types';

export interface CommodityRecord {
  id: string; // e.g. 'Rice'
  name: CommodityType;
  category: 'Foodgrain' | 'Sugar' | 'Pulse' | 'Nutri-Cereal';
  standardBagWeightKg: number;
  maxPermissibleMoisture: number;
  bufferNormQtl: number;
  mspPerQtl: number;
  subsidizedRatePerKg: number;
  description: string;
}

export const INITIAL_COMMODITIES: CommodityRecord[] = [
  {
    id: 'Rice',
    name: 'Rice',
    category: 'Foodgrain',
    standardBagWeightKg: 50,
    maxPermissibleMoisture: 14.0,
    bufferNormQtl: 12000,
    mspPerQtl: 2300,
    subsidizedRatePerKg: 3.0,
    description: 'Fair Average Quality (FAQ) milled parboiled & raw rice for NFSA distribution.',
  },
  {
    id: 'Wheat',
    name: 'Wheat',
    category: 'Foodgrain',
    standardBagWeightKg: 50,
    maxPermissibleMoisture: 12.0,
    bufferNormQtl: 8000,
    mspPerQtl: 2275,
    subsidizedRatePerKg: 2.0,
    description: 'High-protein whole milling wheat stock under FCI central pool allocation.',
  },
  {
    id: 'Sugar',
    name: 'Sugar',
    category: 'Sugar',
    standardBagWeightKg: 50,
    maxPermissibleMoisture: 0.5,
    bufferNormQtl: 1500,
    mspPerQtl: 3800,
    subsidizedRatePerKg: 13.5,
    description: 'Refined crystal sugar allocated under Antyodaya Anna Yojana (AAY).',
  },
  {
    id: 'Coarse Grains',
    name: 'Coarse Grains',
    category: 'Nutri-Cereal',
    standardBagWeightKg: 50,
    maxPermissibleMoisture: 13.0,
    bufferNormQtl: 3000,
    mspPerQtl: 2500,
    subsidizedRatePerKg: 1.0,
    description: 'Nutri-cereals including Ragi, Jowar and Bajra for nutrition security.',
  },
  {
    id: 'Pulses',
    name: 'Pulses',
    category: 'Pulse',
    standardBagWeightKg: 50,
    maxPermissibleMoisture: 10.0,
    bufferNormQtl: 2000,
    mspPerQtl: 7000,
    subsidizedRatePerKg: 38.0,
    description: 'Toor and Chana dal allocated under special state nutrition supplements.',
  },
];

const COLLECTION_NAME = 'commodities';

export const commoditiesRepository = {
  async getAll(): Promise<CommodityRecord[]> {
    if (!isFirebaseConfigured) {
      return INITIAL_COMMODITIES;
    }
    try {
      const snap = await getDocs(collection(db, COLLECTION_NAME));
      if (snap.empty) {
        return INITIAL_COMMODITIES;
      }
      return snap.docs.map((d) => d.data() as CommodityRecord);
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, COLLECTION_NAME);
    }
  },

  subscribe(
    onData: (commodities: CommodityRecord[]) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (!isFirebaseConfigured) {
      onData(INITIAL_COMMODITIES);
      return () => {};
    }

    return onSnapshot(
      collection(db, COLLECTION_NAME),
      (snap) => {
        if (snap.empty) {
          onData(INITIAL_COMMODITIES);
          return;
        }
        const items = snap.docs.map((d) => d.data() as CommodityRecord);
        onData(items);
      },
      (error) => {
        onError?.(error);
        handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
      }
    );
  },
};
