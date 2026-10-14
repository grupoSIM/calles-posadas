import { ParsedArticulo, CorrelationResult, CorrelationMatch, CorrelationConflict, DigestoCalleEntry } from './types.js';

export function stripAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function cleanTokens(str: string): string[] {
  return stripAccents(str.toLowerCase())
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !/^\d+$/.test(t) && !['calle', 'avenida', 'pasaje', 'del', 'los', 'las', 'san', 'santa'].includes(t));
}

export function checkToponymAffinity(normaName: string, streetName: string): boolean {
  if (!normaName || !streetName) return false;
  const normNorma = stripAccents(normaName.toLowerCase()).trim();
  const normStreet = stripAccents(streetName.toLowerCase()).trim();
  if (!normNorma || !normStreet) return false;

  if (normStreet.includes(normNorma) || normNorma.includes(normStreet)) {
    return true;
  }

  const tokensA = cleanTokens(normaName);
  const tokensB = cleanTokens(streetName);
  if (tokensA.length === 0 || tokensB.length === 0) return false;

  // Si comparten al menos un token sustantivo significativo (ej. "areco", "zapiola", "favaloro", "frondizi")
  const common = tokensA.filter(t => tokensB.includes(t));
  return common.length > 0;
}

export function correlateNormasWithStreets(
  articulos: ParsedArticulo[],
  streets: Array<{ nombre?: string; nombre_oficial?: string; numero_calle?: number | null; tipo_via?: string }>
): CorrelationResult {
  const matched: CorrelationMatch[] = [];
  const conflicts: CorrelationConflict[] = [];
  const unmatchedNormas: ParsedArticulo[] = [];

  for (const art of articulos) {
    const candidates = streets.filter(s => {
      const num = s.numero_calle;
      if (num === null || num === undefined) return false;
      if (Number(num) !== art.numero_calle) return false;

      if (s.tipo_via && s.tipo_via.toUpperCase() !== art.tipo_via) {
        return false;
      }
      return true;
    });

    if (candidates.length === 0) {
      unmatchedNormas.push(art);
      continue;
    }

    // Filtrar candidatos con afinidad toponímica
    const validCandidates = candidates.filter(c => {
      const name = c.nombre_oficial || c.nombre || '';
      return checkToponymAffinity(art.nombre_asignado, name);
    });

    if (validCandidates.length === 0) {
      // Discrepancia: existe el número pero los nombres no coinciden
      conflicts.push({
        parsedArticulo: art,
        reason: `Existe arteria N° ${art.numero_calle} pero ninguna coincide toponímicamente con "${art.nombre_asignado}"`,
        details: candidates.map(c => c.nombre_oficial || c.nombre)
      });
      continue;
    }

    if (validCandidates.length > 1) {
      // Múltiples arterias con el mismo número y tipo (ej. traza multi-toponímica o ramas distintas)
      // Buscamos la coincidencia más estrecha
      const exactCandidate = validCandidates.find(c => {
        const name = c.nombre_oficial || c.nombre || '';
        const normN = stripAccents(name.toLowerCase());
        const normA = stripAccents(art.nombre_asignado.toLowerCase());
        return normN.includes(normA) || normA.includes(normN);
      }) || validCandidates[0];

      const streetName = exactCandidate.nombre_oficial || exactCandidate.nombre || art.nombre_asignado;
      const tipoPrefix = art.tipo_via === 'AVENIDA' ? 'Avenida' : art.tipo_via === 'PASAJE' ? 'Pasaje' : 'Calle';
      const cleanOfficialName = streetName.toLowerCase().startsWith(tipoPrefix.toLowerCase())
        ? streetName
        : `${tipoPrefix} ${art.nombre_asignado}`;

      const entry: DigestoCalleEntry = {
        nombre_oficial: cleanOfficialName,
        nombre_normalizado: stripAccents(cleanOfficialName.toLowerCase()),
        numero_calle: art.numero_calle,
        referencia_ordenanza: art.referencia_ordenanza,
        url_ordenanza: art.url_ordenanza,
        documento_normativo: art.documento_normativo,
        articulo_normativo: art.articulo,
        fecha_consulta: '2026-10-12',
        procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
        estado_normativo: 'CONFIRMADO',
        explicacion: '',
        categoria_toponimica: 'OTRO'
      };

      matched.push({
        parsedArticulo: art,
        matchedStreet: {
          nombre: streetName,
          numero: art.numero_calle,
          tipo_via: art.tipo_via
        },
        entry
      });
      continue;
    }

    const matchedCand = validCandidates[0];
    const streetName = matchedCand.nombre_oficial || matchedCand.nombre || art.nombre_asignado;
    const tipoPrefix = art.tipo_via === 'AVENIDA' ? 'Avenida' : art.tipo_via === 'PASAJE' ? 'Pasaje' : 'Calle';
    const cleanOfficialName = streetName.toLowerCase().startsWith(tipoPrefix.toLowerCase())
      ? streetName
      : `${tipoPrefix} ${art.nombre_asignado}`;

    const entry: DigestoCalleEntry = {
      nombre_oficial: cleanOfficialName,
      nombre_normalizado: stripAccents(cleanOfficialName.toLowerCase()),
      numero_calle: art.numero_calle,
      referencia_ordenanza: art.referencia_ordenanza,
      url_ordenanza: art.url_ordenanza,
      documento_normativo: art.documento_normativo,
      articulo_normativo: art.articulo,
      fecha_consulta: '2026-10-12',
      procedencia_normativa: 'Digesto Jurídico Municipal de Posadas - Texto Definitivo',
      estado_normativo: 'CONFIRMADO',
      explicacion: '',
      categoria_toponimica: 'OTRO'
    };

    matched.push({
      parsedArticulo: art,
      matchedStreet: {
        nombre: streetName,
        numero: art.numero_calle,
        tipo_via: art.tipo_via
      },
      entry
    });
  }

  return { matched, conflicts, unmatchedNormas };
}
