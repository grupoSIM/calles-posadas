import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { extractLayers } from '../scripts/etl/extract.js';

describe('T-002: Extracción y descarga reproducible con soporte offline', () => {
  const fixturesDir = path.resolve(process.cwd(), 'data', 'fixtures');

  test('Carga capas en modo offline desde fixtures', async () => {
    const data = await extractLayers({ offline: true, fixturesDir });
    
    assert.ok(data.calles, 'Debe cargar capa de calles');
    assert.ok(data.barrios, 'Debe cargar capa de barrios');
    assert.ok(data.bicisendas, 'Debe cargar capa de bicisendas');
    assert.ok(data.avenidas, 'Debe cargar capa de avenidas');

    assert.ok(Array.isArray(data.calles.features), 'Calles debe tener features');
    assert.ok(data.calles.features.length > 0, 'Calles debe contener elementos');
    assert.ok(data.barrios.features.length > 0, 'Barrios debe contener elementos');
    assert.ok(data.bicisendas.features.length > 0, 'Bicisendas debe contener elementos');
    assert.ok(data.avenidas.features.length > 0, 'Avenidas debe contener elementos');
  });
});
