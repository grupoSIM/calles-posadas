# FEAT-003 — tareas

Descomposición de la [spec](spec.md) en resultados observables. El estado global y la siguiente acción se consultan en el [catálogo](../index.md).

| ID | Resultado de la tarea | Aceptación | Comprobación y evidencia | Estado |
|---|---|---|---|---|
| T-001 | Configurar dependencias frontend (Next.js, React, Tailwind CSS, Leaflet) y layout base con estilos globales y soporte SSR. | AC-001 | Build y configuración de estilos verificado en [evidence.md](evidence.md#t-001). | Verificada |
| T-002 | Implementar componente de visor cartográfico Leaflet cliente (`src/components/map/StreetViewer.tsx`, `StreetViewerClient.tsx`) con teselas libres, soporte de `fitBounds` y renderizado vectorial de GeoJSON con diferenciación de ciclovías. | AC-001, AC-003 | Verificación de renderizado vectorial y cálculo de encuadre en [evidence.md](evidence.md#t-002). | Verificada |
| T-003 | Construir barra de búsqueda y catálogo interactivo (`src/components/search/SearchBar.tsx`, `FilterBar.tsx`) con debounce y filtros por vía y ciclovía. | AC-002 | Verificación de búsqueda y filtros reactivos en [evidence.md](evidence.md#t-003). | Verificada |
| T-004 | Maquetar la ficha de detalle de arteria (`src/components/street/StreetDetailCard.tsx` y vista `/calles/[slug]`) con metadatos viales, reseña toponímica, alturas y enlace al Digesto Municipal. | AC-004 | Verificación de ficha técnica y metadatos en [evidence.md](evidence.md#t-004). | Verificada |
| T-005 | Implementar diseño responsivo mobile-first con panel deslizable/colapsable y suite de pruebas de integración para componentes de catálogo y detalle. | AC-005 | Suite automatizada de integración frontend (`test/frontend-integration.test.ts`) en [evidence.md](evidence.md#t-005). | Verificada |
