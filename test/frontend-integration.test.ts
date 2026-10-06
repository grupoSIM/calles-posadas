import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { getStreetBySlug } from '../src/lib/db/streets';
import { closeDatabase } from '../src/lib/db/client';
import { getStreetMetadata } from '../src/lib/metadata';

describe('FEAT-003: Integración Frontend y Visor Cartográfico', () => {
  after(() => {
    closeDatabase();
  });

  describe('T-004: Metadatos y Estructura de Ficha de Detalle', () => {
    test('getStreetMetadata genera título y descripción adecuados para arteria existente', () => {
      const meta = getStreetMetadata('calle-jujuy-49');
      assert.ok(meta.title.includes('Calle Jujuy'));
      assert.ok(meta.description && meta.description.length > 0);
    });

    test('getStreetMetadata maneja slug inexistente con título fallback', () => {
      const meta = getStreetMetadata('calle-fantasma-999');
      assert.equal(meta.title, 'Calle no encontrada — Calles de Posadas');
    });

    test('Datos de arteria alimentan correctamente la ficha de detalle', () => {
      const street = getStreetBySlug('calle-jujuy-49');
      assert.ok(street, 'Debe existir la calle de prueba');
      assert.equal(street.official_name, 'Calle Jujuy');
      assert.equal(street.road_type, 'CALLE');
      assert.equal(street.street_number, 49);
      assert.equal(street.has_cycleway, true);
      assert.ok(street.total_length_m > 0);
      assert.ok(street.barrios.length > 0);
      assert.ok(street.tramos.length > 0);
    });
  });

  describe('T-002: Contrato GeoJSON para Leaflet y fitBounds', () => {
    test('GeoJSON contiene geometría vectorial válida con coordenadas para Leaflet', () => {
      const street = getStreetBySlug('calle-jujuy-49');
      assert.ok(street?.geojson, 'Debe contener objeto GeoJSON');
      assert.ok(['MultiLineString', 'LineString', 'FeatureCollection'].includes(street.geojson.type));

      // Extraer coordenadas según sea Geometry o Feature
      let coords = street.geojson.coordinates;
      if (street.geojson.type === 'FeatureCollection') {
        coords = street.geojson.features[0]?.geometry?.coordinates;
      }
      assert.ok(Array.isArray(coords) && coords.length > 0, 'Debe tener lista de coordenadas');

      // Extraer primer punto [lng, lat]
      const p1 = Array.isArray(coords[0][0]) ? coords[0][0] : coords[0];
      const [lng, lat] = Array.isArray(p1[0]) ? p1[0] : p1;
      assert.ok(lng >= -56.2 && lng <= -55.7, `Longitud ${lng} debe estar en el rango de Posadas`);
      assert.ok(lat >= -27.6 && lat <= -27.2, `Latitud ${lat} debe estar en el rango de Posadas`);
    });

    test('Identifica tramos con ciclovía para estilización diferencial en el mapa', () => {
      const street = getStreetBySlug('calle-jujuy-49');
      assert.ok(street);
      const cycleTramos = street.tramos.filter((t) => t.tiene_ciclovia);
      assert.ok(cycleTramos.length > 0, 'La arteria debe registrar al menos un tramo con ciclovía');
    });
  });

  describe('T-001, T-003, T-005: Integración de Módulos y Componentes', () => {
    test('Importación de componentes cliente sin errores de sintaxis', async () => {
      const SearchBar = await import('../src/components/search/SearchBar');
      const FilterBar = await import('../src/components/search/FilterBar');
      const StreetDetailCard = await import('../src/components/street/StreetDetailCard');
      const StreetViewerClient = await import('../src/components/map/StreetViewerClient');

      assert.equal(typeof SearchBar.default, 'function');
      assert.equal(typeof FilterBar.default, 'function');
      assert.equal(typeof StreetDetailCard.default, 'function');
      assert.equal(typeof StreetViewerClient.default, 'function');
    });
  });

  describe('FEAT-005: Rediseño visual responsivo y tokens Stitch', () => {
    test('Componentes de vista principal y ficha técnica soportan contrato de datos', async () => {
      const street = getStreetBySlug('calle-jujuy-49');
      assert.ok(street);

      const StreetDetailCard = (await import('../src/components/street/StreetDetailCard')).default;
      assert.equal(typeof StreetDetailCard, 'function');

      // Validar que StreetViewerClient se exporta correctamente
      const StreetViewer = (await import('../src/components/map/StreetViewer')).default;
      assert.equal(typeof StreetViewer, 'function');
    });
  });
});
