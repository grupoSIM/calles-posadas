import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractStreetNumber,
  extractRoadType,
  generateSlug,
  toTitleCase,
  areToponymVariants,
  transformBarrios,
  transformCalles
} from '../scripts/etl/transform.js';

describe('T-003: Normalización toponímica y procesamiento espacial', () => {
  test('Extrae tipo de vía correctamente', () => {
    assert.equal(extractRoadType('AV. 115'), 'AVENIDA');
    assert.equal(extractRoadType('AVENIDA LUCAS BRAULIO ARECO'), 'AVENIDA');
    assert.equal(extractRoadType('CALLE JUJUY(49)'), 'CALLE');
    assert.equal(extractRoadType('PASAJE 134'), 'PASAJE');
    assert.equal(extractRoadType('COSTANERA MONSEÑOR KEMERER'), 'COSTANERA');
  });

  test('Extrae número de calle desde diferentes formatos', () => {
    assert.equal(extractStreetNumber('CALLE JUJUY(49)', '(49)'), 49);
    assert.equal(extractStreetNumber('AV. 115', '115'), 115);
    assert.equal(extractStreetNumber('CALLE 134', ''), 134);
    assert.equal(extractStreetNumber('AV. SAN MARTIN', ''), null);
  });

  test('Genera slug canónico limpio y sin acentos', () => {
    assert.equal(generateSlug('Avenida Lucas Braulio Areco', 115), 'avenida-lucas-braulio-areco-115');
    assert.equal(generateSlug('Calle San Martín'), 'calle-san-martin');
  });

  test('Transforma capa de barrios y detecta chacras', () => {
    const rawBarrios = {
      features: [
        {
          type: 'Feature',
          id: 'b1',
          properties: { fid: 1, nom_barrio: 'VILLA SARITA' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[-55.90, -27.36], [-55.89, -27.36], [-55.89, -27.35], [-55.90, -27.36]]]
          }
        },
        {
          type: 'Feature',
          id: 'b2',
          properties: { fid: 2, nom_barrio: 'CHACRA 148' },
          geometry: {
            type: 'Polygon',
            coordinates: [[[-55.93, -27.40], [-55.92, -27.40], [-55.92, -27.39], [-55.93, -27.40]]]
          }
        }
      ]
    };

    const barrios = transformBarrios(rawBarrios as any);
    assert.equal(barrios.length, 2);
    assert.equal(barrios[0].nombre, 'Villa Sarita');
    assert.equal(barrios[0].tipo, 'BARRIO_OFICIAL');
    assert.equal(barrios[1].tipo, 'CHACRA');
    assert.equal(barrios[1].numeroChacra, 148);
    assert.ok(barrios[0].bbox.length === 4, 'Bbox debe tener 4 coordenadas');
  });

  test('Transforma calles y calcula longitud y bounding boxes', () => {
    const rawCalles = {
      features: [
        {
          type: 'Feature',
          id: 'c1',
          properties: { fid: 1, CALLE: 'CALLE JUJUY(49)', NUM_CALLE: '(49)' },
          geometry: {
            type: 'LineString',
            coordinates: [[-55.899, -27.360], [-55.900, -27.373]]
          }
        }
      ]
    };

    const calles = transformCalles(rawCalles as any, [], { features: [] });
    assert.equal(calles.length, 1);
    assert.equal(calles[0].numeroCalle, 49);
    assert.equal(calles[0].tipoVia, 'CALLE');
    assert.ok(calles[0].longitudTotalM > 1000, 'Debe calcular longitud > 1km');
    assert.equal(calles[0].slug, 'calle-jujuy-49');
    assert.ok(calles[0].bbox[0] <= calles[0].bbox[2], 'minX <= maxX');
  });

  test('T-001: Saneamiento toponímico sin duplicación de prefijos (AVENIDA(171), AVENIDA(77B), AVENIDA)', () => {
    const rawFeatures = {
      features: [
        {
          type: 'Feature',
          id: 'av1',
          properties: { fid: 1, CALLE: 'AVENIDA(171)', NUM_CALLE: '' },
          geometry: { type: 'LineString', coordinates: [[-55.90, -27.36], [-55.91, -27.37]] }
        },
        {
          type: 'Feature',
          id: 'av2',
          properties: { fid: 2, CALLE: 'AVENIDA(77B)', NUM_CALLE: '' },
          geometry: { type: 'LineString', coordinates: [[-55.91, -27.37], [-55.92, -27.38]] }
        },
        {
          type: 'Feature',
          id: 'av3',
          properties: { fid: 3, CALLE: 'AVENIDA', NUM_CALLE: '' },
          geometry: { type: 'LineString', coordinates: [[-55.92, -27.38], [-55.93, -27.39]] }
        }
      ]
    };

    const calles = transformCalles(rawFeatures as any, [], { features: [] });
    assert.equal(calles.length, 3);
    assert.equal(calles[0].nombreOficial, 'Avenida 171');
    assert.equal(calles[0].slug, 'avenida-171');
    assert.equal(calles[0].numeroCalle, 171);

    assert.equal(calles[1].nombreOficial, 'Avenida 77');
    assert.equal(calles[1].slug, 'avenida-77');
    assert.equal(calles[1].numeroCalle, 77);

    assert.equal(calles[2].nombreOficial, 'Avenida Sin Nombre');
    assert.equal(calles[2].slug, 'avenida-sin-nombre');
    assert.equal(calles[2].numeroCalle, null);

    for (const c of calles) {
      assert.ok(!c.nombreOficial.includes('Avenida Avenida'), 'No debe duplicar prefijo Avenida');
      assert.ok(!c.nombreOficial.includes('Calle Calle'), 'No debe duplicar prefijo Calle');
    }
  });

  test('T-002: Consolidación multi-segmento de arterias (caso Calle Suiza N° 98)', () => {
    const rawSuiza = {
      features: [
        {
          type: 'Feature',
          id: 's1',
          properties: { fid: 181, CALLE: 'CALLE SUIZA(98)', NUM_CALLE: '(98)' },
          geometry: {
            type: 'MultiLineString',
            coordinates: [[[-55.900, -27.360], [-55.905, -27.365]]]
          }
        },
        {
          type: 'Feature',
          id: 's2',
          properties: { fid: 188, CALLE: 'CALLE SUIZA(98)', NUM_CALLE: '(98)' },
          geometry: {
            type: 'MultiLineString',
            coordinates: [[[-55.905, -27.365], [-55.908, -27.368]]]
          }
        }
      ]
    };

    const calles = transformCalles(rawSuiza as any, [], { features: [] });
    assert.equal(calles.length, 1, 'Debe consolidar ambos segmentos en 1 único registro');
    const suiza = calles[0];
    assert.equal(suiza.slug, 'calle-suiza-98');
    assert.equal(suiza.nombreOficial, 'Calle Suiza');
    assert.equal(suiza.numeroCalle, 98);
    assert.equal(suiza.tramos.length, 2, 'Debe registrar 2 tramos individuales');
    assert.equal(suiza.tramos[0].ordenTramo, 1);
    assert.equal(suiza.tramos[1].ordenTramo, 2);
    assert.equal(suiza.geojson.type, 'MultiLineString');
    assert.equal(suiza.geojson.coordinates.length, 2, 'Geometría consolidada debe contener ambos trazos');
    const expectedSum = Math.round((suiza.tramos[0].longitudM + suiza.tramos[1].longitudM) * 100) / 100;
    assert.equal(suiza.longitudTotalM, expectedSum, 'Longitud total debe ser la suma de ambos tramos');
  });

  describe('FEAT-007: Consolidación toponímica de variantes y preservación por homonimia física', () => {
    test('Detección y discriminación de variantes toponímicas (areToponymVariants)', () => {
      // Variantes válidas del mismo nombre
      assert.ok(areToponymVariants('Avenida Arq. Jorge Eduardo Vivanco', 'Avenida Arq. Vivanco'));
      assert.ok(areToponymVariants('Calle Emilio Gottschalk', 'Calle E. Gottschalk'));
      assert.ok(areToponymVariants('Calle Esteban S. Semilla', 'Calle Semilla'));
      assert.ok(areToponymVariants('Calle Esteban Servando Semilla', 'Calle Esteban Semilla'));
      assert.ok(areToponymVariants('Calle Jorge Newbery', 'Calle J. Newbery'));
      assert.ok(areToponymVariants('Calle Maestro Salvador Catalano', 'Calle M. S. Catalano'));
      assert.ok(areToponymVariants('Calle Agrim. Collado Ventura', 'Calle Ventura Collado'));

      // Toponimias distintas sobre el mismo número que NO deben unificarse
      assert.ok(!areToponymVariants('Calle Suiza', 'Calle Santa Ana'));
      assert.ok(!areToponymVariants('Calle Suecia', 'Calle San Javier'));
      assert.ok(!areToponymVariants('Calle Francisco Lesner', 'Calle Semilla'));
      assert.ok(!areToponymVariants('Calle General Paz', 'Calle Maximo Paz'));
      assert.ok(!areToponymVariants('Calle 143', 'Calle Maestro Salvador Catalano'));
      assert.ok(!areToponymVariants('Avenida Eva M. D. de Peron', 'Avenida Isaco Abitbol'));

      // Protección contra colisiones espurias por iniciales intermedias o calles s/n
      assert.ok(!areToponymVariants('Calle Las Campanillas', 'Calle Victor C. Marchesini'));
      assert.ok(!areToponymVariants('Calle Las Clavelinas', 'Calle Victor C. Marchesini'));
      assert.ok(!areToponymVariants('Calle Guatambu', 'Calle Sgto. Ay. Ramon G. Acosta'));
      assert.ok(!areToponymVariants('Calle Mocona', 'Calle Araos Pedro M.'));
      assert.ok(!areToponymVariants('Calle Pasillo', 'Calle P. Morcillo'));
      assert.ok(!areToponymVariants('Calle Neuquen', 'Calle S/N'));
    });

    test('AC-001 & AC-003: Consolidación de variantes de arterias y preservación de tramos (Avenida Vivanco N° 139)', () => {
      const rawVivanco = {
        features: [
          {
            type: 'Feature',
            id: 'v1',
            properties: { fid: 54, avenidas: 'AVENIDA ARQ. JORGE EDUARDO VIVANCO(139)', id: 139 },
            geometry: {
              type: 'LineString',
              coordinates: [[-55.940, -27.350], [-55.940, -27.380]]
            }
          },
          {
            type: 'Feature',
            id: 'v2',
            properties: { fid: 99, avenidas: 'AVENIDA ARQ.VIVANCO(139)', id: 139 },
            geometry: {
              type: 'LineString',
              coordinates: [[-55.940, -27.340], [-55.940, -27.350]]
            }
          }
        ]
      };

      const calles = transformCalles({ features: [] }, [], { features: [] }, rawVivanco as any);
      assert.equal(calles.length, 1, 'Debe fusionar las 2 variantes en 1 única avenida');
      const vivanco = calles[0];
      assert.equal(vivanco.nombreOficial, 'Avenida Arq. Jorge Eduardo Vivanco', 'Debe elegir el nombre oficial más completo');
      assert.equal(vivanco.slug, 'avenida-arq-jorge-eduardo-vivanco-139');
      assert.equal(vivanco.numeroCalle, 139);
      assert.equal(vivanco.tipoVia, 'AVENIDA');
      assert.equal(vivanco.tramos.length, 2, 'Debe registrar 2 tramos individuales');
      assert.equal(vivanco.tramos[0].ordenTramo, 1);
      assert.equal(vivanco.tramos[1].ordenTramo, 2);
      assert.equal(vivanco.geojson.type, 'MultiLineString');
      assert.equal(vivanco.geojson.coordinates.length, 2);
    });

    test('AC-002: Preservación de entidades distintas sobre el mismo número catastral (Calle Suiza vs Calle Santa Ana N° 98)', () => {
      const rawFeatures = {
        features: [
          {
            type: 'Feature',
            id: 's1',
            properties: { fid: 181, CALLE: 'CALLE SUIZA(98)', NUM_CALLE: '(98)' },
            geometry: { type: 'LineString', coordinates: [[-55.900, -27.360], [-55.905, -27.365]] }
          },
          {
            type: 'Feature',
            id: 'sa1',
            properties: { fid: 201, CALLE: 'CALLE SANTA ANA(98)', NUM_CALLE: '(98)' },
            geometry: { type: 'LineString', coordinates: [[-55.910, -27.370], [-55.915, -27.375]] }
          }
        ]
      };

      const calles = transformCalles(rawFeatures as any, [], { features: [] });
      assert.equal(calles.length, 2, 'Deben preservarse como 2 arterias independientes');
      const suiza = calles.find(c => c.slug === 'calle-suiza-98');
      const santaAna = calles.find(c => c.slug === 'calle-santa-ana-98');
      assert.ok(suiza, 'Debe existir calle-suiza-98');
      assert.ok(santaAna, 'Debe existir calle-santa-ana-98');
      assert.equal(suiza?.nombreOficial, 'Calle Suiza');
      assert.equal(santaAna?.nombreOficial, 'Calle Santa Ana');
    });

    test('ERR-001 (Regresión): No fusión indebida por variante ambigua (Juan Perez vs Perez vs Pedro Perez N° 50)', () => {
      const rawFeatures = {
        features: [
          {
            type: 'Feature',
            id: 'jp1',
            properties: { fid: 101, CALLE: 'CALLE JUAN PEREZ(50)', NUM_CALLE: '(50)' },
            geometry: { type: 'LineString', coordinates: [[-55.900, -27.350], [-55.910, -27.350]] }
          },
          {
            type: 'Feature',
            id: 'p1',
            properties: { fid: 102, CALLE: 'CALLE PEREZ(50)', NUM_CALLE: '(50)' },
            geometry: { type: 'LineString', coordinates: [[-55.920, -27.350], [-55.930, -27.350]] }
          },
          {
            type: 'Feature',
            id: 'pp1',
            properties: { fid: 103, CALLE: 'CALLE PEDRO PEREZ(50)', NUM_CALLE: '(50)' },
            geometry: { type: 'LineString', coordinates: [[-55.940, -27.350], [-55.950, -27.350]] }
          }
        ]
      };

      const calles = transformCalles(rawFeatures as any, [], { features: [] });
      assert.equal(calles.length, 3, 'Deben permanecer 3 arterias separadas; Perez no debe forzar la unión de Juan y Pedro');

      const juanPerez = calles.find(c => c.slug === 'calle-juan-perez-50');
      const pedroPerez = calles.find(c => c.slug === 'calle-pedro-perez-50');
      const perez = calles.find(c => c.slug === 'calle-perez-50');

      assert.ok(juanPerez, 'Debe existir calle-juan-perez-50 separada');
      assert.ok(pedroPerez, 'Debe existir calle-pedro-perez-50 separada');
      assert.ok(perez, 'Debe existir calle-perez-50 separada sin asignación arbitraria');

      assert.equal(juanPerez?.nombreOficial, 'Calle Juan Perez');
      assert.equal(pedroPerez?.nombreOficial, 'Calle Pedro Perez');
      assert.equal(perez?.nombreOficial, 'Calle Perez');

      // Verificar que se conservan geometrías, longitudes y atributos de los tramos
      assert.equal(juanPerez?.tramos.length, 1);
      assert.equal(pedroPerez?.tramos.length, 1);
      assert.equal(perez?.tramos.length, 1);
      assert.ok((juanPerez?.longitudTotalM ?? 0) > 0);
      assert.ok((pedroPerez?.longitudTotalM ?? 0) > 0);
      assert.ok((perez?.longitudTotalM ?? 0) > 0);
    });
  });

  describe('FEAT-008: Enriquecimiento de manos únicas y ordenanzas de barrios', () => {
    test('ERR-001 (FEAT-008): isManoUnica discrimina vigencia, identidad toponímica y ausencia de fuente', async () => {
      const { isManoUnica } = await import('../scripts/etl/transform.js');
      const fs = await import('fs');
      const manosUnicasOficial = JSON.parse(fs.readFileSync('data/fixtures/manos_unicas.json', 'utf8'));

      // 1. Positivos respaldados oficialmente con vigente = 'SI'
      assert.equal(isManoUnica('Avenida Francisco de Haro', 'AVENIDA', manosUnicasOficial), true);
      assert.equal(isManoUnica('Avenida Padre Jose F. Rademacher', 'AVENIDA', manosUnicasOficial), true);
      assert.equal(isManoUnica('Avenida General Juan Lavalle', 'AVENIDA', manosUnicasOficial), true);
      assert.equal(isManoUnica('Avenida Santa Catalina', 'AVENIDA', manosUnicasOficial), true);
      assert.equal(isManoUnica('Avenida Centenario', 'AVENIDA', manosUnicasOficial), true);
      assert.equal(isManoUnica('Avenida Blas Parera', 'AVENIDA', manosUnicasOficial), true);
      assert.equal(isManoUnica('Avenida Tambor de Tacuari', 'AVENIDA', manosUnicasOficial), true);
      assert.equal(isManoUnica('Avenida Lopez y Planes', 'AVENIDA', manosUnicasOficial), true);

      // 2. Registro no vigente (vigente: 'NO') no debe producir mano única
      const datosNoVigente = JSON.parse(JSON.stringify(manosUnicasOficial));
      const rademacherFeat = datosNoVigente.features.find((f: any) => f.properties?.NOMB_ === 'AV. RADEMACHER');
      rademacherFeat.properties.vigente = 'NO';
      assert.equal(isManoUnica('Avenida Padre Jose F. Rademacher', 'AVENIDA', datosNoVigente), false);

      // 3. Falsa coincidencia por subcadena / homonimia (AV. LAVALLE no debe coincidir con Avenida Lavalleja)
      assert.equal(isManoUnica('Avenida Lavalleja', 'AVENIDA', manosUnicasOficial), false);
      assert.equal(isManoUnica('Avenida Uruguay', 'AVENIDA', manosUnicasOficial), false);
      assert.equal(isManoUnica('Calle Jujuy', 'CALLE', manosUnicasOficial), false);

      // 4. Ausencia de fuente oficial o inferencia sin respaldo
      assert.equal(isManoUnica('Avenida Francisco de Haro', 'AVENIDA'), false, 'Sin fuente oficial debe dar false');
      assert.equal(isManoUnica('Avenida Corrientes', 'AVENIDA', manosUnicasOficial), false, 'Corrientes no está en manos_unicas oficial');
    });

    test('transformBarrios enriquece ordenanzas normativas desde barriosNormativaData', async () => {
      const { transformBarrios } = await import('../scripts/etl/transform.js');
      const rawBarrios = {
        features: [
          {
            type: 'Feature',
            id: 'b1',
            properties: { fid: 1, nom_barrio: 'Villa Sarita' },
            geometry: {
              type: 'Polygon',
              coordinates: [[[-55.90, -27.36], [-55.89, -27.36], [-55.89, -27.35], [-55.90, -27.35], [-55.90, -27.36]]]
            }
          }
        ]
      };
      const rawNormativa = {
        features: [
          {
            type: 'Feature',
            id: 'bn1',
            properties: { fid: 1, NOMBRE_BARRIO: 'Villa Sarita', ORDENANZA: 'ORD. XII N° 45' },
            geometry: {
              type: 'Polygon',
              coordinates: [[[-55.90, -27.36], [-55.89, -27.36], [-55.89, -27.35], [-55.90, -27.35], [-55.90, -27.36]]]
            }
          }
        ]
      };

      const transformed = transformBarrios(rawBarrios as any, rawNormativa as any);
      assert.equal(transformed.length, 1);
      assert.equal(transformed[0].referenciaOrdenanza, 'ORD. XII N° 45');
    });
  });
});


