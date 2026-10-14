import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

describe('FEAT-021: Trazabilidad normativa y rescate documental del Casco Céntrico', () => {
  const rootDir = process.cwd();
  const rawDigestoPath = path.resolve(rootDir, 'data', 'raw', 'digesto_calles.json');
  const fixtureDigestoPath = path.resolve(rootDir, 'data', 'fixtures', 'digesto_calles.json');
  const dbPath = path.resolve(rootDir, 'data', 'calles.db');

  const cascoNumeros = [27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 52];

  const rawEntries = JSON.parse(fs.readFileSync(rawDigestoPath, 'utf-8'));
  const fixtureEntries = JSON.parse(fs.readFileSync(fixtureDigestoPath, 'utf-8'));

  describe('AC-001: Trazabilidad normativa completa en arterias del Casco Céntrico', () => {
    it('Las 25 arterias históricas del Casco Céntrico poseen estado normativo CONFIRMADO y referencia a ordenanza', () => {
      for (const num of cascoNumeros) {
        const matches = rawEntries.filter((e: any) => e.numero_calle === num && (!e.tipo_via || e.tipo_via === 'CALLE' || e.nombre_oficial.toLowerCase().startsWith('calle')));
        assert.ok(matches.length > 0, `Debe existir al menos una entrada para el eje vial ${num} en el Casco Céntrico`);
        
        const confirmed = matches.filter((e: any) => e.estado_normativo === 'CONFIRMADO');
        assert.ok(confirmed.length > 0, `El eje vial ${num} debe poseer al menos una entrada en estado CONFIRMADO`);

        for (const item of confirmed) {
          assert.ok(item.referencia_ordenanza && item.referencia_ordenanza.trim().length > 0, `Eje ${num} (${item.nombre_oficial}) debe tener referencia_ordenanza`);
          assert.ok(item.documento_normativo && item.documento_normativo.trim().length > 0, `Eje ${num} (${item.nombre_oficial}) debe tener documento_normativo`);
          assert.ok(item.url_ordenanza && item.url_ordenanza.startsWith('https://'), `Eje ${num} (${item.nombre_oficial}) debe tener url_ordenanza válida`);
        }
      }
    });

    it('Los fixtures reflejan idéntica cobertura confirmada para los 25 ejes', () => {
      for (const num of cascoNumeros) {
        const matches = fixtureEntries.filter((e: any) => e.numero_calle === num && e.estado_normativo === 'CONFIRMADO');
        assert.ok(matches.length > 0, `Fixture debe contener el eje ${num} en estado CONFIRMADO`);
      }
    });

    it('Belgrano y San Martín conservan sus artículos de la Ordenanza XVIII - N° 46', () => {
      const belgrano = rawEntries.find((e: any) => e.numero_calle === 30 && e.nombre_normalizado?.includes('belgrano'));
      assert.ok(belgrano, 'Debe existir Calle Belgrano');
      assert.strictEqual(belgrano.documento_normativo, 'Ordenanza XVIII - N° 46');
      assert.ok(belgrano.referencia_ordenanza.includes('Art. 48'));

      const sanMartin = rawEntries.find((e: any) => e.numero_calle === 36 && e.nombre_normalizado?.includes('san martin'));
      assert.ok(sanMartin, 'Debe existir Calle San Martín');
      assert.strictEqual(sanMartin.documento_normativo, 'Ordenanza XVIII - N° 46');
      assert.ok(sanMartin.referencia_ordenanza.includes('Art. 49'));
    });

    const cascoNombres: Record<number, string> = {
      27: 'paz',
      28: 'alvear',
      29: '25 de mayo',
      30: 'belgrano',
      31: '3 de febrero',
      32: 'santa fe',
      33: 'rivadavia',
      34: 'sarmiento',
      35: 'buenos aires',
      36: 'san martin',
      37: 'azara',
      38: 'bolivar',
      39: 'colon',
      40: 'cordoba',
      41: 'san lorenzo',
      42: 'la rioja',
      43: 'ayacucho',
      44: 'entre rios',
      45: 'junin',
      46: 'catamarca',
      47: 'san luis',
      48: 'salta',
      49: 'jujuy',
      50: 'tucuman',
      52: 'santiago del estero'
    };

    it('Las 23 arterias históricas fundacionales restantes se respaldan en la Ordenanza XVIII - N° 130', () => {
      const ord130Nums = cascoNumeros.filter(n => n !== 30 && n !== 36);
      for (const num of ord130Nums) {
        const keyword = cascoNombres[num];
        const item = rawEntries.find((e: any) => e.numero_calle === num && e.estado_normativo === 'CONFIRMADO' && e.nombre_normalizado?.includes(keyword));
        assert.ok(item, `Debe existir entrada confirmada para el eje ${num} (${keyword})`);
        assert.strictEqual(item.documento_normativo, 'Ordenanza XVIII - N° 130', `Eje ${num} (${item.nombre_oficial}) debe pertenecer a Ordenanza XVIII - N° 130`);
        assert.ok(item.referencia_ordenanza.includes('Anexo VII'), `Eje ${num} (${item.nombre_oficial}) debe referenciar Anexo VII`);
      }
    });
  });

  describe('AC-002: Cobertura biográfica y toponímica del 100% en el Casco Céntrico', () => {
    it('Todas las arterias confirmadas del Casco Céntrico tienen explicación y categoría válida', () => {
      for (const num of cascoNumeros) {
        const items = rawEntries.filter((e: any) => e.numero_calle === num && e.estado_normativo === 'CONFIRMADO');
        for (const item of items) {
          assert.ok(item.explicacion && item.explicacion.trim().length > 20, `Eje ${num} (${item.nombre_oficial}) debe tener explicación biográfica rigurosa`);
          assert.ok(item.categoria_toponimica && item.categoria_toponimica !== 'OTRO', `Eje ${num} (${item.nombre_oficial}) debe tener categoría válida distinta de OTRO`);
        }
      }
    });

    it('Ejes clave tienen categorización toponímica precisa y contrastada', () => {
      const azara = rawEntries.find((e: any) => e.numero_calle === 37 && e.nombre_normalizado?.includes('azara'));
      assert.strictEqual(azara.categoria_toponimica, 'CIENCIA_CULTURA');

      const bolivar = rawEntries.find((e: any) => e.numero_calle === 38 && e.nombre_normalizado?.includes('bolivar'));
      assert.strictEqual(bolivar.categoria_toponimica, 'PROCER');

      const paz = rawEntries.find((e: any) => e.numero_calle === 27 && e.nombre_normalizado?.includes('paz'));
      assert.strictEqual(paz.categoria_toponimica, 'PROCER');

      const santaFe = rawEntries.find((e: any) => e.numero_calle === 32 && e.nombre_normalizado?.includes('santa fe'));
      assert.strictEqual(santaFe.categoria_toponimica, 'GEOGRAFIA');

      const entreRios = rawEntries.find((e: any) => e.numero_calle === 44 && e.nombre_normalizado?.includes('entre rios'));
      assert.strictEqual(entreRios.categoria_toponimica, 'GEOGRAFIA');
    });
  });

  describe('AC-003: Persistencia e integridad relacional en calles.db', () => {
    it('Las 25 arterias del Casco Céntrico tienen referencia_ordenanza y explicacion en la base de datos', () => {
      const db = new Database(dbPath);
      try {
        const query = db.prepare(`
          SELECT id, slug, nombre_oficial, numero_calle, referencia_ordenanza, explicacion, categoria_toponimica
          FROM calles
          WHERE tipo_via = 'CALLE' AND numero_calle = ?
        `);

        for (const num of cascoNumeros) {
          const rows = query.all(num) as any[];
          assert.ok(rows.length > 0, `Debe existir al menos una calle para el eje ${num} en calles.db`);
          
          const conOrd = rows.filter(r => r.referencia_ordenanza && r.referencia_ordenanza.trim().length > 0);
          assert.ok(conOrd.length > 0, `Eje ${num} debe tener al menos un registro con referencia_ordenanza en calles.db`);

          const conExp = rows.filter(r => r.explicacion && r.explicacion.trim().length > 0);
          assert.ok(conExp.length > 0, `Eje ${num} debe tener al menos un registro con explicacion en calles.db`);
        }
      } finally {
        db.close();
      }
    });
  });

  describe('AC-004: No-regresión de ordenanzas y reseñas preexistentes', () => {
    it('Conserva ordenanzas de avenidas troncales y arterias particulares preexistentes', () => {
      const moreau = rawEntries.find((e: any) => e.numero_calle === 83);
      assert.ok(moreau && moreau.referencia_ordenanza.includes('XVIII - N° 4'));

      const llamosas = rawEntries.find((e: any) => e.numero_calle === 45 && e.nombre_normalizado?.includes('llamosas'));
      assert.ok(llamosas && llamosas.referencia_ordenanza.includes('XVIII - N° 80'));

      const ayala = rawEntries.find((e: any) => e.numero_calle === 62 && e.nombre_normalizado?.includes('ayala'));
      assert.ok(ayala && ayala.referencia_ordenanza.includes('XVIII - N° 306'));
    });
  });
});
