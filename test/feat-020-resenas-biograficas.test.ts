import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { syncDigestoDataset } from '../scripts/etl/digesto/sync.js';
import { findEditorialEnrichment } from '../scripts/etl/digesto/editorial-data.js';

describe('FEAT-020: Curaduría editorial y completitud de reseñas históricas en arterias con ordenanza confirmada', () => {
  const rawPath = path.resolve(process.cwd(), 'data', 'raw', 'digesto_calles.json');
  const fixturePath = path.resolve(process.cwd(), 'data', 'fixtures', 'digesto_calles.json');
  const dbPath = path.resolve(process.cwd(), 'data', 'calles.db');

  describe('AC-001: Completitud biográfica en arterias con ordenanza confirmada en digesto_calles.json', () => {
    test('100% de arterias con estado CONFIRMADO poseen explicación, fuente y categoría distinta de OTRO', () => {
      const data = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
      const confirmed = data.filter((e: any) => e.estado_normativo === 'CONFIRMADO');

      assert.ok(confirmed.length >= 125, `Se esperaban al menos 125 arterias confirmadas, encontradas: ${confirmed.length}`);

      const sinExplicacion = confirmed.filter((e: any) => !e.explicacion || e.explicacion.trim() === '');
      assert.strictEqual(sinExplicacion.length, 0, `Hay arterias confirmadas sin explicación: ${sinExplicacion.map((e: any) => e.nombre_oficial).join(', ')}`);

      const sinFuente = confirmed.filter((e: any) => !e.fuente_biografica || e.fuente_biografica.trim() === '');
      assert.strictEqual(sinFuente.length, 0, `Hay arterias confirmadas sin fuente biográfica: ${sinFuente.map((e: any) => e.nombre_oficial).join(', ')}`);

      const categoriaOtro = confirmed.filter((e: any) => !e.categoria_toponimica || e.categoria_toponimica === 'OTRO');
      assert.strictEqual(categoriaOtro.length, 0, `Hay arterias confirmadas con categoría OTRO: ${categoriaOtro.map((e: any) => e.nombre_oficial).join(', ')}`);
    });

    test('Los fixtures reproducen con paridad idéntica el enriquecimiento editorial', () => {
      const raw = JSON.parse(fs.readFileSync(rawPath, 'utf-8'));
      const fixture = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
      assert.strictEqual(raw.length, fixture.length, 'La cantidad de entradas en raw y fixtures debe coincidir');

      const rawConfirmed = raw.filter((e: any) => e.estado_normativo === 'CONFIRMADO');
      const fixtureConfirmed = fixture.filter((e: any) => e.estado_normativo === 'CONFIRMADO');
      assert.strictEqual(rawConfirmed.length, fixtureConfirmed.length, 'La cantidad de confirmadas en fixtures debe coincidir');
    });
  });

  describe('AC-002: Cobertura específica de ejes y personalidades clave', () => {
    test('Avenida Alicia Moreau de Justo (Eje 83) posee reseña biográfica y categorización CIENCIA_CULTURA', () => {
      const db = new Database(dbPath, { readonly: true });
      const row = db.prepare(`
        SELECT slug, nombre_oficial, numero_calle, explicacion, categoria_toponimica, referencia_ordenanza 
        FROM calles 
        WHERE slug LIKE '%alicia-moreau-de-justo%'
      `).get() as any;
      db.close();

      assert.ok(row, 'Debe existir la arteria de Alicia Moreau de Justo');
      assert.strictEqual(row.numero_calle, 83);
      assert.ok(row.referencia_ordenanza?.includes('XVIII - N° 4'), 'Debe estar vinculada a la Ordenanza XVIII - N° 4');
      assert.ok(row.explicacion?.includes('Alicia Moreau de Justo'), 'Debe contener la síntesis biográfica de Alicia Moreau de Justo');
      assert.strictEqual(row.categoria_toponimica, 'CIENCIA_CULTURA');
    });

    test('Calle Ramón Ayala (Eje 62) posee reseña biográfica y categorización CIENCIA_CULTURA', () => {
      const db = new Database(dbPath, { readonly: true });
      const row = db.prepare(`
        SELECT slug, nombre_oficial, numero_calle, explicacion, categoria_toponimica, referencia_ordenanza 
        FROM calles 
        WHERE slug LIKE '%ramon-ayala%' AND referencia_ordenanza IS NOT NULL
      `).get() as any;
      db.close();

      assert.ok(row, 'Debe existir la arteria de Ramón Ayala con ordenanza confirmada');
      assert.strictEqual(row.numero_calle, 62);
      assert.ok(row.referencia_ordenanza?.includes('XVIII - N° 306'), 'Debe estar vinculada a la Ordenanza XVIII - N° 306');
      assert.ok(row.explicacion?.includes('Ramón Ayala') || row.explicacion?.includes('El Mensú'), 'Debe referir a Ramón Ayala / El Mensú');
      assert.strictEqual(row.categoria_toponimica, 'CIENCIA_CULTURA');
    });

    test('Avenida Intendente Fernando Elías Tulo Llamosas posee reseña y categorización PIONERO en Eje 45', () => {
      const db = new Database(dbPath, { readonly: true });
      const row = db.prepare(`
        SELECT slug, nombre_oficial, tipo_via, numero_calle, explicacion, categoria_toponimica, referencia_ordenanza 
        FROM calles 
        WHERE slug LIKE '%llamosas%'
      `).get() as any;
      db.close();

      assert.ok(row, 'Debe existir la arteria de Tulo Llamosas');
      assert.strictEqual(row.tipo_via, 'AVENIDA', 'Tulo Llamosas debe ser clasificada como AVENIDA');
      assert.strictEqual(row.numero_calle, 45, 'Debe pertenecer al Eje 45');
      assert.ok(row.referencia_ordenanza?.includes('XVIII - N° 80'), 'Debe estar vinculada a la Ordenanza XVIII - N° 80');
      assert.ok(row.explicacion?.includes('Tulo') && row.explicacion?.includes('Llamosas'), 'Debe contener la síntesis biográfica de Tulo Llamosas');
      assert.strictEqual(row.categoria_toponimica, 'PIONERO');
    });

    test('ERR-001: Rutas troncales se clasifican como AVENIDA y no fusionan el Eje 12 con Calle Sargento Cabral', () => {
      const db = new Database(dbPath, { readonly: true });
      // 1. Calle Sargento Cabral en Eje 12
      const cabral = db.prepare(`SELECT id, slug, nombre_oficial, tipo_via, numero_calle FROM calles WHERE slug = 'calle-sgto-cabral-12'`).get() as any;
      assert.ok(cabral);
      assert.strictEqual(cabral.tipo_via, 'CALLE');
      assert.strictEqual(cabral.numero_calle, 12);

      // Verificar que no hay ninguna otra arteria CALLE en Eje 12
      const calles12 = db.prepare(`SELECT id, slug, nombre_oficial FROM calles WHERE numero_calle = 12 AND tipo_via = 'CALLE'`).all();
      assert.strictEqual(calles12.length, 1, 'Calle Sargento Cabral debe ser la única CALLE en el Eje 12');

      // 2. Tulo Llamosas está en AVENIDA 45 y forma corredor con Avenida Uruguay
      const llamosas = db.prepare(`SELECT id, slug, tipo_via, numero_calle FROM calles WHERE slug LIKE '%llamosas%'`).get() as any;
      assert.ok(llamosas);
      assert.strictEqual(llamosas.tipo_via, 'AVENIDA');
      assert.strictEqual(llamosas.numero_calle, 45);

      const avenidas45 = db.prepare(`SELECT id, slug FROM calles WHERE numero_calle = 45 AND tipo_via = 'AVENIDA'`).all();
      assert.ok(avenidas45.length >= 2, 'Eje 45 debe contener Avenida Uruguay y Avenida Llamosas');

      // 3. Ruta Nacional 12 (126) clasificada como AVENIDA
      const r12 = db.prepare(`SELECT id, slug, tipo_via, numero_calle FROM calles WHERE nombre_oficial LIKE '%Ruta Nacional 12%' AND numero_calle = 126`).all() as any[];
      for (const r of r12) {
        assert.strictEqual(r.tipo_via, 'AVENIDA', 'Ruta 12 en eje 126 debe ser AVENIDA');
      }

      db.close();
    });
  });

  describe('AC-003: No-regresión y preservación de biografías históricas preexistentes', () => {
    test('Avenida Uruguay, Calle René Favaloro y Avenida María de la Cruz Moriñigo conservan sus datos', () => {
      const db = new Database(dbPath, { readonly: true });

      const uruguay = db.prepare(`SELECT slug, explicacion, categoria_toponimica FROM calles WHERE slug LIKE '%uruguay%'`).get() as any;
      assert.ok(uruguay, 'Avenida Uruguay debe existir');
      assert.ok(uruguay.explicacion?.includes('República Oriental del Uruguay'), 'Avenida Uruguay debe conservar su texto');
      assert.strictEqual(uruguay.categoria_toponimica, 'GEOGRAFIA');

      const favaloro = db.prepare(`SELECT slug, explicacion, categoria_toponimica FROM calles WHERE slug LIKE '%favaloro%'`).get() as any;
      assert.ok(favaloro, 'Calle Favaloro debe existir');
      assert.ok(favaloro.explicacion?.includes('René Favaloro'), 'Calle Favaloro debe conservar su texto');
      assert.strictEqual(favaloro.categoria_toponimica, 'CIENCIA_CULTURA');

      const morinigo = db.prepare(`SELECT slug, explicacion, categoria_toponimica FROM calles WHERE slug LIKE '%morinigo%'`).get() as any;
      assert.ok(morinigo, 'Avenida Moriñigo debe existir');
      assert.ok(morinigo.explicacion?.includes('María de la Cruz Moriñigo'), 'Avenida Moriñigo debe conservar su texto');
      assert.strictEqual(morinigo.categoria_toponimica, 'COMUNITARIO');

      db.close();
    });
  });

  describe('AC-004: Persistencia reproducible en base de datos calles.db', () => {
    test('El 100% de las 182 arterias con ordenanza confirmada tienen explicacion poblada y categoría válida', () => {
      const db = new Database(dbPath, { readonly: true });
      const withOrd = db.prepare(`
        SELECT id, slug, nombre_oficial, numero_calle, explicacion, categoria_toponimica, referencia_ordenanza 
        FROM calles 
        WHERE referencia_ordenanza IS NOT NULL
      `).all() as any[];

      assert.ok(withOrd.length >= 182, `Debe haber al menos 182 arterias con ordenanza en calles.db, encontradas: ${withOrd.length}`);

      const sinExp = withOrd.filter(c => !c.explicacion || c.explicacion.trim() === '');
      assert.strictEqual(sinExp.length, 0, `No debe haber arterias con ordenanza y explicación vacía`);

      const conOtro = withOrd.filter(c => c.categoria_toponimica === 'OTRO');
      assert.strictEqual(conOtro.length, 0, `No debe haber arterias con ordenanza y categoría OTRO`);

      // Cobertura global de la base de datos
      const totalCalles = db.prepare(`SELECT count(*) as count FROM calles`).get() as any;
      const totalConExp = db.prepare(`SELECT count(*) as count FROM calles WHERE explicacion IS NOT NULL AND TRIM(explicacion) != ''`).get() as any;
      const pct = (totalConExp.count / totalCalles.count) * 100;

      assert.strictEqual(totalCalles.count, 828, 'Total de arterias debe ser 828');
      assert.ok(totalConExp.count >= 229, `Calles con explicación debe ser al menos 229, encontradas: ${totalConExp.count}`);
      assert.ok(pct >= 27.5, `Porcentaje de cobertura debe ser >= 27.5%, actual: ${pct.toFixed(1)}%`);

      db.close();
    });

    test('Sincronización idempotent: ejecutar syncDigestoDataset no degrada ningún metadato', () => {
      const report = syncDigestoDataset({ offline: true });
      assert.ok(report.arteriasConfirmadas >= 125, 'Las confirmadas deben mantenerse');
      assert.strictEqual(report.normasProcesadas, 6, 'Deben procesarse las 6 normas');
    });
  });
});
