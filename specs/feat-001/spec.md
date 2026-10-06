# FEAT-001 — Ingesta, normalización y esquema de datos base (SQLite + FTS5 + R*Tree)

## Origen y necesidad

- **Antecedente:** [PRD Calles de Posadas](../../docs/prd.md) (Secciones 1.1, 1.3, 3 y 6) y decisión de arquitectura [DEC-001](../../docs/decisions.md#dec-001).
- **Problema:** Los datos geográficos de calles, barrios y ciclovías de la [IDE Posadas](https://www.ide.posadas.gob.ar/) están en capas vectoriales abiertas, pero requieren descarga, limpieza de prefijos toponímicos, extracción de números de arteria, cruce espacial con barrios y persistencia estructurada para alimentar el motor de búsqueda y la cartografía con latencia mínima y sin dependencias de servicios externos pesados.
- **Resultado observable:** Pipeline automatizado y reproducible (script ETL en TypeScript) que descarga o lee las capas GeoJSON, normaliza las nomenclaturas, cruza espacialmente tramos con barrios y ciclovías vía `@turf/turf`, genera el archivo de base de datos SQLite (`calles.db`) con tablas relacionales, índices B-Tree, tabla virtual de búsqueda `calles_fts` (FTS5) e índice espacial de Bounding Boxes `calles_rtree` (R*Tree nativo).

## Alcance y exclusiones

### Alcance
1. **Script de descarga de capas públicas de IDE Posadas:**
   - Calles (`geonode:calles_Posadas1`)
   - Barrios (`geonode:barrios_posadas`)
   - Bicisendas y ciclovías (`geonode:bicisendas_ciclovias0`)
2. **Soporte offline / fixtures locales** para ejecuciones de prueba y CI reproducibles sin red.
3. **Pipeline de normalización y procesamiento espacial:**
   - Normalización de prefijos ("Av.", "Calle", "Pje.", "Diagonal", "Costanera").
   - Extracción de número de calle cuando forme parte del nombre (ej. "Av. 115" -> `street_number = 115`).
   - Generación de slug URL canónico único.
   - Cruce espacial determinístico entre segmentos y polígonos de barrios/chacras (usando `@turf/turf`).
   - Detección de solapamiento de infraestructura ciclista por tramo.
   - Cálculo de Bounding Box (`minX, maxX, minY, maxY`) de cada calle y barrio.
4. **Esquema DDL de SQLite embebido:**
   - Tablas relacionales: `calles`, `barrios`, `calle_barrios`, `tramos_ciclovia`.
   - Tabla virtual de texto: `calles_fts USING fts5(nombre, nombre_normalizado, slug, content='calles')`.
   - Tabla virtual espacial: `calles_rtree USING rtree(id, min_x, max_x, min_y, max_y)`.
5. **Carga inicial (seed) y script de verificación de consistencia:**
   - Validación de no nulidad en geometrías GeoJSON.
   - Verificación de consultas de búsqueda FTS5 ("115", "Areco").
   - Verificación de consulta por Bounding Box en R*Tree.

### Exclusiones
- Enriquecimiento masivo de ordenanzas y biografías (se incluye un set piloto de validación; la carga exhaustiva del Digesto se integrará de forma incremental).
- Endpoints de API REST / Route Handlers (corresponde a `FEAT-002`).
- Interfaz gráfica o visor web (corresponde a `FEAT-003`).

## Comportamiento y aceptación

- **AC-001 (Descarga reproducible):** El comando de ingesta descarga las capas GeoJSON de la IDE Posadas y guarda los archivos en un directorio local de datos brutos, o utiliza fixtures locales si se ejecuta con bandera `--offline`.
- **AC-002 (Normalización de nombres y números):** El transformador extrae correctamente el tipo de vía (`AVENIDA`, `CALLE`, `PASAJE`, etc.), separa el número de arteria cuando existe numéricamente y genera un `slug` normalizado (minúsculas, guiones, sin diacríticos).
- **AC-003 (Cruce espacial de tramos y ciclovías):** El pipeline asocia los segmentos de calles con el barrio o chacra que intersectan espacialmente vía Turf.js, e identifica si el tramo cuenta con ciclovía superpuesta.
- **AC-004 (Esquema SQLite con FTS5 y R*Tree):** El script DDL inicializa las tablas relacionales y las tablas virtuales `calles_fts` y `calles_rtree` de forma nativa en un archivo SQLite sin requerir librerías C externas adicionales.
- **AC-005 (Verificación de integridad y búsquedas):** Un comando de comprobación (`npm run test:data` o script de test) valida que:
  1. Existen registros de calles y barrios con geometrías válidas en formato GeoJSON.
  2. Una búsqueda FTS5 por texto o número (ej. "115" o "Areco") devuelve la arteria correcta en < 5 ms.
  3. Una consulta R*Tree de caja delimitadora devuelve las arterias contenidas en el área.

## Diseño y dependencias

- **Componentes:**
  - `scripts/etl/extract.ts`: Descargador HTTP de GeoJSON desde IDE Posadas.
  - `scripts/etl/transform.ts`: Lógica pura de normalización toponímica y cruce espacial con `@turf/turf`.
  - `scripts/etl/schema.sql`: Definición DDL con tablas estándar, FTS5 y R*Tree.
  - `scripts/etl/load.ts`: Inserción en SQLite (`better-sqlite3`).
- **Dependencias:**
  - Node.js >= 20.x, `@turf/turf`, `better-sqlite3`.
  - Decisión arquitectónica acordada en [DEC-001](../../docs/decisions.md#dec-001).

## Aprobación del contrato

- **Estado:** Aprobado.
- **Quién decide:** Usuario (aprobación expresa en chat).
- **Fecha:** 2026-10-06
- **Alcance aprobado:** Alcance completo de FEAT-001 bajo arquitectura SQLite + FTS5 + R*Tree + Turf.js.
