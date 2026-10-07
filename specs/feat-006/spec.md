# FEAT-006 — Saneamiento toponímico, desduplicación y consolidación de tramos en ETL

## Origen y necesidad

- **Antecedente:** Reporte de usuario sobre duplicación de prefijos ("Avenida Avenida") y fragmentación de arterias con múltiples fichas en el catálogo (ej. "Calle Suiza" dividida en `calle-suiza-98` y `calle-suiza-98-2`).
- **Problema:** 
  1. **Duplicación toponímica:** Registros del dataset municipal sin denominación formal vienen identificados como `AVENIDA(171)` o `AVENIDA`. La expresión regular de limpieza en `transform.ts` exigía un espacio posterior (`\s+`), por lo que no eliminó el prefijo y generó nombres redundantes como `Avenida Avenida 171` o `Avenida Avenida`.
  2. **Fragmentación de tramos por arteria:** El dataset GIS municipal modela las arterias como múltiples features vectoriales independientes por corte catastral o discontinuidad física. `transformCalles` generó un registro en `calles` por cada feature vectorial (generando slugs con sufijos numéricos `-2`, `-3`), afectando a 429 arterias del catálogo y dispersando sus tramos en fichas separadas en lugar de consolidarlos en una única calle con múltiples tramos (`tramos_calle`).
- **Resultado observable:** Pipeline ETL corregido que normaliza limpiamente los prefijos viales, agrupa los segmentos de una misma arteria en una sola ficha con su geometría consolidada y múltiples tramos catastrales, y regenera la base SQLite sin duplicaciones.

## Alcance y exclusiones

### Alcance
1. **Normalización toponímica de prefijos (`scripts/etl/transform.ts`):**
   - Limpieza rigurosa de sufijos entre paréntesis numéricos y alfanuméricos (`\(\d+[a-zA-Z]?\)`).
   - Eliminación de prefijos viales aislados (`AVENIDA`, `CALLE`, `PASAJE`) para que arterias sin nombre adopten limpiamente `Avenida <número>` o fallback sin duplicar el prefijo.
2. **Consolidación multi-tramo de arterias (`scripts/etl/transform.ts`):**
   - Agrupación de features por clave canónica (nombre normalizado + número de calle).
   - Unificación de geometrías en un `MultiLineString` consolidado para la ficha técnica y mapa.
   - Cálculo de la longitud total como suma acumulada de los segmentos.
   - Creación de múltiples registros ordenados en `tramos_calle` por cada segmento físico.
   - Unión de conjuntos de barrios y chacras intersectados por cualquiera de los tramos.
3. **Regeneración de base de datos y tests:**
   - Ejecución determinística de ETL y regeneración de `data/calles.db`.
   - Pruebas automatizadas en `test/transform.test.ts` y `test/streets-db.test.ts`.

### Exclusiones
- Modificación del esquema DDL de base de datos (el esquema actual ya contempla `tramos_calle`).
- Modificación de endpoints de API pública o componentes de UI (el contrato frontend ya soporta múltiples tramos y MultiLineString).

## Comportamiento y aceptación

- **AC-001 (Saneamiento toponímico):** Ninguna arteria en la base de datos presenta prefijos duplicados (0 resultados para `SELECT count(*) FROM calles WHERE nombre_oficial LIKE '%Avenida Avenida%' OR nombre_oficial LIKE '%Calle Calle%'`).
- **Comprobación prevista de AC-001:** Consulta SQL sobre `data/calles.db` regenerada y tests unitarios en `test/transform.test.ts` con casos `AVENIDA(171)`, `AVENIDA(77B)` y `AVENIDA`. Artefacto: salida del test unitario y recuento SQL = 0 en evidence.md.
- **AC-002 (Consolidación de arterias multi-segmento):** Arterias con igual nombre oficial y número de calle (ej. "Calle Suiza" N° 98) se unifican en un único registro `calles` con un solo slug (`calle-suiza-98`).
- **Comprobación prevista de AC-002:** Verificación de unicidad de registro para "Calle Suiza" (slug `calle-suiza-98`) mediante consulta SQL y endpoint `/api/v1/streets/calle-suiza-98`, y consulta SQL de ausencia de slugs homónimos con sufijo `-2` derivados de tramos fragmentados. Artefacto: salida de consulta en evidence.md.
- **AC-003 (Preservación y orden de tramos):** Cada segmento original de la arteria consolidada se preserva como fila individual en `tramos_calle` con su longitud y atributos de ciclovía.
- **Comprobación prevista de AC-003:** Inspección de `tramos_calle` para `calle-suiza-98` verificando 2 tramos registrados con longitudes respectivas (~464 m y ~239 m) y suma equivalente a la longitud total de la calle (~703 m). Artefacto: salida SQL y test de integración en evidence.md.
- **AC-004 (Geometría unificada en visor):** La arteria unificada presenta un GeoJSON `MultiLineString` que abarca todos sus tramos en el visor cartográfico.
- **Comprobación prevista de AC-004:** Navegación en frontend local a `/calles/calle-suiza-98` en viewport desktop (1280x800), verificando que la traza sobre Leaflet dibuje ambos tramos simultáneamente. Artefacto: captura en `specs/feat-006/artifacts/AC-004-multitramo-suiza-desktop.png` enlazada en evidence.md.
- **AC-005 (Integridad y suites de prueba):** La suite completa de tests (`npm test`) y la compilación (`npm run build`) pasan al 100%.
- **Comprobación prevista de AC-005:** Ejecución completa de `npm test` y `npm run build` en consola local. Artefacto: exit codes 0 y salidas en evidence.md.

## Diseño y dependencias

- **Archivos afectados:**
  - `scripts/etl/transform.ts`: lógica de normalización toponímica y agrupación de arterias por clave compuesta.
  - `scripts/etl/load.ts`: inserción de tramos asociados y métricas de carga consolidada.
  - `test/transform.test.ts`: tests de desduplicación y tramos agrupados.
  - `data/calles.db`: regeneración de datos de producción/desarrollo.

## Aprobación del contrato

- **Estado:** Aprobado.
- **Quién decide:** Usuario (instrucción expresa en chat).
- **Fecha:** 2026-10-06.
- **Alcance aprobado:** Corrección de duplicación toponímica ("Avenida Avenida") y consolidación de arterias multi-tramo (caso "Calle Suiza" y 429 arterias similares) en el pipeline ETL.

El estado de implementación se consulta en el [catálogo](../index.md); el detalle en [tareas](tasks.md) y las comprobaciones en [evidencia](evidence.md).
