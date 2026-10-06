# FEAT-002 — tareas

Descomposición de la [spec](spec.md) en resultados observables. El estado global y la siguiente acción se consultan en el [catálogo](../index.md).

| ID | Resultado de la tarea | Aceptación | Comprobación y evidencia | Estado |
|---|---|---|---|---|
| T-001 | Implementar módulo de conexión y consultas de datos (`src/lib/db/streets.ts`): búsqueda FTS5, filtros por barrio/chacra/ciclovía/tipo, detalle por slug y listado de barrios. | AC-001, AC-002, AC-003, AC-004, AC-005 | Suite de tests unitarios de base de datos (`test/streets-db.test.ts`) documentada en [evidence.md](evidence.md#t-001). | Verificada |
| T-002 | Implementar handler `GET /api/v1/streets` con validación de query params, paginación y formateo de respuesta JSON. | AC-001, AC-002, AC-003 | Test de integración HTTP documentado en [evidence.md](evidence.md#t-002). | Verificada |
| T-003 | Implementar handler `GET /api/v1/streets/:slug` con retorno de GeoJSON y manejo de 404 para slugs inexistentes. | AC-004 | Test de integración HTTP documentado en [evidence.md](evidence.md#t-003). | Verificada |
| T-004 | Implementar handler `GET /api/v1/barrios` con listado ordenado de barrios y chacras para filtros. | AC-005 | Test de integración HTTP documentado en [evidence.md](evidence.md#t-004). | Verificada |
