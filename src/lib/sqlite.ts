import initSqlJs, { Database, QueryExecResult } from 'sql.js';
import { Module, Lesson, Affiliate, AffiliateReferral, AffiliatePayout } from '../types';

const IDB_NAME = 'CryptoMentor_SQLite_DB';
const IDB_VERSION = 1;
const IDB_STORE_SQLITE = 'sqlite_state';
const IDB_STORE_VIDEOS = 'video_blobs';
const SQLITE_KEY = 'main_database_binary';

let dbInstance: Database | null = null;
let initPromise: Promise<Database> | null = null;
type ChangeListener = () => void;
const listeners = new Set<ChangeListener>();

function notifyChange() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Error in SQLite change listener:', e);
    }
  });
}

export function subscribeToSqlite(listener: ChangeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// -------------------------------------------------------------
// IndexedDB Helpers for SQLite Binary & Video Blobs
// -------------------------------------------------------------

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IDB_NAME, IDB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(IDB_STORE_SQLITE)) {
        db.createObjectStore(IDB_STORE_SQLITE);
      }
      if (!db.objectStoreNames.contains(IDB_STORE_VIDEOS)) {
        db.createObjectStore(IDB_STORE_VIDEOS);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function loadSavedDatabase(): Promise<Uint8Array | null> {
  try {
    const idb = await openIDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE_SQLITE, 'readonly');
      const store = tx.objectStore(IDB_STORE_SQLITE);
      const req = store.get(SQLITE_KEY);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to read SQLite binary from IndexedDB:', err);
    return null;
  }
}

