import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface LayerConfig {
  name: string;
  typeName: string;
  filename: string;
}

export const LAYERS: LayerConfig[] = [
  {
    name: 'calles',
    typeName: 'geonode:calles_Posadas1',
    filename: 'calles.json'
  },
  {
    name: 'barrios',
    typeName: 'geonode:barrios_posadas',
    filename: 'barrios.json'
  },
  {
    name: 'bicisendas',
    typeName: 'geonode:bicisendas_ciclovias0',
    filename: 'bicisendas.json'
  },
  {
    name: 'avenidas',
    typeName: 'geonode:Avenidas_',
    filename: 'avenidas.json'
  },
  {
    name: 'manos_unicas',
    typeName: 'geonode:manos_unicas',
    filename: 'manos_unicas.json'
  },
  {
    name: 'barrios_normativa',
    typeName: 'geonode:Barrios_Posadas1',
    filename: 'barrios_normativa.json'
  },
  {
    name: 'digesto_calles',
    typeName: 'digesto:calles_posadas',
    filename: 'digesto_calles.json'
  }
];

const WFS_BASE_URL = 'https://www.ide.posadas.gob.ar/geoserver/wfs';

export async function fetchWfsLayer(typeName: string): Promise<any> {
  const url = `${WFS_BASE_URL}?service=WFS&version=1.0.0&request=GetFeature&typeName=${encodeURIComponent(typeName)}&outputFormat=application/json`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'CallesPosadas-ETL/1.0',
      'Accept': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`Error HTTP al descargar ${typeName}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function extractLayers(options: { offline?: boolean; rawDir?: string; fixturesDir?: string } = {}): Promise<{ [key: string]: any }> {
  const rawDir = options.rawDir || path.resolve(process.cwd(), 'data', 'raw');
  const fixturesDir = options.fixturesDir || path.resolve(process.cwd(), 'data', 'fixtures');
  
  if (!fs.existsSync(rawDir)) {
    fs.mkdirSync(rawDir, { recursive: true });
  }

  const results: { [key: string]: any } = {};

  for (const layer of LAYERS) {
    const rawFilePath = path.join(rawDir, layer.filename);
    const fixtureFilePath = path.join(fixturesDir, layer.filename);

    if (options.offline || layer.typeName.startsWith('digesto:')) {
      if (fs.existsSync(rawFilePath)) {
        console.log(`[${options.offline ? 'Offline' : 'Local'}] Cargando ${layer.name} desde datos raw locales (${rawFilePath})`);
        results[layer.name] = JSON.parse(fs.readFileSync(rawFilePath, 'utf-8'));
      } else if (fs.existsSync(fixtureFilePath)) {
        console.log(`[${options.offline ? 'Offline' : 'Local'}] Cargando ${layer.name} desde fixtures (${fixtureFilePath})`);
        results[layer.name] = JSON.parse(fs.readFileSync(fixtureFilePath, 'utf-8'));
      } else {
        throw new Error(`No se encontró ${layer.filename} en ${rawDir} ni en ${fixturesDir}`);
      }
      continue;
    }

    // Modo online: descargar desde WFS
    console.log(`Descargando capa ${layer.name} (${layer.typeName}) desde IDE Posadas...`);
    try {
      const data = await fetchWfsLayer(layer.typeName);
      fs.writeFileSync(rawFilePath, JSON.stringify(data, null, 2), 'utf-8');
      console.log(` -> Guardado ${layer.filename} (${data.features?.length ?? 0} features)`);
      results[layer.name] = data;
    } catch (err) {
      console.warn(`Aviso: fallo al descargar ${layer.name}: ${(err as Error).message}`);
      // Fallback a archivo previo si existe
      if (fs.existsSync(rawFilePath)) {
        console.log(` -> Usando versión en caché de ${rawFilePath}`);
        results[layer.name] = JSON.parse(fs.readFileSync(rawFilePath, 'utf-8'));
      } else if (fs.existsSync(fixtureFilePath)) {
        console.log(` -> Usando fixture de ${fixtureFilePath}`);
        results[layer.name] = JSON.parse(fs.readFileSync(fixtureFilePath, 'utf-8'));
      } else {
        throw err;
      }
    }
  }

  return results;
}

// Ejecutar si se invoca por CLI
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const isOffline = process.argv.includes('--offline');
  extractLayers({ offline: isOffline })
    .then(() => console.log('Extracción completada exitosamente.'))
    .catch((err) => {
      console.error('Error durante la extracción:', err);
      process.exit(1);
    });
}
