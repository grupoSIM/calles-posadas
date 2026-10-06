import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('T-001: Esquema DDL SQLite con FTS5 y R*Tree', () => {
  const schemaPath = path.resolve(__dirname, '../scripts/etl/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
  const db = new Database(':memory:');
  db.exec(schemaSql);

  after(() => {
    db.close();
  });

  test('Crea tablas relacionales correctamente', () => {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const names = tables.map(t => t.name);
    assert.ok(names.includes('calles'), 'Debe existir tabla calles');
    assert.ok(names.includes('barrios'), 'Debe existir tabla barrios');
    assert.ok(names.includes('tramos_calle'), 'Debe existir tabla tramos_calle');
    assert.ok(names.includes('calle_barrios'), 'Debe existir tabla calle_barrios');
  });

  test('Tabla virtual FTS5 funciona con trigger de inserción y búsqueda de texto', () => {
    db.prepare(`
      INSERT INTO calles (slug, nombre_oficial, nombre_normalizado, numero_calle, tipo_via, min_x, max_x, min_y, max_y, geojson_traza)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run('av-areco', 'Avenida Lucas Braulio Areco', 'avenida lucas braulio areco', 115, 'AVENIDA', -55.95, -55.90, -27.40, -27.35, '{"type":"LineString","coordinates":[]}');

    // Búsqueda por FTS5 por apellido
    const ftsResults1 = db.prepare(`
      SELECT c.slug, c.nombre_oficial 
      FROM calles_fts f 
      JOIN calles c ON c.id = f.rowid 
      WHERE calles_fts MATCH 'Areco*'
    `).all() as { slug: string; nombre_oficial: string }[];

    assert.equal(ftsResults1.length, 1);
    assert.equal(ftsResults1[0].slug, 'av-areco');

    // Búsqueda FTS5 por número
    const ftsResults2 = db.prepare(`
      SELECT c.slug, c.nombre_oficial 
      FROM calles_fts f 
      JOIN calles c ON c.id = f.rowid 
      WHERE calles_fts MATCH '115'
    `).all() as { slug: string }[];

    assert.equal(ftsResults2.length, 1);
    assert.equal(ftsResults2[0].slug, 'av-areco');
  });

  test('Tabla virtual R*Tree funciona con trigger e indexación espacial de Bounding Box', () => {
    // La calle insertada tiene min_x: -55.95, max_x: -55.90, min_y: -27.40, max_y: -27.35
    // Consulta espacial por ventana de coordenadas (viewport)
    const rtreeResults = db.prepare(`
      SELECT r.id, c.nombre_oficial
      FROM calles_rtree r
      JOIN calles c ON c.id = r.id
      WHERE r.min_x >= -56.0 AND r.max_x <= -55.8
        AND r.min_y >= -27.5 AND r.max_y <= -27.3
    `).all() as { id: number; nombre_oficial: string }[];

    assert.equal(rtreeResults.length, 1);
    assert.equal(rtreeResults[0].nombre_oficial, 'Avenida Lucas Braulio Areco');

    // Consulta fuera de rango no debe devolver resultados
    const fueraDeRango = db.prepare(`
      SELECT r.id
      FROM calles_rtree r
      WHERE r.min_x >= 0.0 AND r.max_x <= 1.0
    `).all();

    assert.equal(fueraDeRango.length, 0);
  });
});
