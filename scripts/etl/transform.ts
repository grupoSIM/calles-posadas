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
    // Buscar patrones como (115), N° 115, o " 115"
    const parenMatch = rawName.match(/\((\d+)\)/);
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
export function transformBarrios(barriosData: { features: RawBarrioFeature[] }): NormalizedBarrio[] {
  const validFeatures = (barriosData.features || []).filter(f => hasValidCoordinates(f.geometry));
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

    return {
      originalId: feat.id || `barrio-${index + 1}`,
      nombre: toTitleCase(rawName),
      tipo,
      numeroChacra,
      referenciaOrdenanza: null,
      geojson: feat.geometry,
      bbox
    };
  });
}

// Normalizar capa de calles y avenidas con cruces espaciales
export function transformCalles(
  callesData: { features: RawCalleFeature[] },
  barrios: NormalizedBarrio[],
  bicisendasData: { features: RawBicisendaFeature[] },
  avenidasData?: { features: RawCalleFeature[] }
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

  // Agrupar o normalizar por nombre oficial
  const usedSlugs = new Set<string>();

  return validCalles.map((feat, index) => {
    const rawCalle = feat.properties?.CALLE || feat.properties?.avenidas || feat.properties?.AVENIDAS || '';
    const rawNumCalle = feat.properties?.NUM_CALLE || (feat.properties?.id ? `(${feat.properties.id})` : '');

    const numeroCalle = extractStreetNumber(rawCalle, rawNumCalle);
    const tipoVia = extractRoadType(rawCalle);

    // Limpiar nombre: remover "(49)", prefijos redundantes
    let cleanName = rawCalle
      .replace(/\(\d+\)/g, '')
      .replace(/^(CALLE|AVENIDA|AV\.?|ANENIDA|PASAJE|PJE\.?|DIAGONAL|COSTANERA)\s+/i, '')
      .trim();

    if (!cleanName && numeroCalle) {
      cleanName = `${tipoVia === 'AVENIDA' ? 'Avenida' : tipoVia === 'PASAJE' ? 'Pasaje' : 'Calle'} ${numeroCalle}`;
    } else {
      const prefix = tipoVia === 'AVENIDA' ? 'Avenida' : tipoVia === 'PASAJE' ? 'Pasaje' : tipoVia === 'DIAGONAL' ? 'Diagonal' : tipoVia === 'COSTANERA' ? 'Costanera' : 'Calle';
      cleanName = `${prefix} ${toTitleCase(cleanName)}`;
    }

    let slug = generateSlug(cleanName, numeroCalle);
    // Garantizar unicidad de slug
    if (usedSlugs.has(slug)) {
      let counter = 2;
      while (usedSlugs.has(`${slug}-${counter}`)) {
        counter++;
      }
      slug = `${slug}-${counter}`;
    }
    usedSlugs.add(slug);

    // Longitud geométrica con turf
    let longitudTotalM = 0;
    try {
      longitudTotalM = Math.round(turf.length(feat as any, { units: 'meters' }) * 100) / 100;
    } catch {
      longitudTotalM = 0;
    }

    const bboxRaw = turf.bbox(feat as any);
    const bbox: [number, number, number, number] = [bboxRaw[0], bboxRaw[1], bboxRaw[2], bboxRaw[3]];

    // Cruce espacial con ciclovías: chequear si interseca o está a < 30m de alguna ciclovía
    let tieneCiclovia = false;
    let tipoCiclovia: string | null = null;

    for (const bici of bicisendaFeatures) {
      try {
        const biciBbox = turf.bbox(bici as any);
        // Descarte rápido por Bounding Box
        if (
          bbox[0] > biciBbox[2] ||
          bbox[2] < biciBbox[0] ||
          bbox[1] > biciBbox[3] ||
          bbox[3] < biciBbox[1]
        ) {
          continue;
        }

        // Bbox se solapa, verificar intersección espacial
        if (turf.booleanIntersects(feat as any, bici as any)) {
          tieneCiclovia = true;
          tipoCiclovia = bici.properties?.Nombre || 'CICLOVIA';
          break;
        }
      } catch {
        // En caso de fallo geométrico aislado, continuar
      }
    }

    // Cruce espacial con barrios para asociar tramos y relaciones
    const barrioIds = new Set<number>();
    const tramos: NormalizedTramo[] = [];

    // Tomar centroide o punto medio del tramo para asignación precisa de barrio
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
        // Filtro rápido Bbox
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
          } catch {
            // Ignorar errores puntuales de polígono
          }
        }
      }
    }

    tramos.push({
      ordenTramo: 1,
      alturaInicio: null,
      alturaFin: null,
      barrioOriginalId: barrioAsignado?.originalId || null,
      numeroChacra: barrioAsignado?.numeroChacra || null,
      tieneCiclovia,
      longitudM: longitudTotalM,
      geojson: feat.geometry
    });

    return {
      originalId: feat.id || `calle-${index + 1}`,
      slug,
      nombreOficial: cleanName,
      nombreNormalizado: stripAccents(cleanName),
      numeroCalle,
      tipoVia,
      sentidoCirculacion: 'DOBLE',
      longitudTotalM,
      tieneCiclovia,
      tipoCiclovia,
      explicacion: null,
      referenciaOrdenanza: null,
      urlOrdenanza: null,
      categoriaToponimica: 'OTRO',
      bbox,
      geojson: feat.geometry,
      barrioIds,
      tramos
    };
  });
}
