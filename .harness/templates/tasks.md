# FEAT-… — tareas

Descomponer la [spec](spec.md) en resultados observables. Conservar IDs y completar la verificación real antes de cerrar cada tarea. El estado global y la siguiente acción se consultan en el [catálogo](../index.md).

| ID | Resultado de la tarea | Aceptación | Comprobación y evidencia | Estado |
|---|---|---|---|---|
| T-001 | Describir el cambio concreto. | AC-001 | Escenario, resultado esperado y método pertinentes; al comprobar, enlazar ejecución y artefactos reales en evidence.md. | Pendiente |

Agregar dependencias entre tareas sólo cuando condicionen su ejecución. No repetir aquí fase, revisión pendiente o próximo paso de la feature. Las tareas completadas mantienen enlace al resultado que justifica el cierre; un resultado parcial no completa criterios sin comprobar.

Incluir el trabajo de aceptación funcional y la revisión independiente como tareas concretas, sin crear una tarea por rol. Para UI, prever interacciones/viewport y guardar capturas o secuencias. Tests técnicos y build conservan su alcance propio. Cada AC debe quedar cubierto por trabajo y comprobación; cerrar implementación no equivale a cerrar la feature.
