import {
  db,
  isFirebaseConfigured,
  setDoc,
  doc,
  getDoc,
  handleFirestoreError,
  OperationType,
  serverTimestamp,
} from '../lib/firebase';
import { DepotSettings } from '../types';
import { DEFAULT_DEPOT_SETTINGS } from '../data/mockData';

const COLLECTION_NAME = 'depot_settings';
const DOC_ID = 'current';

export const depotSettingsRepository = {
  async getSettings(): Promise<DepotSettings> {
    if (!isFirebaseConfigured) {
      return DEFAULT_DEPOT_SETTINGS;
    }
    try {
      const snap = await getDoc(doc(db, COLLECTION_NAME, DOC_ID));
      if (!snap.exists()) {
        return DEFAULT_DEPOT_SETTINGS;
      }
      return snap.data() as DepotSettings;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, `${COLLECTION_NAME}/${DOC_ID}`);
    }
  },

  async saveSettings(settings: Partial<DepotSettings>): Promise<void> {
    if (!isFirebaseConfigured) return;
    try {
      await setDoc(
        doc(db, COLLECTION_NAME, DOC_ID),
        {
          ...settings,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${DOC_ID}`);
    }
  },
};
