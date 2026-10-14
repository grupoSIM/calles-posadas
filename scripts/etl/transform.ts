import * as turf from '@turf/turf';
import { checkToponymAffinity } from './digesto/correlator.js';

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
  delegacion: string | null;
  seccion: string | null;
  articuloOrdenanza: string | null;
  superficieM2: number;
  observaciones: string | null;
  geojson: any;
  bbox: [number, number, number, number]; // minX, minY, maxX, maxY
}

export interface NormalizedCiclovia {
  originalId: string;
  nombre: string;
  tipo: string;
  tramo: string | null;
  ubicacion: string | null;
  anioInstalacion: number | null;
  longitudKm: number;
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
  aliases: string[];
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
  if (rawName) {
    // 1. Priorizar el código canónico de eje entre paréntesis oficial de Posadas: ej. (115), (77B), (45), (126)
    const parenMatch = rawName.match(/\((\d+)/);
    if (parenMatch) return parseInt(parenMatch[1], 10);
  }

  // 2. Usar propiedad de número sólo si no se trata de una ruta nacional o provincial que confunda su código vial con número de calle
  if (numCalleProp && !/ruta|rn\b|rp\b/i.test(rawName || '')) {
    const match = numCalleProp.match(/\d+/);
    if (match) return parseInt(match[0], 10);
  }

  if (rawName) {
    const numMatch = rawName.match(/(?:calle|av\.?|avenida|pje\.?|pasaje|diagonal)\s+(\d+)\b/i);
    if (numMatch) return parseInt(numMatch[1], 10);
  }

  return null;
}

// Extraer tipo de vía
export function extractRoadType(name: string, sourceLayer?: string): 'AVENIDA' | 'CALLE' | 'PASAJE' | 'DIAGONAL' | 'COSTANERA' {
  const upper = (name || '').toUpperCase();
  if (/^AV(?:ENIDA|\.|\b)/.test(upper) || upper.includes('AVENIDA') || upper.includes('ANENIDA')) return 'AVENIDA';
  if (/^P(?:ASAJE|JE\.?|\b)/.test(upper) || upper.includes('PASAJE')) return 'PASAJE';
  if (/^DIAG(?:ONAL|\.|\b)/.test(upper) || upper.includes('DIAGONAL')) return 'DIAGONAL';
  if (upper.includes('COSTANERA')) return 'COSTANERA';
  if (/^RUTA\b|RUTA NACIONAL|RUTA PROVINCIAL|\(EX RUTA/i.test(upper)) return 'AVENIDA';
  if (sourceLayer === 'avenidas') return 'AVENIDA';
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

export function isUnnamedRoad(name: string): boolean {
  const core = name.replace(/^(Avenida|Calle|Pasaje|Diagonal|Costanera)\s+/i, '').trim();
  const clean = stripAccents(core).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (clean.length === 0) return true;
  if (clean === 'sinnombre' || clean === 'sn' || clean === 'sd') return true;
  if (core.toLowerCase().includes('sin nombre') || /\bs\s*\/\s*n\b/i.test(core) || /\bsn\b/i.test(core) || /\bs\s*\/\s*d\b/i.test(core)) return true;
  return false;
}

export function isPurelyNumericRoad(name: string): boolean {
  if (isUnnamedRoad(name)) return false;
  const core = name.replace(/^(Avenida|Calle|Pasaje|Diagonal|Costanera)\s+/i, '').trim();
  const clean = stripAccents(core).replace(/\s+/g, '');
  return /^\d+[a-zA-Z]?$/.test(clean);
}

export function isNumericOrUnnamed(name: string): boolean {
  return isUnnamedRoad(name) || isPurelyNumericRoad(name);
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
    const rawName = (
      feat.properties?._Barrio ||
      feat.properties?.nom_barrio ||
      feat.properties?.NOMBRE_BARRIO ||
      feat.properties?.nombre ||
      `Barrio ${index + 1}`
    ).trim();
    const upper = rawName.toUpperCase();
    const nombre = /[a-z]/.test(rawName) ? rawName : toTitleCase(rawName);
    
    let tipo: 'BARRIO_OFICIAL' | 'BARRIO_SOCIAL' | 'CHACRA' | 'OTRO' = 'BARRIO_OFICIAL';
    const rawTipo = String(feat.properties?.Tipo || '').trim().toLowerCase();
    const chacraMatch = upper.match(/CHACRA\s*N?[°º]?\s*(\d+)/i);

    if (rawTipo.includes('ordenanza')) {
      tipo = 'BARRIO_OFICIAL';
    } else if (rawTipo.includes('social')) {
      tipo = 'BARRIO_SOCIAL';
    } else if (rawTipo.includes('chacra') || upper.includes('CHACRA') || chacraMatch) {
      tipo = 'CHACRA';
    }

    let numeroChacra: number | null = null;
    if (chacraMatch) {
      numeroChacra = parseInt(chacraMatch[1], 10);
    } else if (feat.properties?.Chacra) {
      const match = String(feat.properties.Chacra).match(/^\s*0*([1-9]\d*)\s*$/);
      if (match) {
        numeroChacra = parseInt(match[1], 10);
      }
    }

    const bboxRaw = turf.bbox(feat as any);
    const bbox: [number, number, number, number] = [bboxRaw[0], bboxRaw[1], bboxRaw[2], bboxRaw[3]];

    // Buscar ordenanza por atributo explícito, nombre o cruce espacial
    let referenciaOrdenanza: string | null = null;
    if (feat.properties?.Ordenanza && String(feat.properties.Ordenanza).trim()) {
      referenciaOrdenanza = String(feat.properties.Ordenanza).trim();
    } else {
      referenciaOrdenanza = ordenanzasByName.get(cleanKey(rawName)) || null;
    }

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

    const delegacion = feat.properties?.Delegacion ? String(feat.properties.Delegacion).trim() : null;
    const seccion = feat.properties?.Seccion ? String(feat.properties.Seccion).trim() : null;
    const articuloOrdenanza = feat.properties?.Articulo ? String(feat.properties.Articulo).trim() : null;
    const observaciones = feat.properties?.Observacio ? String(feat.properties.Observacio).trim() : null;

    let superficieM2 = 0;
    try {
      const area = turf.area(feat as any);
      if (typeof area === 'number' && !isNaN(area) && isFinite(area) && area > 0) {
        superficieM2 = Math.round(area * 100) / 100;
      }
    } catch {}

    return {
      originalId: feat.id || `barrio-${index + 1}`,
      nombre,
      tipo,
      numeroChacra,
      referenciaOrdenanza,
      delegacion,
      seccion,
      articuloOrdenanza,
      superficieM2,
      observaciones,
      geojson: feat.geometry,
      bbox
    };
  });
}

// Normalizar capa de ciclovías y red ciclable (FEAT-012)
export function transformCiclovias(
  bicisendasData: { features: RawBicisendaFeature[] }
): NormalizedCiclovia[] {
  const features = (bicisendasData?.features || []).filter(f => hasValidCoordinates(f.geometry));

  return features.map((feat, index) => {
    const rawNombre = feat.properties?.Nombre || 'Ciclovía';
    const tramo = feat.properties?.Tramo || null;
    const ubicacion = feat.properties?.Ubicacion || null;
    const anio = typeof feat.properties?.A_o === 'number' ? feat.properties.A_o : null;
    const longitudKm = typeof feat.properties?.Longitud === 'number' ? feat.properties.Longitud : 0;

    let tipo = 'CICLOVIA';
    if (/bicisenda/i.test(rawNombre)) {
      tipo = 'BICISENDA';
    } else if (/mixto/i.test(rawNombre)) {
      tipo = 'USO_MIXTO';
    }

    const bboxRaw = turf.bbox(feat as any);
    const bbox: [number, number, number, number] = [bboxRaw[0], bboxRaw[1], bboxRaw[2], bboxRaw[3]];

    return {
      originalId: feat.id || `ciclovia-${index + 1}`,
      nombre: rawNombre.trim(),
      tipo,
      tramo: tramo ? tramo.trim() : null,
      ubicacion: ubicacion ? ubicacion.trim() : null,
      anioInstalacion: anio,
      longitudKm: Math.round(longitudKm * 100) / 100,
      geojson: feat.geometry,
      bbox
    };
  });
}

// Determinar si una arteria es de mano única según la capa oficial de la IDE Posadas
export function isManoUnica(
  cleanName: string,
  tipoVia: string,
  manosUnicasData?: { features: any[] }
): boolean {
  if (!manosUnicasData?.features || manosUnicasData.features.length === 0) {
    return false;
  }

  const targetTokens = getToponymTokens(cleanName);
  if (targetTokens.length === 0) return false;

  for (const feat of manosUnicasData.features) {
    // 1. Validar vigencia: sólo registros con vigente === 'SI' son válidos
    const rawVigente = String(feat.properties?.vigente || '').trim().toUpperCase();
    if (rawVigente !== 'SI') continue;

    const rawNomb = feat.properties?.NOMB_ || '';
    if (!rawNomb) continue;

    // 2. Verificar tipo de vía si el registro oficial es explícitamente una avenida
    const officialType = extractRoadType(rawNomb);
    if (officialType === 'AVENIDA' && tipoVia !== 'AVENIDA') {
      continue;
    }

    const cleanNomb = stripAccents(rawNomb)
      .toLowerCase()
      .replace(/^(av\b\.?|avenida|calle|pasaje|pje\b\.?|diagonal|costanera)\s*/i, '')
      .replace(/[^a-z0-9]/g, ' ')
      .trim();
    const nombTokens = cleanNomb.split(/\s+/).filter(w => !TOPONYM_STOPWORDS.has(w));
    if (nombTokens.length === 0) continue;

    // 3. Coincidencia estricta de identidad:
    // Todos los tokens sustantivos del registro oficial deben coincidir como tokens completos
    // (o abreviaturas de diccionario) con los tokens de la arteria destino.
    // Esto evita falsos positivos por subcadenas (ej. 'lavalle' NO coincide con 'lavalleja')
    // y evita que iniciales de una letra ('L.') coincidan espuriamente con apellidos ('Lavalle').
    const allTokensMatch = nombTokens.every(nTok =>
      targetTokens.some(tTok =>
        tTok === nTok ||
        TOPONYM_ABBREVIATIONS.get(nTok) === tTok ||
        TOPONYM_ABBREVIATIONS.get(tTok) === nTok
      )
    );

    if (allTokensMatch) {
      return true;
    }
  }

  return false;
}

export interface DigestoCalleEntry {
  nombre_oficial: string;
  nombre_normalizado: string;
  numero_calle?: number | null;
  referencia_ordenanza: string | null;
  url_ordenanza: string | null;
  documento_normativo?: string | null;
  articulo_normativo?: string | null;
  fecha_consulta?: string | null;
  procedencia_normativa?: string | null;
  estado_normativo?: 'CONFIRMADO' | 'PENDIENTE';
  explicacion: string;
  fuente_biografica?: string;
  categoria_toponimica: string;
}

export function findDigestoEntry(
  cleanName: string,
  nombreNormalizado: string,
  numeroCalle: number | null,
  digestoEntries?: DigestoCalleEntry[] | { [key: string]: any },
  tipoVia?: string,
  extraCandidates?: string[]
): DigestoCalleEntry | null {
  if (!digestoEntries) return null;
  const list: DigestoCalleEntry[] = Array.isArray(digestoEntries)
    ? digestoEntries
    : ((digestoEntries as any).features || (digestoEntries as any).data || []);
  if (!list || list.length === 0) return null;

  const allNames = [cleanName, nombreNormalizado, ...(extraCandidates || [])];
  const normalizedTargets = allNames.map(n => stripAccents(n.toLowerCase().trim())).filter(Boolean);

  // 1. Coincidencia directa por nombre normalizado u oficial
  for (const entry of list) {
    if (tipoVia && entry.nombre_oficial && extractRoadType(entry.nombre_oficial) !== tipoVia) {
      continue;
    }
    const entryNorm = stripAccents((entry.nombre_normalizado || '').toLowerCase().trim());
    const entryOficial = stripAccents((entry.nombre_oficial || '').toLowerCase().trim());
    for (const target of normalizedTargets) {
      if (entryNorm === target || entryOficial === target) {
        return entry;
      }
    }
  }

  // 2. Coincidencia por número de calle si ambos lo poseen y hay afinidad toponímica
  if (numeroCalle !== null) {
    for (const entry of list) {
      if (tipoVia && entry.nombre_oficial && extractRoadType(entry.nombre_oficial) !== tipoVia) {
        continue;
      }
      if (entry.numero_calle === numeroCalle) {
        const entryBase = stripAccents((entry.nombre_normalizado || '').replace(/^(avenida|calle|pasaje|diagonal|costanera)\s+/, '').trim());
        for (const target of normalizedTargets) {
          const targetBase = stripAccents(target.replace(/^(avenida|calle|pasaje|diagonal|costanera)\s+/, '').trim());
          if (
            targetBase &&
            entryBase &&
            (targetBase.includes(entryBase) || entryBase.includes(targetBase) || checkToponymAffinity(targetBase, entryBase))
          ) {
            return entry;
          }
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
    rawNames: Set<string>;
    features: RawCalleFeature[];
  }

  const groupsMap = new Map<string, FeatureGroup>();

  for (const feat of validCalles) {
    const isAvenidaLayer = feat.properties?.avenidas !== undefined || feat.properties?.AVENIDAS !== undefined || feat.properties?.LONG_AV !== undefined;
    const rawCalle = feat.properties?.CALLE || feat.properties?.avenidas || feat.properties?.AVENIDAS || '';
    const rawNumCalle = feat.properties?.NUM_CALLE || (feat.properties?.id ? `(${feat.properties.id})` : '');

    const numeroCalle = extractStreetNumber(rawCalle, rawNumCalle);
    const tipoVia = extractRoadType(rawCalle, isAvenidaLayer ? 'avenidas' : undefined);

    // Limpiar nombre: separar prefijos pegados, remover códigos parentizados, prefijos redundantes y normalizar puntos
    let cleanName = rawCalle
      .replace(/^(CALLE|AVENIDA|ANENIDA|PASAJE|DIAGONAL|COSTANERA)(?=[A-Za-z])/i, '$1 ')
      .replace(/\([^)]*\)?/g, ' ')
      .replace(/^((CALLE|AVENIDA|AV\b\.?|ANENIDA|PASAJE|PJE\b\.?|DIAGONAL|COSTANERA)(\s+|$))+/i, '')
      .replace(/\.([a-zA-Z])/g, '. $1')
      .replace(/\bHUMBOLD\b/gi, 'Humboldt')
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
        rawNames: new Set<string>(),
        features: []
      };
      groupsMap.set(key, group);
    }
    if (cleanName) {
      group.rawNames.add(cleanName);
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
      const allRawNames = new Set(memberIndices.flatMap(idx => Array.from(groupsList[idx]!.rawNames)));

      const primaryIdx = Math.min(...memberIndices);
      groupsList[primaryIdx] = {
        key: canonical.key,
        cleanName: canonical.cleanName,
        nombreNormalizado: canonical.nombreNormalizado,
        numeroCalle: canonical.numeroCalle,
        tipoVia: canonical.tipoVia,
        rawNames: allRawNames,
        features: allFeatures
      };

      for (const idx of memberIndices) {
        if (idx !== primaryIdx) {
          groupsList[idx] = null;
        }
      }
    }

    // Consolidación de tramos puramente numéricos bajo la arteria toponímica nominada (FEAT-011)
    const activeIndices = indices.filter(idx => groupsList[idx] !== null);
    if (activeIndices.length > 1) {
      const namedIndices = activeIndices.filter(idx => !isNumericOrUnnamed(groupsList[idx]!.cleanName));
      const numericIndices = activeIndices.filter(idx => isNumericOrUnnamed(groupsList[idx]!.cleanName));

      // Si hay exactamente 1 arteria con nombre propio y 1 o más numéricas para el mismo número y tipo de vía
      if (namedIndices.length === 1 && numericIndices.length > 0) {
        const targetGroup = groupsList[namedIndices[0]]!;
        for (const numIdx of numericIndices) {
          const numGroup = groupsList[numIdx]!;
          targetGroup.features.push(...numGroup.features);
          for (const raw of numGroup.rawNames) {
            targetGroup.rawNames.add(raw);
          }
          targetGroup.rawNames.add(numGroup.cleanName);
          groupsList[numIdx] = null;
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

    const extraCandidates = Array.from(group.rawNames);
    const digestoEntry = findDigestoEntry(
      group.cleanName,
      group.nombreNormalizado,
      group.numeroCalle,
      digestoCallesData,
      group.tipoVia,
      extraCandidates
    );

    // FEAT-011: Autoridad toponímica canónica del Digesto Municipal
    const officialName = (digestoEntry && digestoEntry.nombre_oficial)
      ? digestoEntry.nombre_oficial.trim()
      : group.cleanName;
    const officialNormalized = stripAccents(officialName);

    let slug = generateSlug(officialName, group.numeroCalle);
    // Garantizar unicidad de slug
    if (usedSlugs.has(slug)) {
      let counter = 2;
      while (usedSlugs.has(`${slug}-${counter}`)) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }
    usedSlugs.add(slug);

    // Recolectar aliases limpios
    const aliasesSet = new Set<string>();
    for (const rName of group.rawNames) {
      if (rName && rName.trim() !== officialName) {
        aliasesSet.add(rName.trim());
      }
    }
    if (group.cleanName && group.cleanName.trim() !== officialName) {
      aliasesSet.add(group.cleanName.trim());
    }
    if (group.numeroCalle !== null) {
      const prefix = group.tipoVia === 'AVENIDA' ? 'Avenida' : group.tipoVia === 'PASAJE' ? 'Pasaje' : group.tipoVia === 'DIAGONAL' ? 'Diagonal' : group.tipoVia === 'COSTANERA' ? 'Costanera' : 'Calle';
      const shortPrefix = group.tipoVia === 'AVENIDA' ? 'Av.' : group.tipoVia === 'PASAJE' ? 'Pje.' : group.tipoVia === 'DIAGONAL' ? 'Diag.' : 'C.';
      const numFull = `${prefix} ${group.numeroCalle}`;
      const numShort = `${shortPrefix} ${group.numeroCalle}`;
      if (numFull !== officialName) aliasesSet.add(numFull);
      if (numShort !== officialName) aliasesSet.add(numShort);
    }
    const aliases = Array.from(aliasesSet);

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

    const esMano = isManoUnica(officialName, group.tipoVia, manosUnicasData) || isManoUnica(group.cleanName, group.tipoVia, manosUnicasData);
    const sentidoCirculacion: 'MANO_UNICA' | 'DOBLE' | 'PEATONAL' = esMano ? 'MANO_UNICA' : 'DOBLE';

    const isUnnamed = isUnnamedRoad(officialName);
    const isNumeric = !isUnnamed && isPurelyNumericRoad(officialName);

    let categoriaToponimica = digestoEntry ? digestoEntry.categoria_toponimica : 'OTRO';
    let explicacion = (digestoEntry && digestoEntry.explicacion && digestoEntry.explicacion.trim()) ? digestoEntry.explicacion.trim() : null;

    if (categoriaToponimica === 'OTRO') {
      if (isNumeric) {
        categoriaToponimica = 'NUMERICA';
        if (!explicacion) {
          explicacion = 'Arteria identificada por su designación numérica en el nomenclador urbano y la cuadrícula catastral de Posadas (Ordenanza XVIII - N° 130 / Marco Histórico de Chacras).';
        }
      } else if (isUnnamed) {
        categoriaToponimica = 'SIN_NOMBRE';
        if (!explicacion) {
          explicacion = 'Tramo vial de uso público registrado en el catastro municipal pendiente de designación toponímica formal por el Honorable Concejo Deliberante.';
        }
      }
    }

    normalizedCalles.push({
      originalId: group.features[0].id || `calle-${groupIndex}`,
      slug,
      nombreOficial: officialName,
      nombreNormalizado: officialNormalized,
      numeroCalle: group.numeroCalle,
      tipoVia: group.tipoVia,
      sentidoCirculacion,
      longitudTotalM,
      tieneCiclovia: tieneCicloviaCalle,
      tipoCiclovia: tieneCicloviaCalle ? (groupTipoCiclovia || 'CICLOVIA') : null,
      explicacion,
      referenciaOrdenanza: (digestoEntry && digestoEntry.referencia_ordenanza && digestoEntry.referencia_ordenanza.trim()) ? digestoEntry.referencia_ordenanza.trim() : null,
      urlOrdenanza: (digestoEntry && digestoEntry.url_ordenanza && digestoEntry.url_ordenanza.trim()) ? digestoEntry.url_ordenanza.trim() : null,
      categoriaToponimica,
      aliases,
      bbox,
      geojson: consolidatedGeometry,
      barrioIds,
      tramos
    });
  }

  return normalizedCalles;
}
