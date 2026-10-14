import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { GET as getCicloviasGeoJsonRoute } from '../src/app/api/v1/ciclovias/geojson/route.js';
import { getDatabase, closeDatabase } from '../src/lib/db/client.js';

describe('FEAT-012: Capa global de ciclovías bajo demanda y desactivada por defecto', () => {
  after(() => {
    closeDatabase();
  });

  describe('AC-001: Persistencia e ingesta de red ciclable en SQLite', () => {
    test('Tabla ciclovias contiene registros con geometrías y atributos válidos', () => {
      const db = getDatabase();
      const count = (db.prepare('SELECT COUNT(*) as count FROM ciclovias').get() as any).count;
      assert.ok(count >= 50, `Debe contener al menos 50 tramos de ciclovías (encontrados: ${count})`);

      const rows = db.prepare('SELECT id, nombre, tipo, tramo, ubicacion, anio_instalacion, longitud_km, min_x, max_x, min_y, max_y, geojson FROM ciclovias LIMIT 5').all() as any[];
      for (const row of rows) {
        assert.ok(row.id > 0);
        assert.ok(row.nombre.length > 0);
        assert.ok(['CICLOVIA', 'BICISENDA', 'USO_MIXTO'].includes(row.tipo));
        assert.ok(row.min_x >= -56.5 && row.max_x <= -55.5, 'Longitud geográfica válida en Posadas');
        assert.ok(row.min_y >= -28.0 && row.max_y <= -27.0, 'Latitud geográfica válida en Posadas');
        
        const geom = JSON.parse(row.geojson);
        assert.ok(['LineString', 'MultiLineString'].includes(geom.type), 'Geometría debe ser lineal');
        assert.ok(geom.coordinates.length > 0);
      }
    });

    test('Tabla virtual ciclovias_rtree permite indexación espacial por Bounding Box', () => {
      const db = getDatabase();
      const rtreeResults = db.prepare(`
        SELECT r.id, c.nombre, c.tramo
        FROM ciclovias_rtree r
        JOIN ciclovias c ON c.id = r.id
        WHERE r.min_x >= -56.0 AND r.max_x <= -55.8
          AND r.min_y >= -27.5 AND r.max_y <= -27.3
        LIMIT 10
      `).all() as any[];

      assert.ok(rtreeResults.length > 0, 'Debe devolver ciclovías dentro del BBOX de Posadas');
    });
  });

  describe('AC-002: Endpoint REST GET /api/v1/ciclovias/geojson', () => {
    test('Devuelve status 200, headers de caché y FeatureCollection GeoJSON completo', async () => {
      const req = new Request('http://localhost:3000/api/v1/ciclovias/geojson');
      const res = await getCicloviasGeoJsonRoute(req);
      assert.equal(res.status, 200);

      const cacheHeader = res.headers.get('Cache-Control');
      assert.ok(cacheHeader && cacheHeader.includes('public'), 'Debe tener cabecera Cache-Control pública');

      const json = await res.json();
      assert.equal(json.type, 'FeatureCollection');
      assert.ok(Array.isArray(json.features));
      assert.ok(json.features.length >= 50, 'Debe incluir al menos 50 tramos de red ciclable');

      const first = json.features[0];
      assert.equal(first.type, 'Feature');
      assert.ok(first.geometry, 'Feature debe incluir geometría');
      assert.ok(first.geometry.coordinates, 'Geometría debe contener coordenadas');
      assert.ok(first.properties, 'Feature debe contener propiedades');
      assert.ok('id' in first.properties);
      assert.ok('nombre' in first.properties);
      assert.ok('tipo' in first.properties);
      assert.ok('tramo' in first.properties);
      assert.ok('ubicacion' in first.properties);
      assert.ok('anio_instalacion' in first.properties);
      assert.ok('longitud_km' in first.properties);
    });

    test('Filtro opcional por id devuelve exclusivamente la ciclovía solicitada', async () => {
      const allReq = new Request('http://localhost:3000/api/v1/ciclovias/geojson');
      const allRes = await getCicloviasGeoJsonRoute(allReq);
      const allJson = await allRes.json();
      const targetId = allJson.features[0].properties.id;

      const req = new Request(`http://localhost:3000/api/v1/ciclovias/geojson?id=${targetId}`);
      const res = await getCicloviasGeoJsonRoute(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.type, 'FeatureCollection');
      assert.equal(json.features.length, 1);
      assert.equal(json.features[0].properties.id, targetId);
    });

    test('Filtro por búsqueda de texto q filtra por nombre, tramo o ubicación', async () => {
      const req = new Request('http://localhost:3000/api/v1/ciclovias/geojson?q=Haro');
      const res = await getCicloviasGeoJsonRoute(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.ok(json.features.length > 0);
      for (const feat of json.features) {
        const text = `${feat.properties.nombre} ${feat.properties.tramo || ''} ${feat.properties.ubicacion || ''}`.toLowerCase();
        assert.ok(text.includes('haro'), 'Debe coincidir con el criterio de búsqueda');
      }
    });
  });
});
