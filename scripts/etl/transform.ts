import * as turf from '@turf/turf';

export interface RawCalleFeature {
  type: string;
  id: string;
  geometry: any;
  properties: {
    fid?: number;
    id?: number;
    CALLE?: string;
    NUM_CALLE?: string;
    avenidas?: string;
    [key: string]: any;
  };
}

export interface RawBarrioFeature {
  type: string;
  id: string;
  geometry: any;
  properties: {
    fid?: number;
    nom_barrio?: string;
    [key: string]: any;
  };
}

export interface RawBicisendaFeature {
  type: string;
  id: string;
  geometry: any;
  properties: {
    id_1?: number;
    id?: number;
    Nombre?: string;
    Tramo?: string;
    Ubicacion?: string;
    [key: string]: any;
  };
}

export interface NormalizedBarrio {
  originalId: string;
  nombre: string;
  tipo: 'BARRIO_OFICIAL' | 'BARRIO_SOCIAL' | 'CHACRA' | 'OTRO';
  numeroChacra: number | null;
  referenciaOrdenanza: string | null;
  geojson: any;
  bbox: [number, number, number, number]; // minX, minY, maxX, maxY
}

export interface NormalizedCalle {
  originalId: string;
  slug: string;
  nombreOficial: string;
  nombreNormalizado: string;
  numeroCalle: number | null;
  tipoVia: 'AVENIDA' | 'CALLE' | 'PASAJE' | 'DIAGONAL' | 'COSTANERA';
  sentidoCirculacion: 'MANO_UNICA' | 'DOBLE' | 'PEATONAL';
  longitudTotalM: number;
  tieneCiclovia: boolean;
  tipoCiclovia: string | null;
  explicacion: string | null;
  referenciaOrdenanza: string | null;
  urlOrdenanza: string | null;
  categoriaToponimica: string;
  bbox: [number, number, number, number];
  geojson: any;
  barrioIds: Set<number>;
  tramos: NormalizedTramo[];
}

export interface NormalizedTramo {
  ordenTramo: number;
  alturaInicio: number | null;
  alturaFin: number | null;
  barrioOriginalId: string | null;
  numeroChacra: number | null;
  tieneCiclovia: boolean;
  longitudM: number;
  geojson: any;
}

// Limpiar diacríticos y caracteres especiales para slugs y búsqueda
export function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function generateSlug(name: string, number?: number | null): string {
  let clean = stripAccents(name)
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  if (number && !clean.includes(String(number))) {
    clean = `${clean}-${number}`;
  }

  return clean || 'calle-sin-nombre';
}

