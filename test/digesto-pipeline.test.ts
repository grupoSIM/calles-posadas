import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseNorma } from '../scripts/etl/digesto/parser.js';
import { correlateNormasWithStreets, checkToponymAffinity } from '../scripts/etl/digesto/correlator.js';
import { syncDigestoDataset } from '../scripts/etl/digesto/sync.js';
import { DigestoNormaRaw, ParsedArticulo } from '../scripts/etl/digesto/types.js';

describe('FEAT-015: Pipeline de extracción y correlación automatizada de ordenanzas del Digesto', () => {

  describe('AC-001: Parseo sintáctico de artículos normativos del Digesto', () => {
    test('Extrae correctamente los artículos de la Ordenanza XVIII - N° 4 (Avenidas)', () => {
      const sampleNorma: DigestoNormaRaw = {
        id: 'XVIII-4',
        documento_normativo: 'Ordenanza XVIII - N° 4',
        titulo: 'Denominación de Avenidas',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%204.pdf',
        procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
        texto: `
          # Comentario inicial
          ARTICULO 1.- Desígnase con el nombre de "Uruguay" a la Avenida N° 45.
          ARTICULO 9.- Desígnase con el nombre de "Brigadier General José Matías Zapiola" a la Avenida N° 107.
          ARTICULO 10.- Desígnase con el nombre de "Lucas Braulio Areco" a la Avenida N° 115.
        `
      };

      const articulos = parseNorma(sampleNorma);
      assert.equal(articulos.length, 3, 'Debe extraer exactamente 3 artículos');

      const areco = articulos.find(a => a.numero_articulo === 10);
      assert.ok(areco, 'Debe existir el artículo 10');
      assert.equal(areco.nombre_asignado, 'Lucas Braulio Areco');
      assert.equal(areco.tipo_via, 'AVENIDA');
      assert.equal(areco.numero_calle, 115);
      assert.equal(areco.referencia_ordenanza, 'Ordenanza XVIII - N° 4, Art. 10');
      assert.equal(areco.url_ordenanza, sampleNorma.url_ordenanza);
    });

    test('Extrae correctamente los artículos de la Ordenanza XVIII - N° 46 (Calles)', () => {
      const sampleNorma: DigestoNormaRaw = {
        id: 'XVIII-46',
        documento_normativo: 'Ordenanza XVIII - N° 46',
        titulo: 'Denominación de Calles',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%2046.pdf',
        procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
        texto: `
          ARTICULO 12.- Desígnase con el nombre de "Doctor René Favaloro" a la Calle N° 138.
          ARTICULO 65.- Desígnase con el nombre de "Dr. Arturo Humberto Illia" a la Calle N° 161.
        `
      };

      const articulos = parseNorma(sampleNorma);
      assert.equal(articulos.length, 2);

      const favaloro = articulos.find(a => a.numero_articulo === 12);
      assert.ok(favaloro);
      assert.equal(favaloro.nombre_asignado, 'Doctor René Favaloro');
      assert.equal(favaloro.tipo_via, 'CALLE');
      assert.equal(favaloro.numero_calle, 138);
      assert.equal(favaloro.referencia_ordenanza, 'Ordenanza XVIII - N° 46, Art. 12');
    });

    test('Soporta sintaxis sin comillas o con orden invertido de tipo y número', () => {
      const normaVariantes: DigestoNormaRaw = {
        id: 'VAR',
        documento_normativo: 'Ordenanza Test',
        titulo: 'Pruebas sintácticas',
        url_ordenanza: 'https://test.gob.ar',
        procedencia_normativa: 'Test',
        texto: `
          ARTICULO 5.- Desígnase con el nombre de Ramón Ayala a la Calle N° 99.
          ARTICULO 7.- a la Avenida N° 200 con el nombre de "Andrés Guacurarí".
        `
      };

      const articulos = parseNorma(normaVariantes);
      assert.equal(articulos.length, 2);
      assert.equal(articulos[0].nombre_asignado, 'Ramón Ayala');
      assert.equal(articulos[0].numero_calle, 99);
      assert.equal(articulos[1].nombre_asignado, 'Andrés Guacurarí');
      assert.equal(articulos[1].numero_calle, 200);
    });
  });

  describe('AC-002: Correlación determinística con el nomenclador urbano', () => {
    test('Correlaciona exitosamente por afinidad toponímica y número vial', () => {
      const articulos: ParsedArticulo[] = [
        {
          articulo: 'Artículo 10',
          numero_articulo: 10,
          nombre_asignado: 'Lucas Braulio Areco',
          tipo_via: 'AVENIDA',
          numero_calle: 115,
          referencia_ordenanza: 'Ordenanza XVIII - N° 4, Art. 10',
          documento_normativo: 'Ordenanza XVIII - N° 4',
          url_ordenanza: 'https://test.gob.ar/4.pdf',
          texto_original: '...'
        }
      ];

      const streets = [
        { nombre: 'AVENIDA ARECO(115)', numero_calle: 115, tipo_via: 'AVENIDA' },
        { nombre: 'CALLE SAN MARTIN(22)', numero_calle: 22, tipo_via: 'CALLE' }
      ];

      const res = correlateNormasWithStreets(articulos, streets);
      assert.equal(res.matched.length, 1);
      assert.equal(res.conflicts.length, 0);

      const match = res.matched[0];
      assert.equal(match.entry.numero_calle, 115);
      assert.equal(match.entry.estado_normativo, 'CONFIRMADO');
      assert.equal(match.entry.referencia_ordenanza, 'Ordenanza XVIII - N° 4, Art. 10');
      assert.equal(match.entry.articulo_normativo, 'Artículo 10');
    });

    test('Verifica afinidad toponímica de tokens clave', () => {
      assert.ok(checkToponymAffinity('Lucas Braulio Areco', 'Avenida Areco'));
      assert.ok(checkToponymAffinity('Doctor René Favaloro', 'Calle Renee Favaloro'));
      assert.ok(checkToponymAffinity('Brigadier General José Matías Zapiola', 'Avenida Zapiola'));
      assert.equal(checkToponymAffinity('Uruguay', 'Calle San Martín'), false);
    });
  });

  describe('AC-003: Preservación editorial y no-regresión de datos biográficos', () => {
    test('syncDigestoDataset preserva explicacion, fuente y categoriaToponimica preexistentes', () => {
      const report = syncDigestoDataset({ offline: true });
      assert.ok(report.articulosParseados >= 19);
      assert.ok(report.arteriasConfirmadas >= 19);

      const rawContent = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'data', 'raw', 'digesto_calles.json'), 'utf-8'));
      
      // Areco debe preservar su síntesis biográfica
      const areco = rawContent.find((e: any) => e.numero_calle === 115 && e.nombre_normalizado.includes('areco'));
      assert.ok(areco, 'Areco debe existir');
      assert.ok(areco.explicacion.includes('Misionerita'), 'Debe conservar la reseña sobre Misionerita');
      assert.equal(areco.categoria_toponimica, 'CIENCIA_CULTURA');
      assert.equal(areco.estado_normativo, 'CONFIRMADO');

      // Quiroga conserva su explicación y su confirmación formal (FEAT-022)
      const quiroga = rawContent.find((e: any) => e.numero_calle === 54 && e.nombre_normalizado.includes('quiroga'));
      assert.ok(quiroga, 'Horacio Quiroga debe existir');
      assert.equal(quiroga.estado_normativo, 'CONFIRMADO');
      assert.ok(quiroga.referencia_ordenanza && quiroga.referencia_ordenanza.includes('Ordenanza XVIII - N° 130'));
      assert.ok(quiroga.explicacion.includes('cuentista y dramaturgo'));
    });
  });

  describe('AC-004: Generación reproducible y trazabilidad offline', () => {
    test('Ejecuta sincronización offline sin conectividad externa y genera archivos idénticos', () => {
      const report = syncDigestoDataset({ offline: true });
      assert.ok(report.tiempoMs >= 0);
      assert.ok(report.conflictos >= 4, 'Detecta los conflictos toponímicos de normas del Digesto');

      const rawPath = path.resolve(process.cwd(), 'data', 'raw', 'digesto_calles.json');
      const fixturePath = path.resolve(process.cwd(), 'data', 'fixtures', 'digesto_calles.json');
      
      const rawText = fs.readFileSync(rawPath, 'utf-8');
      const fixtureText = fs.readFileSync(fixturePath, 'utf-8');
      assert.equal(rawText, fixtureText, 'Ambos archivos deben ser idénticos y reproducibles');
    });
  });

  describe('AC-005: Detección y reporte de conflictos o ambigüedades', () => {
    test('Detecta discrepancia toponímica cuando el número existe pero con denominación divergente', () => {
      const articulos: ParsedArticulo[] = [
        {
          articulo: 'Artículo 99',
          numero_articulo: 99,
          nombre_asignado: 'José de San Martín',
          tipo_via: 'CALLE',
          numero_calle: 49,
          referencia_ordenanza: 'Ordenanza Test, Art. 99',
          documento_normativo: 'Ordenanza Test',
          url_ordenanza: 'https://test.gob.ar',
          texto_original: '...'
        }
      ];

      // Calle 49 en Posadas es Calle Jujuy, no San Martín
      const streets = [
        { nombre: 'CALLE JUJUY(49)', numero_calle: 49, tipo_via: 'CALLE' }
      ];

      const res = correlateNormasWithStreets(articulos, streets);
      assert.equal(res.matched.length, 0, 'No debe haber coincidencia falsa');
      assert.equal(res.conflicts.length, 1, 'Debe registrar un conflicto de discrepancia toponímica');
      assert.ok(res.conflicts[0].reason.includes('ninguna coincide toponímicamente'));
    });

    test('Registra normas huérfanas en unmatchedNormas cuando no existe la arteria en el SIG', () => {
      const articulos: ParsedArticulo[] = [
        {
          articulo: 'Artículo 500',
          numero_articulo: 500,
          nombre_asignado: 'Arteria Inexistente',
          tipo_via: 'CALLE',
          numero_calle: 9999,
          referencia_ordenanza: 'Ordenanza Test, Art. 500',
          documento_normativo: 'Ordenanza Test',
          url_ordenanza: 'https://test.gob.ar',
          texto_original: '...'
        }
      ];

      const streets = [
        { nombre: 'CALLE JUJUY(49)', numero_calle: 49, tipo_via: 'CALLE' }
      ];

      const res = correlateNormasWithStreets(articulos, streets);
      assert.equal(res.matched.length, 0);
      assert.equal(res.unmatchedNormas.length, 1);
      assert.equal(res.unmatchedNormas[0].numero_calle, 9999);
    });
  });
});
