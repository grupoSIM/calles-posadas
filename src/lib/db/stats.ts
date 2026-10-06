import Database from 'better-sqlite3';
import { getDatabase } from './client';

export interface StatsMetrics {
  calles: {
    total: number;
    longitud_total_km: number;
    con_numero: number;
    porcentaje_con_numero: number;
    con_explicacion: number;
    porcentaje_explicacion: number;
    con_ordenanza: number;
    porcentaje_ordenanza: number;
    con_ciclovia: number;
    porcentaje_ciclovia: number;
    longitud_ciclovia_km: number;
  };
  distribucion_tipo_via: {
    tipo: string;
    cantidad: number;
    porcentaje: number;
  }[];
  distribucion_sentido: {
    sentido: string;
    cantidad: number;
    porcentaje: number;
  }[];
  distribucion_toponimica: {
    categoria: string;
    cantidad: number;
    porcentaje: number;
  }[];
  barrios: {
    total: number;
    total_chacras: number;
    total_oficiales: number;
    total_sociales: number;
    total_otros: number;
  };
}

function calcPercentage(count: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((count / total) * 1000) / 10; // 1 decimal ej: 15.4
}

function metersToKm(meters: number): number {
  return Math.round((meters / 1000) * 100) / 100; // 2 decimales ej: 450.25
}

export function getStatsMetrics(customDb?: Database.Database): StatsMetrics {
  const db = customDb || getDatabase();

  // 1. Métricas generales de calles
  const streetStatsSql = `
    SELECT 
      COUNT(*) as total,
      COALESCE(SUM(longitud_total_m), 0) as longitud_total_m,
      COALESCE(SUM(CASE WHEN numero_calle IS NOT NULL THEN 1 ELSE 0 END), 0) as con_numero,
      COALESCE(SUM(CASE WHEN explicacion IS NOT NULL AND length(trim(explicacion)) > 0 THEN 1 ELSE 0 END), 0) as con_explicacion,
      COALESCE(SUM(CASE WHEN (referencia_ordenanza IS NOT NULL AND length(trim(referencia_ordenanza)) > 0) OR (url_ordenanza IS NOT NULL AND length(trim(url_ordenanza)) > 0) THEN 1 ELSE 0 END), 0) as con_ordenanza,
      COALESCE(SUM(CASE WHEN tiene_ciclovia = 1 THEN 1 ELSE 0 END), 0) as con_ciclovia,
      COALESCE(SUM(CASE WHEN tiene_ciclovia = 1 THEN longitud_total_m ELSE 0 END), 0) as longitud_ciclovia_m
    FROM calles
  `;
  const streetStats = db.prepare(streetStatsSql).get() as {
    total: number;
    longitud_total_m: number;
    con_numero: number;
    con_explicacion: number;
    con_ordenanza: number;
    con_ciclovia: number;
    longitud_ciclovia_m: number;
  };

  const totalCalles = streetStats.total;

  // 2. Distribución por tipo de vía
  const tipoViaSql = `
    SELECT tipo_via as tipo, COUNT(*) as cantidad
    FROM calles
    GROUP BY tipo_via
    ORDER BY cantidad DESC
  `;
  const tipoViaRows = db.prepare(tipoViaSql).all() as { tipo: string; cantidad: number }[];
  const distribucion_tipo_via = tipoViaRows.map(r => ({
    tipo: r.tipo,
    cantidad: r.cantidad,
    porcentaje: calcPercentage(r.cantidad, totalCalles)
  }));

  // 3. Distribución por sentido de circulación
  const sentidoSql = `
    SELECT sentido_circulacion as sentido, COUNT(*) as cantidad
    FROM calles
    GROUP BY sentido_circulacion
    ORDER BY cantidad DESC
  `;
  const sentidoRows = db.prepare(sentidoSql).all() as { sentido: string; cantidad: number }[];
  const distribucion_sentido = sentidoRows.map(r => ({
    sentido: r.sentido,
    cantidad: r.cantidad,
    porcentaje: calcPercentage(r.cantidad, totalCalles)
  }));

  // 4. Distribución toponímica
  const toponimiaSql = `
    SELECT categoria_toponimica as categoria, COUNT(*) as cantidad
    FROM calles
    GROUP BY categoria_toponimica
    ORDER BY cantidad DESC
  `;
  const toponimiaRows = db.prepare(toponimiaSql).all() as { categoria: string; cantidad: number }[];
  const distribucion_toponimica = toponimiaRows.map(r => ({
    categoria: r.categoria,
    cantidad: r.cantidad,
    porcentaje: calcPercentage(r.cantidad, totalCalles)
  }));

  // 5. Métricas de barrios y chacras
  const barriosSql = `
    SELECT 
      COUNT(*) as total,
      COALESCE(SUM(CASE WHEN numero_chacra IS NOT NULL THEN 1 ELSE 0 END), 0) as total_chacras,
      COALESCE(SUM(CASE WHEN tipo = 'BARRIO_OFICIAL' THEN 1 ELSE 0 END), 0) as total_oficiales,
      COALESCE(SUM(CASE WHEN tipo = 'BARRIO_SOCIAL' THEN 1 ELSE 0 END), 0) as total_sociales,
      COALESCE(SUM(CASE WHEN tipo NOT IN ('BARRIO_OFICIAL', 'BARRIO_SOCIAL') THEN 1 ELSE 0 END), 0) as total_otros
    FROM barrios
  `;
  const barrioStats = db.prepare(barriosSql).get() as {
    total: number;
    total_chacras: number;
    total_oficiales: number;
    total_sociales: number;
    total_otros: number;
  };

  return {
    calles: {
      total: totalCalles,
      longitud_total_km: metersToKm(streetStats.longitud_total_m),
      con_numero: streetStats.con_numero,
      porcentaje_con_numero: calcPercentage(streetStats.con_numero, totalCalles),
      con_explicacion: streetStats.con_explicacion,
      porcentaje_explicacion: calcPercentage(streetStats.con_explicacion, totalCalles),
      con_ordenanza: streetStats.con_ordenanza,
      porcentaje_ordenanza: calcPercentage(streetStats.con_ordenanza, totalCalles),
      con_ciclovia: streetStats.con_ciclovia,
      porcentaje_ciclovia: calcPercentage(streetStats.con_ciclovia, totalCalles),
      longitud_ciclovia_km: metersToKm(streetStats.longitud_ciclovia_m)
    },
    distribucion_tipo_via,
    distribucion_sentido,
    distribucion_toponimica,
    barrios: {
      total: barrioStats.total,
      total_chacras: barrioStats.total_chacras,
      total_oficiales: barrioStats.total_oficiales,
      total_sociales: barrioStats.total_sociales,
      total_otros: barrioStats.total_otros
    }
  };
}
