import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  extractStreetNumber,
  extractRoadType,
  generateSlug,
  toTitleCase,
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
});
