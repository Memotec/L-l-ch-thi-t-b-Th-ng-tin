import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc,
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { EquipmentData, TrashEquipmentItem } from './types';

// Initialize Firebase SDK
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Test connection on startup as mandated by Skill
export async function testFirestoreConnection(): Promise<boolean> {
  const testPath = 'test/connection';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    console.log('Firebase Firestore connection verified successfully.');
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Verify configuration or network connectivity.');
    } else {
      console.log('Firestore initialized with project:', firebaseConfig.projectId);
    }
    return false;
  }
}

// Firestore Database Helpers for CNS Equipment Management
export const firestoreService = {
  /**
   * Fetches all equipment documents from Firestore
   */
  async getAllEquipments(): Promise<EquipmentData[]> {
    const pathStr = 'equipments';
    try {
      const snap = await getDocs(collection(db, pathStr));
      const list: EquipmentData[] = [];
      snap.forEach(d => {
        const data = d.data() as EquipmentData;
        if (data && data.general) {
          list.push(data);
        }
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, pathStr);
    }
  },

  /**
   * Saves a single equipment document to Firestore
   */
  async saveEquipment(equipment: EquipmentData, updatedBy: string = 'Quản trị viên'): Promise<void> {
    const pathStr = `equipments/${equipment.id}`;
    try {
      const docRef = doc(db, 'equipments', equipment.id);
      const payload = {
        ...equipment,
        updatedAt: new Date().toISOString(),
        updatedBy
      };
      await setDoc(docRef, payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, pathStr);
    }
  },

  /**
   * Batch writes multiple equipments to Firestore
   */
  async batchSaveEquipments(equipments: EquipmentData[], updatedBy: string = 'Quản trị viên'): Promise<void> {
    const pathStr = 'equipments';
    try {
      const batch = writeBatch(db);
      const nowStr = new Date().toISOString();

      equipments.forEach(eq => {
        const docRef = doc(db, 'equipments', eq.id);
        batch.set(docRef, {
          ...eq,
          updatedAt: nowStr,
          updatedBy
        }, { merge: true });
      });

      // Update sync metadata
      const metaRef = doc(db, 'sync_meta', 'global');
      batch.set(metaRef, {
        lastModified: nowStr,
        count: equipments.length,
        updatedBy,
        version: Date.now()
      }, { merge: true });

      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, pathStr);
    }
  },

  /**
   * Deletes an equipment from Firestore
   */
  async deleteEquipment(equipmentId: string): Promise<void> {
    const pathStr = `equipments/${equipmentId}`;
    try {
      await deleteDoc(doc(db, 'equipments', equipmentId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, pathStr);
    }
  },

  /**
   * Real-time listener for equipment list changes across multiple tabs and devices
   */
  subscribeEquipments(
    onUpdate: (equipments: EquipmentData[]) => void, 
    onError?: (err: any) => void
  ): () => void {
    const pathStr = 'equipments';
    return onSnapshot(
      collection(db, pathStr),
      (snapshot) => {
        const items: EquipmentData[] = [];
        snapshot.forEach(docSnap => {
          const item = docSnap.data() as EquipmentData;
          if (item && item.id && item.general) {
            items.push(item);
          }
        });
        onUpdate(items);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, pathStr);
      }
    );
  },

  /**
   * Fetches trash items from Firestore
   */
  async getTrashItems(): Promise<TrashEquipmentItem[]> {
    const pathStr = 'trash';
    try {
      const snap = await getDocs(collection(db, pathStr));
      const list: TrashEquipmentItem[] = [];
      snap.forEach(d => {
        const data = d.data() as TrashEquipmentItem;
        if (data && data.equipment && data.equipment.id) {
          list.push(data);
        }
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, pathStr);
    }
  },

  /**
   * Saves a trash item to Firestore
   */
  async saveTrashItem(item: TrashEquipmentItem): Promise<void> {
    const trashId = item.equipment?.id || `trash_${Date.now()}`;
    const pathStr = `trash/${trashId}`;
    try {
      await setDoc(doc(db, 'trash', trashId), item);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, pathStr);
    }
  },

  /**
   * Permanently deletes a trash item from Firestore
   */
  async deleteTrashItem(itemId: string): Promise<void> {
    const pathStr = `trash/${itemId}`;
    try {
      await deleteDoc(doc(db, 'trash', itemId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, pathStr);
    }
  }
};
