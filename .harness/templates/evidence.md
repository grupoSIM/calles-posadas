# FEAT-… — evidencia

Historia de cambios, ejecuciones y revisiones. Identificar fecha y etapa en cada entrada. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) explican qué se verifica.

## Ejecución: fecha y etapa

- Cambio/alcance comprobado y aceptación cubierta: IDs concretos.
- Entorno relevante y directorio desde el cual se ejecutó.
- Comando exacto o procedimiento manual realmente realizado.
- Exit code real si existe y salida resumida; para manual, observación sin exit inventado.
- Prueba y salida/captura disponible: enlaces relativos a artefactos del producto.
- Fallos, cobertura parcial y límites; no atribuir aceptación a compilación o a una declaración del agente.

Añadir entradas al realizar trabajo, no registros vacíos de ejecuciones hipotéticas. Un fallo se conserva; una comprobación posterior indica qué cambió y si resuelve el fallo anterior. Marcar checkpoints anteriores como históricos. No conservar un encabezado de pendiente que contradiga el resultado posterior.

## Revisión: fecha y alcance, si se realizó

Autor, autocontrol o independencia respecto del implementador, material inspeccionado, pruebas realmente ejecutadas, hallazgos y resultado. Una revisión que leyó salidas previas no se presenta como una nueva ejecución. El cierre posterior de hallazgos identifica quién corrigió y qué comprobó; no inventar otro dictamen del revisor.

No guardar credenciales o datos sensibles. Los comandos y prerrequisitos vigentes viven en docs/project.md; aquí constan las ejecuciones históricas reales.
