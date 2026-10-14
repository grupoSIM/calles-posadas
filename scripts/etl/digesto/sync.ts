import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DigestoNormaRaw, ParsedArticulo, DigestoCalleEntry, SyncReport } from './types.js';
import { parseNorma } from './parser.js';
import { correlateNormasWithStreets, stripAccents, checkToponymAffinity } from './correlator.js';
import { extractRoadType, extractStreetNumber } from '../transform.js';
import { findEditorialEnrichment } from './editorial-data.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface SyncOptions {
  offline?: boolean;
  rawDir?: string;
  fixturesDir?: string;
  normasDir?: string;
}

export function syncDigestoDataset(options: SyncOptions = {}): SyncReport {
  const startTime = Date.now();
  const rootDir = process.cwd();
  const rawDir = options.rawDir || path.resolve(rootDir, 'data', 'raw');
  const fixturesDir = options.fixturesDir || path.resolve(rootDir, 'data', 'fixtures');
  const normasDir = options.normasDir || path.resolve(rawDir, 'digesto', 'normas');

  console.log('--- Sincronización del Pipeline del Digesto Municipal ---');

  // 1. Cargar índice de normas
  const indexPath = path.join(normasDir, 'index.json');
  if (!fs.existsSync(indexPath)) {
    throw new Error(`No se encontró el índice de normas en ${indexPath}`);
  }

  const normasIndex: Array<{
    id: string;
    documento_normativo: string;
    titulo: string;
    url_ordenanza: string;
    procedencia_normativa: string;
    archivo_texto: string;
  }> = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  // 2. Parsear cada norma
  const allParsedArticulos: ParsedArticulo[] = [];
  for (const item of normasIndex) {
    const textPath = path.join(normasDir, item.archivo_texto);
    if (!fs.existsSync(textPath)) {
      console.warn(`Aviso: Archivo de texto ${item.archivo_texto} no encontrado en ${normasDir}`);
      continue;
    }
    const texto = fs.readFileSync(textPath, 'utf-8');
    const normaRaw: DigestoNormaRaw = {
      id: item.id,
      documento_normativo: item.documento_normativo,
      titulo: item.titulo,
      url_ordenanza: item.url_ordenanza,
      procedencia_normativa: item.procedencia_normativa,
      texto
    };

    const parsed = parseNorma(normaRaw);
    console.log(` -> Norma ${item.documento_normativo}: ${parsed.length} artículos parseados.`);
    allParsedArticulos.push(...parsed);
  }

  // 3. Cargar capas de calles y avenidas de referencia para correlación
  let callesData: any = null;
  let avenidasData: any = null;

  const callesRawPath = path.join(rawDir, 'calles.json');
  const callesFixturePath = path.join(fixturesDir, 'calles.json');
  if (fs.existsSync(callesRawPath)) {
    callesData = JSON.parse(fs.readFileSync(callesRawPath, 'utf-8'));
  } else if (fs.existsSync(callesFixturePath)) {
    callesData = JSON.parse(fs.readFileSync(callesFixturePath, 'utf-8'));
  }

  const avenidasRawPath = path.join(rawDir, 'avenidas.json');
  const avenidasFixturePath = path.join(fixturesDir, 'avenidas.json');
  if (fs.existsSync(avenidasRawPath)) {
    avenidasData = JSON.parse(fs.readFileSync(avenidasRawPath, 'utf-8'));
  } else if (fs.existsSync(avenidasFixturePath)) {
    avenidasData = JSON.parse(fs.readFileSync(avenidasFixturePath, 'utf-8'));
  }

  const referenceStreets: Array<{ nombre?: string; nombre_oficial?: string; numero_calle?: number | null; tipo_via?: string }> = [];

  if (callesData && callesData.features) {
    for (const f of callesData.features) {
      const p = f.properties || {};
      const name = p.CALLE || p.nombre || '';
      const num = extractStreetNumber(name, p.NUM_CALLE);
      referenceStreets.push({
        nombre: name,
        numero_calle: num,
        tipo_via: extractRoadType(name)
      });
    }
  }

  if (avenidasData && avenidasData.features) {
    for (const f of avenidasData.features) {
      const p = f.properties || {};
      const name = p.avenidas || p.AVENIDAS || p.AVENIDA || p.CALLE || p.nombre || '';
      const num = extractStreetNumber(name, p.id !== undefined ? String(p.id) : undefined);
      referenceStreets.push({
        nombre: name,
        numero_calle: num,
        tipo_via: extractRoadType(name, 'avenidas')
      });
    }
  }

  // 4. Ejecutar correlación
  const correlation = correlateNormasWithStreets(allParsedArticulos, referenceStreets);
  console.log(` -> Correlación: ${correlation.matched.length} coincidencias, ${correlation.conflicts.length} conflictos.`);

  // 5. Cargar dataset preexistente para preservación editorial
  let existingEntries: DigestoCalleEntry[] = [];
  const digestoRawPath = path.join(rawDir, 'digesto_calles.json');
  const digestoFixturePath = path.join(fixturesDir, 'digesto_calles.json');

  if (fs.existsSync(digestoRawPath)) {
    existingEntries = JSON.parse(fs.readFileSync(digestoRawPath, 'utf-8'));
  } else if (fs.existsSync(digestoFixturePath)) {
    existingEntries = JSON.parse(fs.readFileSync(digestoFixturePath, 'utf-8'));
  }

  // Saneamiento de entradas históricas erróneas (ej. Calle Llamosas N° 12)
  existingEntries = existingEntries.filter(e => {
    if (e.nombre_normalizado?.includes('llamosas') && (e.numero_calle === 12 || extractRoadType(e.nombre_oficial) === 'CALLE')) {
      return false;
    }
    return true;
  });

  // Mapa de preservación editorial por clave única: `${tipo_via}-${numero_calle}-${nombre_normalizado}`
  const editorialMap = new Map<string, { explicacion: string; fuente_biografica?: string; categoria_toponimica: string; nombre_oficial: string; tipo_via: string; numero_calle: number | null }>();
  for (const entry of existingEntries) {
    const tipo = extractRoadType(entry.nombre_oficial);
    const key = `${tipo}-${entry.numero_calle}-${stripAccents(entry.nombre_normalizado)}`;
    if (entry.explicacion && entry.explicacion.trim().length > 0) {
      editorialMap.set(key, {
        explicacion: entry.explicacion,
        fuente_biografica: entry.fuente_biografica,
        categoria_toponimica: entry.categoria_toponimica,
        nombre_oficial: entry.nombre_oficial,
        tipo_via: tipo,
        numero_calle: entry.numero_calle
      });
    }
  }

  // 6. Construir lista unificada
  const resultMap = new Map<string, DigestoCalleEntry>();

  // Primero poblar con las entradas preexistentes
  for (const item of existingEntries) {
    const tipo = extractRoadType(item.nombre_oficial);
    const key = `${tipo}-${item.numero_calle}-${stripAccents(item.nombre_normalizado)}`;
    resultMap.set(key, { ...item });
  }

  // Aplicar las correlaciones confirmadas del pipeline
  for (const match of correlation.matched) {
    const entry = match.entry;
    const tipo = extractRoadType(entry.nombre_oficial);
    const key = `${tipo}-${entry.numero_calle}-${stripAccents(entry.nombre_normalizado)}`;
    
    // Buscar si ya existe por key exacta o por número + tipo de vía con afinidad toponímica estricta
    let target = resultMap.get(key);
    if (!target) {
      for (const [k, v] of resultMap.entries()) {
        const vTipo = extractRoadType(v.nombre_oficial);
        if (v.numero_calle === entry.numero_calle && vTipo === tipo && checkToponymAffinity(entry.nombre_oficial, v.nombre_oficial)) {
          target = v;
          break;
        }
      }
    }

    // Búsqueda editorial estricta: sólo dentro del mismo tipo_via y número vial
    let ed = editorialMap.get(key);
    if (!ed) {
      for (const [k, v] of editorialMap.entries()) {
        if (v.tipo_via === tipo && v.numero_calle === entry.numero_calle && checkToponymAffinity(entry.nombre_oficial, v.nombre_oficial)) {
          ed = v;
          break;
        }
      }
    }

    if (target) {
      target.referencia_ordenanza = entry.referencia_ordenanza;
      target.url_ordenanza = entry.url_ordenanza;
      target.documento_normativo = entry.documento_normativo;
      target.articulo_normativo = entry.articulo_normativo;
      target.estado_normativo = 'CONFIRMADO';
      target.procedencia_normativa = entry.procedencia_normativa;
      target.fecha_consulta = entry.fecha_consulta;
      if (ed) {
        if (ed.explicacion) target.explicacion = ed.explicacion;
        if (ed.fuente_biografica) target.fuente_biografica = ed.fuente_biografica;
        if (ed.categoria_toponimica && ed.categoria_toponimica !== 'OTRO') {
          target.categoria_toponimica = ed.categoria_toponimica;
        }
      }
    } else {
      if (ed) {
        entry.explicacion = ed.explicacion;
        if (ed.fuente_biografica) entry.fuente_biografica = ed.fuente_biografica;
        if (ed.categoria_toponimica) entry.categoria_toponimica = ed.categoria_toponimica;
      } else {
        entry.explicacion = '';
        entry.categoria_toponimica = 'OTRO';
      }
      resultMap.set(key, entry);
    }
  }

  // 6b. Enriquecer entradas sin reseña o con categoría OTRO usando el catálogo editorial curado
  for (const item of resultMap.values()) {
    const tipo = extractRoadType(item.nombre_oficial);
    const enrichment = findEditorialEnrichment(item.nombre_oficial, item.numero_calle, tipo);
    if (enrichment) {
      if (!item.explicacion || item.explicacion.trim() === '') {
        item.explicacion = enrichment.explicacion;
      }
      if (!item.fuente_biografica || item.fuente_biografica.trim() === '') {
        item.fuente_biografica = enrichment.fuente_biografica;
      }
      if (!item.categoria_toponimica || item.categoria_toponimica === 'OTRO') {
        item.categoria_toponimica = enrichment.categoria_toponimica;
      }
    }
  }

  const finalEntries = Array.from(resultMap.values());
  const confirmadas = finalEntries.filter(e => e.estado_normativo === 'CONFIRMADO').length;
  const pendientes = finalEntries.filter(e => e.estado_normativo !== 'CONFIRMADO').length;

  // 7. Guardar en disco (raw y fixtures) de manera reproducible
  fs.writeFileSync(digestoRawPath, JSON.stringify(finalEntries, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(digestoFixturePath, JSON.stringify(finalEntries, null, 2) + '\n', 'utf-8');

  const durationMs = Date.now() - startTime;
  const report: SyncReport = {
    normasProcesadas: normasIndex.length,
    articulosParseados: allParsedArticulos.length,
    arteriasConfirmadas: confirmadas,
    arteriasPendientes: pendientes,
    conflictos: correlation.conflicts.length,
    tiempoMs: durationMs
  };

  console.log(`=== Sincronización exitosa (${(durationMs / 1000).toFixed(2)}s) ===`);
  console.log(`- Normas procesadas: ${report.normasProcesadas}`);
  console.log(`- Artículos parseados: ${report.articulosParseados}`);
  console.log(`- Arterias confirmadas: ${report.arteriasConfirmadas}`);
  console.log(`- Arterias pendientes: ${report.arteriasPendientes}`);
  console.log(`- Conflictos detectados: ${report.conflictos}`);

  return report;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const isOffline = process.argv.includes('--offline');
  const isHarvest = process.argv.includes('--harvest');
  (async () => {
    try {
      if (isHarvest) {
        const { harvestNormasParticulares } = await import('./harvester.js');
        await harvestNormasParticulares(undefined, { offline: isOffline });
      }
      syncDigestoDataset({ offline: isOffline });
    } catch (err) {
      console.error('Error durante la sincronización del Digesto:', err);
      process.exit(1);
    }
  })();
}
