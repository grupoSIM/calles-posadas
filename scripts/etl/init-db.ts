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