async function persistDatabase(db: Database): Promise<void> {
  try {
    const binary = db.export();
    const idb = await openIDB();
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(IDB_STORE_SQLITE, 'readwrite');
      const store = tx.objectStore(IDB_STORE_SQLITE);
      const req = store.put(binary, SQLITE_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.error('Failed to persist SQLite database to IndexedDB:', err);
  }
}

// Video Blob Storage in IndexedDB
export async function saveVideoBlob(blobId: string, file: File | Blob): Promise<void> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE_VIDEOS, 'readwrite');
    const store = tx.objectStore(IDB_STORE_VIDEOS);
    const req = store.put(file, blobId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getVideoBlob(blobId: string): Promise<Blob | null> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE_VIDEOS, 'readonly');
    const store = tx.objectStore(IDB_STORE_VIDEOS);
    const req = store.get(blobId);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteVideoBlob(blobId: string): Promise<void> {
  const idb = await openIDB();
  return new Promise((resolve, reject) => {
    const tx = idb.transaction(IDB_STORE_VIDEOS, 'readwrite');
    const store = tx.objectStore(IDB_STORE_VIDEOS);
    const req = store.delete(blobId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// -------------------------------------------------------------
// Database Initialization & Schema
// -------------------------------------------------------------

const SCHEMA_DDL = `
  CREATE TABLE IF NOT EXISTS modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 1,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS lessons (
    id TEXT PRIMARY KEY,
    module_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    duration TEXT DEFAULT '10:00',
    sort_order INTEGER DEFAULT 1,
    created_at TEXT NOT NULL,
    video_type TEXT DEFAULT 'url',
    video_file_name TEXT,
    video_file_size INTEGER,
    video_blob_id TEXT,
    is_uploaded INTEGER DEFAULT 0,
    FOREIGN KEY(module_id) REFERENCES modules(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS affiliates (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    affiliate_code TEXT UNIQUE NOT NULL,
    commission_rate REAL DEFAULT 20.0,
    total_earnings REAL DEFAULT 0.0,
    unpaid_balance REAL DEFAULT 0.0,
    total_referrals INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active',
    payout_method TEXT DEFAULT 'crypto_usdt',
    payout_details TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT
  );

  CREATE TABLE IF NOT EXISTS affiliate_referrals (
    id TEXT PRIMARY KEY,
    affiliate_id TEXT NOT NULL,
    affiliate_code TEXT NOT NULL,
    referred_user_email TEXT NOT NULL,
    plan TEXT NOT NULL,
    sale_amount REAL NOT NULL,
    commission_amount REAL NOT NULL,
    status TEXT DEFAULT 'approved',
    created_at TEXT NOT NULL,
    FOREIGN KEY(affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS affiliate_payouts (
    id TEXT PRIMARY KEY,
    affiliate_id TEXT NOT NULL,
    affiliate_code TEXT NOT NULL,
    amount REAL NOT NULL,
    payout_method TEXT NOT NULL,
    payout_details TEXT NOT NULL,
    reference_id TEXT,
    status TEXT DEFAULT 'completed',
    created_at TEXT NOT NULL,
    completed_at TEXT,
    FOREIGN KEY(affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`;

function seedInitialData(db: Database) {
  // Modules
  db.run(`
    INSERT OR IGNORE INTO modules (id, title, description, sort_order, created_at) VALUES 
    ('mod-1', 'Osnove Tržišta & Likvidnost', 'Uvod u kripto ekosustav, prepoznavanje tržišne strukture i ponašanje pametnog novca.', 1, datetime('now')),
    ('mod-2', 'Institucionalne Zone & Entry Setupi', 'Dubinska analiza: Supply/Demand zone, Fair Value Gap (FVG) i likvidnosni sweepovi.', 2, datetime('now')),
    ('mod-3', 'Upravljanje Rizikom & Live Mentorship', 'Kalkulacije rizika, psihološka disciplina i priprema za live trading sesije.', 3, datetime('now'));
  `);

  // Lessons
  db.run(`
    INSERT OR IGNORE INTO lessons (id, module_id, title, description, video_url, duration, sort_order, created_at, video_type, is_uploaded) VALUES 
    ('les-101', 'mod-1', '1. Uvod u likvidnost i Smart Money', 'Pregled osnovnih kretanja kapitala na globalnim kripto burzama.', 'https://www.youtube.com/embed/Yp_O6A9Yf_4', '14:20', 1, datetime('now'), 'url', 0),
    ('les-102', 'mod-1', '2. Tumačenje svijećnjaka i volumena', 'Tehnike čitanja agresivnih naloga i volume profile indikatora.', 'https://www.youtube.com/embed/gU9G7_mP2pU', '18:45', 2, datetime('now'), 'url', 0),
    ('les-201', 'mod-2', '1. Identifikacija manipulacija na otvaranju', 'Kako prepoznati lažne proboje (fakeouts) i zamke za retail trgovce.', 'https://www.youtube.com/embed/Yp_O6A9Yf_4', '22:10', 1, datetime('now'), 'url', 0),
    ('les-202', 'mod-2', '2. Fair Value Gap (FVG) i Imbalance', 'Strategija popunjavanja tržišnih praznina i optimalni entry timing.', 'https://www.youtube.com/embed/gU9G7_mP2pU', '19:30', 2, datetime('now'), 'url', 0),
    ('les-301', 'mod-3', '1. Rule-based risk management matrica', 'Matematički model zaštite portfelja s maksimalnim drawdown limitom.', 'https://www.youtube.com/embed/Yp_O6A9Yf_4', '25:00', 1, datetime('now'), 'url', 0);
  `);

  // Affiliates
  db.run(`
    INSERT OR IGNORE INTO affiliates (id, user_name, user_email, affiliate_code, commission_rate, total_earnings, unpaid_balance, total_referrals, status, payout_method, payout_details, created_at) VALUES 
    ('aff-1', 'Dario Forensic Lead', 'dario.forensic@stampar.hr', 'DELL_FORENSIC_7', 25.0, 740.00, 185.00, 5, 'active', 'crypto_usdt', 'USDT-TRC20: TX9kH...7bQp', datetime('now', '-30 days')),
    ('aff-2', 'Marko Alpha Trader', 'marko.crypto@mentorpro.org', 'ALPHA_TRADER_HR', 20.0, 520.00, 120.00, 4, 'active', 'bank_iban', 'HR12 2360 0001 1234 5678', datetime('now', '-20 days')),
    ('aff-3', 'Ivan Balkan Scalp', 'ivan.scalp@tradinghub.io', 'BALKAN_PRO_99', 15.0, 210.00, 0.00, 2, 'active', 'revolut', '@ivanrevo99', datetime('now', '-10 days'));
  `);

  // Affiliate Referrals
  db.run(`
    INSERT OR IGNORE INTO affiliate_referrals (id, affiliate_id, affiliate_code, referred_user_email, plan, sale_amount, commission_amount, status, created_at) VALUES 
    ('ref-101', 'aff-1', 'DELL_FORENSIC_7', 'student1@forensics.hr', 'mentorship', 499.00, 124.75, 'approved', datetime('now', '-12 days')),
    ('ref-102', 'aff-1', 'DELL_FORENSIC_7', 'student2@stampar.org', 'pro', 249.00, 62.25, 'pending', datetime('now', '-3 days')),
    ('ref-201', 'aff-2', 'ALPHA_TRADER_HR', 'investor@zagreb.com', 'pro', 249.00, 49.80, 'approved', datetime('now', '-8 days')),
    ('ref-202', 'aff-2', 'ALPHA_TRADER_HR', 'scalper.pro@gmail.com', 'starter', 99.00, 19.80, 'approved', datetime('now', '-2 days')),
    ('ref-301', 'aff-3', 'BALKAN_PRO_99', 'novi.trader@net.hr', 'mentorship', 499.00, 74.85, 'paid', datetime('now', '-6 days'));
  `);

  // Affiliate Payouts
  db.run(`
    INSERT OR IGNORE INTO affiliate_payouts (id, affiliate_id, affiliate_code, amount, payout_method, payout_details, reference_id, status, created_at, completed_at) VALUES 
    ('pay-1', 'aff-1', 'DELL_FORENSIC_7', 555.00, 'crypto_usdt', 'USDT-TRC20: TX9kH...7bQp', 'TXID_9941829481A02', 'completed', datetime('now', '-14 days'), datetime('now', '-14 days')),
    ('pay-2', 'aff-2', 'ALPHA_TRADER_HR', 400.00, 'bank_iban', 'HR12 2360 0001 1234 5678', 'SEPA_REF_7718910', 'completed', datetime('now', '-10 days'), datetime('now', '-10 days')),
    ('pay-3', 'aff-3', 'BALKAN_PRO_99', 210.00, 'revolut', '@ivanrevo99', 'REV_TRX_481093', 'completed', datetime('now', '-5 days'), datetime('now', '-5 days'));
  `);
}

export async function getSqliteDb(): Promise<Database> {
  if (dbInstance) return dbInstance;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const SQL = await initSqlJs({
      locateFile: (file) => `/${file}`
    });

    const savedBinary = await loadSavedDatabase();
    let db: Database;
    if (savedBinary && savedBinary.length > 0) {
      try {
        db = new SQL.Database(savedBinary);
      } catch (err) {
        console.warn('Failed to load saved SQLite database, initializing fresh one:', err);
        db = new SQL.Database();
      }
    } else {
      db = new SQL.Database();
    }

    // Execute schema DDL
    db.run(SCHEMA_DDL);

    // If new database, seed
    const testResult = db.exec('SELECT count(*) as cnt FROM modules');
    const count = (testResult[0]?.values[0]?.[0] as number) || 0;
    if (count === 0) {
      seedInitialData(db);
      await persistDatabase(db);
    }

    dbInstance = db;
    return db;
  })();

  return initPromise;
}

// -------------------------------------------------------------
// Core SQL Execution Utilities
// -------------------------------------------------------------

export async function executeSql(sql: string, params?: (string | number | null)[]): Promise<void> {
  const db = await getSqliteDb();
  if (params && params.length > 0) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
  await persistDatabase(db);
  notifyChange();
}

export async function querySql<T = any>(sql: string, params?: (string | number | null)[]): Promise<T[]> {
  const db = await getSqliteDb();
  let stmt = db.prepare(sql);
  if (params && params.length > 0) {
    stmt.bind(params);
  }
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as unknown as T);
  }
  stmt.free();
  return results;
}