// Convertir nombres en Title Case adecuado
export function toTitleCase(str: string): string {
  if (!str) return '';
  const preposiciones = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en']);
  return str
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      if (index > 0 && preposiciones.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

// Extraer número de arteria
export function extractStreetNumber(rawName: string, numCalleProp?: string): number | null {
  if (numCalleProp) {
    const match = numCalleProp.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }

  if (rawName) {
    // Buscar patrones como (115), (77B), N° 115, o " 115"
    const parenMatch = rawName.match(/\((\d+)/);
    if (parenMatch) return parseInt(parenMatch[1], 10);

    const numMatch = rawName.match(/(?:calle|av\.?|avenida|pje\.?|pasaje|diagonal)\s+(\d+)\b/i);
    if (numMatch) return parseInt(numMatch[1], 10);
  }

  return null;
}

// Extraer tipo de vía
export function extractRoadType(name: string): 'AVENIDA' | 'CALLE' | 'PASAJE' | 'DIAGONAL' | 'COSTANERA' {
  const upper = name.toUpperCase();
  if (/^AV(?:ENIDA|\.|\b)/.test(upper) || upper.includes('AVENIDA') || upper.includes('ANENIDA')) return 'AVENIDA';
  if (/^P(?:ASAJE|JE\.?|\b)/.test(upper) || upper.includes('PASAJE')) return 'PASAJE';
  if (/^DIAG(?:ONAL|\.|\b)/.test(upper) || upper.includes('DIAGONAL')) return 'DIAGONAL';
  if (upper.includes('COSTANERA')) return 'COSTANERA';
  return 'CALLE';
}

export const TOPONYM_STOPWORDS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'en', '1ra', '1ro', '2da', '2do', '3ra', '3ro']);

export const TOPONYM_ABBREVIATIONS = new Map<string, string>([
  ['arq', 'arquitecto'],
  ['dr', 'doctor'],
  ['dra', 'doctora'],
  ['ing', 'ingeniero'],
  ['prof', 'profesor'],
  ['mstro', 'maestro'],
  ['agrim', 'agrimensor'],
  ['sgto', 'sargento'],
  ['tte', 'teniente'],
  ['cap', 'capitan'],
  ['cmte', 'comandante'],
  ['cte', 'comandante'],
  ['gral', 'general'],
  ['almte', 'almirante'],
  ['gdor', 'gobernador'],
  ['gob', 'gobernador'],
  ['sto', 'subteniente'],
  ['prol', 'prolongacion']
]);

export function getToponymTokens(name: string): string[] {
  const core = name.replace(/^(Avenida|Calle|Pasaje|Diagonal|Costanera)\s+/i, '').trim();
  return stripAccents(core).replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
}

export function isNumericOrUnnamed(name: string): boolean {
  const core = name.replace(/^(Avenida|Calle|Pasaje|Diagonal|Costanera)\s+/i, '').trim();
  const clean = stripAccents(core).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.length === 0) return true;
  if (/^\d+$/.test(clean)) return true;
  if (clean === 'sinnombre' || clean === 'sn') return true;
  if (core.toLowerCase().includes('sin nombre') || /\bs\s*\/\s*n\b/i.test(core) || /\bsn\b/i.test(core)) return true;
  return false;
}

export function isTokenAbbreviation(shortTok: string, longTok: string): boolean {
  if (shortTok === longTok) return true;
  if (shortTok.length === 1 && longTok.length > 1 && longTok.startsWith(shortTok)) return true;
  if (TOPONYM_ABBREVIATIONS.get(shortTok) === longTok) return true;
  if (TOPONYM_ABBREVIATIONS.has(shortTok) && TOPONYM_ABBREVIATIONS.get(shortTok) === TOPONYM_ABBREVIATIONS.get(longTok)) return true;
  return false;
}

export function isNameVariantOf(S: string[], L: string[]): boolean {
  if (S.length > L.length) return false;
  const usedL = new Set<number>();
  let substantiveMatched = 0;

  for (const s of S) {
    if (TOPONYM_STOPWORDS.has(s)) continue;

    let matchedIdx = -1;
    for (let i = 0; i < L.length; i++) {
      if (usedL.has(i)) continue;
      const l = L[i];

      if (isTokenAbbreviation(s, l)) {
        matchedIdx = i;
        if (s.length >= 3 && l.length >= 3 && s === l && !TOPONYM_ABBREVIATIONS.has(s) && !TOPONYM_STOPWORDS.has(s)) {
          substantiveMatched++;
        }
        break;
      }
    }

    if (matchedIdx === -1) {
      return false;
    }

    usedL.add(matchedIdx);
  }

  return substantiveMatched > 0;
}

export function areToponymVariants(nameA: string, nameB: string): boolean {
  if (isNumericOrUnnamed(nameA) || isNumericOrUnnamed(nameB)) return false;
  const tA = getToponymTokens(nameA);
  const tB = getToponymTokens(nameB);
  if (tA.length === 0 || tB.length === 0) return false;

  return isNameVariantOf(tA, tB) || isNameVariantOf(tB, tA);
}

