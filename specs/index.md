# Catálogo de specs

Catálogo de incrementos de producto derivados del [PRD](../docs/prd.md) para el MVP de Calles Posadas.

| ID | Resultado esperado | Prioridad | Dependencias | Spec | Estado actual |
|---|---|---|---|---|---|
| FEAT-001 | Ingesta, normalización y esquema de datos base (Calles, Barrios, Ciclovías) | Alta | Ninguna | [spec.md](feat-001/spec.md) | Verificada |
| FEAT-002 | Motor de búsqueda unificado y endpoints de catálogo (`/api/v1/streets`) | Alta | FEAT-001 | [spec.md](feat-002/spec.md) | Verificada |
| FEAT-003 | Visor cartográfico interactivo y maquetación de fichas en Leaflet | Media | FEAT-002 | [spec.md](feat-003/spec.md) | Verificada |
| FEAT-004 | Pantalla de métricas de cobertura y completitud del nomenclador (`/stats`) | Baja | FEAT-002 | [spec.md](feat-004/spec.md) | Verificada |
| FEAT-005 | Rediseño visual responsivo del visor y optimización espacial con Stitch | Media | FEAT-003 | [spec.md](feat-005/spec.md) | Verificada |

## Trabajo activo y siguiente acción

- **Última feature completada:** `FEAT-005` (Rediseño visual responsivo del visor y optimización espacial con Stitch).
- **Feature activa:** Ninguna (todas las features planificadas del MVP están verificadas).
- **Responsable:** Leader / User.
- **Bloqueo:** Ninguno.
- **Siguiente acción:** Evaluar próximos incrementos de Fase 2 (archivo fotográfico histórico "Posadas del Ayer" o capas adicionales de IDE Posadas).

## Publicación

No autorizada. Cualquier despliegue o publicación en producción requiere autorización explícita e independiente del usuario.