export async function rawExecSql(sql: string): Promise<QueryExecResult[]> {
  const db = await getSqliteDb();
  const res = db.exec(sql);
  await persistDatabase(db);
  notifyChange();
  return res;
}

export async function exportDatabaseBinary(): Promise<Uint8Array> {
  const db = await getSqliteDb();
  return db.export();
}

export async function downloadDatabaseFile(fileName = 'cryptomentor-local-store.sqlite'): Promise<void> {
  const binary = await exportDatabaseBinary();
  const blob = new Blob([binary], { type: 'application/x-sqlite3' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importDatabaseBinary(data: Uint8Array): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file) => `/${file}`
  });
  const newDb = new SQL.Database(data);
  // test validity
  newDb.exec('SELECT 1');
  dbInstance = newDb;
  await persistDatabase(newDb);
  notifyChange();
}

export async function resetDatabaseToDefaults(): Promise<void> {
  const SQL = await initSqlJs({
    locateFile: (file) => `/${file}`
  });
  const newDb = new SQL.Database();
  newDb.run(SCHEMA_DDL);
  seedInitialData(newDb);
  dbInstance = newDb;
  await persistDatabase(newDb);
  notifyChange();
}

// -------------------------------------------------------------
// High-Level SQLite Repositories
// -------------------------------------------------------------

