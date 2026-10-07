# FEAT-… — evidencia

Historia de actividades, cambios, errores, ejecuciones y revisiones. Identificar fecha, etapa, rol ejercido, agente responsable y salida real en cada entrada; no inventar intervenciones para completar roles. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) explican qué se verifica.

## Ejecución: fecha y etapa

- Cambio/alcance comprobado y aceptación cubierta: IDs concretos.
- Tipo de comprobación: compilación/importaciones, prueba técnica o aceptación funcional; no tratarlas como equivalentes.
- Escenario, condición inicial y datos relevantes; resultado esperado del contrato y resultado observado.
- Entorno relevante y directorio desde el cual se ejecutó; viewport para interfaz.
- Comando exacto o procedimiento manual realmente realizado.
- Exit code real si existe y salida resumida; para manual, observación sin exit inventado.
- Prueba y salida/captura disponible: enlaces relativos a artefactos del producto. Para UI, capturas reales bajo `artifacts/`; una interacción lleva secuencia o grabación más pasos y assertions/observaciones pertinentes. No afirmar validación visual sin inspección real.
- Resultado respecto del AC: cumplido, falló o no comprobado; un exit 0 de diagnóstico no certifica aceptación.
- Fallos, cobertura parcial y límites; no atribuir aceptación a compilación o a una declaración del agente.

Añadir entradas al realizar trabajo, no registros vacíos de ejecuciones hipotéticas. Un fallo se conserva; una comprobación posterior indica qué cambió y si resuelve el fallo anterior. Marcar checkpoints anteriores como históricos. No conservar un encabezado de pendiente que contradiga el resultado posterior.

## Errores y correcciones: entradas reales

Para cada error reportado por usuario, pruebas o revisor, registrar ID local ERR-…, origen/fecha, AC afectado si aplica, síntoma y reproducción, esperado/observado, cambio correctivo y enlace a su comprobación posterior. Conservar evidencia del fallo. Un error sin comprobar su corrección sigue abierto; para arreglos históricos conocidos sólo por Git, registrar ese límite sin inventar ejecuciones. Si modifica alcance, enlazar acuerdo o propuesta nueva.

## Revisión independiente: fecha y alcance

Se completa cuando otro agente realiza la revisión, obligatoria antes de cerrar la feature. Identificar implementador y revisor, material inspeccionado, AC contrastados, pruebas realmente ejecutadas por el revisor, salidas previas sólo leídas y capturas/grabaciones realmente inspeccionadas. Declarar suficiencia de pruebas, hallazgos, resultado y límites. Una revisión que leyó salidas previas no se presenta como una nueva ejecución.

Tras correcciones, registrar quién corrigió, qué comprobación resolvió cada hallazgo y la confirmación real del revisor sobre el resultado vigente. No inventar dictamen ni presentar autocontrol como revisión independiente. Si falta revisión o aceptación, informar pendiente y conservar la siguiente acción en catálogo; no marcar Verificada.

En la entrega, incluir enlaces directos a las comprobaciones y evidencia visual para que el usuario pueda ver qué se probó.

No guardar credenciales o datos sensibles. Los comandos y prerrequisitos vigentes viven en docs/project.md; aquí constan las ejecuciones históricas reales.
