import Database from 'better-sqlite3';
import { initDatabase } from './init-db.js';
import { NormalizedBarrio, NormalizedCalle, NormalizedCiclovia } from './transform.js';

export function loadToDatabase(
  db: Database.Database,
  barrios: NormalizedBarrio[],
  calles: NormalizedCalle[],
  ciclovias: NormalizedCiclovia[] = []
): { barriosCount: number; callesCount: number; tramosCount: number; cicloviasCount: number } {
  // Limpiar datos previos si existen
  db.exec('DELETE FROM calle_barrios;');
  db.exec('DELETE FROM tramos_calle;');
  db.exec('DELETE FROM calles;');
  db.exec('DELETE FROM barrios;');
  db.exec('DELETE FROM ciclovias;');

  const insertBarrio = db.prepare(`
    INSERT INTO barrios (
      nombre, tipo, numero_chacra, referencia_ordenanza,
      delegacion, seccion, articulo_ordenanza, superficie_m2, observaciones,
      geojson, min_x, max_x, min_y, max_y
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCalle = db.prepare(`
    INSERT INTO calles (slug, nombre_oficial, nombre_normalizado, numero_calle, tipo_via, sentido_circulacion, longitud_total_m, tiene_ciclovia, tipo_ciclovia, explicacion, referencia_ordenanza, url_ordenanza, categoria_toponimica, aliases, min_x, max_x, min_y, max_y, geojson_traza)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertTramo = db.prepare(`
    INSERT INTO tramos_calle (calle_id, orden_tramo, altura_inicio, altura_fin, barrio_id, numero_chacra, tiene_ciclovia, longitud_m, geojson)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCalleBarrio = db.prepare(`
    INSERT OR IGNORE INTO calle_barrios (calle_id, barrio_id)
    VALUES (?, ?)
  `);

  const insertCiclovia = db.prepare(`
    INSERT INTO ciclovias (nombre, tipo, tramo, ubicacion, anio_instalacion, longitud_km, min_x, max_x, min_y, max_y, geojson)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let tramosCount = 0;

  const transaction = db.transaction(() => {
    // 0. Limpiar datos existentes si se repuebla
    db.exec(`
      DELETE FROM calle_barrios;
      DELETE FROM tramos_calle;
      DELETE FROM calles;
      DELETE FROM barrios;
      DELETE FROM ciclovias;
    `);

    // 1. Cargar Barrios
    const barrioIdMap = new Map<string, number>();
    const barrioIndexMap = new Map<number, number>();
    for (let i = 0; i < barrios.length; i++) {
      const b = barrios[i];
      const result = insertBarrio.run(
        b.nombre,
        b.tipo,
        b.numeroChacra,
        b.referenciaOrdenanza,
        b.delegacion,
        b.seccion,
        b.articuloOrdenanza,
        b.superficieM2,
        b.observaciones,
        JSON.stringify(b.geojson),
        b.bbox[0],
        b.bbox[2],
        b.bbox[1],
        b.bbox[3]
      );
      const insertedId = Number(result.lastInsertRowid);
      barrioIdMap.set(b.originalId, insertedId);
      barrioIndexMap.set(i + 1, insertedId);
    }

    // 2. Cargar Calles
    for (const c of calles) {
      const result = insertCalle.run(
        c.slug,
        c.nombreOficial,
        c.nombreNormalizado,
        c.numeroCalle,
        c.tipoVia,
        c.sentidoCirculacion,
        c.longitudTotalM,
        c.tieneCiclovia ? 1 : 0,
        c.tipoCiclovia,
        c.explicacion,
        c.referenciaOrdenanza,
        c.urlOrdenanza,
        c.categoriaToponimica,
        c.aliases && c.aliases.length > 0 ? JSON.stringify(c.aliases) : null,
        c.bbox[0],
        c.bbox[2],
        c.bbox[1],
        c.bbox[3],
        JSON.stringify(c.geojson)
      );
      const calleId = Number(result.lastInsertRowid);

      // Cargar tramos
      for (const t of c.tramos) {
        const barrioDbId = t.barrioOriginalId ? barrioIdMap.get(t.barrioOriginalId) || null : null;
        insertTramo.run(
          calleId,
          t.ordenTramo,
          t.alturaInicio,
          t.alturaFin,
          barrioDbId,
          t.numeroChacra,
          t.tieneCiclovia ? 1 : 0,
          t.longitudM,
          JSON.stringify(t.geojson)
        );
        tramosCount++;

        if (barrioDbId) {
          insertCalleBarrio.run(calleId, barrioDbId);
        }
      }

      // Cargar relaciones directas con barrios
      for (const bIdx of c.barrioIds) {
        const actualBarrioId = barrioIndexMap.get(bIdx);
        if (actualBarrioId) {
          insertCalleBarrio.run(calleId, actualBarrioId);
        }
      }
    }

    // 3. Cargar Ciclovías (FEAT-012)
    for (const c of ciclovias) {
      insertCiclovia.run(
        c.nombre,
        c.tipo,
        c.tramo,
        c.ubicacion,
        c.anioInstalacion,
        c.longitudKm,
        c.bbox[0],
        c.bbox[2],
        c.bbox[1],
        c.bbox[3],
        JSON.stringify(c.geojson)
      );
    }
  });

  transaction();

  return {
    barriosCount: barrios.length,
    callesCount: calles.length,
    tramosCount,
    cicloviasCount: ciclovias.length
  };
}
