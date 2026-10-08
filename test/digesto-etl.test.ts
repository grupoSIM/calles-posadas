import { test, describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { getDatabase, closeDatabase } from '../src/lib/db/client.js';
import { getStreetBySlug } from '../src/lib/db/streets.js';
import { getStatsMetrics } from '../src/lib/db/stats.js';
import { findDigestoEntry, DigestoCalleEntry } from '../scripts/etl/transform.js';

describe('FEAT-009: Vinculación normativa del Digesto Jurídico Municipal y memoria toponímica de calles', () => {
  after(() => {
    closeDatabase();
  });

  describe('AC-001: Trazabilidad normativa y persistencia en base de datos', () => {
    test('La base de datos contiene ordenanzas del Digesto vinculadas y URLs oficiales', () => {
      const db = getDatabase();
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN referencia_ordenanza IS NOT NULL THEN 1 ELSE 0 END) as con_ordenanza,
          SUM(CASE WHEN url_ordenanza IS NOT NULL AND url_ordenanza LIKE 'https://digesto.hcdposadas.gob.ar/%' THEN 1 ELSE 0 END) as con_url_valida
        FROM calles
      `).get() as { total: number; con_ordenanza: number; con_url_valida: number };

      assert.ok(stats.con_ordenanza >= 15, `Debe haber al menos 15 arterias con ordenanza confirmada (obtenido: ${stats.con_ordenanza})`);
      assert.equal(stats.con_ordenanza, stats.con_url_valida, 'Toda ordenanza vinculada debe tener URL válida al Digesto');

      // Comprobación de asociación corregida: Av. Lucas Braulio Areco corresponde a Ordenanza XVIII - N° 4, Art. 10
      const areco = db.prepare('SELECT referencia_ordenanza, url_ordenanza FROM calles WHERE slug = ?').get('avenida-lucas-braulio-areco-115') as any;
      assert.ok(areco, 'Avenida Lucas Braulio Areco debe existir en el catálogo');
      assert.equal(areco.referencia_ordenanza, 'Ordenanza XVIII - N° 4, Art. 10');
      assert.equal(areco.url_ordenanza, 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%204.pdf');

      // Comprobación de otras asociaciones confirmadas (Zapiola Art. 9, Favaloro XVIII-46 Art. 12)
      const zapiola = db.prepare('SELECT referencia_ordenanza, url_ordenanza FROM calles WHERE slug = ?').get('avenida-brigadier-general-jose-matias-zapiola-107') as any;
      assert.ok(zapiola, 'Avenida Zapiola debe existir');
      assert.equal(zapiola.referencia_ordenanza, 'Ordenanza XVIII - N° 4, Art. 9');

      const favaloro = db.prepare('SELECT referencia_ordenanza, url_ordenanza FROM calles WHERE slug = ?').get('calle-renee-favaloro-138') as any;
      assert.ok(favaloro, 'Calle Favaloro debe existir');
      assert.equal(favaloro.referencia_ordenanza, 'Ordenanza XVIII - N° 46, Art. 12');

      // Comprobación negativa: Avenida Corrientes no tiene ordenanza formal confirmada en el lote, queda en null (no supuesta)
      const corrientes = db.prepare('SELECT referencia_ordenanza, url_ordenanza, explicacion FROM calles WHERE slug = ?').get('avenida-corrientes-51') as any;
      assert.ok(corrientes, 'Avenida Corrientes debe existir');
      assert.equal(corrientes.referencia_ordenanza, null, 'No debe asignarse ordenanza sin respaldo comprobado');
      assert.equal(corrientes.url_ordenanza, null, 'No debe asignarse URL sin respaldo comprobado');
      assert.ok(corrientes.explicacion, 'Conserva su explicación toponímica diferenciada');
    });
  });

  describe('AC-002: Memoria toponímica y taxonomía de categorías', () => {
    test('findDigestoEntry resuelve correctamente por nombre normalizado, oficial o número', () => {
      const sampleEntries: DigestoCalleEntry[] = [
        {
          nombre_oficial: 'Avenida Lucas Braulio Areco',
          nombre_normalizado: 'avenida lucas braulio areco',
          numero_calle: 115,
          referencia_ordenanza: 'Ordenanza XVIII - N° 46',
          url_ordenanza: 'https://digesto.hcdposadas.gob.ar/ver_ordenanza/774',
          explicacion: 'Músico y pintor misionero.',
          categoria_toponimica: 'CIENCIA_CULTURA'
        },
        {
          nombre_oficial: 'Calle San Lorenzo',
          nombre_normalizado: 'calle san lorenzo',
          numero_calle: 41,
          referencia_ordenanza: 'Ordenanza XVIII - N° 46',
          url_ordenanza: 'https://digesto.hcdposadas.gob.ar/ver_ordenanza/774',
          explicacion: 'Combate de San Lorenzo de 1813.',
          categoria_toponimica: 'FECHA_PATRIA'
        }
      ];

      const matchAreco = findDigestoEntry('Avenida Lucas Braulio Areco', 'avenida lucas braulio areco', 115, sampleEntries);
      assert.ok(matchAreco);
      assert.equal(matchAreco.categoria_toponimica, 'CIENCIA_CULTURA');

      const matchSanLorenzo = findDigestoEntry('Calle San Lorenzo', 'calle san lorenzo', 41, sampleEntries);
      assert.ok(matchSanLorenzo);
      assert.equal(matchSanLorenzo.categoria_toponimica, 'FECHA_PATRIA');

      const noMatch = findDigestoEntry('Calle Inexistente', 'calle inexistente', null, sampleEntries);
      assert.equal(noMatch, null);
    });

    test('Las 7 categorías toponímicas están representadas en la base de datos', () => {
      const db = getDatabase();
      const categories = db.prepare(`
        SELECT categoria_toponimica, COUNT(*) as count 
        FROM calles 
        GROUP BY categoria_toponimica
      `).all() as { categoria_toponimica: string; count: number }[];

      const foundCategories = new Set(categories.map(c => c.categoria_toponimica));
      assert.ok(foundCategories.has('PROCER'), 'Debe contener categoría PROCER');
      assert.ok(foundCategories.has('PUEBLOS_ORIGINARIOS'), 'Debe contener categoría PUEBLOS_ORIGINARIOS');
      assert.ok(foundCategories.has('GEOGRAFIA'), 'Debe contener categoría GEOGRAFIA');
      assert.ok(foundCategories.has('FECHA_PATRIA'), 'Debe contener categoría FECHA_PATRIA');
      assert.ok(foundCategories.has('BOTANICA_FAUNA'), 'Debe contener categoría BOTANICA_FAUNA');
      assert.ok(foundCategories.has('CIENCIA_CULTURA'), 'Debe contener categoría CIENCIA_CULTURA');
      assert.ok(foundCategories.has('OTRO'), 'Debe contener categoría OTRO');

      // Verificar que las explicaciones no sean vacías ni triviales
      const explicaciones = db.prepare(`
        SELECT explicacion FROM calles WHERE explicacion IS NOT NULL
      `).all() as { explicacion: string }[];

      for (const row of explicaciones) {
        assert.ok(row.explicacion.trim().length >= 20, 'La reseña debe tener un contenido biográfico sustantivo');
      }
    });
  });

  describe('AC-003: Contrato de Ficha Técnica (getStreetBySlug) y Badges', () => {
    test('getStreetBySlug devuelve toponym_category, explanation y ordenanza estructurada', () => {
      const street = getStreetBySlug('avenida-lucas-braulio-areco-115');
      assert.ok(street, 'Debe devolver el detalle de la arteria');
      assert.equal(street.official_name, 'Avenida Lucas Braulio Areco');
      assert.equal(street.toponym_category, 'CIENCIA_CULTURA');
      assert.ok(street.explanation && street.explanation.includes('Misionerita'));
      assert.ok(street.ordinance);
      assert.equal(street.ordinance.reference, 'Ordenanza XVIII - N° 4, Art. 10');
      assert.equal(street.ordinance.url, 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%204.pdf');
    });

    test('Arteria con reseña biográfica pero ordenanza no confirmada devuelve ordinance null', () => {
      const street = getStreetBySlug('avenida-corrientes-51');
      assert.ok(street, 'Debe devolver Avenida Corrientes');
      assert.equal(street.toponym_category, 'GEOGRAFIA');
      assert.ok(street.explanation && street.explanation.length > 20);
      assert.equal(street.ordinance, null, 'Ordinance debe ser null para ordenanza pendiente no confirmada');
    });

    test('Arteria sin ordenanza devuelve toponym_category OTRO y ordinance null', () => {
      const street = getStreetBySlug('avenida-272');
      if (street) {
        assert.equal(street.toponym_category, 'OTRO');
        assert.equal(street.ordinance, null);
      }
    });
  });

  describe('AC-004: Métricas de cobertura y completitud en stats', () => {
    test('getStatsMetrics refleja incremento positivo en ordenanza, explicación y categorías', () => {
      const stats = getStatsMetrics();

      assert.ok(stats.calles.con_ordenanza >= 15, 'con_ordenanza debe ser >= 15');
      assert.ok(stats.calles.porcentaje_ordenanza > 0, 'porcentaje_ordenanza debe ser > 0%');

      assert.ok(stats.calles.con_explicacion >= 30, 'con_explicacion debe ser >= 30');
      assert.ok(stats.calles.porcentaje_explicacion > 0, 'porcentaje_explicacion debe ser > 0%');

      assert.ok(stats.distribucion_toponimica.length >= 6, 'Debe tener al menos 6 categorías toponímicas en el desglose');
      const topCat = stats.distribucion_toponimica.find(c => c.categoria === 'PROCER');
      assert.ok(topCat && topCat.cantidad > 0, 'Debe haber arterias categorizadas como PROCER');
    });
  });
});
