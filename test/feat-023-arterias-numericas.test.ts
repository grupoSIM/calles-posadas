import { describe, it } from 'node:test';
import assert from 'node:assert';
import path from 'node:path';
import Database from 'better-sqlite3';
import { isUnnamedRoad, isPurelyNumericRoad, isNumericOrUnnamed } from '../scripts/etl/transform';
import { getStatsMetrics } from '../src/lib/db/stats';

describe('FEAT-023: Normalización semántica y categorización de arterias numéricas y tramos sin nombre', () => {
  const rootDir = process.cwd();
  const dbPath = path.resolve(rootDir, 'data', 'calles.db');
  const db = new Database(dbPath, { readonly: true });

  describe('AC-001: Clasificación toponímica semántica de arterias numéricas', () => {
    it('Identifica y clasifica exactamente 191 arterias puramente numéricas con categoría NUMERICA', () => {
      const rows = db.prepare("SELECT id, slug, nombre_oficial, numero_calle, categoria_toponimica, explicacion FROM calles WHERE categoria_toponimica = 'NUMERICA'").all() as any[];
      assert.strictEqual(rows.length, 191, 'Deben existir exactamente 191 arterias clasificadas como NUMERICA');

      for (const r of rows) {
        assert.ok(isPurelyNumericRoad(r.nombre_oficial), `La arteria ${r.nombre_oficial} debe ser detectada como numérica pura`);
        assert.ok(
          r.explicacion && r.explicacion.includes('designación numérica en el nomenclador urbano y la cuadrícula catastral'),
          `La arteria ${r.nombre_oficial} debe poseer la explicación de la cuadrícula catastral`
        );
      }
    });

    it('Casos representativos de arterias numéricas poseen slug y número de calle coherentes', () => {
      const muestra = ['Calle 47', 'Calle 142', 'Pasaje 45', 'Calle 86', 'Calle 100'];
      for (const nombre of muestra) {
        const item = db.prepare('SELECT nombre_oficial, categoria_toponimica, explicacion, numero_calle FROM calles WHERE nombre_oficial = ?').get(nombre) as any;
        assert.ok(item, `Debe existir ${nombre} en la base de datos`);
        assert.strictEqual(item.categoria_toponimica, 'NUMERICA', `${nombre} debe tener categoría NUMERICA`);
        assert.ok(item.numero_calle > 0, `${nombre} debe tener numero_calle mayor a 0`);
      }
    });
  });

  describe('AC-002: Clasificación y contextualización de tramos sin nombre', () => {
    it('Identifica y clasifica exactamente 5 tramos viales sin nombre con categoría SIN_NOMBRE', () => {
      const rows = db.prepare("SELECT id, slug, nombre_oficial, categoria_toponimica, explicacion FROM calles WHERE categoria_toponimica = 'SIN_NOMBRE'").all() as any[];
      assert.strictEqual(rows.length, 5, 'Deben existir exactamente 5 tramos clasificados como SIN_NOMBRE');

      const expectedNames = [
        'Calle Sin Nombre',
        'Pasaje S/n',
        'Pasaje Sin Nombre',
        'Calle S/n',
        'Avenida Sin Nombre'
      ];

      for (const expected of expectedNames) {
        const found = rows.find(r => r.nombre_oficial.toLowerCase() === expected.toLowerCase());
        assert.ok(found, `Debe existir el tramo ${expected} en la base de datos con categoría SIN_NOMBRE`);
        assert.ok(
          found.explicacion && found.explicacion.includes('pendiente de designación toponímica formal'),
          `El tramo ${expected} debe indicar que está pendiente de designación toponímica`
        );
      }
    });

    it('Helper isUnnamedRoad discrimina variantes sin nombre y abreviaciones s/n o s/d', () => {
      assert.strictEqual(isUnnamedRoad('Calle Sin Nombre'), true);
      assert.strictEqual(isUnnamedRoad('Pasaje S/n'), true);
      assert.strictEqual(isUnnamedRoad('Pasaje S/N'), true);
      assert.strictEqual(isUnnamedRoad('Calle s/d'), true);
      assert.strictEqual(isUnnamedRoad('Avenida Sin Nombre'), true);
      assert.strictEqual(isUnnamedRoad('Calle 47'), false);
      assert.strictEqual(isUnnamedRoad('Calle San Martín'), false);
    });
  });

  describe('AC-003: No-regresión de arterias con fechas patrias y próceres', () => {
    it('Fechas patrias con números no son clasificadas como NUMERICA', () => {
      const fechas = ['Calle 3 de Febrero', 'Calle 25 de Mayo'];
      for (const f of fechas) {
        const row = db.prepare('SELECT nombre_oficial, categoria_toponimica, explicacion FROM calles WHERE nombre_oficial = ?').get(f) as any;
        assert.ok(row, `Debe existir ${f}`);
        assert.strictEqual(row.categoria_toponimica, 'FECHA_PATRIA', `${f} debe conservar categoría FECHA_PATRIA`);
        assert.strictEqual(isPurelyNumericRoad(f), false, `${f} no debe ser detectada como numérica pura`);
      }
    });

    it('Arterias de próceres con dígitos parentizados de IDE conservan su categoría previa', () => {
      const proceres = [
        'CALLE SAN ROQUE GONZALEZ DE SANTA CRUZ(41)',
        'CALLE HERNANDEZ(14)'
      ];
      for (const p of proceres) {
        const row = db.prepare('SELECT nombre_oficial, categoria_toponimica FROM calles WHERE nombre_oficial = ?').get(p) as any;
        if (row) {
          assert.notStrictEqual(row.categoria_toponimica, 'NUMERICA', `${p} no debe ser clasificada como NUMERICA`);
          assert.strictEqual(isPurelyNumericRoad(p), false, `${p} no debe ser detectada como numérica pura`);
        }
      }
    });
  });

  describe('AC-004: Badges visuales en frontend', () => {
    it('Helpers de clasificación semántica diferencian tipos de vía correctamente', () => {
      assert.strictEqual(isNumericOrUnnamed('Calle 47'), true);
      assert.strictEqual(isNumericOrUnnamed('Pasaje Sin Nombre'), true);
      assert.strictEqual(isNumericOrUnnamed('Calle San Martín'), false);
    });
  });

  describe('AC-005: Transparencia en métricas de cobertura y estadísticas', () => {
    it('getStatsMetrics refleja la categorización semántica y reducción de la categoría residual OTRO', () => {
      const stats = getStatsMetrics(db);

      const numericaStat = stats.distribucion_toponimica.find(t => t.categoria === 'NUMERICA');
      assert.ok(numericaStat, 'Debe existir la categoría NUMERICA en la distribución toponímica');
      assert.strictEqual(numericaStat.cantidad, 191, 'NUMERICA debe tener 191 arterias');
      assert.strictEqual(numericaStat.porcentaje, 23.1, 'NUMERICA debe representar el 23.1% del total');

      const sinNombreStat = stats.distribucion_toponimica.find(t => t.categoria === 'SIN_NOMBRE');
      assert.ok(sinNombreStat, 'Debe existir la categoría SIN_NOMBRE en la distribución toponímica');
      assert.strictEqual(sinNombreStat.cantidad, 5, 'SIN_NOMBRE debe tener 5 tramos');
      assert.strictEqual(sinNombreStat.porcentaje, 0.6, 'SIN_NOMBRE debe representar el 0.6%');

      const otroStat = stats.distribucion_toponimica.find(t => t.categoria === 'OTRO');
      assert.ok(otroStat, 'Debe existir la categoría residual OTRO');
      assert.strictEqual(otroStat.cantidad, 393, 'OTRO debe reducirse a 393 arterias');
      assert.strictEqual(otroStat.porcentaje, 47.5, 'OTRO debe representar el 47.5%');
    });
  });
});
