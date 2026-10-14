export interface DigestoNormaRaw {
  id: string; // ej: "XVIII-4"
  documento_normativo: string; // ej: "Ordenanza XVIII - N° 4"
  titulo: string;
  url_ordenanza: string;
  fecha_sancion?: string;
  procedencia_normativa: string;
  texto: string;
}

export interface ParsedArticulo {
  articulo: string; // ej: "Artículo 10"
  numero_articulo: number;
  nombre_asignado: string; // ej: "Lucas Braulio Areco"
  tipo_via: 'AVENIDA' | 'CALLE' | 'PASAJE';
  numero_calle: number;
  referencia_ordenanza: string; // ej: "Ordenanza XVIII - N° 4, Art. 10"
  documento_normativo: string; // ej: "Ordenanza XVIII - N° 4"
  url_ordenanza: string;
  texto_original: string;
}

export interface DigestoCalleEntry {
  nombre_oficial: string;
  nombre_normalizado: string;
  numero_calle: number;
  referencia_ordenanza: string | null;
  url_ordenanza: string | null;
  documento_normativo: string | null;
  articulo_normativo: string | null;
  fecha_consulta: string;
  procedencia_normativa: string | null;
  estado_normativo: 'CONFIRMADO' | 'PENDIENTE';
  explicacion: string;
  fuente_biografica?: string;
  categoria_toponimica: string;
}

export interface CorrelationMatch {
  parsedArticulo: ParsedArticulo;
  matchedStreet: {
    nombre: string;
    numero: number;
    tipo_via: string;
  };
  entry: DigestoCalleEntry;
}

export interface CorrelationConflict {
  parsedArticulo: ParsedArticulo;
  reason: string;
  details?: any;
}

export interface CorrelationResult {
  matched: CorrelationMatch[];
  conflicts: CorrelationConflict[];
  unmatchedNormas: ParsedArticulo[];
}

export interface SyncReport {
  normasProcesadas: number;
  articulosParseados: number;
  arteriasConfirmadas: number;
  arteriasPendientes: number;
  conflictos: number;
  tiempoMs: number;
}
