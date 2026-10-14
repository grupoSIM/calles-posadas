import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

describe('FEAT-022: Ingesta y correlación de ordenanzas de avenidas troncales remanentes', () => {
  const rootDir = process.cwd();
  const rawDigestoPath = path.resolve(rootDir, 'data', 'raw', 'digesto_calles.json');
  const fixtureDigestoPath = path.resolve(rootDir, 'data', 'fixtures', 'digesto_calles.json');
  const dbPath = path.resolve(rootDir, 'data', 'calles.db');

  const avenidasTroncalesRemanentes = [
    'Avenida Horacio Quiroga',
    'Avenida Almafuerte',
    'Avenida Martin Fierro',
    'Avenida Guillermo Marconi',
    'Avenida Bartolome Mitre',
    'Avenida Justo Jose Urquiza',
    'Avenida General Juan Lavalle',
    'Avenida Almirante Brown',
    'Avenida Mariano Moreno',
    'Avenida Monteagudo',
    'Avenida Doctor Madariaga',
    'Avenida Roque Saenz Peña',
    'Avenida Leandro N. Alem',
    'Avenida Las Heras',
    'Avenida Cmte Leonardo Rosales',
    'Avenida Tambor de Tacuari',
    'Avenida Corrientes',
    'Avenida Santa Cruz',
    'Avenida Santa Catalina',
    'Avenida Tierra del Fuego',
    'Avenida Centenario',
    'Avenida Chacabuco',
    'Avenida Ituzaingo',
    'Avenida Maipu',
    'Avenida Trincheras de San Jose',
    'Avenida Aguado',
    'Avenida Lopez y Planes',
    'Avenida Blas Parera',
    'Avenida Domingo Cabred',
    'Avenida Francisco de Haro',
    'Avenida Ricardo Bustamante',
    'Avenida Padre Jose F. Rademacher'
  ];

  const rawEntries = JSON.parse(fs.readFileSync(rawDigestoPath, 'utf-8'));
  const fixtureEntries = JSON.parse(fs.readFileSync(fixtureDigestoPath, 'utf-8'));

  describe('AC-001: Trazabilidad normativa completa en las 32 avenidas troncales remanentes', () => {
    it('Todas las 32 avenidas troncales remanentes poseen estado CONFIRMADO y referencia normativa', () => {
      assert.strictEqual(avenidasTroncalesRemanentes.length, 32, 'Deben evaluarse exactamente 32 avenidas troncales');

      for (const nombre of avenidasTroncalesRemanentes) {
        const item = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase() === nombre.toLowerCase());
        assert.ok(item, `Debe existir la entrada ${nombre} en digesto_calles.json`);
        assert.strictEqual(item.estado_normativo, 'CONFIRMADO', `${nombre} debe estar en estado CONFIRMADO`);
        assert.strictEqual(item.documento_normativo, 'Ordenanza XVIII - N° 130', `${nombre} debe pertenecer a Ordenanza XVIII - N° 130`);
        assert.ok(item.referencia_ordenanza && item.referencia_ordenanza.includes('Ordenanza XVIII - N° 130'), `${nombre} debe contener referencia formal a XVIII-130`);
        assert.ok(item.url_ordenanza && item.url_ordenanza.startsWith('https://'), `${nombre} debe tener url_ordenanza válida`);
      }
    });

    it('Los fixtures reflejan idéntica cobertura para las 32 avenidas troncales', () => {
      for (const nombre of avenidasTroncalesRemanentes) {
        const item = fixtureEntries.find((e: any) => e.nombre_oficial.toLowerCase() === nombre.toLowerCase());
        assert.ok(item, `Fixture debe contener ${nombre}`);
        assert.strictEqual(item.estado_normativo, 'CONFIRMADO', `Fixture: ${nombre} debe estar CONFIRMADO`);
        assert.strictEqual(item.documento_normativo, 'Ordenanza XVIII - N° 130');
      }
    });
  });

  describe('AC-002: Preservación editorial íntegra y categorías toponímicas', () => {
    it('El 100% de las 32 avenidas conserva explicación biográfica detallada', () => {
      for (const nombre of avenidasTroncalesRemanentes) {
        const item = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase() === nombre.toLowerCase());
        assert.ok(item.explicacion && item.explicacion.trim().length > 25, `${nombre} debe tener explicación biográfica rigurosa`);
        assert.ok(item.fuente_biografica && item.fuente_biografica.trim().length > 0, `${nombre} debe indicar fuente biográfica`);
      }
    });

    it('Ninguna de las 32 avenidas posee categoría OTRO', () => {
      for (const nombre of avenidasTroncalesRemanentes) {
        const item = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase() === nombre.toLowerCase());
        assert.notStrictEqual(item.categoria_toponimica, 'OTRO', `${nombre} no debe tener categoría toponímica OTRO`);
      }
    });

    it('Avenidas clave poseen categorización precisa y fundamentada', () => {
      const lopezPlanes = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase().includes('lopez y planes'));
      assert.strictEqual(lopezPlanes.categoria_toponimica, 'PROCER');

      const blasParera = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase().includes('blas parera'));
      assert.strictEqual(blasParera.categoria_toponimica, 'CIENCIA_CULTURA');

      const cabred = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase().includes('cabred'));
      assert.strictEqual(cabred.categoria_toponimica, 'CIENCIA_CULTURA');

      const rademacher = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase().includes('rademacher'));
      assert.strictEqual(rademacher.categoria_toponimica, 'RELIGIOSO');

      const bustamante = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase().includes('bustamante'));
      assert.strictEqual(bustamante.categoria_toponimica, 'PIONERO');

      const corrientes = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase() === 'avenida corrientes');
      assert.strictEqual(corrientes.categoria_toponimica, 'GEOGRAFIA');
    });
  });

  describe('AC-003: Persistencia e integridad relacional en calles.db', () => {
    it('Las 32 avenidas troncales poseen referencia_ordenanza y explicacion en la base de datos', () => {
      const db = new Database(dbPath);
      try {
        const stmt = db.prepare(`
          SELECT id, slug, nombre_oficial, tipo_via, referencia_ordenanza, explicacion, categoria_toponimica
          FROM calles
          WHERE tipo_via = 'AVENIDA' AND lower(nombre_oficial) = lower(?)
        `);

        for (const nombre of avenidasTroncalesRemanentes) {
          const row: any = stmt.get(nombre);
          assert.ok(row, `Debe existir registro en SQLite para ${nombre}`);
          assert.ok(row.referencia_ordenanza && row.referencia_ordenanza.includes('Ordenanza XVIII - N° 130'), `DB: ${nombre} debe tener referencia_ordenanza`);
          assert.ok(row.explicacion && row.explicacion.trim().length > 20, `DB: ${nombre} debe tener explicacion`);
          assert.notStrictEqual(row.categoria_toponimica, 'OTRO', `DB: ${nombre} no debe tener categoría OTRO`);
        }
      } finally {
        db.close();
      }
    });

    it('El número total de avenidas confirmadas en la base de datos es de al menos 63', () => {
      const db = new Database(dbPath);
      try {
        const res: any = db.prepare(`
          SELECT count(*) as total
          FROM calles
          WHERE tipo_via = 'AVENIDA' AND referencia_ordenanza IS NOT NULL
        `).get();
        assert.ok(res.total >= 63, `El total de avenidas confirmadas en DB debe ser >= 63 (actual: ${res.total})`);
      } finally {
        db.close();
      }
    });
  });

  describe('AC-004: No-regresión del catálogo normativo previo', () => {
    it('Avenidas previas de Ordenanza XVIII - N° 4 conservan sus normas originales', () => {
      const uruguay = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase().includes('uruguay'));
      assert.ok(uruguay, 'Debe existir Av. Uruguay');
      assert.strictEqual(uruguay.documento_normativo, 'Ordenanza XVIII - N° 4');
      assert.ok(uruguay.referencia_ordenanza.includes('Art. 1'));

      const roquePerez = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase().includes('roque perez'));
      assert.ok(roquePerez, 'Debe existir Av. Roque Pérez');
      assert.strictEqual(roquePerez.documento_normativo, 'Ordenanza XVIII - N° 4');
      assert.ok(roquePerez.referencia_ordenanza.includes('Art. 33'));

      const llamosas = rawEntries.find((e: any) => e.nombre_oficial.toLowerCase().includes('llamosas'));
      assert.ok(llamosas, 'Debe existir Av. Llamosas');
      assert.strictEqual(llamosas.documento_normativo, 'Ordenanza XVIII - N° 80');
    });

    it('Calles del Casco Céntrico (FEAT-021) conservan su confirmación y normas', () => {
      const azara = rawEntries.find((e: any) => e.numero_calle === 37 && e.nombre_normalizado?.includes('azara'));
      assert.ok(azara, 'Debe existir Calle Félix de Azara');
      assert.strictEqual(azara.estado_normativo, 'CONFIRMADO');
      assert.strictEqual(azara.documento_normativo, 'Ordenanza XVIII - N° 130');

      const belgrano = rawEntries.find((e: any) => e.numero_calle === 30 && e.nombre_normalizado?.includes('belgrano'));
      assert.ok(belgrano, 'Debe existir Calle Belgrano');
      assert.strictEqual(belgrano.documento_normativo, 'Ordenanza XVIII - N° 46');
    });
  });
});
