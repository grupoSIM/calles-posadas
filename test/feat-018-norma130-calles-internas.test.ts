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

describe('FEAT-018: Ingesta modular de calles internas y pasajes de chacras mediante Ordenanza XVIII - N° 130', () => {

  const rootDir = process.cwd();
  const rawDir = path.join(rootDir, 'data', 'raw');
  const normaPath = path.join(rawDir, 'digesto', 'normas', 'XVIII-130.txt');

  describe('AC-001: Extracción y parseo integral de artículos de la Ordenanza XVIII - N° 130', () => {
    test('Extrae al menos 70 artículos de calles internas y pasajes con denominación, tipo de vía y número vial', () => {
      assert.ok(fs.existsSync(normaPath), 'El archivo XVIII-130.txt debe existir');
      const texto = fs.readFileSync(normaPath, 'utf-8');

      const norma: DigestoNormaRaw = {
        id: 'XVIII-130',
        documento_normativo: 'Ordenanza XVIII - N° 130',
        titulo: 'Denominaciones de Barrios y Calles Internas del Municipio de Posadas',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/ORDENANZA%20XVIII%20-%20N%C2%BA%20130%207ma%202019.pdf',
        procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
        texto
      };

      const articulos = parseNorma(norma);
      assert.ok(articulos.length >= 70, `Debe extraer al menos 70 artículos toponímicos (obtenidos: ${articulos.length})`);

      for (const art of articulos) {
        assert.ok(art.numero_articulo > 0, `Artículo debe tener número válido: ${art.articulo}`);
        assert.ok(art.nombre_asignado && art.nombre_asignado.length > 0, `Debe tener nombre asignado: ${art.articulo}`);
        assert.ok(art.tipo_via === 'CALLE' || art.tipo_via === 'PASAJE', `Tipo de vía debe ser CALLE o PASAJE en ${art.articulo}`);
        assert.ok(art.numero_calle !== null && art.numero_calle > 0, `Debe tener número vial: ${art.articulo}`);
        assert.equal(art.documento_normativo, 'Ordenanza XVIII - N° 130');
        assert.ok(art.url_ordenanza.includes('130'));
      }

      // Verificación de arterias clave
      const art20 = articulos.find(a => a.numero_articulo === 20);
      assert.ok(art20, 'Debe incluir Artículo 20 (Julio César Sánchez Ratti)');
      assert.equal(art20.numero_calle, 22);

      const art65 = articulos.find(a => a.numero_articulo === 65);
      assert.ok(art65, 'Debe incluir Artículo 65 (Los Pensamientos)');
      assert.equal(art65.numero_calle, 23);

      const art66 = articulos.find(a => a.numero_articulo === 66);
      assert.ok(art66, 'Debe incluir Artículo 66 (Los Girasoles)');
      assert.equal(art66.numero_calle, 25);

      const art67 = articulos.find(a => a.numero_articulo === 67);
      assert.ok(art67, 'Debe incluir Artículo 67 (Estrella Federal)');
      assert.equal(art67.numero_calle, 27);

      const art68 = articulos.find(a => a.numero_articulo === 68);
      assert.ok(art68, 'Debe incluir Artículo 68 (Los Jazmines)');
      assert.equal(art68.numero_calle, 27);
    });
  });

  describe('AC-002: Soporte de sufijos alfanuméricos y tipo de vía sin truncamiento', () => {
    test('Parsea arterias con sufijos literales sin colisiones ni truncamiento erróneo', () => {
      const texto = fs.readFileSync(normaPath, 'utf-8');
      const norma: DigestoNormaRaw = {
        id: 'XVIII-130',
        documento_normativo: 'Ordenanza XVIII - N° 130',
        titulo: 'Denominaciones de Barrios y Calles Internas del Municipio de Posadas',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/ORDENANZA%20XVIII%20-%20N%C2%BA%20130%207ma%202019.pdf',
        procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
        texto
      };

      const articulos = parseNorma(norma);

      // Comprobar que artículos con sufijos en texto original se capturaron
      const art20 = articulos.find(a => a.numero_articulo === 20);
      assert.ok(art20 && art20.texto_original.includes('22a'));

      const art65 = articulos.find(a => a.numero_articulo === 65);
      assert.ok(art65 && art65.texto_original.includes('23a'));

      const art68 = articulos.find(a => a.numero_articulo === 68);
      assert.ok(art68 && art68.texto_original.includes('27a'));

      const art70 = articulos.find(a => a.numero_articulo === 70);
      assert.ok(art70 && art70.texto_original.includes('29a'));

      const art75 = articulos.find(a => a.numero_articulo === 75);
      assert.ok(art75 && art75.texto_original.includes('35a'));
    });
  });

  describe('AC-003: Correlación determinística y no-regresión editorial', () => {
    test('Correlaciona arterias de XVIII-130 y preserva explicaciones previas sin contaminación', () => {
      const texto = fs.readFileSync(normaPath, 'utf-8');
      const norma: DigestoNormaRaw = {
        id: 'XVIII-130',
        documento_normativo: 'Ordenanza XVIII - N° 130',
        titulo: 'Denominaciones de Barrios y Calles Internas del Municipio de Posadas',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/ORDENANZA%20XVIII%20-%20N%C2%BA%20130%207ma%202019.pdf',
        procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
        texto
      };

      const articulos = parseNorma(norma);
      const callesData = JSON.parse(fs.readFileSync(path.join(rawDir, 'calles.json'), 'utf-8'));

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

      const correlation = correlateNormasWithStreets(articulos, referenceStreets);
      assert.ok(correlation.matched.length >= 50, `Debe correlacionar al menos 50 arterias de XVIII-130 (obtenidas: ${correlation.matched.length})`);

      for (const m of correlation.matched) {
        assert.equal(m.entry.estado_normativo, 'CONFIRMADO');
        assert.ok(m.entry.referencia_ordenanza && m.entry.referencia_ordenanza.startsWith('Ordenanza XVIII - N° 130'));
      }

      // No-regresión editorial: ejecutar sync y verificar conservación intacta
      const report = syncDigestoDataset({ offline: true });
      assert.ok(report.arteriasConfirmadas >= 110, `Debe superar 110 arterias confirmadas (obtenidas: ${report.arteriasConfirmadas})`);

      const rawDigestoPath = path.join(rawDir, 'digesto_calles.json');
      const digestoEntries: any[] = JSON.parse(fs.readFileSync(rawDigestoPath, 'utf-8'));

      // 1. Dr. René Favaloro (debe conservar explicación médica y Ordenanza XVIII - N° 46)
      const favaloro = digestoEntries.find(e => e.nombre_normalizado.includes('favaloro'));
      assert.ok(favaloro, 'Favaloro debe existir');
      assert.ok(favaloro.explicacion.includes('médico'), 'Favaloro debe preservar su reseña biográfica médica');
      assert.equal(favaloro.documento_normativo, 'Ordenanza XVIII - N° 46');

      // 2. Constituyentes Provinciales (debe conservar Ordenanza XVIII - N° 46)
      const constituyentes = digestoEntries.find(e => e.nombre_normalizado === 'calle constituyentes provinciales');
      assert.ok(constituyentes, 'Constituyentes debe existir');
      assert.ok(constituyentes.explicacion.includes('Constitución'), 'Constituyentes debe preservar su reseña');
      assert.equal(constituyentes.documento_normativo, 'Ordenanza XVIII - N° 46');

      // 3. Dr. Arturo Humberto Illia (debe conservar Ordenanza XVIII - N° 46)
      const illia = digestoEntries.find(e => e.nombre_normalizado.includes('illia'));
      assert.ok(illia, 'Illia debe existir');
      assert.ok(illia.explicacion.includes('presidente'), 'Illia debe preservar su reseña presidencial');
      assert.equal(illia.documento_normativo, 'Ordenanza XVIII - N° 46');

      // 4. Avenida República Oriental del Uruguay (debe conservar Ordenanza XVIII - N° 4)
      const uruguay = digestoEntries.find(e => e.nombre_normalizado === 'avenida uruguay');
      assert.ok(uruguay, 'Uruguay debe existir');
      assert.equal(uruguay.documento_normativo, 'Ordenanza XVIII - N° 4');
    });
  });

  describe('AC-004: Reproducibilidad offline y consistencia del catálogo', () => {
    test('Regenera raw y fixtures offline idénticamente sin discrepancias', () => {
      const fixturesDir = path.join(rootDir, 'data', 'fixtures');
      const rawFile = path.join(rawDir, 'digesto_calles.json');
      const fixtureFile = path.join(fixturesDir, 'digesto_calles.json');

      const report = syncDigestoDataset({ offline: true });
      assert.ok(report.normasProcesadas >= 3, 'Debe procesar al menos las 3 normas consolidadas');
      assert.ok(report.articulosParseados >= 180, 'Debe parsear al menos 180 artículos en total');

      const rawContent = fs.readFileSync(rawFile, 'utf-8');
      const fixtureContent = fs.readFileSync(fixtureFile, 'utf-8');
      assert.equal(rawContent, fixtureContent, 'raw y fixtures deben ser idénticos tras la sincronización');
    });
  });

  describe('AC-005: Integridad técnica y consistencia en SQLite', () => {
    test('calles.db refleja las arterias confirmadas con Ordenanza XVIII - N° 130', () => {
      const dbPath = path.join(rootDir, 'data', 'calles.db');
      assert.ok(fs.existsSync(dbPath), 'calles.db debe existir');
      const db = new Database(dbPath, { readonly: true });

      const norma130Rows = db.prepare(`
        SELECT COUNT(*) as count FROM calles
        WHERE referencia_ordenanza LIKE 'Ordenanza XVIII - N° 130%'
      `).get() as { count: number };

      assert.ok(norma130Rows.count >= 40, `Debe haber al menos 40 arterias con XVIII-130 en calles.db (obtenidas: ${norma130Rows.count})`);

      // Verificar arteria representativa: Calle J. C. Sanchez Ratti
      const sanchezRatti = db.prepare(`
        SELECT nombre_oficial, numero_calle, referencia_ordenanza, url_ordenanza
        FROM calles
        WHERE nombre_normalizado LIKE '%sanchez ratti%'
      `).get() as any;

      assert.ok(sanchezRatti, 'Sanchez Ratti debe existir en la BD');
      assert.ok(sanchezRatti.referencia_ordenanza.includes('Ordenanza XVIII - N° 130'), 'Debe tener ordenanza XVIII-130');
      assert.ok(sanchezRatti.url_ordenanza.includes('130'), 'Debe tener URL oficial de la ordenanza');

      db.close();
    });
  });

});
