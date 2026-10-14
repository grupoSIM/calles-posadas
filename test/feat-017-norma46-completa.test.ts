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

describe('FEAT-017: Completitud toponímica de calles del ejido urbano mediante Ordenanza XVIII - N° 46', () => {

  const rootDir = process.cwd();
  const rawDir = path.join(rootDir, 'data', 'raw');
  const normaPath = path.join(rawDir, 'digesto', 'normas', 'XVIII-46.txt');

  describe('AC-001: Extracción y parseo integral de artículos de la Ordenanza XVIII - N° 46', () => {
    test('Extrae al menos 45 artículos de calles con denominación, tipo de vía y número vial', () => {
      assert.ok(fs.existsSync(normaPath), 'El archivo XVIII-46.txt debe existir');
      const texto = fs.readFileSync(normaPath, 'utf-8');

      const norma: DigestoNormaRaw = {
        id: 'XVIII-46',
        documento_normativo: 'Ordenanza XVIII - N° 46',
        titulo: 'Denominación de Calles del Municipio de Posadas',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%2046.pdf',
        procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
        texto
      };

      const articulos = parseNorma(norma);
      assert.ok(articulos.length >= 45, `Debe extraer al menos 45 artículos parseados (obtenidos: ${articulos.length})`);

      for (const art of articulos) {
        assert.ok(art.numero_articulo > 0, `Artículo debe tener número válido: ${art.articulo}`);
        assert.ok(art.nombre_asignado && art.nombre_asignado.length > 0, `Debe tener nombre asignado: ${art.articulo}`);
        assert.ok(art.tipo_via === 'CALLE' || art.tipo_via === 'PASAJE', `Tipo de vía debe ser CALLE o PASAJE en artículo ${art.articulo}`);
        assert.ok(art.numero_calle !== null && art.numero_calle > 0, `Debe tener número vial: ${art.articulo}`);
        assert.equal(art.documento_normativo, 'Ordenanza XVIII - N° 46');
        assert.ok(art.url_ordenanza.includes('XVIII%20-%2046.pdf'));
      }

      // Verificación de arterias clave
      const art1 = articulos.find(a => a.numero_articulo === 1);
      assert.ok(art1, 'Debe incluir Artículo 1 (Constituyentes Provinciales)');
      assert.equal(art1.numero_calle, 16);

      const favaloro = articulos.find(a => a.numero_articulo === 12);
      assert.ok(favaloro, 'Debe incluir Artículo 12 (Favaloro)');
      assert.equal(favaloro.numero_calle, 138);

      const illia = articulos.find(a => a.numero_articulo === 65);
      assert.ok(illia, 'Debe incluir Artículo 65 (Illia)');
      assert.equal(illia.numero_calle, 161);

      const fores = articulos.find(a => a.numero_articulo === 66);
      assert.ok(fores, 'Debe incluir Artículo 66 (Forés)');
      assert.equal(fores.numero_calle, 199);
    });
  });

  describe('AC-002: Correlación determinística con calles del nomenclador urbano', () => {
    test('Correlaciona determinísticamente calles confirmadas sin falsos positivos', () => {
      const texto = fs.readFileSync(normaPath, 'utf-8');
      const norma: DigestoNormaRaw = {
        id: 'XVIII-46',
        documento_normativo: 'Ordenanza XVIII - N° 46',
        titulo: 'Denominación de Calles del Municipio de Posadas',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%2046.pdf',
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
      assert.ok(correlation.matched.length >= 10, `Debe confirmar al menos 10 calles en correlación directa (obtenidas: ${correlation.matched.length})`);

      // Comprobar trazabilidad legal asignada
      for (const m of correlation.matched) {
        assert.equal(m.entry.estado_normativo, 'CONFIRMADO');
        assert.ok(m.entry.referencia_ordenanza && m.entry.referencia_ordenanza.startsWith('Ordenanza XVIII - N° 46'));
        assert.ok(m.entry.url_ordenanza && m.entry.url_ordenanza.includes('XVIII%20-%2046.pdf'));
      }

      // Verificación directa en base de datos SQLite conforme al método de comprobación de AC-002
      const dbPath = path.join(rootDir, 'data', 'calles.db');
      if (fs.existsSync(dbPath)) {
        const db = new Database(dbPath, { readonly: true });
        const cDb = db.prepare("SELECT count(id) as count FROM calles WHERE tipo_via = 'CALLE' AND referencia_ordenanza LIKE '%XVIII - N° 46%'").get() as any;
        assert.ok(cDb.count >= 40, `Debe alcanzar al menos 40 calles con ordenanza XVIII-46 en calles.db (obtenidas: ${cDb.count})`);
        db.close();
      }
    });
  });

  describe('AC-003: Preservación editorial y no-regresión de datos biográficos', () => {
    test('Conserva las explicaciones históricas preexistentes sin contaminación cruzada', () => {
      const digestoRawPath = path.join(rawDir, 'digesto_calles.json');

      const report = syncDigestoDataset({ offline: true });
      assert.ok(report.articulosParseados >= 70, 'El reporte debe reflejar los artículos de XVIII-4 y XVIII-46');

      const data = JSON.parse(fs.readFileSync(digestoRawPath, 'utf-8'));

      // 1. Calle Favaloro (N° 138) debe tener biografía de René Favaloro
      const favaloro = data.find((e: any) => e.numero_calle === 138 && e.nombre_normalizado.includes('favaloro'));
      assert.ok(favaloro, 'Debe existir Calle René Favaloro');
      assert.ok(favaloro.explicacion.includes('René Favaloro'), 'Favaloro debe tener su propia biografía');
      assert.equal(favaloro.categoria_toponimica, 'CIENCIA_CULTURA');

      // 2. Avenida 17 de Agosto (N° 138) debe conservar su homenaje a San Martín (no Favaloro)
      const av17Agosto = data.find((e: any) => e.numero_calle === 138 && e.nombre_normalizado.includes('17 de agosto'));
      assert.ok(av17Agosto, 'Debe existir Avenida 17 de Agosto');
      assert.ok(av17Agosto.explicacion.includes('inmortalidad del Padre de la Patria'), 'Av. 17 de Agosto debe conservar homenaje a San Martín');
      assert.equal(av17Agosto.categoria_toponimica, 'FECHA_PATRIA');

      // 3. Calle Dr. Arturo Humberto Illia (N° 161) debe tener biografía de Illia (no Frondizi)
      const illia = data.find((e: any) => e.numero_calle === 161 && e.nombre_normalizado.includes('illia'));
      assert.ok(illia, 'Debe existir Calle Illia');
      assert.ok(illia.explicacion.includes('Arturo Umberto Illia') || illia.explicacion.includes('médico y presidente'), 'Illia no debe contaminarse con Frondizi');
      assert.ok(!illia.explicacion.includes('Frondizi'), 'Illia no debe contener texto de Frondizi');

      // 4. Calle Constituyentes Provinciales (N° 16) debe conservar homenaje a la Convención de 1958
      const constituyentes = data.find((e: any) => e.numero_calle === 16 && e.nombre_normalizado.includes('constituyentes'));
      assert.ok(constituyentes, 'Debe existir Calle Constituyentes Provinciales');
      assert.ok(constituyentes.explicacion.includes('Constitución de la Provincia de Misiones'), 'Debe conservar homenaje a la Convención de 1958');

      // 5. Avenida Trincheras de San José (N° 62) debe conservar reseña fundacional
      const trincheras = data.find((e: any) => e.numero_calle === 62 && e.nombre_normalizado.includes('trincheras'));
      assert.ok(trincheras, 'Debe existir Avenida Trincheras de San José');
      assert.ok(trincheras.explicacion.includes('Nombre fundacional histórico de Posadas'), 'Trincheras debe conservar reseña fundacional');

      // 6. Arterias sin reseña propia (ej. Castelli N° 77) no deben heredar biografías espurias
      const castelli = data.find((e: any) => e.nombre_normalizado.includes('castelli'));
      if (castelli) {
        assert.ok(!castelli.explicacion || !castelli.explicacion.includes('Lavalle'), 'Castelli no debe heredar biografía de Lavalle');
      }
    });
  });

  describe('AC-004: Reproducibilidad offline y consistencia del catálogo', () => {
    test('Ejecución reproducible offline actualiza raw y fixtures sin discrepancias', () => {
      const rawPath = path.join(rawDir, 'digesto_calles.json');
      const fixturePath = path.join(rootDir, 'data', 'fixtures', 'digesto_calles.json');

      const report = syncDigestoDataset({ offline: true });
      assert.ok(report.arteriasConfirmadas >= 40);

      const rawContent = fs.readFileSync(rawPath, 'utf-8');
      const fixtureContent = fs.readFileSync(fixturePath, 'utf-8');
      assert.equal(rawContent, fixtureContent, 'raw y fixtures deben ser idénticos tras la sincronización');
    });
  });

});
