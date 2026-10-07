import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { GET as getBarriosGeoJsonRoute } from '../src/app/api/v1/barrios/geojson/route.js';
import { getDatabase, closeDatabase } from '../src/lib/db/client.js';

describe('FEAT-008: Capa interactiva de barrios y enriquecimiento vial', () => {
  after(() => {
    closeDatabase();
  });

  describe('AC-001: Endpoint GET /api/v1/barrios/geojson', () => {
    test('Devuelve 200 y FeatureCollection GeoJSON válido con barrios y chacras', async () => {
      const req = new Request('http://localhost:3000/api/v1/barrios/geojson');
      const res = await getBarriosGeoJsonRoute(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.type, 'FeatureCollection');
      assert.ok(Array.isArray(json.features));
      assert.ok(json.features.length >= 200, 'Debe contener al menos 200 barrios y chacras');

      const first = json.features[0];
      assert.equal(first.type, 'Feature');
      assert.ok(first.geometry, 'Cada feature debe incluir geometría');
      assert.ok(first.geometry.coordinates, 'Geometría debe tener coordenadas');
      assert.ok(first.properties, 'Feature debe contener propiedades');
      assert.ok('id' in first.properties);
      assert.ok('nombre' in first.properties);
      assert.ok('tipo' in first.properties);
      assert.ok('numero_chacra' in first.properties);
      assert.ok('referencia_ordenanza' in first.properties);
    });

    test('Filtro opcional por id devuelve la feature solicitada', async () => {
      const allReq = new Request('http://localhost:3000/api/v1/barrios/geojson');
      const allRes = await getBarriosGeoJsonRoute(allReq);
      const allJson = await allRes.json();
      const targetId = allJson.features[0].properties.id;

      const req = new Request(`http://localhost:3000/api/v1/barrios/geojson?id=${targetId}`);
      const res = await getBarriosGeoJsonRoute(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.type, 'FeatureCollection');
      assert.equal(json.features.length, 1);
      assert.equal(json.features[0].properties.id, targetId);
    });

    test('Filtro por búsqueda de texto q filtra barrios', async () => {
      const req = new Request('http://localhost:3000/api/v1/barrios/geojson?q=Bella');
      const res = await getBarriosGeoJsonRoute(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.ok(json.features.length > 0);
      for (const feat of json.features) {
        assert.ok(
          feat.properties.nombre.toLowerCase().includes('bella'),
          'El nombre debe coincidir con el criterio de búsqueda'
        );
      }
    });
  });

  describe('AC-003: Enriquecimiento de sentidos de circulación y ordenanzas desde IDE', () => {
    test('Avenidas clave con mano única oficial quedan registradas con MANO_UNICA', () => {
      const db = getDatabase();
      const keyAvenues = [
        'Avenida Francisco de Haro',
        'Avenida General Juan Lavalle',
        'Avenida Santa Catalina',
        'Avenida Corrientes',
        'Avenida Padre Jose F. Rademacher',
        'Avenida Centenario',
        'Avenida Tambor de Tacuari',
        'Avenida Lopez y Planes',
        'Avenida Blas Parera'
      ];

      for (const avName of keyAvenues) {
        const row = db.prepare('SELECT nombre_oficial, sentido_circulacion FROM calles WHERE nombre_oficial = ?').get(avName) as any;
        assert.ok(row, `Debe existir la arteria ${avName} en la base de datos`);
        assert.equal(
          row.sentido_circulacion,
          'MANO_UNICA',
          `La arteria ${avName} debe tener sentido_circulacion = 'MANO_UNICA'`
        );
      }
    });

    test('Barrios cuentan con ordenanzas de creación asociadas desde IDE Posadas', () => {
      const db = getDatabase();
      const countRow = db.prepare('SELECT count(*) as count FROM barrios WHERE referencia_ordenanza IS NOT NULL').get() as any;
      assert.ok(countRow.count > 100, 'Debe haber más de 100 barrios con ordenanza de creación enriquecida');
    });
  });
});
