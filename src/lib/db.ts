import Database from 'better-sqlite3';
import path from 'path';

const isServerless = process.env.NODE_ENV === 'production' || !!process.env.VERCEL || !!process.env.AWS_LAMBDA || !!process.env.K_SERVICE;
const DB_PATH = isServerless 
  ? path.join('/tmp', 'database.sqlite') 
  : path.resolve(process.cwd(), 'database.sqlite');

declare global {
  var _db: Database.Database | undefined;
}

let rawDb: Database.Database | null = null;
let isInitialized = false;

function getRawDb(): Database.Database {
  if (rawDb) return rawDb;

  if (process.env.NODE_ENV === 'production') {
    rawDb = new Database(DB_PATH, { timeout: 10000 });
  } else {
    if (!global._db) {
      global._db = new Database(DB_PATH, { timeout: 10000 });
    }
    rawDb = global._db;
  }

  if (!isInitialized) {
    isInitialized = true;
    // Enable WAL mode for better concurrent read performance
    rawDb.pragma('journal_mode = WAL');

    // Create tables
    rawDb.exec(`
      CREATE TABLE IF NOT EXISTS registrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        phone TEXT NOT NULL UNIQUE,
        location TEXT NOT NULL,
        ready_to_relocate TEXT NOT NULL DEFAULT 'No',
        resume_url TEXT DEFAULT '',
        created_at DATETIME DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_email ON registrations(email);
      CREATE INDEX IF NOT EXISTS idx_phone ON registrations(phone);
      CREATE INDEX IF NOT EXISTS idx_location ON registrations(location);
      CREATE INDEX IF NOT EXISTS idx_created_at ON registrations(created_at);
    `);

    // Migration: add new columns if they don't exist yet
    try {
      rawDb.exec(`ALTER TABLE registrations ADD COLUMN ready_to_relocate TEXT NOT NULL DEFAULT 'No'`);
    } catch { /* column already exists */ }
    try {
      rawDb.exec(`ALTER TABLE registrations ADD COLUMN resume_url TEXT DEFAULT ''`);
    } catch { /* column already exists */ }
  }

  return rawDb;
}

// Proxy to delegate all database calls to the lazily initialized database
const db = new Proxy({} as Database.Database, {
  get(target, prop, receiver) {
    const instance = getRawDb();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  }
});

export default db;

// Type for a registration record
export interface Registration {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  location: string;
  ready_to_relocate: string;
  resume_url: string;
  created_at: string;
}