export function getNameScore(name: string): number {
  const core = name.replace(/^(Avenida|Calle|Pasaje|Diagonal|Costanera)\s+/i, '').trim();
  const tokens = stripAccents(core).replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(Boolean);
  let score = 0;
  for (const t of tokens) {
    if (TOPONYM_STOPWORDS.has(t)) continue;
    if (t.length > 2) score += 10;
    else if (t.length === 2) score += 5;
    else score += 1;
  }
  return score * 1000 + name.length;
}

export function hasValidCoordinates(geom: any): boolean {
  if (!geom || !geom.coordinates || !Array.isArray(geom.coordinates)) return false;
  if (geom.coordinates.length === 0) return false;
  let current = geom.coordinates;
  while (Array.isArray(current) && current.length > 0 && Array.isArray(current[0])) {
    current = current[0];
  }
  return current.length >= 2 && typeof current[0] === 'number' && isFinite(current[0]) && typeof current[1] === 'number' && isFinite(current[1]);
}

// Normalizar capa de barrios
export function transformBarrios(
  barriosData: { features: RawBarrioFeature[] },
  barriosNormativaData?: { features: any[] }
): NormalizedBarrio[] {
  const validFeatures = (barriosData.features || []).filter(f => hasValidCoordinates(f.geometry));

  // Mapa de ordenanzas por nombre normalizado
  const ordenanzasByName = new Map<string, string>();
  const cleanKey = (s: string) =>
    stripAccents(s).toLowerCase().replace(/[^a-z0-9]/g, '');

  if (barriosNormativaData?.features) {
    for (const feat of barriosNormativaData.features) {
      const nombre = feat.properties?.NOMBRE_BARRIO;
      const ordenanza = feat.properties?.ORDENANZA;
      if (nombre && ordenanza) {
        ordenanzasByName.set(cleanKey(nombre), ordenanza.trim());
      }
    }
  }

  return validFeatures.map((feat, index) => {
    const rawName = (feat.properties?.nom_barrio || `Barrio ${index + 1}`).trim();
    const upper = rawName.toUpperCase();
    
    let tipo: 'BARRIO_OFICIAL' | 'BARRIO_SOCIAL' | 'CHACRA' | 'OTRO' = 'BARRIO_OFICIAL';
    let numeroChacra: number | null = null;

    const chacraMatch = upper.match(/CHACRA\s*N?[°º]?\s*(\d+)/i);
    if (chacraMatch) {
      tipo = 'CHACRA';
      numeroChacra = parseInt(chacraMatch[1], 10);
    }

    const bboxRaw = turf.bbox(feat as any);
    const bbox: [number, number, number, number] = [bboxRaw[0], bboxRaw[1], bboxRaw[2], bboxRaw[3]];

    // Buscar ordenanza por nombre o cruce espacial
    let referenciaOrdenanza: string | null = ordenanzasByName.get(cleanKey(rawName)) || null;

    if (!referenciaOrdenanza && barriosNormativaData?.features) {
      try {
        const centroid = turf.pointOnFeature(feat as any);
        for (const bNorm of barriosNormativaData.features) {
          if (bNorm.properties?.ORDENANZA && bNorm.geometry && hasValidCoordinates(bNorm.geometry)) {
            if (turf.booleanPointInPolygon(centroid, { type: 'Feature', geometry: bNorm.geometry, properties: {} })) {
              referenciaOrdenanza = bNorm.properties.ORDENANZA.trim();
              break;
            }
          }
        }
      } catch {}
    }

    return {
      originalId: feat.id || `barrio-${index + 1}`,
      nombre: toTitleCase(rawName),
      tipo,
      numeroChacra,
      referenciaOrdenanza,
      geojson: feat.geometry,
      bbox
    };
  });
}

