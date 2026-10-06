# FEAT-001 — evidencia

Historia de cambios, ejecuciones y comprobaciones de `FEAT-001`. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) detallan qué se verifica.

## Ejecución: 2026-10-06 — Discovery y definición arquitectónica (SQLite + FTS5 + R*Tree) (Histórico)

- **Alcance comprobado:** Verificación de entorno, análisis comparativo de persistencia, adopción de arquitectura SQLite con FTS5 y R*Tree nativo, y actualización del contrato.
- **Entorno y directorio:** `c:\DEV\calles-posadas`, Windows PowerShell.
- **Comprobaciones ejecutadas:**
  1. Detección de runtimes disponibles: Node.js `v22.14.0`, npm `10.9.2`, pnpm `10.4.1`, Python `3.12.9`. Exit code: 0.
  2. Conectividad HTTP con IDE Posadas: `curl.exe -I -s --max-time 5 https://www.ide.posadas.gob.ar/` -> `HTTP/1.1 200 OK`. Exit code: 0.
  3. Formalización de decisión técnica [DEC-001](../../docs/decisions.md#dec-001) acordando arquitectura SQLite + FTS5 + R*Tree + Turf.js para desacoplar el procesamiento espacial a la etapa de ingesta.
- **Resultado:** Aprobación humana del contrato otorgada en chat el 2026-10-06.

---

## Ejecución: 2026-10-06 — Implementación y comprobación de Tareas T-001 a T-004

### <a id="t-001"></a>T-001: Esquema DDL SQLite con FTS5 y R*Tree
- **Alcance comprobado:** Tablas relacionales (`calles`, `barrios`, `tramos_calle`, `calle_barrios`), triggers de sincronización y tablas virtuales `calles_fts` (FTS5) y `calles_rtree`, `barrios_rtree` (R*Tree).
- **Comando:** `npm run init:db`
- **Exit code:** 0.
- **Salida observable:** Base de datos inicializada en `data/calles.db` con tablas e índices creados sin dependencias nativas externas.
- **Prueba unitaria:** `test/schema.test.ts` (3 tests aprobados).

### <a id="t-002"></a>T-002: Módulo extractor y descarga con soporte offline
- **Alcance comprobado:** Descarga de capas vectoriales WFS desde IDE Posadas (`geonode:calles_Posadas1`, `geonode:barrios_posadas`, `geonode:bicisendas_ciclovias0`) y fallback con bandera `--offline` a `data/raw/` y `data/fixtures/`.
- **Comando:** `npm run extract`
- **Exit code:** 0.
- **Salida observable:**
  - `calles.json`: 2674 features descargadas.
  - `barrios.json`: 210 features descargadas.
  - `bicisendas.json`: 52 features descargadas.
- **Prueba unitaria:** `test/extract.test.ts` (test offline aprobado).

### <a id="t-003"></a>T-003: Normalización toponímica, cálculo de Bounding Boxes y cruce espacial con Turf.js
- **Alcance comprobado:** Extracción de tipos de vía y números de calle, cálculo de longitud métrica, generación de slugs canónicos, cruce espacial con barrios y detección de ciclovías superpuestas. Filtrado defensivo de geometrías vacías (detectadas 2 en barrios y 8 en calles del dataset crudo municipal).
- **Comando:** `npm test`
- **Exit code:** 0.
- **Prueba unitaria:** `test/transform.test.ts` (5 tests aprobados).

### <a id="t-004"></a>T-004: Pipeline ETL de carga (seed) y script de verificación de integridad y rendimiento
- **Alcance comprobado:** Ejecución completa del pipeline ETL (`scripts/etl/run-etl.ts`) y validación de consultas en la base resultante (`scripts/verify-data.ts`).
- **Comando:** `npm run etl`
  - **Exit code:** 0.
  - **Tiempo de ejecución total:** 1.16 segundos.
  - **Registros cargados:** 2.673 calles y avenidas, 208 barrios y chacras, 2.673 tramos, 140 calles con infraestructura ciclista detectada.
- **Comando de verificación:** `npm run test:data`
  - **Exit code:** 0.
  - **Búsqueda FTS5 ("Jujuy*"):** 1 resultado en **0.184 ms**.
  - **Búsqueda FTS5 ("49"):** 5 resultados.
  - **Consulta espacial R*Tree (Bbox Centro Posadas):** 10 arterias recuperadas en **0.100 ms**.
  - **Geometrías nulas:** 0.
- **Prueba unitaria:** `test/load-verify.test.ts` (1 test aprobado).

---

## Cobertura total de la suite de pruebas
- **Comando:** `npm test`
- **Resultado:** 10 tests aprobados en 4 suites (0 fallos, duración total: ~385 ms). Exit code: 0.

## Autocontrol y límites
- **Verificación realizada:** Autocontrol técnico empírico del Developer/Leader.
- **Límites:** El enriquecimiento biográfico y legislativo detallado de cada ordenanza desde el Digesto se integrará en las siguientes features (`FEAT-002` / `FEAT-003`).
