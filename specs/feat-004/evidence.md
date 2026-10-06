# FEAT-004 — evidencia

Historia de cambios, ejecuciones y comprobaciones de `FEAT-004`. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) detallan qué se verifica.

## Ejecución: 2026-10-06 — Implementación de métricas de cobertura y pantalla /stats

### <a id="t-001"></a>T-001: Módulo de agregación de métricas sobre SQLite (`src/lib/db/stats.ts`)
- **Alcance comprobado:** Consultas agregadas de conteo de arterias (2.673), red vial acumulada (~1.815 km), cobertura de numeración catastral, cobertura de explicaciones y ordenanzas del Digesto, calles con ciclovía (140 arterias, 5.2%), desglose por tipo de vía (`CALLE`, `AVENIDA`, `PASAJE`, etc.), sentido de circulación, categorización toponímica y composición de barrios/chacras.
- **Comando:** `npm test`
- **Exit code:** 0.
- **Prueba:** `test/stats.test.ts` (suite T-001: Agregación en base de datos).

### <a id="t-002"></a>T-002: Endpoint HTTP REST `GET /api/v1/stats` (`src/app/api/v1/stats/route.ts`)
- **Alcance comprobado:** Respuesta HTTP 200 con payload JSON estructurado `{ success: true, data: { ... } }`, cabeceras `Cache-Control: public, max-age=3600, s-maxage=86400, stale-while-revalidate=86400` y tiempo de ejecución inferior a 15 ms.
- **Comando:** `npm test`
- **Exit code:** 0.
- **Prueba:** `test/stats.test.ts` (suite T-002: Endpoint HTTP GET /api/v1/stats).

### <a id="t-003"></a>T-003: Vista de cobertura y métricas `/stats` (`src/app/stats/page.tsx`)
- **Alcance comprobado:** Componente de servidor Next.js que renderiza tarjetas KPI, panel de completitud y madurez de datos abiertos con barras porcentuales proporcionales, desglose por tipo de vía y sentido de circulación, composición catastral de Posadas y accesos directos al explorador con filtros contextuales.
- **Comando:** `npm test` y `npm run build`
- **Exit code:** 0.
- **Prueba:** `test/stats.test.ts` (suite T-003, T-004: Vista de Página /stats).

### <a id="t-004"></a>T-004: Integración en navegación global (`src/app/layout.tsx`) y build de producción
- **Alcance comprobado:** Enlace directo "Métricas" en la barra de navegación superior sticky del layout global. Compilación limpia sin errores ni advertencias en Next.js App Router.
- **Comando:** `npm run build`
- **Exit code:** 0.
- **Resultado:**
  - Route (app):
    - `○ /` (Static)
    - `○ /_not-found`
    - `ƒ /api/v1/barrios`
    - `ƒ /api/v1/stats`
    - `ƒ /api/v1/streets`
    - `ƒ /api/v1/streets/[slug]`
    - `○ /calles/[slug]`
    - `○ /stats` (Static prerendered)

---

## Cobertura total de pruebas
- **Comando:** `npm test`
- **Exit code:** 0.
- **Resultado:** 32 tests aprobados en 17 suites (0 fallos, 0 omitidos).