// Determinar si una arteria es de mano única según la capa oficial de la IDE Posadas o toponimia consolidada
export function isManoUnica(
  cleanName: string,
  tipoVia: string,
  manosUnicasData?: { features: any[] }
): boolean {
  const normName = stripAccents(cleanName).toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();

  // Avenidas de mano única consolidadas históricamente en Posadas (ej. Av. Corrientes)
  if (normName.includes('corrientes') && tipoVia === 'AVENIDA') {
    return true;
  }

  const knownAvenues = [
    'francisco de haro',
    'rademacher',
    'centenario',
    'blas parera',
    'tambor de tacuari',
    'lopez y planes',
    'lavalle',
    'santa catalina'
  ];

  if (!manosUnicasData?.features || manosUnicasData.features.length === 0) {
    if (tipoVia === 'AVENIDA') {
      return knownAvenues.some(kw => normName.includes(kw));
    }
    return false;
  }

  for (const feat of manosUnicasData.features) {
    const rawNomb = feat.properties?.NOMB_ || '';
    if (!rawNomb) continue;
    const cleanNomb = stripAccents(rawNomb).toLowerCase().replace(/^(av|avenida|calle)\s+/, '').replace(/[^a-z0-9]/g, ' ').trim();
    const tokens = cleanNomb.split(/\s+/).filter(w => !TOPONYM_STOPWORDS.has(w));
    if (tokens.length === 0) continue;

    if (tokens.length === 1 && normName.includes(tokens[0])) {
      return true;
    }
    if (tokens.length > 1 && tokens.every(tok => normName.includes(tok))) {
      return true;
    }
  }

  return false;
}

export interface DigestoCalleEntry {
  nombre_oficial: string;
  nombre_normalizado: string;
  numero_calle?: number | null;
  referencia_ordenanza: string;
  url_ordenanza: string;
  explicacion: string;
  categoria_toponimica: string;
}

export function findDigestoEntry(
  cleanName: string,
  nombreNormalizado: string,
  numeroCalle: number | null,
  digestoEntries?: DigestoCalleEntry[] | { [key: string]: any }
): DigestoCalleEntry | null {
  if (!digestoEntries) return null;
  const list: DigestoCalleEntry[] = Array.isArray(digestoEntries)
    ? digestoEntries
    : ((digestoEntries as any).features || (digestoEntries as any).data || []);
  if (!list || list.length === 0) return null;

  const normClean = stripAccents(cleanName.toLowerCase().trim());
  const normNorm = stripAccents(nombreNormalizado.toLowerCase().trim());

  // 1. Coincidencia directa por nombre normalizado u oficial
  for (const entry of list) {
    const entryNorm = stripAccents((entry.nombre_normalizado || '').toLowerCase().trim());
    const entryOficial = stripAccents((entry.nombre_oficial || '').toLowerCase().trim());
    if (entryNorm === normNorm || entryOficial === normClean || entryNorm === normClean || entryOficial === normNorm) {
      return entry;
    }
  }

  // 2. Coincidencia por número de calle si ambos lo poseen y hay afinidad toponímica
  if (numeroCalle !== null) {
    for (const entry of list) {
      if (entry.numero_calle === numeroCalle) {
        const entryBase = stripAccents((entry.nombre_normalizado || '').replace(/^(avenida|calle|pasaje)\s+/, '').trim());
        const targetBase = stripAccents(normNorm.replace(/^(avenida|calle|pasaje)\s+/, '').trim());
        if (targetBase && entryBase && (targetBase.includes(entryBase) || entryBase.includes(targetBase))) {
          return entry;
        }
      }
    }
  }

  return null;
}

