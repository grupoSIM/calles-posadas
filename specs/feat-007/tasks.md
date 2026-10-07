# FEAT-007 — tareas

Descomponer la [spec](spec.md) en resultados observables. Conservar IDs y completar la verificación real antes de cerrar cada tarea. El estado global y la siguiente acción se consultan en el [catálogo](../index.md).

| ID | Resultado de la tarea | Aceptación | Comprobación y evidencia | Estado |
|---|---|---|---|---|
| T-001 | Algoritmo de detección de variantes toponímicas y abreviaturas sobre el mismo número en `transform.ts` | AC-001, AC-002 | Tests unitarios en `test/transform.test.ts` con casos Vivanco, Gottschalk, y verificación de no unificación de Suiza vs Santa Ana. Registro en [evidence.md](evidence.md#t-001). | Implementado |
| T-002 | Consolidación geométrica y preservación de tramos de las variantes detectadas | AC-001, AC-003 | Verificación de geometría `MultiLineString` y orden secuencial de tramos para Avenida Vivanco. Registro en [evidence.md](evidence.md#t-002). | Implementado |
| T-003 | Re-ejecución del ETL (`npm run etl`) y validación de consultas en SQLite | AC-001, AC-002, AC-003 | Consultas SQL sobre `data/calles.db`: 1 sola arteria para Avenida Vivanco, preservación de Calle Suiza y Calle Santa Ana separadas. Registro en [evidence.md](evidence.md#t-003). | Implementado |
| T-004 | Verificación de suites de test completas y compilación de producción | AC-004 | Ejecución de `npm test` y `npm run build` con exit codes 0. Registro en [evidence.md](evidence.md#t-004). | Implementado |
| T-005 | Revisión independiente por otro agente antes del cierre | AC-001 a AC-004 | Auditoría y dictamen de agente Verifier independiente contrastando contrato, diff y consultas. Registro en [evidence.md](evidence.md#revisión-independiente). | Verificada |

Incluir el trabajo de aceptación funcional y la revisión independiente como tareas concretas, sin crear una tarea por rol. Para UI, prever interacciones/viewport y guardar capturas o secuencias. Tests técnicos y build conservan su alcance propio. Cada AC debe quedar cubierto por trabajo y comprobación; cerrar implementación no equivale a cerrar la feature.
