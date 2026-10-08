# FEAT-005 — tareas

Descomposición de la [spec](spec.md) en resultados observables. El estado global y la siguiente acción se consultan en el [catálogo](../index.md).

| ID | Resultado de la tarea | Aceptación | Comprobación y evidencia | Estado |
|---|---|---|---|---|
| T-001 | Configurar variables de tema, tokens de color y estilos Stitch (`River Azure`, `Guaraní Emerald`, `Midnight Slate`, glassmorphism) en `globals.css` y `tailwind.config.js`. | AC-001 | Inspección de estilos y verificación de contrastes en [evidence.md](evidence.md#t-001). | Verificada |
| T-002 | Rediseñar la cabecera institucional en `layout.tsx` con identidad cívica, isotipo municipal y enlaces limpios. | AC-001, AC-004 | Verificación visual y pruebas de navegación en [evidence.md](evidence.md#t-002). | Verificada |
| T-003 | Rediseñar el panel lateral de búsqueda y ficha en `src/app/page.tsx` permitiendo retención de contexto, transición fluida entre lista y ficha de calle sin recargas. | AC-002 | Pruebas de interacción y verificación de filtros preservados en [evidence.md](evidence.md#t-003). | Verificada |
| T-004 | Implementar bottom sheet móvil responsivo de 3 estados (peek 72px, medio 45vh, completo 90vh) con barra flotante compacta. | AC-003 | Verificación de renderizado en viewport móvil en [evidence.md](evidence.md#t-004). | Verificada |
| T-005 | Integrar controles HUD cartográficos minimalistas (zoom, toggle ciclovía, píldora de coordenadas Posadas) en `StreetViewer.tsx`. | AC-004 | Validación interactiva en visor Leaflet en [evidence.md](evidence.md#t-005). | Verificada |
| T-006 | Rediseñar la ficha técnica `StreetDetailCard.tsx` con tarjetas de ordenanza municipal del Digesto, badges viales y datos estructurados. | AC-001, AC-002 | Comprobación de componentes y enlace seguro a Digesto en [evidence.md](evidence.md#t-006). | Verificada |
| T-007 | Ejecutar suite de pruebas (`npm test`) y compilación de producción (`npm run build`) para certificar cero regresiones. | AC-005 | Salida real de tests y build en [evidence.md](evidence.md#t-007). | Verificada |
| T-008 | Resalte cartográfico y estilización diferencial por tramo de ciclovía en `StreetViewer.tsx` y API (ERR-002) | AC-004 | Validación interactiva en visor Leaflet con capturas reales (resalte activo e inactivo para Avenida Vivanco). Registro en [evidence.md](evidence.md#t-008). | Verificada |
| T-009 | Revisión independiente de la corrección de ERR-002 | AC-001 a AC-005 | Auditoría y dictamen de agente Verifier independiente sobre la corrección visual y técnica de ciclovías. Registro en [evidence.md](evidence.md#revisión-independiente-err-002). | Verificada |
| T-010 | Cabecera móvil responsiva y persistencia/recuperación del panel de búsqueda en viewport móvil (ERR-003) | AC-001, AC-003 | Implementar `Header.tsx`, `h-dvh`, auto-expansión en búsqueda, botón flotante de recuperación y captura de evidencia móvil en [evidence.md](evidence.md#t-010). | Verificada |
| T-011 | Revisión independiente de la corrección de ERR-003 | AC-001, AC-003 | Auditoría y dictamen de Verifier independiente sobre usabilidad y layout en viewport móvil. Registro en [evidence.md](evidence.md#revisión-independiente-err-003). | Verificada |

