import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { GET as getStreets } from '../src/app/api/v1/streets/route.js';
import { GET as getStreetDetail } from '../src/app/api/v1/streets/[slug]/route.js';
import { GET as getBarrios } from '../src/app/api/v1/barrios/route.js';
import { closeDatabase } from '../src/lib/db/client.js';

describe('T-002, T-003, T-004: Handlers HTTP de Catálogo y Búsqueda', () => {
  after(() => {
    closeDatabase();
  });

  describe('T-002: GET /api/v1/streets', () => {
    test('Búsqueda por texto devuelve 200 y resultados paginados', async () => {
      const req = new Request('http://localhost:3000/api/v1/streets?q=Jujuy&page=1&limit=10');
      const res = await getStreets(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.ok(json.total > 0);
      assert.equal(json.page, 1);
      assert.equal(json.limit, 10);
      assert.ok(Array.isArray(json.data));
      assert.ok(json.data.length > 0);
      assert.ok(json.data[0].official_name.includes('Jujuy'));
      assert.ok(Array.isArray(json.data[0].barrios), 'Cada calle debe incluir lista de barrios');
    });

    test('Filtro por tipo de vía y ciclovía', async () => {
      const req = new Request('http://localhost:3000/api/v1/streets?road_type=CALLE&has_cycleway=true');
      const res = await getStreets(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.ok(json.total > 0);
      for (const item of json.data) {
        assert.equal(item.road_type, 'CALLE');
        assert.equal(item.has_cycleway, true);
      }
    });

    test('Validación de errores: rechaza limit mayor a 100 con 400 Bad Request', async () => {
      const req = new Request('http://localhost:3000/api/v1/streets?limit=150');
      const res = await getStreets(req);
      assert.equal(res.status, 400);

      const json = await res.json();
      assert.ok(json.error.includes('limit'));
    });

    test('Validación de errores: rechaza page negativo o inválido con 400 Bad Request', async () => {
      const req = new Request('http://localhost:3000/api/v1/streets?page=0');
      const res = await getStreets(req);
      assert.equal(res.status, 400);

      const json = await res.json();
      assert.ok(json.error.includes('page'));
    });
  });

  describe('T-003: GET /api/v1/streets/:slug', () => {
    test('Retorna 200 con traza GeoJSON para una calle existente', async () => {
      // 1. Obtener un slug existente
      const listReq = new Request('http://localhost:3000/api/v1/streets?limit=1');
      const listRes = await getStreets(listReq);
      const listJson = await listRes.json();
      const slug = listJson.data[0].slug;

      // 2. Consultar detalle
      const req = new Request(`http://localhost:3000/api/v1/streets/${slug}`);
      const res = await getStreetDetail(req, { params: { slug } });
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.equal(json.slug, slug);
      assert.ok(json.official_name);
      assert.ok(json.geojson, 'Debe incluir GeoJSON');
      assert.ok(json.geojson.coordinates, 'GeoJSON debe tener coordenadas');
      assert.ok(Array.isArray(json.tramos));
    });

    test('Retorna 404 Not Found para un slug inexistente', async () => {
      const req = new Request('http://localhost:3000/api/v1/streets/slug-que-no-existe-jamás-999');
      const res = await getStreetDetail(req, { params: { slug: 'slug-que-no-existe-jamás-999' } });
      assert.equal(res.status, 404);

      const json = await res.json();
      assert.ok(json.error.includes('No se encontró'));
    });
  });

  describe('T-004: GET /api/v1/barrios', () => {
    test('Retorna 200 con catálogo completo de barrios y chacras', async () => {
      const req = new Request('http://localhost:3000/api/v1/barrios');
      const res = await getBarrios(req);
      assert.equal(res.status, 200);

      const json = await res.json();
      assert.ok(json.total >= 200);
      assert.ok(Array.isArray(json.data));
      assert.ok(json.data[0].id);
      assert.ok(json.data[0].name);
      assert.ok(json.data[0].type);
    });
  });
});
