import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { transformCalles, findDigestoEntry, NormalizedCalle } from '../scripts/etl/transform.js';
import { searchStreets, getStreetBySlug } from '../src/lib/db/streets.js';
import { GET as getStreetDetail } from '../src/app/api/v1/streets/[slug]/route.js';
import { closeDatabase } from '../src/lib/db/client.js';

describe('FEAT-011: Autoridad toponímica canónica del Digesto Municipal y resolución de alias', () => {
  after(() => {
    closeDatabase();
  });

  describe('AC-001: Prevalencia toponímica canónica del Digesto Municipal en ETL', () => {
    test('Arteria adopta el nombre oficial canónico del Digesto prevaleciendo sobre la etiqueta de la IDE', () => {
      const rawFeatures = {
        features: [
          {
            type: 'Feature',
            id: 'calle-areco-raw',
            geometry: {
              type: 'LineString',
              coordinates: [[-55.91, -27.38], [-55.91, -27.39]]
            },
            properties: {
              CALLE: 'AVENIDA ARECO',
              NUM_CALLE: '(115)'
            }
          }
        ]
      };

      const sampleDigesto = [
        {
          nombre_oficial: 'Avenida Lucas Braulio Areco',
          nombre_normalizado: 'avenida lucas braulio areco',
          numero_calle: 115,
          referencia_ordenanza: 'Ordenanza XVIII - N° 4, Art. 10',
          url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%204.pdf',
          categoria_toponimica: 'CIENCIA_CULTURA',
          explicacion: 'Músico y compositor misionero.'
        }
      ];

      const res = transformCalles(rawFeatures as any, [], { features: [] }, undefined, undefined, sampleDigesto);
      assert.equal(res.length, 1);
      const calle = res[0];

      // Debe adoptar el nombre del Digesto
      assert.equal(calle.nombreOficial, 'Avenida Lucas Braulio Areco');
      assert.equal(calle.slug, 'avenida-lucas-braulio-areco-115');
      // Debe incluir la etiqueta de la IDE como alias
      assert.ok(calle.aliases.includes('Avenida Areco'), 'Avenida Areco debe ser un alias');
      assert.ok(calle.aliases.includes('Avenida 115') || calle.aliases.includes('Av. 115'));
    });
  });

  describe('AC-002: Consolidación de tramos numéricos bajo la arteria toponímica nominada', () => {
    test('Unifica tramos numéricos de la IDE (Avenida 107) con la arteria nominada (Avenida Zapiola)', () => {
      const rawFeatures = {
        features: [
          {
            type: 'Feature',
            id: 'zapiola-raw',
            geometry: {
              type: 'LineString',
              coordinates: [[-55.92, -27.36], [-55.92, -27.37]]
            },
            properties: {
              avenidas: 'AVENIDA ZAPIOLA(107)',
              id: 107
            }
          },
          {
            type: 'Feature',
            id: 'num-107-raw',
            geometry: {
              type: 'LineString',
              coordinates: [[-55.92, -27.37], [-55.92, -27.38]]
            },
            properties: {
              avenidas: 'AVENIDA 107',
              id: 107
            }
          }
        ]
      };

      const sampleDigesto = [
        {
          nombre_oficial: 'Avenida Brigadier General Jose Matias Zapiola',
          nombre_normalizado: 'avenida brigadier general jose matias zapiola',
          numero_calle: 107,
          referencia_ordenanza: 'Ordenanza XVIII - N° 4, Art. 9',
          url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%204.pdf',
          categoria_toponimica: 'PROCER',
          explicacion: 'Militar y político patriota argentino.'
        }
      ];

      const res = transformCalles({ features: [] }, [], { features: [] }, rawFeatures as any, undefined, sampleDigesto);
      
      // No debe quedar Avenida 107 como ficha separada
      assert.equal(res.length, 1, 'Debe consolidar en 1 sola arteria');
      const zapiola = res[0];
      assert.equal(zapiola.nombreOficial, 'Avenida Brigadier General Jose Matias Zapiola');
      assert.equal(zapiola.tramos.length, 2, 'Debe fusionar los tramos de ambas features');
      assert.ok(zapiola.aliases.includes('Avenida 107'), 'Avenida 107 debe registrarse como alias');
    });
  });

  describe('AC-003: Persistencia e indexación de alias en SQLite y FTS5', () => {
    test('Búsqueda resuelve arteria canónica al buscar por alias de la IDE ("107", "Areco", "Vivanco")', () => {
      // 1. Búsqueda por alias "Jorge Eduardo Vivanco" (nombre completo de IDE pero la ordenanza es "Avenida Vivanco")
      const resVivanco = searchStreets({ q: 'Jorge Eduardo Vivanco' });
      assert.ok(resVivanco.total > 0);
      assert.equal(resVivanco.data[0].official_name, 'Avenida Vivanco');

      // 2. Búsqueda por alias "107"
      const res107 = searchStreets({ q: '107' });
      assert.ok(res107.total > 0);
      const foundZapiola = res107.data.find(d => d.official_name.includes('Zapiola'));
      assert.ok(foundZapiola, 'Debe resolver Zapiola al buscar por el número 107');

      // 3. Búsqueda por alias "Areco"
      const resAreco = searchStreets({ q: 'Areco' });
      assert.ok(resAreco.total > 0);
      assert.equal(resAreco.data[0].official_name, 'Avenida Lucas Braulio Areco');
    });
  });

  describe('AC-004: Exposición de alias en contrato de API (GET /api/v1/streets/:slug)', () => {
    test('getStreetBySlug y endpoint HTTP entregan arreglo de aliases limpio', async () => {
      // getStreetBySlug
      const detail = getStreetBySlug('avenida-lucas-braulio-areco-115');
      assert.ok(detail, 'Debe existir Areco');
      assert.ok(Array.isArray(detail.aliases), 'Debe incluir propiedad aliases como array');
      assert.ok(detail.aliases.length > 0, 'Debe tener al menos un alias');

      // HTTP Endpoint
      const req = new Request('http://localhost:3000/api/v1/streets/avenida-lucas-braulio-areco-115');
      const res = await getStreetDetail(req, {
        params: Promise.resolve({ slug: 'avenida-lucas-braulio-areco-115' })
      });
      assert.equal(res.status, 200);
      const json = await res.json();
      assert.ok(Array.isArray(json.aliases));
      assert.ok(json.aliases.includes('Avenida 115') || json.aliases.includes('Av. 115'));
    });

    test('getStreetBySlug resuelve fallback de slug histórico o alternativo', () => {
      // Consulta por slug de variante de la IDE
      const vivancoFallback = getStreetBySlug('avenida-arq-jorge-eduardo-vivanco-139');
      assert.ok(vivancoFallback, 'Debe resolver por slug alternativo histórico');
      assert.equal(vivancoFallback.official_name, 'Avenida Vivanco');
    });
  });
});
