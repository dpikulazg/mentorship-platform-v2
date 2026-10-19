import { DataSourceType, Module, Lesson, Affiliate, AffiliateReferral, AffiliatePayout } from '../types';
import { sqliteService, getSqliteDb, downloadDatabaseFile, importDatabaseBinary, resetDatabaseToDefaults, subscribeToSqlite } from '../lib/sqlite';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY_DATASOURCE = 'cryptomentor_preferred_datasource';

// Active data source state
let currentDataSource: DataSourceType = (localStorage.getItem(STORAGE_KEY_DATASOURCE) as DataSourceType) || 'sqlite';
const sourceChangeListeners = new Set<(source: DataSourceType) => void>();

export function getActiveDataSource(): DataSourceType {
  return currentDataSource;
}

export function setActiveDataSource(source: DataSourceType) {
  currentDataSource = source;
  localStorage.setItem(STORAGE_KEY_DATASOURCE, source);
  sourceChangeListeners.forEach(cb => cb(source));
}

export function subscribeToDataSourceChange(callback: (source: DataSourceType) => void): () => void {
  sourceChangeListeners.add(callback);
  return () => {
    sourceChangeListeners.delete(callback);
  };
}

export const unifiedDataService = {
  // Modules
  async getModules(): Promise<Module[]> {
    if (currentDataSource === 'sqlite') {
      return await sqliteService.getModules();
    } else {
      try {
        const snap = await getDocs(collection(db, 'modules'));
        const list = snap.docs.map(d => d.data() as Module);
        list.sort((a, b) => a.order - b.order);
        return list;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'modules');
        // Fallback to SQLite if Firestore has permission or connectivity errors
        return await sqliteService.getModules();
      }
    }
  },

  async saveModule(module: Module): Promise<void> {
    // Save to SQLite
    await sqliteService.saveModule(module);

    // If currently on or syncing to Firestore, attempt write
    if (currentDataSource === 'firestore') {
      try {
        await setDoc(doc(db, 'modules', module.id), module);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `modules/${module.id}`);
      }
    }
  },

  async deleteModule(id: string): Promise<void> {
    await sqliteService.deleteModule(id);
    if (currentDataSource === 'firestore') {
      try {
        await deleteDoc(doc(db, 'modules', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `modules/${id}`);
      }
    }
  },

  // Lessons
  async getLessons(): Promise<Lesson[]> {
    if (currentDataSource === 'sqlite') {
      return await sqliteService.getLessons();
    } else {
      try {
        const snap = await getDocs(collection(db, 'lessons'));
        const list = snap.docs.map(d => d.data() as Lesson);
        list.sort((a, b) => a.order - b.order);
        return list;
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'lessons');
        return await sqliteService.getLessons();
      }
    }
  },

  async saveLesson(lesson: Lesson, videoFile?: File | Blob): Promise<void> {
    await sqliteService.saveLesson(lesson, videoFile);

    if (currentDataSource === 'firestore') {
      try {
        // Strip out large video binary before writing to Firestore
        const { ...firestoreLesson } = lesson;
        await setDoc(doc(db, 'lessons', lesson.id), firestoreLesson);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `lessons/${lesson.id}`);
      }
    }
  },

  async deleteLesson(id: string): Promise<void> {
    await sqliteService.deleteLesson(id);
    if (currentDataSource === 'firestore') {
      try {
        await deleteDoc(doc(db, 'lessons', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `lessons/${id}`);
      }
    }
  },

  // Affiliates
  async getAffiliates(): Promise<Affiliate[]> {
    return await sqliteService.getAffiliates();
  },

  async saveAffiliate(affiliate: Affiliate): Promise<void> {
    await sqliteService.saveAffiliate(affiliate);
  },

  async deleteAffiliate(id: string): Promise<void> {
    await sqliteService.deleteAffiliate(id);
  },

  // Referrals
  async getAffiliateReferrals(affiliateId?: string): Promise<AffiliateReferral[]> {
    return await sqliteService.getAffiliateReferrals(affiliateId);
  },

  async recordReferral(referral: AffiliateReferral): Promise<void> {
    await sqliteService.recordReferral(referral);
  },

  // Payouts
  async getAffiliatePayouts(affiliateId?: string): Promise<AffiliatePayout[]> {
    return await sqliteService.getAffiliatePayouts(affiliateId);
  },

  async processPayout(payout: AffiliatePayout): Promise<void> {
    await sqliteService.processPayout(payout);
  },

  // Sync operations
  async syncFirestoreToSqlite(): Promise<{ modulesCount: number; lessonsCount: number }> {
    const snapModules = await getDocs(collection(db, 'modules'));
    const firestoreModules = snapModules.docs.map(d => d.data() as Module);
    for (const mod of firestoreModules) {
      await sqliteService.saveModule(mod);
    }

    const snapLessons = await getDocs(collection(db, 'lessons'));
    const firestoreLessons = snapLessons.docs.map(d => d.data() as Lesson);
    for (const les of firestoreLessons) {
      await sqliteService.saveLesson(les);
    }

    return {
      modulesCount: firestoreModules.length,
      lessonsCount: firestoreLessons.length
    };
  },

  async syncSqliteToFirestore(): Promise<{ modulesCount: number; lessonsCount: number }> {
    const sqliteModules = await sqliteService.getModules();
    for (const mod of sqliteModules) {
      await setDoc(doc(db, 'modules', mod.id), mod);
    }

    const sqliteLessons = await sqliteService.getLessons();
    for (const les of sqliteLessons) {
      await setDoc(doc(db, 'lessons', les.id), les);
    }

    return {
      modulesCount: sqliteModules.length,
      lessonsCount: sqliteLessons.length
    };
  }
};
