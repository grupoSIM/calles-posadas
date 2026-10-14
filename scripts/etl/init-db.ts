import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initDatabase(dbPath?: string): Database.Database {
  const targetPath = dbPath || path.resolve(process.cwd(), 'data', 'calles.db');
  
  // Asegurar que el directorio de datos existe
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const db = new Database(targetPath);
  
  // Configuración de rendimiento para SQLite
  db.pragma('journal_mode = WAL');
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = ON');

  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  // Asegurar migración idempotente de columna aliases si la tabla ya existía
  try {
    const pragmaCalles = db.prepare("PRAGMA table_info(calles)").all() as { name: string }[];
    const colNames = pragmaCalles.map(c => c.name);
    if (colNames.length > 0 && !colNames.includes('aliases')) {
      db.exec("ALTER TABLE calles ADD COLUMN aliases TEXT NULL;");
      db.exec("DROP TRIGGER IF EXISTS calles_ai;");
      db.exec("DROP TRIGGER IF EXISTS calles_ad;");
      db.exec("DROP TRIGGER IF EXISTS calles_au;");
      db.exec("DROP TABLE IF EXISTS calles_fts;");
    }

    const pragmaBarrios = db.prepare("PRAGMA table_info(barrios)").all() as { name: string }[];
    const barrioCols = pragmaBarrios.map(c => c.name);
    if (barrioCols.length > 0) {
      if (!barrioCols.includes('delegacion')) db.exec("ALTER TABLE barrios ADD COLUMN delegacion TEXT NULL;");
      if (!barrioCols.includes('seccion')) db.exec("ALTER TABLE barrios ADD COLUMN seccion TEXT NULL;");
      if (!barrioCols.includes('articulo_ordenanza')) db.exec("ALTER TABLE barrios ADD COLUMN articulo_ordenanza TEXT NULL;");
      if (!barrioCols.includes('superficie_m2')) db.exec("ALTER TABLE barrios ADD COLUMN superficie_m2 REAL NOT NULL DEFAULT 0;");
      if (!barrioCols.includes('observaciones')) db.exec("ALTER TABLE barrios ADD COLUMN observaciones TEXT NULL;");
    }
  } catch {}

  db.exec(schemaSql);
  return db;
}

// Ejecutar si se invoca directamente
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const db = initDatabase();
  console.log('Base de datos inicializada exitosamente en data/calles.db');
  
  // Verificar tablas creadas
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type IN ('table', 'virtual') ORDER BY name").all() as { name: string }[];
  console.log('Tablas y tablas virtuales creadas:');
  for (const t of tables) {
    console.log(` - ${t.name}`);
  }
  db.close();
}
