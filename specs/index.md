# Catálogo de specs

Catálogo de incrementos de producto derivados del [PRD](../docs/prd.md) para el MVP de Calles Posadas.

| ID | Resultado esperado | Prioridad | Dependencias | Spec | Estado actual |
|---|---|---|---|---|---|
| FEAT-001 | Ingesta, normalización y esquema de datos base (Calles, Barrios, Ciclovías) | Alta | Ninguna | [spec.md](feat-001/spec.md) | Verificada |
| FEAT-002 | Motor de búsqueda unificado y endpoints de catálogo (`/api/v1/streets`) | Alta | FEAT-001 | [spec.md](feat-002/spec.md) | Verificada |
| FEAT-003 | Visor cartográfico interactivo y maquetación de fichas en Leaflet | Media | FEAT-002 | [spec.md](feat-003/spec.md) | Verificada |
| FEAT-004 | Pantalla de métricas de cobertura y completitud del nomenclador (`/stats`) | Baja | FEAT-002 | [spec.md](feat-004/spec.md) | Verificada |
| FEAT-005 | Rediseño visual responsivo del visor y optimización espacial con Stitch | Media | FEAT-003 | [spec.md](feat-005/spec.md) | Verificada |
| FEAT-006 | Saneamiento toponímico, desduplicación y consolidación de tramos en ETL | Alta | FEAT-001 | [spec.md](feat-006/spec.md) | Verificada |

## Trabajo activo y siguiente acción

- **Última feature completada:** `FEAT-006` (Saneamiento toponímico, desduplicación y consolidación de tramos en ETL).
- **Feature activa:** Ninguna (todas las features aprobadas del catálogo están verificadas).
- **Responsable:** Ninguno.
- **Bloqueo:** Ninguno.
- **Siguiente acción:** Esperar priorización de nuevos incrementos o instrucciones del usuario.

## Publicación

Autorizada por el usuario el 2026-10-07 para sincronización y push al repositorio remoto principal (`origin/main`). Despliegue en producción o entornos VPS sujeto a confirmación independiente.

## Aplicación del harness actualizado

Aplicar [la guía SDD liviana piloto 2](../.harness/README.md) y [sus responsabilidades](../.harness/roles.md). FEAT-006 conserva su aprobación y tareas pendientes: esta actualización no la implementa ni reabre su contrato. No recalifica las entregas históricas ni supone que sus hallazgos ya se corrigieron. Toda feature nueva entra como Propuesta (proposed) y pasa por discovery y aprobación del contrato antes del código. El cierre exige aceptación comprobada, evidencia visual cuando aplica y revisión independiente.
