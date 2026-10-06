# FEAT-004 — tareas

Descomposición de la [spec](spec.md) en resultados observables. El estado global y la siguiente acción se consultan en el [catálogo](../index.md).

| ID | Resultado de la tarea | Aceptación | Comprobación y evidencia | Estado |
|---|---|---|---|---|
| T-001 | Implementar módulo de agregación de métricas de base de datos (`src/lib/db/stats.ts`) con conteos, porcentajes, desglose de vías, ciclovías y categorías toponímicas. | AC-001, AC-002 | Consultas y validación en `test/stats.test.ts` documentadas en [evidence.md](evidence.md#t-001). | Verificada |
| T-002 | Implementar endpoint HTTP REST `GET /api/v1/stats` (`src/app/api/v1/stats/route.ts`) con respuesta JSON y encabezados de caché. | AC-001 | Test de endpoint HTTP en `test/stats.test.ts` documentado en [evidence.md](evidence.md#t-002). | Verificada |
| T-003 | Diseñar e implementar la vista de cobertura y métricas `/stats` (`src/app/stats/page.tsx`) con tarjetas KPI, barras de progreso y diseño responsivo. | AC-003 | Verificación visual y pruebas de renderizado en [evidence.md](evidence.md#t-003). | Verificada |
| T-004 | Integrar enlace de navegación hacia `/stats` en la cabecera global (`src/app/layout.tsx`) y validar compilación integral (`npm run build`). | AC-004, AC-005 | Compilación exitosa Next.js y verificación de navegación en [evidence.md](evidence.md#t-004). | Verificada |

