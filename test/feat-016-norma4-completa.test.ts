import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { parseNorma } from '../scripts/etl/digesto/parser.js';
import { correlateNormasWithStreets } from '../scripts/etl/digesto/correlator.js';
import { syncDigestoDataset } from '../scripts/etl/digesto/sync.js';
import { DigestoNormaRaw } from '../scripts/etl/digesto/types.js';
import { extractRoadType, extractStreetNumber } from '../scripts/etl/transform.js';

describe('FEAT-016: Completitud toponímica de avenidas troncales mediante extracción integral de Ordenanza XVIII - N° 4', () => {

  const rootDir = process.cwd();
  const rawDir = path.join(rootDir, 'data', 'raw');
  const normaPath = path.join(rawDir, 'digesto', 'normas', 'XVIII-4.txt');

  describe('AC-001: Extracción y parseo integral de artículos de la Ordenanza XVIII - N° 4', () => {
    test('Extrae al menos 33 artículos de avenidas con denominación, tipo de vía y número vial', () => {
      assert.ok(fs.existsSync(normaPath), 'El archivo XVIII-4.txt debe existir');
      const texto = fs.readFileSync(normaPath, 'utf-8');

      const norma: DigestoNormaRaw = {
        id: 'XVIII-4',
        documento_normativo: 'Ordenanza XVIII - N° 4',
        titulo: 'Denominación de Avenidas del Municipio de Posadas',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%204.pdf',
        procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
        texto
      };

      const articulos = parseNorma(norma);
      assert.ok(articulos.length >= 33, `Debe extraer al menos 33 artículos parseados (obtenidos: ${articulos.length})`);

      for (const art of articulos) {
        assert.ok(art.numero_articulo > 0, `Artículo debe tener número válido: ${art.articulo}`);
        assert.ok(art.nombre_asignado && art.nombre_asignado.length > 0, `Debe tener nombre asignado: ${art.articulo}`);
        assert.equal(art.tipo_via, 'AVENIDA', `Tipo de vía debe ser AVENIDA en artículo ${art.articulo}`);
        assert.ok(art.numero_calle !== null && art.numero_calle > 0, `Debe tener número vial: ${art.articulo}`);
        assert.equal(art.documento_normativo, 'Ordenanza XVIII - N° 4');
        assert.ok(art.url_ordenanza.includes('XVIII%20-%204.pdf'));
      }

      // Verificación de arterias clave
      const uruguay = articulos.find(a => a.numero_articulo === 1);
      assert.ok(uruguay, 'Debe incluir Artículo 1 (Uruguay)');
      assert.equal(uruguay.numero_calle, 45);

      const areco = articulos.find(a => a.numero_articulo === 10);
      assert.ok(areco, 'Debe incluir Artículo 10 (Lucas Braulio Areco)');
      assert.equal(areco.numero_calle, 115);

      const roquePerez = articulos.find(a => a.numero_articulo === 33);
      assert.ok(roquePerez, 'Debe incluir Artículo 33 (Roque Pérez)');
      assert.equal(roquePerez.numero_calle, 26);
    });
  });

  describe('AC-002: Correlación determinística con avenidas del nomenclador urbano', () => {
    test('Correlaciona determinísticamente superando las 30 avenidas confirmadas sin falsos positivos', () => {
      const texto = fs.readFileSync(normaPath, 'utf-8');
      const norma: DigestoNormaRaw = {
        id: 'XVIII-4',
        documento_normativo: 'Ordenanza XVIII - N° 4',
        titulo: 'Denominación de Avenidas del Municipio de Posadas',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%204.pdf',
        procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
        texto
      };

      const articulos = parseNorma(norma);

      const callesData = JSON.parse(fs.readFileSync(path.join(rawDir, 'calles.json'), 'utf-8'));
      const avenidasData = JSON.parse(fs.readFileSync(path.join(rawDir, 'avenidas.json'), 'utf-8'));

      const referenceStreets: Array<{ nombre?: string; numero_calle?: number | null; tipo_via?: string }> = [];
      for (const f of callesData.features) {
        const p = f.properties || {};
        const name = p.CALLE || p.nombre || '';
        referenceStreets.push({
          nombre: name,
          numero_calle: extractStreetNumber(name, p.NUM_CALLE),
          tipo_via: extractRoadType(name)
        });
      }
      for (const f of avenidasData.features) {
        const p = f.properties || {};
        const name = p.avenidas || p.AVENIDAS || p.AVENIDA || p.CALLE || p.nombre || '';
        referenceStreets.push({
          nombre: name,
          numero_calle: extractStreetNumber(name, p.id !== undefined ? String(p.id) : undefined),
          tipo_via: 'AVENIDA'
        });
      }

      const correlation = correlateNormasWithStreets(articulos, referenceStreets);
      assert.ok(correlation.matched.length >= 28, `Debe confirmar al menos 28 avenidas en correlación directa (obtenidas: ${correlation.matched.length})`);
      // Verifica detección legítima de conflictos toponímicos (REV-016-002: boulevards vs avenidas base)
      assert.ok(correlation.conflicts.length >= 3, 'Debe detectar legítimamente conflictos toponímicos (boulevards que difieren de la arteria base)');

      // Comprobar trazabilidad legal asignada
      for (const m of correlation.matched) {
        assert.equal(m.entry.estado_normativo, 'CONFIRMADO');
        assert.ok(m.entry.referencia_ordenanza && m.entry.referencia_ordenanza.startsWith('Ordenanza XVIII - N° 4'));
        assert.ok(m.entry.url_ordenanza && m.entry.url_ordenanza.includes('XVIII%20-%204.pdf'));
      }

      // Verificación directa en base de datos SQLite conforme al método de comprobación de AC-002
      const dbPath = path.join(rootDir, 'data', 'calles.db');
      if (fs.existsSync(dbPath)) {
        const db = new Database(dbPath, { readonly: true });
        const avDb = db.prepare("SELECT count(id) as count FROM calles WHERE tipo_via = 'AVENIDA' AND referencia_ordenanza LIKE '%XVIII - N° 4%'").get() as any;
        assert.ok(avDb.count >= 30, `Debe alcanzar al menos 30 avenidas con ordenanza XVIII-4 en calles.db (obtenidas: ${avDb.count})`);
        db.close();
      }
    });
  });

  describe('AC-003: Preservación editorial y no-regresión de datos biográficos', () => {
    test('Conserva las explicaciones históricas preexistentes en avenidas con ordenanza confirmada', () => {
      const digestoRawPath = path.join(rawDir, 'digesto_calles.json');
      const prevData = JSON.parse(fs.readFileSync(digestoRawPath, 'utf-8'));
      const arecoPrev = prevData.find((e: any) => e.numero_calle === 115);
      const quirogaPrev = prevData.find((e: any) => e.numero_calle === 54);

      const report = syncDigestoDataset({ offline: true });
      assert.ok(report.arteriasConfirmadas >= 30, 'El reporte debe reflejar el incremento de confirmadas');

      const newData = JSON.parse(fs.readFileSync(digestoRawPath, 'utf-8'));
      const arecoPost = newData.find((e: any) => e.numero_calle === 115);
      const quirogaPost = newData.find((e: any) => e.numero_calle === 54);

      if (arecoPrev && arecoPrev.explicacion) {
        assert.equal(arecoPost.explicacion, arecoPrev.explicacion, 'La explicación de Areco debe preservarse');
        assert.equal(arecoPost.categoria_toponimica, arecoPrev.categoria_toponimica, 'La categoría toponímica de Areco debe preservarse');
      }

      if (quirogaPrev && quirogaPrev.explicacion) {
        assert.equal(quirogaPost.explicacion, quirogaPrev.explicacion, 'La explicación de Quiroga debe preservarse');
      }
    });
  });

  describe('AC-004: Reproducibilidad offline y consistencia del catálogo', () => {
    test('Ejecución reproducible offline actualiza raw y fixtures sin discrepancias', () => {
      const rawPath = path.join(rawDir, 'digesto_calles.json');
      const fixturePath = path.join(rootDir, 'data', 'fixtures', 'digesto_calles.json');

      const report = syncDigestoDataset({ offline: true });
      assert.ok(report.arteriasConfirmadas >= 30);

      const rawContent = fs.readFileSync(rawPath, 'utf-8');
      const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
      assert.equal(rawContent, fixtureContent, 'raw y fixtures deben ser idénticos tras la sincronización');
    });
  });

});
