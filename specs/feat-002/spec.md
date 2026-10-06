# FEAT-002 — Motor de búsqueda unificado y endpoints de catálogo

## Origen y necesidad

- **Antecedente:** [PRD Calles de Posadas](../../docs/prd.md) (Secciones 4.1, 4.2 y 5: RF-01, RF-02).
- **Problema:** Los datos consolidados en SQLite (`data/calles.db`) necesitan ser expuestos mediante servicios de consulta y endpoints REST JSON optimizados, capaces de resolver búsquedas multi-alias (nombre formal, número de arteria, barrio, chacra), filtros combinados (tipo de vía, presencia de ciclovía) y entregar la geometría GeoJSON de detalle lista para el visor cartográfico.
- **Resultado observable:** Módulo de consultas y endpoints HTTP `/api/v1/streets`, `/api/v1/streets/:slug` y `/api/v1/barrios` con paginación, filtros combinados y tiempos de respuesta inferiores a 10 ms sobre SQLite + FTS5.

## Alcance y exclusiones

### Alcance
1. **Módulo de consultas de dominio (`src/lib/db/streets.ts`):**
   - Búsqueda multi-alias vía FTS5 (prefijos, números y nombres sin diacríticos).
   - Filtros combinados por:
     - `barrio_id`: Asociación con polígonos de barrios.
     - `chacra`: Número de chacra catastral (1 a 200+).
     - `road_type`: `AVENIDA`, `CALLE`, `PASAJE`, `DIAGONAL`, `COSTANERA`.
     - `has_cycleway`: Arterias con infraestructura ciclista detectada.
   - Paginación determinística (`page`, `limit` de 1 a 100) y conteo total.
2. **Endpoint `GET /api/v1/streets`:**
   - Lista paginada con metadatos de vía, longitud, ciclovía y lista de barrios por los que transita.
3. **Endpoint `GET /api/v1/streets/:slug`:**
   - Detalle canónico de arteria, metadatos, ordenanza de respaldo y objeto `geojson` con la geometría vectorial de la traza para Leaflet.
4. **Endpoint `GET /api/v1/barrios`:**
   - Listado ordenado de barrios oficiales y chacras para alimentar selectores y filtros de búsqueda en el cliente.
5. **Suite de pruebas de integración HTTP / servicio:**
   - Verificación de contratos JSON, códigos de estado (200, 404, 400), filtros y rendimiento.

### Exclusiones
- Interfaz gráfica de usuario y componentes interactivos de mapa en Leaflet (corresponde a `FEAT-003`).
- Endpoint de métricas agregadas `/api/v1/stats` (corresponde a `FEAT-004`).
- Autenticación o rutas de mutación/escritura (la API es 100% de solo lectura pública).

## Comportamiento y aceptación

- **AC-001 (Búsqueda multi-alias):** `GET /api/v1/streets?q=<query>` resuelve búsquedas por nombre parcial ("Jujuy"), número de arteria ("49") o términos combinados, retornando resultados ordenados por relevancia FTS5 en menos de 10 ms.
- **AC-002 (Filtros de catálogo):** `GET /api/v1/streets` permite filtrar por `chacra` (número), `barrio_id` (entero), `road_type` (tipo de vía) y `has_cycleway` (`true`/`false`), retornando sólo los registros que cumplen todas las condiciones.
- **AC-003 (Paginación consistente):** `GET /api/v1/streets` devuelve la estructura `{ total: number, page: number, limit: number, data: CalleSummary[] }`, validando que `limit` no exceda 100 y `page` >= 1.
- **AC-004 (Ficha de detalle y GeoJSON):** `GET /api/v1/streets/:slug` retorna 200 OK con metadatos viales, ordenanza y el campo `geojson` con la traza geográfica completa. Si el slug no existe, retorna 404 Not Found con mensaje descriptivo.
- **AC-005 (Catálogo de barrios):** `GET /api/v1/barrios` retorna 200 OK con el listado de todos los barrios y chacras registrados (`id`, `nombre`, `tipo`, `numero_chacra`).

## Diseño y dependencias

- **Componentes:**
  - `src/lib/db/client.ts`: Conexión de solo lectura a SQLite (`better-sqlite3`).
  - `src/lib/db/streets.ts`: Funciones `searchStreets()`, `getStreetBySlug()`, `listBarrios()`.
  - `src/app/api/v1/streets/route.ts`: Handler HTTP de catálogo y búsqueda.
  - `src/app/api/v1/streets/[slug]/route.ts`: Handler HTTP de detalle de arteria.
  - `src/app/api/v1/barrios/route.ts`: Handler HTTP de listado de barrios.
- **Dependencias:**
  - Base de datos SQLite generada y verificada en `FEAT-001` (`data/calles.db`).
  - Next.js (App Router) o servidor HTTP nativo.

## Aprobación del contrato

- **Estado:** Aprobado.
- **Quién decide:** Usuario (aprobación expresa en chat).
- **Fecha:** 2026-10-06
- **Alcance aprobado:** Búsqueda FTS5, filtros de catálogo, detalle con GeoJSON y listado de barrios.
