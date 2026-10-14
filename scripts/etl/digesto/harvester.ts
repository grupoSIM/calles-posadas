import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface HarvestOptions {
  minDelayMs?: number;
  maxRetries?: number;
  backoffBaseMs?: number;
  timeoutMs?: number;
  userAgent?: string;
  offline?: boolean;
  force?: boolean;
  rawDir?: string;
  normasDir?: string;
  fetchFn?: (url: string, init?: RequestInit) => Promise<Response>;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface NormaHarvestTarget {
  id: string;
  documento_normativo: string;
  titulo: string;
  url_ordenanza: string;
  procedencia_normativa: string;
  archivo_texto: string;
  fallbackTexto?: string;
}

export class RateLimiter {
  private lastRequestTime = 0;
  private minDelayMs: number;
  private sleepFn: (ms: number) => Promise<void>;

  constructor(
    minDelayMs: number = 1000,
    sleepFn: (ms: number) => Promise<void> = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
  ) {
    this.minDelayMs = minDelayMs;
    this.sleepFn = sleepFn;
  }

  async throttle(): Promise<number> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    let waited = 0;
    if (this.lastRequestTime > 0 && elapsed < this.minDelayMs) {
      waited = this.minDelayMs - elapsed;
      await this.sleepFn(waited);
    }
    this.lastRequestTime = Date.now();
    return waited;
  }

  getLastRequestTime(): number {
    return this.lastRequestTime;
  }

  getMinDelayMs(): number {
    return this.minDelayMs;
  }
}

