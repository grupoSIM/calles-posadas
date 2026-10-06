import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { getStatsMetrics } from '../src/lib/db/stats.js';
import { GET as getStatsRoute } from '../src/app/api/v1/stats/route.js';
import { closeDatabase } from '../src/lib/db/client.js';

describe('FEAT-004: Métricas de Cobertura y Endpoint de Estadísticas', () => {
  after(() => {
    closeDatabase();
  });

  describe('T-001: Agregación en base de datos (stats.ts)', () => {
    test('Calcula métricas de calles y cobertura con tipos válidos', () => {
      const stats = getStatsMetrics();

      assert.ok(stats.calles.total > 0, 'Debe haber calles registradas');
      assert.ok(stats.calles.longitud_total_km > 0, 'Longitud total debe ser positiva');
      assert.ok(typeof stats.calles.con_numero === 'number');
      assert.ok(stats.calles.porcentaje_con_numero >= 0 && stats.calles.porcentaje_con_numero <= 100);
      assert.ok(stats.calles.con_ciclovia >= 0);
      assert.ok(stats.calles.porcentaje_ciclovia >= 0 && stats.calles.porcentaje_ciclovia <= 100);
      assert.ok(stats.calles.longitud_ciclovia_km >= 0);

      // Verificación de barrios
      assert.ok(stats.barrios.total > 0, 'Debe haber barrios registrados');
      assert.ok(stats.barrios.total_chacras > 0, 'Debe haber chacras identificadas');

      // Distribución por tipo de vía
      assert.ok(Array.isArray(stats.distribucion_tipo_via));
      assert.ok(stats.distribucion_tipo_via.length > 0);
      const sumaCantidadesVia = stats.distribucion_tipo_via.reduce((acc, curr) => acc + curr.cantidad, 0);
      assert.equal(sumaCantidadesVia, stats.calles.total, 'La suma de vías debe coincidir con el total de calles');

      // Distribución por sentido
      assert.ok(Array.isArray(stats.distribucion_sentido));
      assert.ok(stats.distribucion_sentido.length > 0);

      // Distribución toponímica
      assert.ok(Array.isArray(stats.distribucion_toponimica));
      assert.ok(stats.distribucion_toponimica.length > 0);
    });
  });

  describe('T-002: Endpoint HTTP GET /api/v1/stats', () => {
    test('Retorna 200 con payload estructurado y headers de caché', async () => {
      const req = new Request('http://localhost:3000/api/v1/stats');
      const res = await getStatsRoute(req);
      assert.equal(res.status, 200);

      const cacheControl = res.headers.get('Cache-Control');
      assert.ok(cacheControl?.includes('public'));
      assert.ok(cacheControl?.includes('s-maxage=86400'));

      const json = await res.json();
      assert.equal(json.success, true);
      assert.ok(json.data.calles.total > 0);
      assert.ok(json.data.barrios.total > 0);
      assert.ok(Array.isArray(json.data.distribucion_tipo_via));
    });
  });

  describe('T-003, T-004: Vista de Página /stats', () => {
    test('Importación y metadatos de la página /stats', async () => {
      const statsModule = await import('../src/app/stats/page.js');
      assert.ok(typeof statsModule.default === 'function', 'StatsPage debe ser un componente funcional');
      assert.ok(statsModule.metadata, 'Debe incluir metadatos');
      assert.ok(statsModule.metadata.title?.toString().includes('Métricas'));
    });
  });
});
