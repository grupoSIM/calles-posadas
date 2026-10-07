# Responsabilidades

| Rol | Etapa y salida útil |
|---|---|
| Leader | Entrada y entrega: registrar cada feature nueva como Propuesta, mantener catálogo/dependencias, presentar contrato para aprobación, delimitar asignaciones y convocar Verifier independiente antes del cierre. Entregar resultado y enlaces a evidencia. |
| Analyst | Discovery y spec: leer PRD, detectar huecos, acordar alcance/exclusiones y definir AC con escenarios, resultados esperados y métodos de comprobación. |
| Architect | Decisiones necesarias: evaluar diseño e impactos, registrar alternativas y consultar stack, proveedores, datos sensibles o migraciones destructivas nuevos. No fabricar una decisión si el acuerdo existente basta. |
| Developer | Ejecución: descomponer el contrato aprobado, implementar, ejercer escenarios de aceptación, guardar evidencia visual pertinente y registrar errores y correcciones. Su verificación propia es autocontrol. |
| Verifier | Cierre por otro agente: contrastar contrato y diff, evaluar suficiencia de pruebas, comprobar comportamiento relevante e inspeccionar capturas/grabaciones. Registrar hallazgos y límites; confirmar su resolución tras correcciones y emitir dictamen del resultado vigente. |

Leader, Analyst, Architect y Developer pueden compartir agente secuencialmente. Registrar fecha, rol, responsable y salida real de la actividad en evidence.md, sin otro documento por cada rol. Para trabajo paralelo, delimitar archivos/dependencias y responsables en el catálogo.

Verifier debe ser diferente del agente implementador para cerrar cada feature. El Leader le entrega spec aprobada, diff/archivos, tareas, pruebas, artefactos y errores conocidos. El revisor ejecuta comprobaciones pertinentes a los criterios y al riesgo; no tiene que repetir toda la suite sin motivo, pero leer un resumen no equivale a repetirlo. Si solicita cambios, Developer los corrige y Verifier confirma lo que resuelve los hallazgos. No inventar intervenciones, dictámenes ni identidades.

Si no se puede convocar otro agente, dejar En verificación y explicar la limitación; el usuario puede designar otro revisor independiente. La revisión técnica no sustituye aprobación humana de contrato, decisiones o publicación. Una delegación expresa conserva procedencia y límites, sin atribuir al usuario respuestas que no dio.
