import Database from 'better-sqlite3';
import path from 'node:path';

let dbInstance: Database.Database | null = null;

export function getDatabase(customPath?: string): Database.Database {
  if (customPath) {
    const db = new Database(customPath, { readonly: true });
    db.pragma('foreign_keys = ON');
    return db;
  }

  if (!dbInstance) {
    const defaultPath = path.resolve(process.cwd(), 'data', 'calles.db');
    dbInstance = new Database(defaultPath, { readonly: true });
    dbInstance.pragma('foreign_keys = ON');
  }

  return dbInstance;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}
