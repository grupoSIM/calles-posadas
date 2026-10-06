# FEAT-002 — evidencia

Historia de cambios, ejecuciones y comprobaciones de `FEAT-002`. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) detallan qué se verifica.

## Ejecución: 2026-10-06 — Implementación y verificación de la API de Catálogo

### <a id="t-001"></a>T-001: Módulo de consultas de dominio (`src/lib/db/streets.ts`)
- **Alcance comprobado:** Consultas sobre SQLite con sanitización FTS5 por prefijos, filtros combinados (`roadType`, `hasCycleway`, `barrioId`, `chacra`), paginación determinística, detalle completo con parseo GeoJSON y listado ordenado de barrios.
- **Comando:** `npm test`
- **Exit code:** 0.
- **Prueba unitaria:** `test/streets-db.test.ts` (6 tests aprobados).
- **Rendimiento:** Búsquedas FTS5 y filtros resueltos en menos de 1 ms en consultas calientes y menos de 15 ms en arranque en frío.

### <a id="t-002"></a>T-002: Handler `GET /api/v1/streets`
- **Alcance comprobado:** Endpoint REST paginado con validación de límites (rechazo con 400 Bad Request si `limit` > 100 o `page` < 1), filtros combinados por query params y cabeceras de caché.
- **Comando:** `npm test`
- **Exit code:** 0.
- **Prueba de integración:** `test/api-routes.test.ts` (4 tests aprobados).

### <a id="t-003"></a>T-003: Handler `GET /api/v1/streets/:slug`
- **Alcance comprobado:** Recuperación de ficha de detalle con trazado GeoJSON de coordenadas vectoriales en EPSG:4326 y respuesta 404 Not Found con mensaje estructurado para slugs inexistentes.
- **Comando:** `npm test`
- **Exit code:** 0.
- **Prueba de integración:** `test/api-routes.test.ts` (2 tests aprobados).

### <a id="t-004"></a>T-004: Handler `GET /api/v1/barrios`
- **Alcance comprobado:** Endpoint ligero que retorna los 208 barrios y chacras ordenados alfabéticamente para selectores del frontend con cabeceras de caché `public, max-age=600`.
- **Comando:** `npm test`
- **Exit code:** 0.
- **Prueba de integración:** `test/api-routes.test.ts` (1 test aprobado).

---

## Cobertura total de pruebas
- **Comando:** `npm test`
- **Resultado:** 23 tests aprobados en 9 suites (0 fallos, duración total: ~413 ms). Exit code: 0.

## Autocontrol y límites
- **Verificación realizada:** Autocontrol técnico del implementador mediante suite automatizada de pruebas HTTP y de base de datos.
- **Límites:** El consumo visual de estos endpoints se desarrollará en `FEAT-003` (visor cartográfico interactivo y maquetación de fichas en Leaflet).
