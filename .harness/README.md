# Flujo reusable SDD liviano

Revisión de guía: **piloto 2 — 2026-10-06**. Incorpora lo observado en el piloto real: control de entrada, aceptación de comportamiento, evidencia visual y revisión independiente antes del cierre.

Propósito: pasar de necesidades a un incremento aprobado, implementado, comprobado y retomable. Las reglas y decisiones específicas del producto viven en `docs/` y `specs/`.

## Recorrido

1. **Propuesta:** el Leader registra cada feature nueva en el catálogo, también después del MVP. Una entrada puede existir sin carpeta ni contrato detallado; no autoriza código.
2. **Discovery:** Analyst lee antecedentes, distingue hipótesis y acuerdos, pregunta por huecos relevantes y propone alcance/exclusiones; Architect resuelve decisiones necesarias. Ordenar incrementos por resultados y dependencias. Cada necesidad incluida tiene destino; diferir decisiones que no afectan lo próximo.
3. **Spec próxima:** definir origen, alcance, comportamiento, aceptación con IDs, diseño suficiente y dependencias. Descomponer tareas observables y cómo comprobarlas. Resolver decisiones bloqueantes y obtener aprobación real del contrato antes del código.
4. **Ejecución:** Developer implementa dentro del acuerdo, prueba los escenarios solicitados y registra resultados, errores y artefactos. Cambios sustanciales de alcance o impacto se consultan; seguimiento y correcciones del comportamiento aprobado no exigen reaprobar. Una capacidad nueva comienza en Propuesta.
5. **Verificación independiente y entrega:** el Leader asigna otro agente como Verifier. Éste contrasta contrato y producto, observa evidencia visual y evalúa si las pruebas demuestran aceptación. Developer corrige; Verifier confirma hallazgos resueltos y dictamen vigente. Sólo entonces el Leader actualiza cierre, siguiente acción y entrega enlaces a las pruebas/capturas. Una comprobación parcial deja la feature En verificación o Bloqueada, con motivo. Publicación es una autorización separada.

Estados legibles del catálogo: **Propuesta (proposed) → Discovery → Especificada → Aprobada → En implementación → En verificación → Verificada**; Bloqueada indica causa y siguiente acción. No hay motor de estados, recibos ni un agente por cada etapa. Una feature aprobada existente conserva su contrato; preparar comprobaciones suficientes y aplicar el nuevo cierre no reabre aprobación salvo cambio sustancial del acuerdo. No recalificar automáticamente entregas históricas.

El alcance de pruebas y de revisión depende del cambio, pero la revisión independiente del cierre es obligatoria en cada feature. Si el entorno no ofrece otro agente, el Leader lo informa y deja pendiente la revisión; no la simula ni presenta autocontrol como equivalente. El usuario puede designar otro revisor independiente. Una revisión previa no cubre automáticamente correcciones posteriores.

Si se corrige una feature ya Verificada, actualizar sólo esa entrada a En implementación/En verificación, añadir tareas y evidencia del arreglo y revisar independientemente lo cambiado antes de recuperar Verificada. Conservar contrato aprobado, IDs e historia; no reabrir las demás features ni solicitar aprobación repetida del mismo alcance. No repetir pruebas ajenas al cambio sin una razón de regresión o riesgo.

## Aceptación y evidencia observable

Antes de implementar, cada AC indica condición inicial, acción, resultado esperado y cómo observarlo. Mantener ese resultado al escribir pruebas: devolver cualquier fila no demuestra búsqueda correcta; importar un componente no demuestra interacción; compilar no demuestra retención de filtros ni uso móvil. Incluir errores y límites relevantes sin añadir pruebas que sólo repitan la implementación.

En evidence.md, separar compilación/pruebas técnicas de aceptación. Cada comprobación identifica AC, entorno/datos, comando o pasos reales, esperado, observado y artefactos. Registrar pass, fail o pendiente según lo observado; ejecutar exitosamente un script diagnóstico no convierte el producto en aceptado. Lo que no se pudo ejecutar queda sin comprobar.

