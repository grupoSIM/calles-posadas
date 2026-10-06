import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);

export function verifyData(dbPath?: string): { success: boolean; details: any } {
  const targetPath = dbPath || path.resolve(process.cwd(), 'data', 'calles.db');
  console.log(`Verificando integridad y consultas en: ${targetPath}`);

  const db = new Database(targetPath, { readonly: true });

  // 1. Conteos de tablas base
  const totalCalles = (db.prepare('SELECT COUNT(*) as count FROM calles').get() as any).count;
  const totalBarrios = (db.prepare('SELECT COUNT(*) as count FROM barrios').get() as any).count;
  const totalTramos = (db.prepare('SELECT COUNT(*) as count FROM tramos_calle').get() as any).count;
  const totalConCiclovia = (db.prepare('SELECT COUNT(*) as count FROM calles WHERE tiene_ciclovia = 1').get() as any).count;

  console.log(`- Calles cargadas: ${totalCalles}`);
  console.log(`- Barrios cargados: ${totalBarrios}`);
  console.log(`- Tramos geométricos: ${totalTramos}`);
  console.log(`- Calles con ciclovía: ${totalConCiclovia}`);

  if (totalCalles === 0 || totalBarrios === 0) {
    throw new Error('Fallo de integridad: No hay calles o barrios cargados en la base.');
  }

  // 2. Comprobar que no hay geometrías nulas o vacías
  const callesSinGeo = (db.prepare("SELECT COUNT(*) as count FROM calles WHERE geojson_traza IS NULL OR geojson_traza = ''").get() as any).count;
  if (callesSinGeo > 0) {
    throw new Error(`Fallo de integridad: ${callesSinGeo} calles tienen geometría nula.`);
  }

  // 3. Probar búsqueda FTS5 de texto y velocidad
  const t0 = performance.now();
  const ftsTest = db.prepare(`
    SELECT c.id, c.nombre_oficial, c.slug, c.numero_calle
    FROM calles_fts f
    JOIN calles c ON c.id = f.rowid
    WHERE calles_fts MATCH 'Jujuy*'
    LIMIT 5
  `).all() as any[];
  const ftsTimeMs = performance.now() - t0;

  console.log(`- Test FTS5 ("Jujuy*"): ${ftsTest.length} resultados en ${ftsTimeMs.toFixed(3)} ms`);
  if (ftsTest.length === 0) {
    throw new Error('Fallo FTS5: Búsqueda de "Jujuy*" no devolvió resultados.');
  }

  // Búsqueda por número
  const ftsNumTest = db.prepare(`
    SELECT c.id, c.nombre_oficial, c.slug, c.numero_calle
    FROM calles_fts f
    JOIN calles c ON c.id = f.rowid
    WHERE calles_fts MATCH '49'
    LIMIT 5
  `).all() as any[];
  console.log(`- Test FTS5 ("49"): ${ftsNumTest.length} resultados`);

  // 4. Probar consulta espacial R*Tree (Viewport de Posadas Centro: aprox [-55.91, -55.88] x [-27.38, -27.35])
  const t1 = performance.now();
  const rtreeTest = db.prepare(`
    SELECT c.id, c.nombre_oficial
    FROM calles_rtree r
    JOIN calles c ON c.id = r.id
    WHERE r.min_x >= -55.95 AND r.max_x <= -55.85
      AND r.min_y >= -27.42 AND r.max_y <= -27.34
    LIMIT 10
  `).all() as any[];
  const rtreeTimeMs = performance.now() - t1;

  console.log(`- Test R*Tree (Bbox Centro): ${rtreeTest.length} calles encontradas en ${rtreeTimeMs.toFixed(3)} ms`);
  if (rtreeTest.length === 0) {
    throw new Error('Fallo R*Tree: Consulta de Bounding Box no devolvió calles.');
  }

  db.close();
  return {
    success: true,
    details: {
      totalCalles,
      totalBarrios,
      totalTramos,
      totalConCiclovia,
      ftsTimeMs,
      rtreeTimeMs
    }
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  try {
    const res = verifyData();
    console.log('✅ Verificación de datos completada exitosamente.');
  } catch (err) {
    console.error('❌ Error de verificación:', err);
    process.exit(1);
  }
}
