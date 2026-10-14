import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { getDatabase, closeDatabase } from '../src/lib/db/client.js';
import { searchStreets, getStreetBySlug, listBarrios, sanitizeFtsQuery } from '../src/lib/db/streets.js';

describe('T-001: Módulo de consultas de dominio (streets.ts)', () => {
  const dbPath = path.resolve(process.cwd(), 'data', 'calles.db');
  let db: any;

  before(() => {
    db = getDatabase(dbPath);
  });

  after(() => {
    closeDatabase();
  });

  test('Sanitiza queries FTS5 correctamente', () => {
    assert.equal(sanitizeFtsQuery('Lucas Braulio Areco'), '"Lucas"* "Braulio"* "Areco"*');
    assert.equal(sanitizeFtsQuery('115*'), '"115"*');
    assert.equal(sanitizeFtsQuery('  '), null);
  });

  test('AC-001: Búsqueda multi-alias resuelve por nombre y por número en < 15 ms', () => {
    // Warm-up JIT
    searchStreets({ q: 'San' }, db);

    const t0 = performance.now();
    const resultNombre = searchStreets({ q: 'Jujuy' }, db);
    const durationNombre = performance.now() - t0;

    assert.ok(resultNombre.total > 0, 'Debe encontrar calle Jujuy');
    assert.ok(durationNombre < 15, `Búsqueda debe tomar < 15ms (tomó ${durationNombre.toFixed(2)}ms)`);
    assert.ok(resultNombre.data[0].official_name.includes('Jujuy'));

    // Búsqueda por número
    const resultNum = searchStreets({ q: '49' }, db);
    assert.ok(resultNum.total > 0, 'Debe encontrar calle por número 49');
  });

  test('ERR-003: Búsqueda resuelve Calle Humboldt tanto con "Humboldt" como con "Humbold"', () => {
    const resExact = searchStreets({ q: 'Humboldt' }, db);
    assert.ok(resExact.total >= 1, 'Debe encontrar Calle Humboldt con búsqueda exacta "Humboldt"');
    assert.equal(resExact.data[0].official_name, 'Calle Humboldt');
    assert.equal(resExact.data[0].slug, 'calle-humboldt-27');
    assert.equal(resExact.data[0].street_number, 27);

    const resPrefix = searchStreets({ q: 'Humbold' }, db);
    assert.ok(resPrefix.total >= 1, 'Debe encontrar Calle Humboldt con búsqueda por prefijo "Humbold"');
    assert.equal(resPrefix.data[0].official_name, 'Calle Humboldt');

    const detail = getStreetBySlug('calle-humboldt-27', db);
    assert.ok(detail, 'Debe devolver el detalle canónico de Calle Humboldt');
    assert.equal(detail.official_name, 'Calle Humboldt');
  });

  test('AC-002: Filtros combinados (tipo de vía y ciclovía)', () => {
    const resultAvenidas = searchStreets({ roadType: 'AVENIDA', limit: 10 }, db);
    assert.ok(resultAvenidas.total > 0);
    for (const c of resultAvenidas.data) {
      assert.equal(c.road_type, 'AVENIDA');
    }

    const resultCiclovia = searchStreets({ hasCycleway: true, limit: 10 }, db);
    assert.ok(resultCiclovia.total > 0);
    for (const c of resultCiclovia.data) {
      assert.equal(c.has_cycleway, true);
    }
  });

  test('AC-003: Paginación y límites', () => {
    const page1 = searchStreets({ page: 1, limit: 5 }, db);
    assert.equal(page1.page, 1);
    assert.equal(page1.limit, 5);
    assert.equal(page1.data.length, 5);

    const page2 = searchStreets({ page: 2, limit: 5 }, db);
    assert.equal(page2.page, 2);
    assert.equal(page2.limit, 5);
    assert.notEqual(page1.data[0].id, page2.data[0].id);
  });

  test('AC-004: Detalle por slug con GeoJSON válido y 404 para inexistente', () => {
    // Tomar una calle existente
    const sample = searchStreets({ limit: 1 }, db).data[0];
    const detail = getStreetBySlug(sample.slug, db);

    assert.ok(detail, 'Debe retornar detalle de calle');
    assert.equal(detail.slug, sample.slug);
    assert.ok(detail.geojson, 'Debe contener traza GeoJSON');
    assert.ok(Array.isArray(detail.tramos), 'Debe incluir tramos');

    // Slug inexistente
    const notFound = getStreetBySlug('calle-inexistente-xyz-999', db);
    assert.equal(notFound, null);

    // ERR: Deduplicación de barrios toponímicos homónimos (ej. Las Tacuaritas)
    const tacuaritasStreet = getStreetBySlug('calle-chacho-penaloza-136', db);
    if (tacuaritasStreet && tacuaritasStreet.barrios) {
      const tacuaritasCount = tacuaritasStreet.barrios.filter((b) => b === 'Las Tacuaritas').length;
      assert.equal(tacuaritasCount, 1, 'No debe duplicar barrios con el mismo nombre toponímico');
    }
  });

  test('AC-005: Listado de barrios ordenado', () => {
    const barrios = listBarrios(db);
    assert.ok(barrios.length >= 200, 'Debe retornar barrios cargados');
    assert.ok(barrios[0].name.localeCompare(barrios[1].name) <= 0, 'Debe estar ordenado alfabéticamente');
  });
});