export const sqliteService = {
  // Modules
  async getModules(): Promise<Module[]> {
    const rows = await querySql<{
      id: string;
      title: string;
      description: string;
      sort_order: number;
      created_at: string;
    }>('SELECT id, title, description, sort_order, created_at FROM modules ORDER BY sort_order ASC');

    return rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description || '',
      order: r.sort_order,
      createdAt: r.created_at
    }));
  },

  async saveModule(module: Module): Promise<void> {
    await executeSql(
      `INSERT INTO modules (id, title, description, sort_order, created_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title = excluded.title,
         description = excluded.description,
         sort_order = excluded.sort_order`,
      [module.id, module.title, module.description, module.order, module.createdAt || new Date().toISOString()]
    );
  },

  async deleteModule(id: string): Promise<void> {
    // Delete any associated video blobs first
    const lessons = await querySql<{ video_blob_id: string }>(
      'SELECT video_blob_id FROM lessons WHERE module_id = ? AND video_blob_id IS NOT NULL',
      [id]
    );
    for (const l of lessons) {
      if (l.video_blob_id) {
        await deleteVideoBlob(l.video_blob_id);
      }
    }
    await executeSql('DELETE FROM lessons WHERE module_id = ?', [id]);
    await executeSql('DELETE FROM modules WHERE id = ?', [id]);
  },

  // Lessons
  async getLessons(): Promise<Lesson[]> {
    const rows = await querySql<{
      id: string;
      module_id: string;
      title: string;
      description: string;
      video_url: string;
      duration: string;
      sort_order: number;
      created_at: string;
      video_type: 'url' | 'upload';
      video_file_name: string;
      video_file_size: number;
      video_blob_id: string;
      is_uploaded: number;
    }>('SELECT * FROM lessons ORDER BY sort_order ASC');

    return rows.map(r => ({
      id: r.id,
      moduleId: r.module_id,
      title: r.title,
      description: r.description || '',
      videoUrl: r.video_url || '',
      duration: r.duration || '10:00',
      order: r.sort_order,
      createdAt: r.created_at,
      videoType: r.video_type || (r.is_uploaded ? 'upload' : 'url'),
      videoFileName: r.video_file_name || undefined,
      videoFileSize: r.video_file_size || undefined,
      videoBlobId: r.video_blob_id || undefined,
      isUploaded: Boolean(r.is_uploaded)
    }));
  },

  async saveLesson(lesson: Lesson, videoFile?: File | Blob): Promise<void> {
    let blobId = lesson.videoBlobId;

    if (videoFile) {
      blobId = blobId || `blob-${lesson.id}-${Date.now()}`;
      await saveVideoBlob(blobId, videoFile);
    }

    const isUploaded = lesson.videoType === 'upload' || Boolean(blobId) ? 1 : 0;

    await executeSql(
      `INSERT INTO lessons (id, module_id, title, description, video_url, duration, sort_order, created_at, video_type, video_file_name, video_file_size, video_blob_id, is_uploaded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         module_id = excluded.module_id,
         title = excluded.title,
         description = excluded.description,
         video_url = excluded.video_url,
         duration = excluded.duration,
         sort_order = excluded.sort_order,
         video_type = excluded.video_type,
         video_file_name = excluded.video_file_name,
         video_file_size = excluded.video_file_size,
         video_blob_id = excluded.video_blob_id,
         is_uploaded = excluded.is_uploaded`,
      [
        lesson.id,
        lesson.moduleId,
        lesson.title,
        lesson.description,
        lesson.videoUrl || '',
        lesson.duration || '10:00',
        lesson.order,
        lesson.createdAt || new Date().toISOString(),
        lesson.videoType || (isUploaded ? 'upload' : 'url'),
        lesson.videoFileName || null,
        lesson.videoFileSize || null,
        blobId || null,
        isUploaded
      ]
    );
  },

  async deleteLesson(id: string): Promise<void> {
    const rows = await querySql<{ video_blob_id: string }>(
      'SELECT video_blob_id FROM lessons WHERE id = ?',
      [id]
    );
    if (rows[0]?.video_blob_id) {
      await deleteVideoBlob(rows[0].video_blob_id);
    }
    await executeSql('DELETE FROM lessons WHERE id = ?', [id]);
  },

  // Affiliates Management
  async getAffiliates(): Promise<Affiliate[]> {
    const rows = await querySql<{
      id: string;
      user_id: string;
      user_name: string;
      user_email: string;
      affiliate_code: string;
      commission_rate: number;
      total_earnings: number;
      unpaid_balance: number;
      total_referrals: number;
      status: 'active' | 'pending' | 'suspended';
      payout_method: 'crypto_usdt' | 'bank_iban' | 'revolut' | 'paypal';
      payout_details: string;
      created_at: string;
      updated_at: string;
    }>('SELECT * FROM affiliates ORDER BY total_earnings DESC');

    return rows.map(r => ({
      id: r.id,
      userId: r.user_id || undefined,
      userName: r.user_name,
      userEmail: r.user_email,
      affiliateCode: r.affiliate_code,
      commissionRate: r.commission_rate,
      totalEarnings: r.total_earnings,
      unpaidBalance: r.unpaid_balance,
      totalReferrals: r.total_referrals,
      status: r.status,
      payoutMethod: r.payout_method,
      payoutDetails: r.payout_details || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at || undefined
    }));
  },

  async saveAffiliate(affiliate: Affiliate): Promise<void> {
    await executeSql(
      `INSERT INTO affiliates (id, user_id, user_name, user_email, affiliate_code, commission_rate, total_earnings, unpaid_balance, total_referrals, status, payout_method, payout_details, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_name = excluded.user_name,
         user_email = excluded.user_email,
         affiliate_code = excluded.affiliate_code,
         commission_rate = excluded.commission_rate,
         total_earnings = excluded.total_earnings,
         unpaid_balance = excluded.unpaid_balance,
         total_referrals = excluded.total_referrals,
         status = excluded.status,
         payout_method = excluded.payout_method,
         payout_details = excluded.payout_details,
         updated_at = excluded.updated_at`,
      [
        affiliate.id,
        affiliate.userId || null,
        affiliate.userName,
        affiliate.userEmail,
        affiliate.affiliateCode.toUpperCase(),
        affiliate.commissionRate,
        affiliate.totalEarnings,
        affiliate.unpaidBalance,
        affiliate.totalReferrals,
        affiliate.status,
        affiliate.payoutMethod,
        affiliate.payoutDetails,
        affiliate.createdAt || new Date().toISOString(),
        new Date().toISOString()
      ]
    );
  },

  async deleteAffiliate(id: string): Promise<void> {
    await executeSql('DELETE FROM affiliates WHERE id = ?', [id]);
  },

  // Affiliate Referrals
  async getAffiliateReferrals(affiliateId?: string): Promise<AffiliateReferral[]> {
    let sql = 'SELECT * FROM affiliate_referrals';
    const params: string[] = [];
    if (affiliateId) {
      sql += ' WHERE affiliate_id = ?';
      params.push(affiliateId);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = await querySql<{
      id: string;
      affiliate_id: string;
      affiliate_code: string;
      referred_user_email: string;
      plan: 'starter' | 'pro' | 'mentorship';
      sale_amount: number;
      commission_amount: number;
      status: 'pending' | 'approved' | 'paid';
      created_at: string;
    }>(sql, params);

    return rows.map(r => ({
      id: r.id,
      affiliateId: r.affiliate_id,
      affiliateCode: r.affiliate_code,
      referredUserEmail: r.referred_user_email,
      plan: r.plan,
      saleAmount: r.sale_amount,
      commissionAmount: r.commission_amount,
      status: r.status,
      createdAt: r.created_at
    }));
  },

  async recordReferral(referral: AffiliateReferral): Promise<void> {
    // Insert referral record
    await executeSql(
      `INSERT INTO affiliate_referrals (id, affiliate_id, affiliate_code, referred_user_email, plan, sale_amount, commission_amount, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        referral.id,
        referral.affiliateId,
        referral.affiliateCode,
        referral.referredUserEmail,
        referral.plan,
        referral.saleAmount,
        referral.commissionAmount,
        referral.status,
        referral.createdAt || new Date().toISOString()
      ]
    );

    // Update aggregate metrics on the affiliate
    await executeSql(
      `UPDATE affiliates SET 
         total_referrals = total_referrals + 1,
         total_earnings = total_earnings + ?,
         unpaid_balance = unpaid_balance + ?,
         updated_at = ?
       WHERE id = ?`,
      [referral.commissionAmount, referral.commissionAmount, new Date().toISOString(), referral.affiliateId]
    );
  },

  // Affiliate Payouts
  async getAffiliatePayouts(affiliateId?: string): Promise<AffiliatePayout[]> {
    let sql = 'SELECT * FROM affiliate_payouts';
    const params: string[] = [];
    if (affiliateId) {
      sql += ' WHERE affiliate_id = ?';
      params.push(affiliateId);
    }
    sql += ' ORDER BY created_at DESC';

    const rows = await querySql<{
      id: string;
      affiliate_id: string;
      affiliate_code: string;
      amount: number;
      payout_method: string;
      payout_details: string;
      reference_id: string;
      status: 'processing' | 'completed' | 'rejected';
      created_at: string;
      completed_at: string;
    }>(sql, params);

    return rows.map(r => ({
      id: r.id,
      affiliateId: r.affiliate_id,
      affiliateCode: r.affiliate_code,
      amount: r.amount,
      payoutMethod: r.payout_method,
      payoutDetails: r.payout_details,
      referenceId: r.reference_id || undefined,
      status: r.status,
      createdAt: r.created_at,
      completedAt: r.completed_at || undefined
    }));
  },

  async processPayout(payout: AffiliatePayout): Promise<void> {
    await executeSql(
      `INSERT INTO affiliate_payouts (id, affiliate_id, affiliate_code, amount, payout_method, payout_details, reference_id, status, created_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payout.id,
        payout.affiliateId,
        payout.affiliateCode,
        payout.amount,
        payout.payoutMethod,
        payout.payoutDetails,
        payout.referenceId || `TX-${Date.now().toString(36).toUpperCase()}`,
        payout.status || 'completed',
        payout.createdAt || new Date().toISOString(),
        payout.completedAt || new Date().toISOString()
      ]
    );

    // Deduct unpaid balance from affiliate
    await executeSql(
      `UPDATE affiliates SET 
         unpaid_balance = MAX(0, unpaid_balance - ?),
         updated_at = ?
       WHERE id = ?`,
      [payout.amount, new Date().toISOString(), payout.affiliateId]
    );

    // Also mark approved referrals as 'paid'
    await executeSql(
      `UPDATE affiliate_referrals SET status = 'paid' WHERE affiliate_id = ? AND status = 'approved'`,
      [payout.affiliateId]
    );
  }
};
