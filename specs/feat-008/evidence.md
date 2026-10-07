# Evidencia de comprobación — FEAT-008: Capa interactiva de barrios en visor y enriquecimiento vial desde IDE Posadas

Historia de cambios, ejecuciones y comprobaciones de `FEAT-008`. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) detallan qué se verifica.

## Registro de actividades y responsables

- **2026-10-07:** Leader / Analyst — Discovery de capas IDE Posadas (`manos_unicas`, `Materialidad_red_vial_2026_0`, `Jerarquia_Red_Vial_00`, `Barrios_Posadas1`) y formulación del contrato de `FEAT-008`.
- **2026-10-07:** Usuario — Aprobación formal del contrato de `FEAT-008`.
- **2026-10-07:** Developer — Implementación de T-001 (enriquecimiento ETL), T-002 (endpoint GeoJSON), T-003 (capa interactiva Leaflet) y T-004 (suite de pruebas y build). Autocontrol completado.

## Estado de criterios de aceptación

| AC | Descripción | Estado | Método de comprobación |
|---|---|---|---|
| AC-001 | Endpoint `GET /api/v1/barrios/geojson` | Cumplido | Test de integración en `test/barrios-geojson.test.ts`. |
| AC-002 | Capa vectorial de barrios y conmutador HUD en `StreetViewer.tsx` | Cumplido | Captura en entorno real: [AC-002-capa-barrios.png](artifacts/AC-002-capa-barrios.png). |
| AC-003 | Enriquecimiento de `sentido_circulacion: 'MANO_UNICA'` y ordenanzas desde IDE | Cumplido | Verificación SQL en `calles` y `barrios` + `test/barrios-geojson.test.ts`. |
| AC-004 | Integridad técnica y suite de pruebas (`npm test`, `npm run build`) | Cumplido | Ejecución local limpia con exit code 0 (49 tests pasados, build exitoso). |

## Ejecución y comprobaciones empíricas

### T-001: Enriquecimiento de datos viales y barrios en ETL
- **Archivos modificados:** `scripts/etl/extract.ts`, `scripts/etl/transform.ts`, `scripts/etl/run-etl.ts`, `data/fixtures/manos_unicas.json`, `data/fixtures/barrios_normativa.json`.
- **Comprobación:**
  - Ejecución de `npm run etl -- --offline`:
    - 208 barrios y chacras procesados.
    - 874 calles y avenidas procesadas.
    - 2781 tramos geométricos.
  - Verificación SQL:
    - 9 arterias clave con mano única confirmadas: Avenida Corrientes, Avenida Francisco de Haro, Avenida Centenario, Avenida Tambor de Tacuari, Avenida Lopez y Planes, Avenida Blas Parera, Avenida Padre Jose F. Rademacher, Avenida General Juan Lavalle, Avenida Santa Catalina con `sentido_circulacion = 'MANO_UNICA'`.
    - 147 barrios enriquecidos con `referencia_ordenanza` (ej. `ORD. XVIII N° 130`).

### T-002: Endpoint GeoJSON de Barrios (`/api/v1/barrios/geojson`)
- **Archivos creados/modificados:** `src/lib/db/streets.ts` (`getBarriosGeoJson`), `src/app/api/v1/barrios/geojson/route.ts`.
- **Comprobación:**
  - Test de integración `test/barrios-geojson.test.ts`:
    - Código 200 y FeatureCollection con 208 features y atributos completos.
    - Filtro por `id` devuelve exactamente la feature requerida.
    - Filtro por texto `q` filtra barrios correctamente.

### T-003: Capa vectorial interactiva y HUD en StreetViewer
- **Archivos modificados:** `src/components/map/StreetViewer.tsx`, `src/app/page.tsx`, `src/app/calles/[slug]/page.tsx`.
- **Comprobación:**
  - Botón HUD conmutador `🏘️ Barrios` toggleable en esquina superior derecha.
  - Carga asíncrona de GeoJSON y renderizado Leaflet con estilo cívico sutil (#64748b con dashArray 4, 4) y resaltado contextual para barrios asociados a la arteria activa (#0284c7 con fillOpacity 0.22).
  - Tooltips y popups con nombre, tipo, chacra y referencia de ordenanza oficial.
  - Inclusión en leyenda de referencias ("Límites de barrio / chacra") al activarse.
  - Captura real en navegador headless: [AC-002-capa-barrios.png](artifacts/AC-002-capa-barrios.png).

### T-004: Suite técnica de pruebas y compilación estática
- **Comandos:** `npm test`, `npm run test:data`, `npm run build`.
- **Resultados observados:**
  - `npm test`: 49 tests pasados en 24 suites (0 fallos).
  - `npm run test:data`: Integridad de datos en SQLite con FTS5 y R*Tree verificada (< 10 ms).
  - `npm run build`: Compilación exitosa con Turbopack (exit code 0), incluyendo la nueva ruta dinámica `/api/v1/barrios/geojson`.

## Hallazgos y seguimiento

- Ningún error bloqueante encontrado. Autocontrol satisfactorio.

## Revisión independiente y dictamen de cierre

- **Fecha y rol:** 2026-10-07, Verifier independiente (`e33379a2-99ab-4e9e-8cdb-f72e862984c8`).
- **Material inspeccionado:**
  - Contrato en [spec.md](spec.md) (AC-001 a AC-004), tareas en [tasks.md](tasks.md), y registro en [evidence.md](evidence.md).
  - Diff en `scripts/etl/extract.ts`, `scripts/etl/transform.ts`, `scripts/etl/run-etl.ts`, `src/lib/db/streets.ts`, `src/app/api/v1/barrios/geojson/route.ts`, `src/components/map/StreetViewer.tsx`, `src/app/page.tsx`, `src/app/calles/[slug]/page.tsx`, y suites de tests.
  - Artefacto visual: [AC-002-capa-barrios.png](artifacts/AC-002-capa-barrios.png).
- **Comprobaciones ejecutadas personalmente por el revisor:**
  1. `npm test`: 49 tests aprobados en 24 suites (0 fallos, 0 saltados).
  2. `npm run test:data`: Base de datos íntegra (`calles.db`), 874 calles, 208 barrios, 2781 tramos, consultas FTS5 y R*Tree < 0.2 ms.
  3. `npm run build`: Compilación limpia en Next.js Turbopack (exit code 0), ruta dinámica `/api/v1/barrios/geojson` generada sin errores.
  4. Inspección de artefacto visual [AC-002-capa-barrios.png](artifacts/AC-002-capa-barrios.png): Botón HUD de Barrios activo, polígonos de barrios renderizados con estilo cívico y leyenda de referencias dinámica.
- **Hallazgos:** Ninguno.
- **Dictamen:** **FAVORABLE**. AC-001 a AC-004 plenamente verificados. Cierre de feature aprobado.
