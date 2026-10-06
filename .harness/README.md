# Flujo reusable SDD liviano

Propósito: pasar de necesidades a un incremento aprobado, implementado, comprobado y retomable. Las reglas y decisiones específicas del producto viven en `docs/` y `specs/`.

## Recorrido

1. **Discovery:** leer antecedentes, distinguir hipótesis y acuerdos, preguntar por huecos relevantes y proponer MVP/exclusiones. Diferir decisiones que no afectan lo próximo.
2. **Catálogo:** ordenar incrementos por resultados de producto y dependencias. Cada necesidad incluida tiene destino; las exclusiones o diferimientos se explican en contexto.
3. **Spec próxima:** definir origen, alcance, comportamiento, aceptación con IDs, diseño suficiente y dependencias. Descomponer tareas observables y cómo comprobarlas. Resolver decisiones bloqueantes y obtener aprobación real del contrato antes del código.
4. **Ejecución:** implementar dentro del acuerdo, verificar con pruebas del producto y registrar lo observado. Cambios sustanciales de alcance o impacto se consultan; seguimiento y correcciones editoriales equivalentes no exigen reaprobar.
5. **Entrega:** actualizar estado y siguiente acción, comprobar coherencia de lectura y dejar ejecución y pruebas reproducibles. Una comprobación parcial se informa como parcial. Publicación es una autorización separada.

No hay motor de estados ni una cadena universal de revisiones. La comprobación es obligatoria; la revisión separada se aplica proporcionalmente al riesgo y a la independencia requerida.

## Fuentes de verdad

| Archivo | Contenido |
|---|---|
| `docs/project.md` | Contexto, alcance y exclusiones acordados, restricciones, arquitectura/datos y comandos reales. Enlaza el PRD y decisiones; no duplica avances. |
| `docs/decisions.md` | Decisiones importantes, alternativas, autoridad y dependencias abiertas. No duplica aprobación o fase de cada feature. |
| `specs/index.md` | Catálogo y único estado actual, trabajo activo, responsable, bloqueo y siguiente acción; publicación por separado. |
| `specs/<id>/spec.md` | Contrato y aprobación: lo acordado, sin resultados de ejecución o notas temporales de progreso. |
| `specs/<id>/tasks.md` | Detalle de tareas, aceptación cubierta y comprobación para cerrarlas. Sin otra fase global o siguiente acción duplicada. |
| `specs/<id>/evidence.md` | Historia fechada de cambios/comprobaciones, comandos, resultados, fallos, cobertura, revisión y límites. |

No crear matrices o anexos equivalentes por rutina. Un anexo sólo se justifica por información necesaria. Las plantillas se copian cuando hay una feature concreta; adaptar o eliminar campos que no aportan. IDs estables permiten seguir aceptación → tarea → comprobación sin varias tablas idénticas.

## Una entrega legible fuera del chat

El catálogo debe resolver qué está hecho, qué está bloqueado y cuál es el siguiente paso. El contexto debe permitir ejecutar el producto y sus pruebas con prerrequisitos y comandos reales. Las pruebas/salidas se conservan con rutas relativas al repositorio; si un artefacto no se puede versionar, indicar cómo obtenerlo. Los documentos históricos llevan fecha y etapa; una conclusión posterior identifica el pendiente que resuelve.

Antes de cerrar el tramo, leé como alguien nuevo: contrato coherente, tareas realmente comprobadas, evidencia con fallos y límites, catálogo actual, instrucciones de uso/pruebas y referencias disponibles. Corregí textos obsoletos sin borrar historia ni añadir otro trámite. Si algo no pudo comprobarse, dejalo visible con motivo y acción en catálogo.

La confianza proviene del comportamiento comprobado y la constancia útil. Los IDs o declaraciones no autentican aprobadores ni prueban por sí solos la corrección del producto.
