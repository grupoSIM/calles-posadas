# FEAT-001 — tareas

Descomposición de la [spec](spec.md) en resultados observables. El estado global y la siguiente acción se consultan en el [catálogo](../index.md).

| ID | Resultado de la tarea | Aceptación | Comprobación y evidencia | Estado |
|---|---|---|---|---|
| T-001 | Definir esquema SQLite DDL (tablas relacionales, tabla virtual `calles_fts` con FTS5 y `calles_rtree` con R*Tree nativo) y script de inicialización. | AC-004 | Ejecución de script DDL contra SQLite y verificación de tablas y esquemas virtuales documentada en [evidence.md](evidence.md#t-001). | Verificada |
| T-002 | Implementar módulo extractor para descargar capas GeoJSON de IDE Posadas con soporte para fixtures offline. | AC-001 | Ejecución de script de descarga y validación de archivos GeoJSON guardados documentada en [evidence.md](evidence.md#t-002). | Verificada |
| T-003 | Implementar lógica de normalización toponímica, cálculo de Bounding Boxes y cruce espacial de barrios y ciclovías con Turf.js. | AC-002, AC-003 | Ejecución de suite de tests unitarios de normalización (`npm test`) documentada en [evidence.md](evidence.md#t-003). | Verificada |
| T-004 | Implementar script de carga (seed) y script de verificación de integridad, consultas FTS5 y consultas R*Tree. | AC-004, AC-005 | Ejecución del seed y script de validación con salida y tiempos documentados en [evidence.md](evidence.md#t-004). | Verificada |
