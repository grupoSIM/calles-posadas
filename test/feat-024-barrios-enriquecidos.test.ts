import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import path from 'node:path';
import { GET as getBarriosGeoJsonRoute } from '../src/app/api/v1/barrios/geojson/route.js';
import { getBarriosGeoJson } from '../src/lib/db/streets.js';
import { getDatabase, closeDatabase } from '../src/lib/db/client.js';

describe('FEAT-024: Ingesta y enriquecimiento de metadatos territoriales y normativos de barrios desde IDE Posadas', () => {
  const db = getDatabase();

  after(() => {
    closeDatabase();
  });

  describe('AC-001: Extracción y esquema de datos enriquecido de barrios', () => {
    test('Tabla barrios cuenta con las columnas territoriales, normativas y métricas', () => {
      const columns = db.prepare('PRAGMA table_info(barrios)').all() as { name: string; type: string }[];
      const colMap = new Map(columns.map(c => [c.name, c.type]));

      assert.ok(colMap.has('delegacion'), 'Columna delegacion debe existir');
      assert.ok(colMap.has('seccion'), 'Columna seccion debe existir');
      assert.ok(colMap.has('articulo_ordenanza'), 'Columna articulo_ordenanza debe existir');
      assert.ok(colMap.has('superficie_m2'), 'Columna superficie_m2 debe existir');
      assert.ok(colMap.has('observaciones'), 'Columna observaciones debe existir');
    });

    test('Existen índices para acelerar búsquedas territoriales por delegación y sección', () => {
      const indexes = db.prepare('PRAGMA index_list(barrios)').all() as { name: string }[];
      const idxNames = indexes.map(i => i.name);

      assert.ok(idxNames.includes('idx_barrios_delegacion'), 'Debe existir idx_barrios_delegacion');
      assert.ok(idxNames.includes('idx_barrios_seccion'), 'Debe existir idx_barrios_seccion');
    });
  });

  describe('AC-002: Normalización toponímica y completitud de atributos', () => {
    test('Cantidad de barrios cargados en base de datos cumple o supera el mínimo requerido (>= 260)', () => {
      const row = db.prepare('SELECT count(*) as count FROM barrios').get() as { count: number };
      assert.ok(row.count >= 260, `Se esperaban >= 260 barrios, encontrados: ${row.count}`);
      assert.equal(row.count, 263, 'Se deben haber ingerido los 263 barrios de la capa geonode:Barrios_SMU0');
    });

    test('Cobertura territorial de al menos 15 delegaciones municipales normalizadas', () => {
      const delegaciones = db.prepare('SELECT DISTINCT delegacion FROM barrios WHERE delegacion IS NOT NULL').all() as { delegacion: string }[];
      assert.ok(delegaciones.length >= 15, `Se esperaban >= 15 delegaciones, encontradas: ${delegaciones.length}`);

      const nombresDelegaciones = delegaciones.map(d => d.delegacion);
      assert.ok(nombresDelegaciones.includes('Las Dolores Norte'), 'Debe incluir Las Dolores Norte');
      assert.ok(nombresDelegaciones.includes('Villa Cabello'), 'Debe incluir Villa Cabello');
      assert.ok(nombresDelegaciones.includes('Santa Rita'), 'Debe incluir Santa Rita');
      assert.ok(nombresDelegaciones.includes('Villa Urquiza'), 'Debe incluir Villa Urquiza');
      assert.ok(nombresDelegaciones.includes('Itaembé Guazú'), 'Debe incluir Itaembé Guazú');
    });

    test('Al menos 200 barrios cuentan con trazabilidad legal a nivel de artículo normativo', () => {
      const row = db.prepare("SELECT count(*) as count FROM barrios WHERE articulo_ordenanza IS NOT NULL AND articulo_ordenanza != ''").get() as { count: number };
      assert.ok(row.count >= 200, `Se esperaban >= 200 barrios con artículo normativo, encontrados: ${row.count}`);
    });

    test('Cálculo de superficie métrica (> 0 m²) para todos los barrios', () => {
      const row = db.prepare('SELECT count(*) as count FROM barrios WHERE superficie_m2 > 0').get() as { count: number };
      const totalRow = db.prepare('SELECT count(*) as count FROM barrios').get() as { count: number };
      assert.equal(row.count, totalRow.count, 'El 100% de los barrios debe tener superficie calculada > 0');
    });

    test('Tipología administrativa categorizada correctamente', () => {
      const rows = db.prepare('SELECT tipo, count(*) as count FROM barrios GROUP BY tipo').all() as { tipo: string; count: number }[];
      const tipos = rows.map(r => r.tipo);

      assert.ok(tipos.includes('BARRIO_OFICIAL'), 'Debe existir tipología BARRIO_OFICIAL');
      assert.ok(tipos.includes('BARRIO_SOCIAL'), 'Debe existir tipología BARRIO_SOCIAL');
      assert.ok(tipos.includes('CHACRA'), 'Debe existir tipología CHACRA');
    });
  });

  describe('AC-003: Endpoint GeoJSON de barrios enriquecido', () => {
    test('GET /api/v1/barrios/geojson expone delegacion, seccion, articulo_ordenanza, superficie_m2 y observaciones', async () => {
      const req = new Request('http://localhost:3000/api/v1/barrios/geojson');
      const res = await getBarriosGeoJsonRoute(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.type, 'FeatureCollection');
      assert.equal(json.features.length, 263);

      const first = json.features[0];
      assert.ok('delegacion' in first.properties, 'Properties debe contener delegacion');
      assert.ok('seccion' in first.properties, 'Properties debe contener seccion');
      assert.ok('articulo_ordenanza' in first.properties, 'Properties debe contener articulo_ordenanza');
      assert.ok('superficie_m2' in first.properties, 'Properties debe contener superficie_m2');
      assert.ok('observaciones' in first.properties, 'Properties debe contener observaciones');
      assert.ok(typeof first.properties.superficie_m2 === 'number');
    });

    test('Filtrado por delegación a través del endpoint o helper de datos', async () => {
      const req = new Request('http://localhost:3000/api/v1/barrios/geojson?delegacion=Villa%20Cabello');
      const res = await getBarriosGeoJsonRoute(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.ok(json.features.length > 0, 'Debe devolver barrios de Villa Cabello');
      for (const feat of json.features) {
        assert.equal(feat.properties.delegacion, 'Villa Cabello');
      }
    });

    test('Filtrado por sección catastral a través del endpoint', async () => {
      const req = new Request('http://localhost:3000/api/v1/barrios/geojson?seccion=012');
      const res = await getBarriosGeoJsonRoute(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.ok(json.features.length > 0, 'Debe devolver barrios de sección 012');
      for (const feat of json.features) {
        assert.equal(feat.properties.seccion, '012');
      }
    });
  });
});
