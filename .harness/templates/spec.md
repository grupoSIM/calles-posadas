# FEAT-… — resultado de producto

## Origen y necesidad

Enlazar PRD/acuerdo y describir actor, problema y resultado observable. Distinguir el antecedente del alcance vigente.

## Alcance y exclusiones

Precisar qué incluye el incremento y sus límites. Enlazar contexto si una restricción ya está acordada allí.

## Comportamiento y aceptación

- AC-001: condición inicial, acción y resultado observable solicitado; incluir errores/límites pertinentes.
- Comprobación prevista de AC-001: escenario/datos, método (prueba funcional, consulta, interacción real o comprobación manual reproducible) y artefacto esperado cuando corresponda. Para UI, indicar viewport y captura/secuencia/grabación prevista en `artifacts/`.

Repetir este par por cada criterio, sin otra matriz equivalente. Mantener IDs y resultado esperado al aclarar criterios. Añadir sólo los necesarios. Compilar o importar un componente no demuestra comportamiento. No usar resultados de pruebas como parte del contrato ni dar por realizadas las comprobaciones previstas. Resolver cómo observar cada AC antes del código.

## Diseño y dependencias

Diseño suficiente para ejecutar: componentes/datos/interacciones afectados, decisiones enlazadas, seguridad y migración si aplican. Resolver dependencias bloqueantes antes del código. Anexos sólo cuando aporten información necesaria.

## Aprobación del contrato

Registrar estado de aprobación, quién decide, fecha, mensaje o referencia localizable y alcance exacto. Si hay delegación, citar su procedencia y límites. Una plantilla, una solicitud general de feature o una hipótesis no es una aprobación de este contrato. Los cambios sustanciales se acuerdan y registran aquí; seguimiento y evidencia no forman parte del contrato aprobado.

El estado de implementación se consulta en el [catálogo](../index.md); el detalle en [tareas](tasks.md) y las comprobaciones en [evidencia](evidence.md).