// Normalizar capa de calles y avenidas con cruces espaciales
export function transformCalles(
  callesData: { features: RawCalleFeature[] },
  barrios: NormalizedBarrio[],
  bicisendasData: { features: RawBicisendaFeature[] },
  avenidasData?: { features: RawCalleFeature[] },
  manosUnicasData?: { features: any[] },
  digestoCallesData?: DigestoCalleEntry[] | { [key: string]: any }
): NormalizedCalle[] {
  // Pre-computar buffers o geometrías de bicisendas para cruce rápido
  const bicisendaFeatures = (bicisendasData?.features || []).filter(f => hasValidCoordinates(f.geometry));
  
  // Unificar calles y avenidas
  const allFeatures = [
    ...(callesData?.features || []),
    ...(avenidasData?.features || [])
  ];

  // Filtrar con geometría válida
  const validCalles = allFeatures.filter(f => hasValidCoordinates(f.geometry));

  // Agrupar features por clave canónica (nombre normalizado + número de calle)
  interface FeatureGroup {
    key: string;
    cleanName: string;
    nombreNormalizado: string;
    numeroCalle: number | null;
    tipoVia: 'AVENIDA' | 'CALLE' | 'PASAJE' | 'DIAGONAL' | 'COSTANERA';
    features: RawCalleFeature[];
  }

  const groupsMap = new Map<string, FeatureGroup>();

  for (const feat of validCalles) {
    const rawCalle = feat.properties?.CALLE || feat.properties?.avenidas || feat.properties?.AVENIDAS || '';
    const rawNumCalle = feat.properties?.NUM_CALLE || (feat.properties?.id ? `(${feat.properties.id})` : '');

    const numeroCalle = extractStreetNumber(rawCalle, rawNumCalle);
    const tipoVia = extractRoadType(rawCalle);

    // Limpiar nombre: separar prefijos pegados, remover códigos parentizados, prefijos redundantes y normalizar puntos
    let cleanName = rawCalle
      .replace(/^(CALLE|AVENIDA|ANENIDA|PASAJE|DIAGONAL|COSTANERA)(?=[A-Za-z])/i, '$1 ')
      .replace(/\([^)]*\)?/g, ' ')
      .replace(/^((CALLE|AVENIDA|AV\b\.?|ANENIDA|PASAJE|PJE\b\.?|DIAGONAL|COSTANERA)(\s+|$))+/i, '')
      .replace(/\.([a-zA-Z])/g, '. $1')
      .trim();

    const prefix = tipoVia === 'AVENIDA' ? 'Avenida' : tipoVia === 'PASAJE' ? 'Pasaje' : tipoVia === 'DIAGONAL' ? 'Diagonal' : tipoVia === 'COSTANERA' ? 'Costanera' : 'Calle';

    if (!cleanName) {
      cleanName = numeroCalle ? `${prefix} ${numeroCalle}` : `${prefix} Sin Nombre`;
    } else {
      cleanName = `${prefix} ${toTitleCase(cleanName)}`;
    }

    const nombreNormalizado = stripAccents(cleanName);
    const key = `${nombreNormalizado}|${numeroCalle ?? ''}`;

    let group = groupsMap.get(key);
    if (!group) {
      group = {
        key,
        cleanName,
        nombreNormalizado,
        numeroCalle,
        tipoVia,
        features: []
      };
      groupsMap.set(key, group);
    }
    group.features.push(feat);
  }

  // Consolidación toponímica de variantes y abreviaturas por homonimia física (FEAT-007)
  const groupsList: (FeatureGroup | null)[] = Array.from(groupsMap.values());

  const byNumberAndType = new Map<string, number[]>();
  for (let i = 0; i < groupsList.length; i++) {
    const grp = groupsList[i]!;
    if (grp.numeroCalle !== null) {
      const pKey = `${grp.numeroCalle}|${grp.tipoVia}`;
      if (!byNumberAndType.has(pKey)) byNumberAndType.set(pKey, []);
      byNumberAndType.get(pKey)!.push(i);
    }
  }

  for (const indices of byNumberAndType.values()) {
    if (indices.length <= 1) continue;

    const n = indices.length;
    const isVariant: boolean[][] = Array.from({ length: n }, () => Array(n).fill(false));
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (areToponymVariants(groupsList[indices[i]]!.cleanName, groupsList[indices[j]]!.cleanName)) {
          isVariant[i][j] = true;
          isVariant[j][i] = true;
        }
      }
    }

    // Detectar nodos ambiguos:
    // Un nodo i es ambiguo si tiene dos vecinos j y k que NO son variantes entre sí.
    const isAmbiguous = new Set<number>();
    for (let i = 0; i < n; i++) {
      const neighbors: number[] = [];
      for (let j = 0; j < n; j++) {
        if (isVariant[i][j]) neighbors.push(j);
      }
      for (let a = 0; a < neighbors.length; a++) {
        for (let b = a + 1; b < neighbors.length; b++) {
          if (!isVariant[neighbors[a]][neighbors[b]]) {
            isAmbiguous.add(i);
            break;
          }
        }
        if (isAmbiguous.has(i)) break;
      }
    }

    const parent = indices.map((_, idx) => idx);
    const find = (i: number): number => {
      if (parent[i] === i) return i;
      return (parent[i] = find(parent[i]));
    };
    const union = (i: number, j: number) => {
      const rootI = find(i);
      const rootJ = find(j);
      if (rootI !== rootJ) parent[rootI] = rootJ;
    };

    // Unir únicamente pares no ambiguos que sean variantes mutuas
    for (let i = 0; i < n; i++) {
      if (isAmbiguous.has(i)) continue;
      for (let j = i + 1; j < n; j++) {
        if (isAmbiguous.has(j)) continue;
        if (isVariant[i][j]) {
          union(i, j);
        }
      }
    }

    const components = new Map<number, number[]>();
    for (let i = 0; i < indices.length; i++) {
      const root = find(i);
      if (!components.has(root)) components.set(root, []);
      components.get(root)!.push(indices[i]);
    }

    for (const memberIndices of components.values()) {
      if (memberIndices.length <= 1) continue;

      memberIndices.sort((a, b) => getNameScore(groupsList[b]!.cleanName) - getNameScore(groupsList[a]!.cleanName));
      const canonical = groupsList[memberIndices[0]]!;
      const allFeatures = memberIndices.flatMap(idx => groupsList[idx]!.features);

      const primaryIdx = Math.min(...memberIndices);
      groupsList[primaryIdx] = {
        key: canonical.key,
        cleanName: canonical.cleanName,
        nombreNormalizado: canonical.nombreNormalizado,
        numeroCalle: canonical.numeroCalle,
        tipoVia: canonical.tipoVia,
        features: allFeatures
      };

      for (const idx of memberIndices) {
        if (idx !== primaryIdx) {
          groupsList[idx] = null;
        }
      }
    }
  }

  const finalGroups = groupsList.filter((g): g is FeatureGroup => g !== null);

  const usedSlugs = new Set<string>();
  const normalizedCalles: NormalizedCalle[] = [];
  let groupIndex = 0;

  for (const group of finalGroups) {
    groupIndex++;
    let slug = generateSlug(group.cleanName, group.numeroCalle);
    // Garantizar unicidad de slug
    if (usedSlugs.has(slug)) {
      let counter = 2;
      while (usedSlugs.has(`${slug}-${counter}`)) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }
    usedSlugs.add(slug);

    const barrioIds = new Set<number>();
    const tramos: NormalizedTramo[] = [];
    const allLines: any[] = [];
    let groupTipoCiclovia: string | null = null;

    for (let fIdx = 0; fIdx < group.features.length; fIdx++) {
      const feat = group.features[fIdx];
      let longitudM = 0;
      try {
        longitudM = Math.round(turf.length(feat as any, { units: 'meters' }) * 100) / 100;
      } catch {
        longitudM = 0;
      }

      // Consolidar coordenadas en MultiLineString
      if (feat.geometry.type === 'LineString') {
        allLines.push(feat.geometry.coordinates);
      } else if (feat.geometry.type === 'MultiLineString') {
        allLines.push(...feat.geometry.coordinates);
      }

      const featBboxRaw = turf.bbox(feat as any);
      let tieneCiclovia = false;
      for (const bici of bicisendaFeatures) {
        try {
          const biciBbox = turf.bbox(bici as any);
          if (
            featBboxRaw[0] > biciBbox[2] ||
            featBboxRaw[2] < biciBbox[0] ||
            featBboxRaw[1] > biciBbox[3] ||
            featBboxRaw[3] < biciBbox[1]
          ) {
            continue;
          }

          if (turf.booleanIntersects(feat as any, bici as any)) {
            tieneCiclovia = true;
            if (!groupTipoCiclovia) {
              groupTipoCiclovia = bici.properties?.Nombre || 'CICLOVIA';
            }
            break;
          }
        } catch {}
      }

      // Cruce espacial con barrios para asociar tramos
      let puntoCalle: any = null;
      try {
        puntoCalle = turf.pointOnFeature(feat as any);
      } catch {
        puntoCalle = null;
      }

      let barrioAsignado: NormalizedBarrio | null = null;
      if (puntoCalle) {
        for (let bIndex = 0; bIndex < barrios.length; bIndex++) {
          const b = barrios[bIndex];
          if (
            puntoCalle.geometry.coordinates[0] >= b.bbox[0] &&
            puntoCalle.geometry.coordinates[0] <= b.bbox[2] &&
            puntoCalle.geometry.coordinates[1] >= b.bbox[1] &&
            puntoCalle.geometry.coordinates[1] <= b.bbox[3]
          ) {
            try {
              if (turf.booleanPointInPolygon(puntoCalle, { type: 'Feature', geometry: b.geojson, properties: {} })) {
                barrioAsignado = b;
                barrioIds.add(bIndex + 1);
                break;
              }
            } catch {}
          }
        }
      }

      tramos.push({
        ordenTramo: fIdx + 1,
        alturaInicio: null,
        alturaFin: null,
        barrioOriginalId: barrioAsignado?.originalId || null,
        numeroChacra: barrioAsignado?.numeroChacra || null,
        tieneCiclovia,
        longitudM,
        geojson: feat.geometry
      });
    }

    const consolidatedGeometry = {
      type: 'MultiLineString',
      coordinates: allLines
    };

    const bboxRaw = turf.bbox({ type: 'Feature', geometry: consolidatedGeometry, properties: {} } as any);
    const bbox: [number, number, number, number] = [bboxRaw[0], bboxRaw[1], bboxRaw[2], bboxRaw[3]];
    const longitudTotalM = Math.round(tramos.reduce((acc, t) => acc + t.longitudM, 0) * 100) / 100;
    const tieneCicloviaCalle = tramos.some(t => t.tieneCiclovia);

    const esMano = isManoUnica(group.cleanName, group.tipoVia, manosUnicasData);
    const sentidoCirculacion: 'MANO_UNICA' | 'DOBLE' | 'PEATONAL' = esMano ? 'MANO_UNICA' : 'DOBLE';

    const digestoEntry = findDigestoEntry(group.cleanName, group.nombreNormalizado, group.numeroCalle, digestoCallesData);

    normalizedCalles.push({
      originalId: group.features[0].id || `calle-${groupIndex}`,
      slug,
      nombreOficial: group.cleanName,
      nombreNormalizado: group.nombreNormalizado,
      numeroCalle: group.numeroCalle,
      tipoVia: group.tipoVia,
      sentidoCirculacion,
      longitudTotalM,
      tieneCiclovia: tieneCicloviaCalle,
      tipoCiclovia: tieneCicloviaCalle ? (groupTipoCiclovia || 'CICLOVIA') : null,
      explicacion: digestoEntry ? digestoEntry.explicacion : null,
      referenciaOrdenanza: digestoEntry ? digestoEntry.referencia_ordenanza : null,
      urlOrdenanza: digestoEntry ? digestoEntry.url_ordenanza : null,
      categoriaToponimica: digestoEntry ? digestoEntry.categoria_toponimica : 'OTRO',
      bbox,
      geojson: consolidatedGeometry,
      barrioIds,
      tramos
    });
  }

  return normalizedCalles;
}
