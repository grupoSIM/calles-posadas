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
| FEAT-007 | Consolidación toponímica de variantes y abreviaturas viales por homonimia física | Media | FEAT-006 | [spec.md](feat-007/spec.md) | Verificada |
| FEAT-008 | Capa interactiva de barrios en visor y enriquecimiento vial desde IDE Posadas | Alta | FEAT-007 | [spec.md](feat-008/spec.md) | Verificada |
| FEAT-009 | Vinculación normativa del Digesto Jurídico Municipal y memoria toponímica de calles | Alta | FEAT-008 | [spec.md](feat-009/spec.md) | Verificada |

## Trabajo activo y siguiente acción

- **Feature actual:** FEAT-005 (corrección ERR-003 verificada favorablemente por revisor independiente).
- **Estado:** Verificada.
- **Responsable:** Leader.
- **Bloqueo:** Ninguno.
- **Siguiente acción:** Ciclo de corrección móvil cerrado con evidencia visual y tests en verde. Esperar nuevas instrucciones del usuario.

## Publicación

Autorizada por el usuario el 2026-10-08 para sincronización, commit y push al repositorio remoto principal (`origin/main`). Despliegue en producción o entornos VPS sujeto a confirmación independiente.

## Aplicación del harness actualizado

Aplicar [la guía SDD liviana piloto 2](../.harness/README.md) y [sus responsabilidades](../.harness/roles.md). Toda feature nueva entra como Propuesta (proposed) y pasa por discovery y aprobación del contrato antes del código. El cierre exige aceptación comprobada, evidencia visual cuando aplica y revisión independiente.

## Notas históricas de transición (archivadas)

- *2026-10-06 (Transición Piloto 2):* Al incorporar la guía del piloto 2, FEAT-006 conservaba su aprobación previa y tareas pendientes de verificación; dicha nota histórica no reabrió su contrato ni afectó su posterior verificación formal y cierre el 2026-10-07.
