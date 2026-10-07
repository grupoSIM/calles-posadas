import Database from 'better-sqlite3';
import { getDatabase } from './client';

export interface SearchStreetsParams {
  q?: string;
  barrioId?: number;
  chacra?: number;
  roadType?: string;
  hasCycleway?: boolean;
  page?: number;
  limit?: number;
}

export interface CalleSummary {
  id: number;
  slug: string;
  official_name: string;
  street_number: number | null;
  road_type: string;
  traffic_direction: string;
  total_length_m: number;
  has_cycleway: boolean;
  preview_explanation: string | null;
  barrios: string[];
  toponym_category?: string;
}

export interface SearchStreetsResult {
  total: number;
  page: number;
  limit: number;
  data: CalleSummary[];
}

export interface CalleDetail {
  id: number;
  slug: string;
  official_name: string;
  street_number: number | null;
  road_type: string;
  traffic_direction: string;
  total_length_m: number;
  has_cycleway: boolean;
  cycleway_type: string | null;
  explanation: string | null;
  toponym_category?: string;
  ordinance: {
    reference: string | null;
    url: string | null;
  } | null;
  geojson: any;
  barrios: string[];
  tramos: {
    orden: number;
    altura_inicio: number | null;
    altura_fin: number | null;
    tiene_ciclovia: boolean;
    longitud_m: number;
    geojson?: any;
  }[];
}

export interface BarrioSummary {
  id: number;
  name: string;
  type: string;
  chacra_number: number | null;
}

