# FEAT-006 — tareas

Descomponer la [spec](spec.md) en resultados observables. Conservar IDs y completar la verificación real antes de cerrar cada tarea. El estado global y la siguiente acción se consultan en el [catálogo](../index.md).

| ID | Resultado de la tarea | Aceptación | Comprobación y evidencia | Estado |
|---|---|---|---|---|
| T-001 | Corrección de limpieza de prefijos y sufijos en `transform.ts` para eliminar duplicaciones toponímicas ("Avenida Avenida") | AC-001 | Tests unitarios en `test/transform.test.ts` con casos `AVENIDA(171)`, `AVENIDA(77B)` y `AVENIDA`. Registro y salida en [evidence.md](evidence.md#t-001). | Verificada |
| T-002 | Agrupación multi-segmento en `transformCalles` por nombre y número, unificando geometrías en `MultiLineString` y generando registros en `tramos_calle` | AC-002, AC-003 | Tests unitarios en `test/transform.test.ts` validando consolidación de "Calle Suiza" (slug único `calle-suiza-98`, 2 tramos y suma de longitudes ~703 m). Registro y salida en [evidence.md](evidence.md#t-002). | Verificada |
| T-003 | Re-ejecución del pipeline ETL (`npm run etl`) y validación de consistencia e integridad física en SQLite | AC-001, AC-002, AC-003 | Consultas SQL sobre `data/calles.db`: 0 registros con duplicación de prefijos, ausencia de sufijos homónimos `-2` y comprobación de filas en `tramos_calle`. Registro y recuentos en [evidence.md](evidence.md#t-003). | Verificada |
| T-004 | Validación funcional e inspección visual de la geometría multi-tramo en el visor cartográfico | AC-004 | Verificación en visor cartográfico (`/calles/calle-suiza-98`) en viewport desktop (1280x800) confirmando renderizado simultáneo de ambos tramos sobre Leaflet. Captura real guardada en `specs/feat-006/artifacts/AC-004-multitramo-suiza-desktop.png` y enlazada en [evidence.md](evidence.md#t-004). | Verificada |
| T-005 | Verificación técnica de regresiones en suite de pruebas y compilación estática | AC-005 | Ejecución completa de `npm test` y `npm run build` (exit codes 0). Registro y salidas en [evidence.md](evidence.md#t-005). | Verificada |
| T-006 | Revisión independiente de contrato, diff, pruebas y evidencia visual por otro agente | AC-001 a AC-005 | Auditoría y dictamen emitido por agente Verifier independiente contrastando spec, código, tests y captura visual en `artifacts/`. Enlace a dictamen en [evidence.md](evidence.md#revisión-independiente). | Verificada |

Incluir el trabajo de aceptación funcional y la revisión independiente como tareas concretas, sin crear una tarea por rol. Para UI, prever interacciones/viewport y guardar capturas o secuencias. Tests técnicos y build conservan su alcance propio. Cada AC debe quedar cubierto por trabajo y comprobación; cerrar implementación no equivale a cerrar la feature.