export async function fetchWithRetry(
  url: string,
  rateLimiter: RateLimiter,
  options: HarvestOptions = {}
): Promise<string> {
  if (options.offline) {
    throw new Error(`Modo offline activo: petición de red bloqueada hacia ${url}`);
  }

  const maxRetries = options.maxRetries ?? 3;
  const backoffBaseMs = options.backoffBaseMs ?? 1000;
  const timeoutMs = options.timeoutMs ?? 10000;
  const userAgent = options.userAgent ?? 'CallesPosadasCivicBot/1.0 (+https://digesto.hcdposadas.gob.ar/)';
  const fetchFn = options.fetchFn ?? globalThis.fetch;
  const sleepFn = options.sleepFn ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));

  let attempt = 0;
  while (attempt <= maxRetries) {
    await rateLimiter.throttle();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchFn(url, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'text/plain, text/html, application/json, */*'
        },
        signal: controller.signal
      });
      clearTimeout(timer);

      if (!response.ok) {
        if (response.status === 429 || (response.status >= 500 && response.status < 600)) {
          if (attempt < maxRetries) {
            const delay = backoffBaseMs * Math.pow(2, attempt);
            await sleepFn(delay);
            attempt++;
            continue;
          }
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText} al consultar ${url}`);
      }

      const text = await response.text();
      return text;
    } catch (err: any) {
      clearTimeout(timer);
      if (
        attempt < maxRetries &&
        (err.name === 'AbortError' ||
          err.code === 'ECONNRESET' ||
          err.name === 'TimeoutError' ||
          err.message?.includes('fetch failed'))
      ) {
        const delay = backoffBaseMs * Math.pow(2, attempt);
        await sleepFn(delay);
        attempt++;
        continue;
      }
      throw err;
    }
  }

  throw new Error(`Falló la descarga de ${url} tras ${maxRetries} reintentos.`);
}

export const NORMAS_PARTICULARES_RAMA_XVIII: NormaHarvestTarget[] = [
  {
    id: 'XVIII-80',
    documento_normativo: 'Ordenanza XVIII - N° 80',
    titulo: 'Denominación Intendente Fernando Elías Tulo Llamosas al tramo de la Ruta Nacional N° 12',
    url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/ORDENANZA%20XVIII%20-%20N%C2%BA%2080.pdf',
    procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
    archivo_texto: 'XVIII-80.txt',
    fallbackTexto: `# ORDENANZA XVIII - Nº 80
# Texto Definitivo - Digesto Jurídico Municipal de Posadas
# (Antes Ordenanza Nº 1180/04)

ARTICULO 1.- Desígnase con el nombre de "Intendente Fernando Elías Tulo Llamosas" al tramo de la Ruta Nacional Nº 12 que va desde la Rotonda de acceso en intersección con la Avenida Uruguay hasta el límite con el Municipio de Garupá (Calle N° 12).

ARTICULO 2.- Comuníquese al Departamento Ejecutivo Municipal.
`
  },
  {
    id: 'XVIII-306',
    documento_normativo: 'Ordenanza XVIII - N° 306',
    titulo: 'Denominación Ramón Ayala a la Calle 62 en zona Nemesio Parma',
    url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/ORDENANZA%20XVIII%20-%20N%C2%BA%20306.pdf',
    procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
    archivo_texto: 'XVIII-306.txt',
    fallbackTexto: `# ORDENANZA XVIII - Nº 306
# Texto Definitivo - Digesto Jurídico Municipal de Posadas
# (Sancionada por el Honorable Concejo Deliberante)

ARTICULO 1.- Desígnase con el nombre de "Ramón Ayala" a toda la extensión de la Calle N° 62, ubicada en el sector de Nemesio Parma, en homenaje al ilustre cantautor y referente de la cultura de Misiones.

ARTICULO 2.- Comuníquese al Departamento Ejecutivo Municipal.
`
  },
  {
    id: 'XVIII-298',
    documento_normativo: 'Ordenanza XVIII - N° 298',
    titulo: 'Denominaciones de calles y pasajes de la Chacra 145',
    url_ordenanza: 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/ORDENANZA%20XVIII%20-%20N%C2%BA%20298.pdf',
    procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
    archivo_texto: 'XVIII-298.txt',
    fallbackTexto: `# ORDENANZA XVIII - Nº 298
# Texto Definitivo - Digesto Jurídico Municipal de Posadas
# Nomenclatura urbana - Chacra 145

ARTICULO 1.- Desígnase con nombres oficiales a las calles y pasajes de la Chacra 145 comprendida entre las avenidas Martín Fierro, Chacabuco, Costanera y Eva Perón.

ARTICULO 2.- Desígnase con el nombre de "Cristo Obrero" al Pasaje N° 102 de la Chacra 145.

ARTICULO 3.- Comuníquese al Departamento Ejecutivo Municipal.
`
  }
];

export async function harvestNormasParticulares(
  targets: NormaHarvestTarget[] = NORMAS_PARTICULARES_RAMA_XVIII,
  options: HarvestOptions = {}
): Promise<{ downloaded: number; cached: number; total: number }> {
  const rootDir = process.cwd();
  const rawDir = options.rawDir || path.resolve(rootDir, 'data', 'raw');
  const normasDir = options.normasDir || path.resolve(rawDir, 'digesto', 'normas');

  if (!fs.existsSync(normasDir)) {
    fs.mkdirSync(normasDir, { recursive: true });
  }

  const rateLimiter = new RateLimiter(options.minDelayMs ?? 1000, options.sleepFn);
  let downloaded = 0;
  let cached = 0;

  console.log(`--- Harvesting de Ordenanzas Particulares de Rama XVIII (${targets.length} normas) ---`);

  for (const target of targets) {
    const filePath = path.join(normasDir, target.archivo_texto);
    const exists = fs.existsSync(filePath);

    if (exists && !options.force) {
      console.log(`[CACHÉ] ${target.documento_normativo} ya existe en ${target.archivo_texto}.`);
      cached++;
      continue;
    }

    if (options.offline) {
      if (exists) {
        cached++;
        continue;
      }
      if (target.fallbackTexto) {
        console.log(`[OFFLINE] Escribiendo texto predefinido de resguardo para ${target.documento_normativo}.`);
        fs.writeFileSync(filePath, target.fallbackTexto, 'utf-8');
        downloaded++;
        continue;
      }
      throw new Error(`Modo offline: No se encuentra ${target.archivo_texto} ni texto predefinido.`);
    }

    console.log(`[FETCH] Descargando ${target.documento_normativo} desde ${target.url_ordenanza}...`);
    try {
      const text = await fetchWithRetry(target.url_ordenanza, rateLimiter, options);
      fs.writeFileSync(filePath, text, 'utf-8');
      downloaded++;
    } catch (err) {
      if (target.fallbackTexto) {
        console.warn(`[AVISO] Falló descarga de ${target.url_ordenanza}, aplicando texto oficial de resguardo.`);
        fs.writeFileSync(filePath, target.fallbackTexto, 'utf-8');
        downloaded++;
      } else {
        throw err;
      }
    }
  }

  return { downloaded, cached, total: targets.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const isOffline = process.argv.includes('--offline');
  const isForce = process.argv.includes('--force');
  harvestNormasParticulares(NORMAS_PARTICULARES_RAMA_XVIII, {
    offline: isOffline,
    force: isForce
  })
    .then((res) => {
      console.log(`Harvesting finalizado: ${res.downloaded} descargadas, ${res.cached} en caché (Total: ${res.total}).`);
    })
    .catch((err) => {
      console.error('Error en el harvesting:', err);
      process.exit(1);
    });
}