// Sanitizar términos para FTS5
export function sanitizeFtsQuery(q?: string): string | null {
  if (!q) return null;
  // Quitar caracteres de control de FTS5
  const clean = q.replace(/["*^:(){}\[\]\-+~]/g, ' ').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return null;
  // Crear búsqueda por prefijo para cada palabra (AND implícito)
  return words.map(w => `"${w}"*`).join(' ');
}

export function searchStreets(params: SearchStreetsParams, customDb?: Database.Database): SearchStreetsResult {
  const db = customDb || getDatabase();
  
  const page = Math.max(1, Number(params.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(params.limit) || 20));
  const offset = (page - 1) * limit;

  const ftsQuery = sanitizeFtsQuery(params.q);

  const whereConditions: string[] = [];
  const queryArgs: any[] = [];

  // FTS5 JOIN si hay término de búsqueda
  let fromClause = 'FROM calles c';
  if (ftsQuery) {
    fromClause = 'FROM calles_fts f JOIN calles c ON c.id = f.rowid';
    whereConditions.push('calles_fts MATCH ?');
    queryArgs.push(ftsQuery);
  }

  // Filtro por tipo de vía
  if (params.roadType) {
    whereConditions.push('c.tipo_via = ?');
    queryArgs.push(params.roadType.toUpperCase());
  }

  // Filtro por ciclovía
  if (params.hasCycleway !== undefined) {
    whereConditions.push('c.tiene_ciclovia = ?');
    queryArgs.push(params.hasCycleway ? 1 : 0);
  }

  // Filtro por barrio ID
  if (params.barrioId !== undefined && !isNaN(params.barrioId)) {
    whereConditions.push('EXISTS (SELECT 1 FROM calle_barrios cb WHERE cb.calle_id = c.id AND cb.barrio_id = ?)');
    queryArgs.push(params.barrioId);
  }

  // Filtro por número de chacra
  if (params.chacra !== undefined && !isNaN(params.chacra)) {
    whereConditions.push(`
      EXISTS (
        SELECT 1 FROM calle_barrios cb 
        JOIN barrios b ON b.id = cb.barrio_id 
        WHERE cb.calle_id = c.id AND b.numero_chacra = ?
      )
    `);
    queryArgs.push(params.chacra);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  // 1. Conteo total
  const countSql = `SELECT COUNT(DISTINCT c.id) as total ${fromClause} ${whereClause}`;
  const countRow = db.prepare(countSql).get(...queryArgs) as { total: number };
  const total = countRow ? countRow.total : 0;

  // 2. Consulta de datos
  const orderByClause = ftsQuery ? 'ORDER BY rank, c.nombre_oficial ASC' : 'ORDER BY c.nombre_oficial ASC';
  const dataSql = `
    SELECT 
      c.id,
      c.slug,
      c.nombre_oficial,
      c.numero_calle,
      c.tipo_via,
      c.sentido_circulacion,
      c.longitud_total_m,
      c.tiene_ciclovia,
      c.explicacion,
      c.categoria_toponimica,
      (
        SELECT GROUP_CONCAT(b.nombre, '|||')
        FROM calle_barrios cb
        JOIN barrios b ON b.id = cb.barrio_id
        WHERE cb.calle_id = c.id
      ) as barrios_list
    ${fromClause}
    ${whereClause}
    ${orderByClause}
    LIMIT ? OFFSET ?
  `;

  const rows = db.prepare(dataSql).all(...queryArgs, limit, offset) as any[];

  const data: CalleSummary[] = rows.map(r => ({
    id: r.id,
    slug: r.slug,
    official_name: r.nombre_oficial,
    street_number: r.numero_calle,
    road_type: r.tipo_via,
    traffic_direction: r.sentido_circulacion,
    total_length_m: r.longitud_total_m,
    has_cycleway: r.tiene_ciclovia === 1,
    preview_explanation: r.explicacion ? r.explicacion.slice(0, 150) + '...' : null,
    barrios: r.barrios_list ? r.barrios_list.split('|||') : [],
    toponym_category: r.categoria_toponimica || 'OTRO'
  }));

  return {
    total,
    page,
    limit,
    data
  };
}

export function getStreetBySlug(slug: string, customDb?: Database.Database): CalleDetail | null {
  const db = customDb || getDatabase();

  const streetSql = `
    SELECT 
      c.id,
      c.slug,
      c.nombre_oficial,
      c.numero_calle,
      c.tipo_via,
      c.sentido_circulacion,
      c.longitud_total_m,
      c.tiene_ciclovia,
      c.tipo_ciclovia,
      c.explicacion,
      c.referencia_ordenanza,
      c.url_ordenanza,
      c.categoria_toponimica,
      c.geojson_traza
    FROM calles c
    WHERE c.slug = ?
  `;

  const street = db.prepare(streetSql).get(slug) as any;
  if (!street) return null;

  // Obtener barrios asociados
  const barriosSql = `
    SELECT b.nombre
    FROM calle_barrios cb
    JOIN barrios b ON b.id = cb.barrio_id
    WHERE cb.calle_id = ?
    ORDER BY b.nombre ASC
  `;
  const barriosRows = db.prepare(barriosSql).all(street.id) as { nombre: string }[];
  const barrios = barriosRows.map(b => b.nombre);

  // Obtener tramos
  const tramosSql = `
    SELECT 
      t.orden_tramo,
      t.altura_inicio,
      t.altura_fin,
      t.tiene_ciclovia,
      t.longitud_m,
      t.geojson
    FROM tramos_calle t
    WHERE t.calle_id = ?
    ORDER BY t.orden_tramo ASC
  `;
  const tramosRows = db.prepare(tramosSql).all(street.id) as any[];
  const tramos = tramosRows.map(t => {
    let tramoGeojson = null;
    try {
      tramoGeojson = t.geojson ? JSON.parse(t.geojson) : null;
    } catch {
      tramoGeojson = null;
    }
    return {
      orden: t.orden_tramo,
      altura_inicio: t.altura_inicio,
      altura_fin: t.altura_fin,
      tiene_ciclovia: t.tiene_ciclovia === 1,
      longitud_m: t.longitud_m,
      geojson: tramoGeojson
    };
  });

  let geojson = null;
  try {
    geojson = JSON.parse(street.geojson_traza);
  } catch {
    geojson = null;
  }

  return {
    id: street.id,
    slug: street.slug,
    official_name: street.nombre_oficial,
    street_number: street.numero_calle,
    road_type: street.tipo_via,
    traffic_direction: street.sentido_circulacion,
    total_length_m: street.longitud_total_m,
    has_cycleway: street.tiene_ciclovia === 1,
    cycleway_type: street.tipo_ciclovia,
    explanation: street.explicacion,
    toponym_category: street.categoria_toponimica || 'OTRO',
    ordinance: street.referencia_ordenanza || street.url_ordenanza ? {
      reference: street.referencia_ordenanza,
      url: street.url_ordenanza
    } : null,
    geojson,
    barrios,
    tramos
  };
}

export function listBarrios(customDb?: Database.Database): BarrioSummary[] {
  const db = customDb || getDatabase();

  const sql = `
    SELECT id, nombre, tipo, numero_chacra
    FROM barrios
    ORDER BY nombre ASC
  `;

  const rows = db.prepare(sql).all() as any[];
  return rows.map(r => ({
    id: r.id,
    name: r.nombre,
    type: r.tipo,
    chacra_number: r.numero_chacra
  }));
}

export interface BarriosGeoJsonParams {
  id?: number;
  q?: string;
}

export interface BarrioGeoJsonFeature {
  type: 'Feature';
  id: number;
  properties: {
    id: number;
    nombre: string;
    tipo: string;
    numero_chacra: number | null;
    referencia_ordenanza: string | null;
  };
  geometry: any;
}

export interface BarriosFeatureCollection {
  type: 'FeatureCollection';
  features: BarrioGeoJsonFeature[];
}

export function getBarriosGeoJson(
  params: BarriosGeoJsonParams = {},
  customDb?: Database.Database
): BarriosFeatureCollection {
  const db = customDb || getDatabase();

  const whereConditions: string[] = [];
  const queryArgs: any[] = [];

  if (params.id) {
    whereConditions.push('id = ?');
    queryArgs.push(Number(params.id));
  }

  if (params.q) {
    const qClean = params.q.trim();
    const chacraNum = parseInt(qClean.replace(/\D/g, ''), 10);
    if (!isNaN(chacraNum)) {
      whereConditions.push('(nombre LIKE ? OR numero_chacra = ?)');
      queryArgs.push(`%${qClean}%`, chacraNum);
    } else {
      whereConditions.push('nombre LIKE ?');
      queryArgs.push(`%${qClean}%`);
    }
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
  const sql = `
    SELECT id, nombre, tipo, numero_chacra, referencia_ordenanza, geojson
    FROM barrios
    ${whereClause}
    ORDER BY nombre ASC
  `;

  const rows = db.prepare(sql).all(...queryArgs) as any[];

  const features: BarrioGeoJsonFeature[] = rows.map((r) => {
    let geom = null;
    try {
      geom = JSON.parse(r.geojson);
    } catch {
      geom = null;
    }
    return {
      type: 'Feature',
      id: r.id,
      properties: {
        id: r.id,
        nombre: r.nombre,
        tipo: r.tipo,
        numero_chacra: r.numero_chacra,
        referencia_ordenanza: r.referencia_ordenanza,
      },
      geometry: geom,
    };
  });

  return {
    type: 'FeatureCollection',
    features,
  };
}

