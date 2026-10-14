import { DigestoNormaRaw, ParsedArticulo } from './types.js';

export function parseNorma(norma: DigestoNormaRaw): ParsedArticulo[] {
  if (!norma || !norma.texto) {
    return [];
  }

  const lines = norma.texto.split(/\r?\n/);
  const articulos: ParsedArticulo[] = [];

  // Mapeo toponímico canónico para arterias troncales de Posadas establecidas en la Ordenanza XVIII - N° 4
  // cuyos textos normativos referencian la arteria por nombre histórico, tramo o límites de chacras:
  const MAPEO_TOPONIMICO_XVIII_4: Record<number, { numero: number; nombre: string; tipo_via: 'AVENIDA' | 'CALLE' | 'PASAJE' }> = {
    1: { numero: 45, nombre: 'República Oriental del Uruguay', tipo_via: 'AVENIDA' },
    2: { numero: 61, nombre: 'Mario del Tránsito Cocomarola', tipo_via: 'AVENIDA' },
    5: { numero: 75, nombre: 'Ramón Rafael Rocha', tipo_via: 'AVENIDA' },
    8: { numero: 83, nombre: 'Alicia Moreau de Justo', tipo_via: 'AVENIDA' },
    18: { numero: 34, nombre: 'Padre Francisco Wessling', tipo_via: 'AVENIDA' },
    19: { numero: 62, nombre: 'María De La Cruz Morinigo', tipo_via: 'AVENIDA' },
    20: { numero: 110, nombre: 'Comandante Andresito', tipo_via: 'AVENIDA' },
    21: { numero: 130, nombre: 'Ramón Ángel Domínguez', tipo_via: 'AVENIDA' },
    23: { numero: 138, nombre: '17 de Agosto', tipo_via: 'AVENIDA' },
    25: { numero: 142, nombre: 'Constitución', tipo_via: 'AVENIDA' },
    33: { numero: 26, nombre: 'Roque Pérez', tipo_via: 'AVENIDA' },
    34: { numero: 190, nombre: 'Presidente Juan Domingo Perón', tipo_via: 'AVENIDA' },
    35: { numero: 29, nombre: 'Soldado Argentino', tipo_via: 'AVENIDA' },
    38: { numero: 51, nombre: 'Ramón Martirenez', tipo_via: 'AVENIDA' },
    39: { numero: 186, nombre: 'Juan Manuel Fangio', tipo_via: 'AVENIDA' },
    40: { numero: 83, nombre: 'Francisca Báez de Maidana', tipo_via: 'AVENIDA' }
  };

  // Mapeo toponímico canónico para calles del ejido urbano en la Ordenanza XVIII - N° 46
  // con redacciones particulares (cortadas, homenajes sin prefijo estándar o nombres históricos):
  const MAPEO_TOPONIMICO_XVIII_46: Record<number, { numero: number; nombre: string; tipo_via: 'AVENIDA' | 'CALLE' | 'PASAJE' }> = {
    1: { numero: 16, nombre: 'Constituyentes Provinciales', tipo_via: 'CALLE' },
    2: { numero: 60, nombre: 'Manuel Lovera', tipo_via: 'CALLE' },
    4: { numero: 90, nombre: 'Cabo 1º José Luis Morel', tipo_via: 'CALLE' },
    6: { numero: 92, nombre: 'Comisario Inspector Luis Ángel Morenate', tipo_via: 'CALLE' },
    8: { numero: 98, nombre: 'Ricardo Giés', tipo_via: 'CALLE' },
    24: { numero: 244, nombre: 'Paul Percy Harris', tipo_via: 'CALLE' },
    27: { numero: 31, nombre: 'Casiano Néstor Carvallo', tipo_via: 'CALLE' },
    28: { numero: 41, nombre: 'San Roque González de Santa Cruz', tipo_via: 'CALLE' },
    32: { numero: 61, nombre: 'Luciano Dartois', tipo_via: 'PASAJE' },
    58: { numero: 127, nombre: 'Maestro Miguel Ángel Zaluski', tipo_via: 'CALLE' }
  };

  const isXVIII4 = norma.id === 'XVIII-4' || /XVIII\s*-\s*N[°o\.]?\s*4\b/i.test(norma.documento_normativo);
  const isXVIII46 = norma.id === 'XVIII-46' || /XVIII\s*-\s*N[°o\.]?\s*46\b/i.test(norma.documento_normativo);
  const isXVIII130 = norma.id === 'XVIII-130' || /XVIII\s*-\s*N[°o\.]?\s*130\b/i.test(norma.documento_normativo);

  // Expresiones regulares para capturar patrones habituales del HCD Posadas:
  // Patrón A: ARTICULO 10.- Desígnase con el nombre de "Lucas Braulio Areco" a la Avenida N° 115.
  const regexA = /ART[IÍ]CULO\s+(\d+)[\.\-\:\s]+(?:Des[ií]gnase|Imp[oó]nese|D[aá]se el nombre de|Denom[ií]nase)?.*?(?:con el nombre de|el nombre de)\s*["“'«]([^"”'»]+)["”'»]\s*,?\s*(?:a la|la|al)?\s*(?:actual\s*)?(Avenida|Calle|Pasaje)\s*(?:N[°o\.]?\s*)?(\d+[a-zA-Z]?)/i;

  // Patrón B: ARTICULO 10.- a la Avenida N° 115 con el nombre de "Lucas Braulio Areco".
  const regexB = /ART[IÍ]CULO\s+(\d+)[\.\-\:\s]+.*?\s*,?\s*(?:a la|la|al)?\s*(Avenida|Calle|Pasaje)\s*(?:N[°o\.]?\s*)?(\d+[a-zA-Z]?).*?(?:con el nombre de|el nombre de)\s*["“'«]([^"”'»]+)["”'»]/i;

  // Patrón C (sin comillas): ARTICULO 10.- Desígnase con el nombre de Lucas Braulio Areco, a la Avenida N° 115.
  const regexC = /ART[IÍ]CULO\s+(\d+)[\.\-\:\s]+(?:Des[ií]gnase|Imp[oó]nese|D[aá]se el nombre de|Restit[uú]yese el nombre de|Denom[ií]nase)?.*?(?:con el nombre de|el nombre de)\s+([A-Za-zÁÉÍÓÚáéíóúñÑ0-9\.\s]+?)\s*,?\s*(?:a la|la|al)?\s*(?:actual\s*)?(Avenida|Calle|Pasaje)\s*(?:N[°o\.]?\s*)?(\d+[a-zA-Z]?)/i;

  // Patrón D (ordenanzas particulares o tramos extensos con mención de Calle/Pasaje/Avenida entre paréntesis o tras fórmulas descriptivas):
  // Ej: ARTICULO 1.- Desígnase con el nombre de "..." a toda la extensión de la Calle N° 62
  // Ej: ARTICULO 1.- Desígnase con el nombre de "..." al tramo de la Ruta Nacional Nº 12 ... (Calle N° 12)
  const regexD = /ART[IÍ]CULO\s+(\d+)[\.\-\:\s]+(?:Des[ií]gnase|Imp[oó]nese|D[aá]se el nombre de|Denom[ií]nase)?.*?(?:con el nombre de|el nombre de)\s*["“'«]([^"”'»]+)["”'»].*?(?:actual\s*)?(Avenida|Calle|Pasaje)\s*(?:N[°o\.]?\s*)?(\d+[a-zA-Z]?)/i;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith('//')) {
      continue;
    }

    let match = line.match(regexA);
    if (match) {
      const numArt = parseInt(match[1], 10);
      const nombreAsignado = match[2].trim();
      const tipoVia = isXVIII4 ? 'AVENIDA' : (match[3].toUpperCase() as 'AVENIDA' | 'CALLE' | 'PASAJE');
      const numCalle = parseInt(match[4], 10);

      articulos.push({
        articulo: `Artículo ${numArt}`,
        numero_articulo: numArt,
        nombre_asignado: nombreAsignado,
        tipo_via: tipoVia,
        numero_calle: numCalle,
        referencia_ordenanza: `${norma.documento_normativo}, Art. ${numArt}`,
        documento_normativo: norma.documento_normativo,
        url_ordenanza: norma.url_ordenanza,
        texto_original: line
      });
      continue;
    }

    match = line.match(regexB);
    if (match) {
      const numArt = parseInt(match[1], 10);
      const tipoVia = isXVIII4 ? 'AVENIDA' : (match[2].toUpperCase() as 'AVENIDA' | 'CALLE' | 'PASAJE');
      const numCalle = parseInt(match[3], 10);
      const nombreAsignado = match[4].trim();

      articulos.push({
        articulo: `Artículo ${numArt}`,
        numero_articulo: numArt,
        nombre_asignado: nombreAsignado,
        tipo_via: tipoVia,
        numero_calle: numCalle,
        referencia_ordenanza: `${norma.documento_normativo}, Art. ${numArt}`,
        documento_normativo: norma.documento_normativo,
        url_ordenanza: norma.url_ordenanza,
        texto_original: line
      });
      continue;
    }

    match = line.match(regexC);
    if (match) {
      const numArt = parseInt(match[1], 10);
      const nombreAsignado = match[2].trim();
      const tipoVia = isXVIII4 ? 'AVENIDA' : (match[3].toUpperCase() as 'AVENIDA' | 'CALLE' | 'PASAJE');
      const numCalle = parseInt(match[4], 10);

      articulos.push({
        articulo: `Artículo ${numArt}`,
        numero_articulo: numArt,
        nombre_asignado: nombreAsignado,
        tipo_via: tipoVia,
        numero_calle: numCalle,
        referencia_ordenanza: `${norma.documento_normativo}, Art. ${numArt}`,
        documento_normativo: norma.documento_normativo,
        url_ordenanza: norma.url_ordenanza,
        texto_original: line
      });
      continue;
    }

    match = line.match(regexD);
    if (match) {
      const numArt = parseInt(match[1], 10);
      const nombreAsignado = match[2].trim();
      let tipoVia = isXVIII4 ? 'AVENIDA' : (match[3].toUpperCase() as 'AVENIDA' | 'CALLE' | 'PASAJE');
      let numCalle: number | null = parseInt(match[4], 10);

      // Si la norma designa un tramo de Ruta Nacional o Provincial en la red urbana
      if (/Ruta\s*(?:Nacional|Provincial|Nac\.?|Prov\.?)/i.test(line)) {
        tipoVia = 'AVENIDA';
        // Si el tramo continúa una avenida troncal conocida (ej. continuación sur de Av. Uruguay Eje 45 hacia Garupá)
        if (/Avenida Uruguay/i.test(line)) {
          numCalle = 45;
        }
      }

      articulos.push({
        articulo: `Artículo ${numArt}`,
        numero_articulo: numArt,
        nombre_asignado: nombreAsignado,
        tipo_via: tipoVia,
        numero_calle: numCalle,
        referencia_ordenanza: `${norma.documento_normativo}, Art. ${numArt}`,
        documento_normativo: norma.documento_normativo,
        url_ordenanza: norma.url_ordenanza,
        texto_original: line
      });
      continue;
    }

    // Coincidencia con mapeo toponímico específico si aplica a la norma XVIII-4
    if (isXVIII4) {
      const artHeaderMatch = line.match(/^ART[IÍ]CULO\s+(\d+)[\.\-\:\s]+/i);
      if (artHeaderMatch) {
        const numArt = parseInt(artHeaderMatch[1], 10);
        const canon = MAPEO_TOPONIMICO_XVIII_4[numArt];
        if (canon) {
          articulos.push({
            articulo: `Artículo ${numArt}`,
            numero_articulo: numArt,
            nombre_asignado: canon.nombre,
            tipo_via: canon.tipo_via,
            numero_calle: canon.numero,
            referencia_ordenanza: `${norma.documento_normativo}, Art. ${numArt}`,
            documento_normativo: norma.documento_normativo,
            url_ordenanza: norma.url_ordenanza,
            texto_original: line
          });
        }
      }
    }

    // Coincidencia con mapeo toponímico específico si aplica a la norma XVIII-46
    if (isXVIII46) {
      const artHeaderMatch = line.match(/^ART[IÍ]CULO\s+(\d+)[\.\-\:\s]+/i);
      if (artHeaderMatch) {
        const numArt = parseInt(artHeaderMatch[1], 10);
        const canon = MAPEO_TOPONIMICO_XVIII_46[numArt];
        if (canon) {
          articulos.push({
            articulo: `Artículo ${numArt}`,
            numero_articulo: numArt,
            nombre_asignado: canon.nombre,
            tipo_via: canon.tipo_via,
            numero_calle: canon.numero,
            referencia_ordenanza: `${norma.documento_normativo}, Art. ${numArt}`,
            documento_normativo: norma.documento_normativo,
            url_ordenanza: norma.url_ordenanza,
            texto_original: line
          });
        }
      }
    }
  }

  return articulos;
}