Para UI, conservar capturas reales en `specs/<id>/artifacts/`, con nombres como `AC-002-ficha-abierta-desktop.png`. Anotar viewport y estado, enlazar archivos relativos y conservar secuencia o video para interacciones, junto con pasos y assertions/observaciones. Verifier inspecciona los archivos: su mera existencia no acredita el comportamiento. No crear imágenes ficticias ni afirmar validación visual basándose en código, clases CSS o build. Entregar enlaces directos a estas pruebas; guardar artefactos pequeños en el repo y documentar ubicación/obtención de grabaciones grandes si requieren otro almacenamiento accesible.

Registrar errores reportados y hallazgos en la evidencia de la feature, con ID local estable, origen, reproducción, esperado/observado, corrección y comprobación que lo resuelve. Conservar fallos anteriores. Un hallazgo fuera del incremento se deja con destino y prioridad, sin ampliar silenciosamente el contrato. Un fallo del incremento que invalida aceptación, integridad o seguridad impide el cierre; diferir un criterio aprobado exige acordar explícitamente el cambio de alcance.

Los roles dejan constancia de actividad, no recibos: fecha, rol, responsable y salida real en la evidencia existente. Verifier tiene una identidad diferente del implementador; declara qué inspeccionó, qué ejecutó personalmente, qué salidas sólo leyó y qué quedó sin comprobar. Una aprobación humana o una etiqueta de rol no prueban revisión independiente.

## Fuentes de verdad

| Archivo | Contenido |
|---|---|
| `docs/project.md` | Contexto, alcance y exclusiones acordados, restricciones, arquitectura/datos y comandos reales. Enlaza el PRD y decisiones; no duplica avances. |
| `docs/decisions.md` | Decisiones importantes, alternativas, autoridad y dependencias abiertas. No duplica aprobación o fase de cada feature. |
| `specs/index.md` | Catálogo y único estado actual, trabajo activo, responsable, bloqueo y siguiente acción; publicación por separado. |
| `specs/<id>/spec.md` | Contrato y aprobación: lo acordado, sin resultados de ejecución o notas temporales de progreso. |
| `specs/<id>/tasks.md` | Detalle de tareas, aceptación cubierta y comprobación para cerrarlas. Sin otra fase global o siguiente acción duplicada. |
| `specs/<id>/evidence.md` | Actividades y responsables reales, historia fechada de cambios/comprobaciones, esperado/observado, errores, enlaces a artefactos, cobertura, revisión independiente y límites. |
| `specs/<id>/artifacts/` | Capturas, secuencias, grabaciones y salidas necesarias para inspeccionar las comprobaciones; se crea cuando haya artefactos reales. |

No crear matrices o anexos equivalentes por rutina. Un anexo sólo se justifica por información necesaria. Las plantillas se copian cuando hay una feature concreta; adaptar o eliminar campos que no aportan. IDs estables permiten seguir aceptación → tarea → comprobación sin varias tablas idénticas.

## Una entrega legible fuera del chat

El catálogo debe resolver qué está hecho, qué está bloqueado y cuál es el siguiente paso. El contexto debe permitir ejecutar el producto y sus pruebas con prerrequisitos y comandos reales. Las pruebas/salidas se conservan con rutas relativas al repositorio; si un artefacto no se puede versionar, indicar cómo obtenerlo. Los documentos históricos llevan fecha y etapa; una conclusión posterior identifica el pendiente que resuelve.

Antes de cerrar el tramo, leé como alguien nuevo: contrato coherente, tareas realmente comprobadas, todos los AC satisfechos con evidencia pertinente, dictamen independiente vigente, fallos resueltos o pendientes explícitos, catálogo actual, instrucciones y referencias disponibles. Corregí textos obsoletos sin borrar historia ni añadir otro trámite. Si algo no pudo comprobarse, dejalo visible con motivo y acción en catálogo. No cerrar como Verificada por el mero resultado de tests/build.

La confianza proviene del comportamiento comprobado y la constancia útil. Los IDs o declaraciones no autentican aprobadores ni prueban por sí solos la corrección del producto.
