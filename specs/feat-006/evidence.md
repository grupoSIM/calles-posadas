# FEAT-006 — evidencia

Historia de actividades, cambios, errores, ejecuciones y revisiones. Identificar fecha, etapa, rol ejercido, agente responsable y salida real en cada entrada; no inventar intervenciones para completar roles. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) explican qué se verifica.

## Diagnóstico previo y antecedentes (2026-10-06)

1. **Problema "Avenida Avenida":**
   - 13 registros en `calles` con nombre `Avenida Avenida` originados por features con `avenidas: "AVENIDA(171)"`, etc.
   - La regex en `transform.ts` requería espacio `\s+` posterior al prefijo, dejando `cleanName = "AVENIDA"` y generando `Avenida Avenida`.
2. **Problema de fragmentación de arterias (caso "Calle Suiza"):**
   - 429 arterias presentan múltiples registros independientes en la base de datos (con slugs `-2`, `-3`).
   - "Calle Suiza (98)" posee 2 features vectoriales en `data/raw/calles.json` (fid 181 con 464 m y fid 188 con 239 m). En lugar de agruparse como 2 tramos de una sola calle, el ETL las cargó como 2 arterias independientes.

## Errores y correcciones: entradas reales

### ERR-001: Duplicación toponímica de prefijos viales ("Avenida Avenida")
- **Origen y fecha:** Reporte de usuario (2026-10-06).
- **AC afectado:** AC-001.
- **Síntoma y reproducción:** 13 registros en tabla `calles` con nombre `Avenida Avenida` originados por features con atributos como `AVENIDA(171)`, `AVENIDA(77B)` o `AVENIDA`. Consulta: `SELECT count(*) FROM calles WHERE nombre_oficial LIKE '%Avenida Avenida%'`.
- **Esperado:** Nombre normalizado limpio (`Avenida 171` o prefijo vial simple sin duplicaciones).
- **Observado:** `Avenida Avenida 171` o `Avenida Avenida` debido a que la regex en `transform.ts` requería `\s+` tras el prefijo.
- **Cambio correctivo:** Corrección de regex en `transform.ts` para separar prefijos pegados (`CALLEGENDARME`), remover sufijos parentizados alfanuméricos (`\([^)]*\)?`), prefijos redundantes múltiples (`^((CALLE|AVENIDA|...)...)+`) y normalizar espacios tras puntos de abreviatura.
- **Comprobación posterior:** Verificado en [T-001](#t-001) (`test/transform.test.ts`) y [T-003](#t-003) (consulta SQL devuelve 0 registros con prefijo duplicado en `calles.db`). Resuelto.

### ERR-002: Fragmentación de arterias multi-segmento en fichas independientes ("Calle Suiza")
- **Origen y fecha:** Reporte de usuario (2026-10-06).
- **AC afectado:** AC-002, AC-003, AC-004.
- **Síntoma y reproducción:** 429 arterias presentan registros fragmentados en la base de datos con sufijos `-2`, `-3`. El caso testigo "Calle Suiza (98)" cuenta con 2 features vectoriales en `data/raw/calles.json` (fid 181 de 464 m y fid 188 de 239 m). En lugar de consolidarse como una arteria con 2 tramos, el ETL generó dos fichas separadas (`calle-suiza-98` y `calle-suiza-98-2`).
- **Esperado:** Ficha única con slug `calle-suiza-98`, 2 filas asociadas en `tramos_calle` y geometría combinada MultiLineString que dibuje la traza completa en el mapa.
- **Observado:** 2 registros independientes en `calles`, geometrías desvinculadas y longitud no acumulada.
- **Cambio correctivo:** Implementación de agrupación canónica en `transformCalles` por `(nombreNormalizado, numeroCalle)`, consolidación de trazas en `MultiLineString` y ordenamiento secuencial de tramos en `tramos_calle`.
- **Comprobación posterior:** Verificado en [T-002](#t-002), [T-003](#t-003) y comprobación visual con captura en [T-004](#t-004). Resuelto.

## Ejecuciones y comprobaciones: 2026-10-07

### <a id="t-001"></a>T-001: Saneamiento toponímico de prefijos (AC-001)
- **Fecha y rol:** 2026-10-07, Developer (Autocontrol).
- **Alcance comprobado:** Limpieza rigurosa de sufijos alfanuméricos y prefijos redundantes en `scripts/etl/transform.ts`. Casos `AVENIDA(171)` -> `Avenida 171`, `AVENIDA(77B)` -> `Avenida 77`, `AVENIDA` -> `Avenida Sin Nombre`.
- **Comando:** `node --test --import tsx test/transform.test.ts`
- **Exit code:** 0
- **Resultado observado:** Test unitario `T-001: Saneamiento toponímico sin duplicación de prefijos` superado exitosamente. Cero instancias de "Avenida Avenida" o "Calle Calle".
- **Estado AC-001:** Cumplido.

### <a id="t-002"></a>T-002: Consolidación multi-segmento en ETL (AC-002, AC-003)
- **Fecha y rol:** 2026-10-07, Developer (Autocontrol).
- **Alcance comprobado:** Agrupación canónica en `transformCalles` por `(nombreNormalizado, numeroCalle)`. Geometría unificada en `MultiLineString`, cálculo de longitud total sumada y generación de filas individuales en `tramos_calle`.
- **Comando:** `node --test --import tsx test/transform.test.ts`
- **Exit code:** 0
- **Resultado observado:** Test unitario `T-002: Consolidación multi-segmento de arterias (caso Calle Suiza N° 98)` superado. Caso "Calle Suiza" consolidado en 1 única calle (`slug: calle-suiza-98`), 2 tramos y suma exacta de longitudes.
- **Estado AC-002, AC-003:** Cumplido.

### <a id="t-003"></a>T-003: Re-ejecución del ETL e integridad en SQLite (AC-001, AC-002, AC-003)
- **Fecha y rol:** 2026-10-07, Developer (Autocontrol).
- **Alcance comprobado:** Regeneración determinística de la base de datos `data/calles.db` mediante el pipeline ETL.
- **Comando:** `npm run etl`
- **Exit code:** 0
- **Resultado observado:**
  - 208 barrios y chacras cargados.
  - 912 arterias consolidadas (reducción limpia desde las 2781 features fragmentadas anteriores).
  - 2781 tramos geométricos preservados en `tramos_calle` (100% de la red vial preservada).
  - Consulta `SELECT count(*) FROM calles WHERE nombre_oficial LIKE '%Avenida Avenida%' OR nombre_oficial LIKE '%Calle Calle%'`: 0 registros.
  - Consulta `SELECT slug, nombre_oficial, longitud_total_m FROM calles WHERE slug LIKE 'calle-suiza%'`: 1 registro (`calle-suiza-98`, longitud total 703.12 m).
  - Consulta `SELECT count(*) FROM calles WHERE slug LIKE '%-2'`: 0 registros por homonimia física.
- **Estado AC-001, AC-002, AC-003:** Cumplido.

### <a id="t-004"></a>T-004: Inspección visual de geometría multi-tramo en visor Leaflet (AC-004)
- **Fecha y rol:** 2026-10-07, Developer (Autocontrol).
- **Alcance comprobado:** Comprobación visual interactiva en frontend local (`http://localhost:3000/calles/calle-suiza-98`) en viewport desktop (1280x800).
- **Procedimiento:** Servidor Next.js iniciado, captura realizada mediante navegador headless en viewport 1280x800 con renderizado completo de capas Leaflet y datos estructurados.
- **Artefacto:** [AC-004-multitramo-suiza-desktop.png](artifacts/AC-004-multitramo-suiza-desktop.png)
- **Resultado observado:** La ficha de detalle muestra `Calle Suiza`, longitud `703 m`, ficha de `TRAMOS CATASTRALES (2)` con Tramo 1 (464 m) y Tramo 2 (239 m), y el visor cartográfico renderiza simultáneamente ambos segmentos vectoriales de la arteria sobre el mapa en color River Azure (`#0284c7`) con encuadre automático correcto.
- **Estado AC-004:** Cumplido.

### <a id="t-005"></a>T-005: Verificación de regresiones y compilación estática (AC-005)
- **Fecha y rol:** 2026-10-07, Developer (Autocontrol).
- **Alcance comprobado:** Ejecución completa de suites de prueba unitarias/integración y compilación estática para producción.
- **Comandos:** `npm test` y `npm run build`
- **Exit codes:** 0 y 0
- **Resultado observado:**
  - `npm test`: 36 tests pasados en 18 suites (0 fallos).
  - `npm run build`: Compilación exitosa en Next.js 16.3.8 con Turbopack (rutas `/`, `/_not-found`, `/calles/[slug]`, `/stats`, y endpoints API generados sin errores).
- **Estado AC-005:** Cumplido.

## Revisión independiente

- **Fecha y rol:** 2026-10-07, Verifier (Revisión independiente por agente separado).
- **Implementador vs Revisor:** Implementación realizada por Developer (`bc3fabc7-4191-4bb5-8bc3-8ee44a859582`). Auditoría y contrastación ejecutada de forma independiente por Verifier (`a998434e-c51c-403c-9b19-96e5e57f1a57`).
- **Material inspeccionado:**
  - Contrato formal: `specs/feat-006/spec.md` (criterios de aceptación AC-001 a AC-005).
  - Tareas de desglose: `specs/feat-006/tasks.md` (T-001 a T-006).
  - Diff y código fuente: `scripts/etl/transform.ts`, `test/transform.test.ts`, `test/load-verify.test.ts`.
  - Base de datos física: `data/calles.db` (912 arterias, 2781 tramos, 208 barrios).
  - Artefacto visual: `specs/feat-006/artifacts/AC-004-multitramo-suiza-desktop.png` (viewport desktop 1280x800).
  - Registro de errores: ERR-001 ("Avenida Avenida") y ERR-002 ("Calle Suiza fragmentada") en `specs/feat-006/evidence.md`.
- **Comprobaciones ejecutadas personalmente:**
  1. *AC-001 (Saneamiento toponímico):* Consulta SQL `SELECT count(*) FROM calles WHERE nombre_oficial LIKE '%Avenida Avenida%' OR nombre_oficial LIKE '%Calle Calle%'` ejecutada sobre `data/calles.db`. Resultado: 0 registros duplicados.
  2. *AC-002 (Consolidación multi-segmento):* Consulta SQL de unicidad para "Calle Suiza" devolvió exactamente 1 registro (`slug: calle-suiza-98`, `id: 6498`, `longitud_total_m: 703.12`). Consulta de sufijos homónimos `-2` devolvió 0 registros.
  3. *AC-003 (Preservación y orden de tramos):* Consulta SQL a `tramos_calle` para `calle_id = 6498` arrojó 2 tramos físicos ordenados (`Tramo 1`: 464.07 m; `Tramo 2`: 239.05 m; suma: 703.12 m).
  4. *AC-004 (Inspección visual):* Auditoría directa de imagen `AC-004-multitramo-suiza-desktop.png` comprobó la tarjeta con 2 tramos catastrales (464 m y 239 m) y la visualización de ambos segmentos de traza simultáneos en el mapa Leaflet en River Azure.
  5. *AC-005 (Suites de test y build):* Ejecución directa de `npm test` (36 tests pasados en 18 suites, 0 fallos) y `npm run build` (Next.js 16.3.8 Turbopack, compilación estática completada exitosamente sin errores).
- **Hallazgos:** Ninguno. La implementación respeta estrictamente el contrato, no altera el DDL de base de datos ni los endpoints públicos, y resuelve íntegramente las anomalías reportadas.
- **Dictamen formal:** Favorable. Todos los criterios de aceptación (AC-001 a AC-005) están satisfechos con evidencia empírica verificada. Aprobado para cierre como Verificada.

