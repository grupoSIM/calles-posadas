import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  RateLimiter,
  fetchWithRetry,
  harvestNormasParticulares,
  NORMAS_PARTICULARES_RAMA_XVIII
} from '../scripts/etl/digesto/harvester.js';
import { parseNorma } from '../scripts/etl/digesto/parser.js';
import { correlateNormasWithStreets } from '../scripts/etl/digesto/correlator.js';
import { syncDigestoDataset } from '../scripts/etl/digesto/sync.js';

describe('FEAT-019: Harvester y correlación de ordenanzas particulares de Rama XVIII', () => {
  describe('AC-001: Rate Limiter y Fetch con Reintentos', () => {
    test('RateLimiter calcula y aplica espera cuando las peticiones ocurren con menor intervalo que minDelayMs', async () => {
      let sleepCalledMs = 0;
      const fakeSleep = async (ms: number) => {
        sleepCalledMs += ms;
      };

      const limiter = new RateLimiter(500, fakeSleep);
      // Primera petición no debe esperar
      const wait1 = await limiter.throttle();
      assert.strictEqual(wait1, 0, 'Primera llamada a throttle no debe demorar');

      // Segunda petición consecutiva inmediata debe esperar el remanente
      const wait2 = await limiter.throttle();
      assert.ok(wait2 > 0 && wait2 <= 500, `Debe esperar tiempo proporcional a minDelayMs, esperado >0 y <=500, recibido: ${wait2}`);
      assert.strictEqual(sleepCalledMs, wait2, 'sleepFn debe invocarse con la demora calculada');
    });

    test('fetchWithRetry reintenta con backoff exponencial ante códigos 429 / 5xx', async () => {
      let callCount = 0;
      const sleepDelays: number[] = [];
      const fakeSleep = async (ms: number) => {
        sleepDelays.push(ms);
      };

      const mockFetch = async () => {
        callCount++;
        if (callCount < 3) {
          return new Response('Rate limited', { status: 429, statusText: 'Too Many Requests' });
        }
        return new Response('Texto exitoso de la ordenanza', { status: 200, statusText: 'OK' });
      };

      const limiter = new RateLimiter(0, fakeSleep);
      const content = await fetchWithRetry('https://digesto.hcdposadas.gob.ar/test', limiter, {
        maxRetries: 3,
        backoffBaseMs: 100,
        fetchFn: mockFetch as any,
        sleepFn: fakeSleep
      });

      assert.strictEqual(content, 'Texto exitoso de la ordenanza');
      assert.strictEqual(callCount, 3, 'Debió reintentar 2 veces y triunfar al 3er intento');
      assert.deepStrictEqual(sleepDelays, [100, 200], 'Los delays deben seguir progresión exponencial (100, 200)');
    });

    test('fetchWithRetry falla con error tras exceder el número máximo de reintentos', async () => {
      let callCount = 0;
      const mockFetch = async () => {
        callCount++;
        return new Response('Server Error', { status: 503, statusText: 'Service Unavailable' });
      };

      const limiter = new RateLimiter(0, async () => {});
      await assert.rejects(
        async () => {
          await fetchWithRetry('https://digesto.hcdposadas.gob.ar/error', limiter, {
            maxRetries: 2,
            backoffBaseMs: 10,
            fetchFn: mockFetch as any,
            sleepFn: async () => {}
          });
        },
        /HTTP 503/
      );
      assert.strictEqual(callCount, 3, 'Debió realizar 1 intento inicial + 2 reintentos');
    });
  });

  describe('AC-002: Modo Offline y Preservación de Caché', () => {
    test('fetchWithRetry lanza error preventivo si el flag offline está activo', async () => {
      const limiter = new RateLimiter(0, async () => {});
      await assert.rejects(
        async () => {
          await fetchWithRetry('https://digesto.hcdposadas.gob.ar/norma', limiter, { offline: true });
        },
        /Modo offline activo/
      );
    });

    test('harvestNormasParticulares en modo offline utiliza caché preexistente sin invocar red', async () => {
      let networkInvoked = false;
      const mockFetch = async () => {
        networkInvoked = true;
        throw new Error('No debe llamar a la red');
      };

      const res = await harvestNormasParticulares(NORMAS_PARTICULARES_RAMA_XVIII, {
        offline: true,
        fetchFn: mockFetch as any
      });

      assert.strictEqual(networkInvoked, false, 'No debió haber ninguna llamada a la red en modo offline');
      assert.strictEqual(res.total, 3, 'Debe procesar las 3 normas de Rama XVIII');
      assert.ok(res.cached + res.downloaded === 3, 'Todas las normas deben resolverse por caché o resguardo');
    });
  });

  describe('AC-003: Parseo y correlación determinística de ordenanzas particulares', () => {
    test('parseNorma extrae correctamente los artículos de XVIII-80 y XVIII-306', () => {
      const txt80 = fs.readFileSync(path.resolve(process.cwd(), 'data/raw/digesto/normas/XVIII-80.txt'), 'utf-8');
      const p80 = parseNorma({
        id: 'XVIII-80',
        documento_normativo: 'Ordenanza XVIII - N° 80',
        titulo: 'Denominación Tulo Llamosas',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/norma80',
        procedencia_normativa: 'Digesto Jurídico Municipal',
        texto: txt80
      });

      assert.strictEqual(p80.length, 1);
      assert.strictEqual(p80[0].numero_articulo, 1);
      assert.strictEqual(p80[0].nombre_asignado, 'Intendente Fernando Elías Tulo Llamosas');
      assert.strictEqual(p80[0].tipo_via, 'AVENIDA');
      assert.strictEqual(p80[0].numero_calle, 45);
      assert.strictEqual(p80[0].referencia_ordenanza, 'Ordenanza XVIII - N° 80, Art. 1');

      const txt306 = fs.readFileSync(path.resolve(process.cwd(), 'data/raw/digesto/normas/XVIII-306.txt'), 'utf-8');
      const p306 = parseNorma({
        id: 'XVIII-306',
        documento_normativo: 'Ordenanza XVIII - N° 306',
        titulo: 'Denominación Ramón Ayala',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/norma306',
        procedencia_normativa: 'Digesto Jurídico Municipal',
        texto: txt306
      });

      assert.strictEqual(p306.length, 1);
      assert.strictEqual(p306[0].numero_articulo, 1);
      assert.strictEqual(p306[0].nombre_asignado, 'Ramón Ayala');
      assert.strictEqual(p306[0].tipo_via, 'CALLE');
      assert.strictEqual(p306[0].numero_calle, 62);
      assert.strictEqual(p306[0].referencia_ordenanza, 'Ordenanza XVIII - N° 306, Art. 1');
    });

    test('correlateNormasWithStreets asocia determinísticamente sin homonimia inválida', () => {
      const artAyala = {
        articulo: 'Artículo 1',
        numero_articulo: 1,
        nombre_asignado: 'Ramón Ayala',
        tipo_via: 'CALLE' as const,
        numero_calle: 62,
        referencia_ordenanza: 'Ordenanza XVIII - N° 306, Art. 1',
        documento_normativo: 'Ordenanza XVIII - N° 306',
        url_ordenanza: 'https://digesto.hcdposadas.gob.ar/norma306',
        texto_original: 'Desígnase Ramón Ayala a la Calle 62'
      };

      const streets = [
        { nombre: 'CALLE SGTO. CABRAL(12)', numero_calle: 12, tipo_via: 'CALLE' },
        { nombre: 'CALLE(62A)', numero_calle: 62, tipo_via: 'CALLE' },
        { nombre: 'CALLE RAMON AYALA(62)', numero_calle: 62, tipo_via: 'CALLE' }
      ];

      const res = correlateNormasWithStreets([artAyala], streets);
      assert.strictEqual(res.matched.length, 1);
      assert.strictEqual(res.matched[0].matchedStreet.nombre, 'CALLE RAMON AYALA(62)');
      assert.strictEqual(res.matched[0].entry.referencia_ordenanza, 'Ordenanza XVIII - N° 306, Art. 1');
      assert.strictEqual(res.conflicts.length, 0);
    });
  });

  describe('AC-004: Preservación Editorial y No-regresión', () => {
    test('syncDigestoDataset preserva todas las reseñas biográficas y confirma las nuevas ordenanzas', () => {
      const report = syncDigestoDataset({ offline: true });

      assert.strictEqual(report.normasProcesadas, 6, 'Deben procesarse las 6 normas registradas en index.json');
      assert.ok(report.arteriasConfirmadas >= 125, `Debe haber al menos 125 arterias confirmadas, reportado: ${report.arteriasConfirmadas}`);

      const dataRaw = JSON.parse(
        fs.readFileSync(path.resolve(process.cwd(), 'data/raw/digesto_calles.json'), 'utf-8')
      );

      // 1. Verificar confirmación de Ramón Ayala (XVIII-306)
      const ayala = dataRaw.find((d: any) => d.nombre_oficial.toUpperCase().includes('AYALA'));
      assert.ok(ayala, 'Debe existir entrada para Ramón Ayala');
      assert.strictEqual(ayala.referencia_ordenanza, 'Ordenanza XVIII - N° 306, Art. 1');
      assert.strictEqual(ayala.estado_normativo, 'CONFIRMADO');

      // 2. Verificar confirmación de Tulo Llamosas (XVIII-80)
      const llamosas = dataRaw.find((d: any) => d.nombre_oficial.toUpperCase().includes('LLAMOSAS'));
      assert.ok(llamosas, 'Debe existir entrada para Tulo Llamosas');
      assert.strictEqual(llamosas.referencia_ordenanza, 'Ordenanza XVIII - N° 80, Art. 1');
      assert.strictEqual(llamosas.estado_normativo, 'CONFIRMADO');

      // 3. Verificar no-regresión de reseñas biográficas de normas anteriores (XVIII-4, XVIII-46)
      const uruguay = dataRaw.find((d: any) => d.nombre_oficial.includes('Uruguay'));
      assert.ok(uruguay && uruguay.explicacion.length > 0, 'Reseña de Av. Uruguay debe preservarse intacta');
      assert.strictEqual(uruguay.referencia_ordenanza, 'Ordenanza XVIII - N° 4, Art. 1');

      const favaloro = dataRaw.find((d: any) => d.nombre_oficial.includes('Favaloro'));
      assert.ok(favaloro && favaloro.explicacion.includes('René Favaloro'), 'Reseña de Favaloro debe preservarse intacta');

      const morinigo = dataRaw.find((d: any) => d.nombre_oficial.includes('Morinigo'));
      assert.ok(morinigo && morinigo.explicacion.includes('María de la Cruz Moriñigo'), 'Reseña de Moriñigo debe preservarse intacta');
    });
  });
});
