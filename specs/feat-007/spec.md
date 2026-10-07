# FEAT-007 — Consolidación toponímica de variantes y abreviaturas viales por homonimia física

## Origen y necesidad

- **Antecedente:** Reporte de usuario sobre fragmentación de arterias continuas que comparten el mismo número catastral oficial pero presentan nombres municipales con abreviaturas o variantes del mismo prócer (ej. Avenida N° 139 dividida en `Avenida Arq. Vivanco` y `Avenida Arq. Jorge Eduardo Vivanco`).
- **Problema:** 
  1. En `FEAT-006`, la consolidación multi-tramo agrupó por igualdad literal de `(nombreNormalizado, numeroCalle)`. Cuando el municipio registró tramos de la misma arteria con nombres abreviados (ej. `Arq. Vivanco` vs `Arq. Jorge Eduardo Vivanco`, `Semilla` vs `Esteban S. Semilla`, `Newbery` vs `Jorge Newbery`), el ETL generó fichas independientes para tramos contiguos de la misma calle.
  2. Al mismo tiempo, en ejes viales como la Calle N° 98 conviven denominaciones históricas legítimamente distintas regidas por ordenanzas diferentes en sectores separados de la ciudad (ej. `Calle Suiza` N° 98 vs `Calle Santa Ana` N° 98). Estas no deben unificarse de forma destructiva.
- **Resultado observable:** Pipeline ETL enriquecido con un algoritmo de agrupamiento por tokens toponímicos principales que unifica variantes del mismo nombre o prócer bajo la denominación más completa cuando comparten número catastral, preservando estrictamente separadas las arterias con toponimias genuinamente distintas.

## Alcance y exclusiones

### Alcance
1. **Detección y consolidación de variantes homónimas (`scripts/etl/transform.ts`):**
   - Comparación de arterias con igual `numeroCalle` y mismo tipo de vía (`tipoVia`).
   - Identificación de variantes toponímicas cuando los tokens del nombre más corto están contenidos o representan abreviaturas del nombre más largo (ej. `Vivanco` en `Jorge Eduardo Vivanco`, `E. Gottschalk` en `Emilio Gottschalk`, `Cabo Maciel` en `Cabo de 2da Martin Omar Maciel`).
   - Selección automática del nombre más descriptivo y completo como `nombreOficial` consolidado.
   - Fusión de geometrías en `MultiLineString`, preservación de todos los tramos individuales en `tramos_calle` y unión de barrios intersectados.
2. **Preservación estricta de toponimias distintas:**
   - Arterias con igual número pero diferente identidad toponímica (ej. "Suiza" vs "Santa Ana" en N° 98, o "Suecia" vs "San Javier" en N° 100) permanecen como entidades separadas con sus respectivos slugs y longitudes.
3. **Tests y validación de base de datos:**
   - Suite de pruebas unitarias cubriendo los casos de consolidación (`Vivanco`, `Gottschalk`, `Newbery`) y preservación (`Suiza` vs `Santa Ana`).
   - Re-ejecución del ETL (`npm run etl`) y validación de integridad en SQLite.

### Exclusiones
- Fusión de calles sin número catastral (`numeroCalle === null`).
- Modificación del esquema de base de datos o contratos de API pública.

## Comportamiento y aceptación

- **AC-001 (Consolidación de variantes de próceres y abreviaturas):** Arterias con igual número y variantes del mismo nombre (ej. Avenida N° 139) se unifican en un único registro con el nombre más completo (`Avenida Arq. Jorge Eduardo Vivanco`, slug `avenida-arq-jorge-eduardo-vivanco-139`) abarcando todos sus tramos vectoriales.
- **Comprobación prevista de AC-001:** Consulta SQL en `calles` para N° 139 y tipo `AVENIDA`: debe existir exactamente 1 registro de avenida para Vivanco con longitud acumulada (~4.455 m). Test unitario en `test/transform.test.ts`. Artefacto: salida de tests y consulta en evidence.md.
- **AC-002 (Preservación de toponimias independientes sobre el mismo número):** Arterias que comparten número pero corresponden a nombres o entidades distintas (ej. "Calle Suiza" N° 98 y "Calle Santa Ana" N° 98) se conservan como fichas y slugs independientes (`calle-suiza-98` y `calle-santa-ana-98`).
- **Comprobación prevista de AC-002:** Consulta SQL para N° 98: confirmación de existencia separada de `Calle Suiza` y `Calle Santa Ana`. Artefacto: salida en evidence.md.
- **AC-003 (Preservación y orden de tramos consolidados):** Todos los tramos originales de las variantes unificadas se mantienen ordenados en `tramos_calle` con sus longitudes y atributos de ciclovía.
- **Comprobación prevista de AC-003:** Inspección de tramos de Avenida Vivanco en `tramos_calle` verificando que contenga tanto el tramo principal (~4.096 m) como el tramo norte (~358 m). Artefacto: salida SQL en evidence.md.
- **AC-004 (Integridad técnica y suite de pruebas):** Ejecución al 100% de `npm test` y compilación `npm run build` sin errores ni regresiones.
- **Comprobación prevista de AC-004:** Ejecución de suites en entorno local con exit codes 0. Artefacto: registro de comandos en evidence.md.

## Diseño y dependencias

- **Archivos afectados:**
  - `scripts/etl/transform.ts`: función de normalización y agrupación secundaria por tokens de homonimia.
  - `test/transform.test.ts`: casos de prueba para variantes de abreviaturas y preservación toponímica.
  - `data/calles.db`: regeneración de base de datos consolidada.

## Aprobación del contrato

- **Estado:** Aprobado.
- **Quién decide:** Usuario.
- **Fecha:** 2026-10-07.
- **Alcance aprobado:** Consolidación de variantes abreviadas sobre el mismo número (ej. Vivanco N° 139) preservando toponimias distintas (ej. Suiza vs Santa Ana N° 98).

El estado de implementación se consulta en el [catálogo](../index.md); el detalle en [tareas](tasks.md) y las comprobaciones en [evidencia](evidence.md).
