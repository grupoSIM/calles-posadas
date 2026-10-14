import { describe, it } from 'node:test';
import assert from 'node:assert';
import Database from 'better-sqlite3';
import { getStreetBySlug } from '../src/lib/db/streets.js';

describe('FEAT-014: Visualización y selección de trazas unificadas multi-toponímicas por eje/número vial', () => {
  const db = new Database('data/calles.db', { readonly: true });

  it('AC-001: Resuelve corredor vial con múltiples arterias para Avenida Corrientes (Eje 51)', () => {
    const detail = getStreetBySlug('avenida-corrientes-51', db);
    assert.ok(detail, 'Debe existir la arteria avenida-corrientes-51');
    assert.ok(detail.eje_vial, 'Debe incluir información de eje_vial');
    assert.strictEqual(detail.eje_vial.numero_eje, 51);
    assert.strictEqual(detail.eje_vial.tipo_via, 'AVENIDA');
    assert.strictEqual(detail.eje_vial.nombre_eje, 'Eje Avenida N° 51');
    assert.ok(detail.eje_vial.arterias.length >= 4, 'El eje 51 debe contener al menos 4 toponimias');

    // Verificar que Avenida Corrientes sea la activa
    const corrienteArt = detail.eje_vial.arterias.find(a => a.slug === 'avenida-corrientes-51');
    assert.ok(corrienteArt, 'Avenida Corrientes debe estar en la lista de arterias del eje');
    assert.strictEqual(corrienteArt.is_current, true);

    // Verificar que las demás arterias estén presentes y no sean activas
    const rocaArt = detail.eje_vial.arterias.find(a => a.slug === 'avenida-roca-51');
    assert.ok(rocaArt, 'Avenida Roca debe integrar el eje 51');
    assert.strictEqual(rocaArt.is_current, false);

    const haroArt = detail.eje_vial.arterias.find(a => a.slug === 'avenida-francisco-de-haro-51');
    assert.ok(haroArt, 'Avenida Francisco de Haro debe integrar el eje 51');
    assert.strictEqual(haroArt.is_current, false);

    const martinezArt = detail.eje_vial.arterias.find(a => a.slug === 'avenida-ramon-martinez-51' || a.slug === 'avenida-ramon-martirenez-51');
    assert.ok(martinezArt, 'Avenida Ramón Martínez / Martirenez debe integrar el eje 51');
    assert.strictEqual(martinezArt.is_current, false);

    // Verificar geometrías cargadas
    assert.ok(rocaArt.geojson, 'Debe incluir geojson_traza de las arterias del eje');
    assert.ok(detail.eje_vial.longitud_total_eje_m > 4000, 'Longitud acumulada debe ser mayor a 4000m');
  });

  it('AC-001: Resuelve corredor vial para Calle Suiza (Eje Calle 98)', () => {
    const detail = getStreetBySlug('calle-suiza-98', db);
    assert.ok(detail, 'Debe existir calle-suiza-98');
    assert.ok(detail.eje_vial, 'Debe incluir eje_vial');
    assert.strictEqual(detail.eje_vial.numero_eje, 98);
    assert.strictEqual(detail.eje_vial.tipo_via, 'CALLE');

    const santaAna = detail.eje_vial.arterias.find(a => a.slug === 'calle-santa-ana-98');
    assert.ok(santaAna, 'Calle Santa Ana debe formar parte del eje 98');
    assert.strictEqual(santaAna.is_current, false);

    const suiza = detail.eje_vial.arterias.find(a => a.slug === 'calle-suiza-98');
    assert.ok(suiza, 'Calle Suiza debe ser la arteria activa');
    assert.strictEqual(suiza.is_current, true);
  });

  it('AC-001: Retorna eje_vial = null para arterias con número único no compartido', () => {
    const zapiola = getStreetBySlug('avenida-brigadier-general-jose-matias-zapiola-107', db);
    assert.ok(zapiola, 'Debe existir Zapiola N° 107');
    assert.strictEqual(zapiola.eje_vial, null, 'Arteria única no debe tener eje_vial');
  });

  it('AC-001: Retorna eje_vial = null para arterias sin número', () => {
    // Buscar una calle sin número
    const sinNumeroRow = db.prepare('SELECT slug FROM calles WHERE numero_calle IS NULL LIMIT 1').get() as { slug: string } | undefined;
    if (sinNumeroRow) {
      const sinNumero = getStreetBySlug(sinNumeroRow.slug, db);
      assert.ok(sinNumero);
      assert.strictEqual(sinNumero.eje_vial, null, 'Arteria sin número no debe tener eje_vial');
    }
  });

  it('AC-002: Exposición en contrato de objeto de detalle y endpoint HTTP', async () => {
    const detail = getStreetBySlug('avenida-almirante-brown-70', db);
    assert.ok(detail);
    assert.ok(detail.eje_vial);
    assert.strictEqual(detail.eje_vial.numero_eje, 70);
    assert.strictEqual(detail.eje_vial.tipo_via, 'AVENIDA');
    assert.ok(detail.eje_vial.arterias.some(a => a.official_name.includes('Moreno')));

    // Llamada directa al Route Handler HTTP
    const { GET } = await import('../src/app/api/v1/streets/[slug]/route.js');
    const req = new Request('http://localhost:3000/api/v1/streets/avenida-corrientes-51');
    const res = await GET(req, {
      params: Promise.resolve({ slug: 'avenida-corrientes-51' })
    });
    assert.strictEqual(res.status, 200);
    const json = await res.json();
    assert.ok(json.eje_vial, 'El payload JSON de la API debe incluir eje_vial');
    assert.strictEqual(json.eje_vial.numero_eje, 51);
    assert.ok(json.eje_vial.arterias.length >= 4);
  });
});
