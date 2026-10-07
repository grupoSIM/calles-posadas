import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initDatabase } from './init-db.js';
import { extractLayers } from './extract.js';
import { transformBarrios, transformCalles } from './transform.js';
import { loadToDatabase } from './load.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runETL(options: { offline?: boolean; dbPath?: string } = {}) {
  const startTime = Date.now();
  console.log('=== Iniciando Pipeline ETL Calles de Posadas ===');

  // 1. Extraer o cargar capas
  const layers = await extractLayers({ offline: options.offline });

  // 2. Transformar capas
  console.log('Transformando barrios y chacras...');
  const barrios = transformBarrios(layers.barrios, layers.barrios_normativa);
  console.log(` -> ${barrios.length} barrios y chacras procesados.`);

  console.log('Transformando calles y avenidas, calculando longitudes y cruces espaciales...');
  const calles = transformCalles(layers.calles, barrios, layers.bicisendas, layers.avenidas, layers.manos_unicas, layers.digesto_calles);
  console.log(` -> ${calles.length} calles y avenidas procesadas.`);

  // 3. Inicializar y cargar base de datos
  const dbPath = options.dbPath || path.resolve(process.cwd(), 'data', 'calles.db');
  console.log(`Cargando registros en SQLite (${dbPath})...`);
  const db = initDatabase(dbPath);

  const stats = loadToDatabase(db, barrios, calles);
  db.close();

  const durationMs = Date.now() - startTime;
  console.log('=== Pipeline ETL finalizado exitosamente ===');
  console.log(`- Barrios y Chacras: ${stats.barriosCount}`);
  console.log(`- Calles y Avenidas: ${stats.callesCount}`);
  console.log(`- Tramos geométricos: ${stats.tramosCount}`);
  console.log(`- Tiempo total: ${(durationMs / 1000).toFixed(2)}s`);

  return stats;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const isOffline = process.argv.includes('--offline');
  runETL({ offline: isOffline }).catch((err) => {
    console.error('Error ejecutando ETL:', err);
    process.exit(1);
  });
}
