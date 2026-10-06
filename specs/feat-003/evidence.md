# FEAT-003 — evidencia

Historia de cambios, ejecuciones y comprobaciones de `FEAT-003`. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) detallan qué se verifica.

## Ejecución: 2026-10-06 — Implementación de frontend Next.js, visor Leaflet y ficha técnica

### <a id="t-001"></a>T-001: Configuración de dependencias frontend y layout base
- **Alcance comprobado:** Instalación y configuración de Next.js (App Router), React 19, Tailwind CSS v3, PostCSS, Leaflet y soporte para componentes de cliente sin errores de hidratación ni acceso a `window`.
- **Comando:** `npm run build`
- **Exit code:** 0.
- **Resultado:** Compilación de rutas `/`, `/_not-found`, `/calles/[slug]` y endpoints `/api/v1/*` en 869 ms.

### <a id="t-002"></a>T-002: Visor cartográfico Leaflet cliente (`StreetViewer.tsx`, `StreetViewerClient.tsx`)
- **Alcance comprobado:** Renderizado de mapa base CartoDB Positron centrado en Posadas (`[-27.36708, -55.89608]`), soporte de encuadre dinámico (`fitBounds`) a las geometrías de las arterias, capas vectoriales GeoJSON (`LineString` y `MultiLineString`) y diferenciación de color/estilo para tramos con ciclovía (`has_cycleway = true`).
- **Comando:** `npm test`
- **Exit code:** 0.
- **Prueba:** Suite `test/frontend-integration.test.ts` (verificación de coordenadas WGS84 de Posadas y detección de tramos ciclistas).

### <a id="t-003"></a>T-003: Catálogo y buscador interactivo (`SearchBar.tsx`, `FilterBar.tsx`, `page.tsx`)
- **Alcance comprobado:** Barra de búsqueda con debounce (300 ms), selector de tipos de vía (`AVENIDA`, `CALLE`, `PASAJE`, `DIAGONAL`, `COSTANERA`), selector de barrios/chacras cargados desde `/api/v1/barrios`, filtro directo de ciclovías y paginación determinística en panel lateral izquierdo.
- **Comando:** `npm test`
- **Exit code:** 0.
- **Prueba:** Suite `test/frontend-integration.test.ts` e integración con API probada en `test/api-routes.test.ts`.

### <a id="t-004"></a>T-004: Ficha de detalle de arteria (`StreetDetailCard.tsx`, `/calles/[slug]/page.tsx`)
- **Alcance comprobado:** Maquetación completa con nombre oficial, número de arteria, sentido de circulación, longitud total formateada (m/km), barrios asociados, alturas catastrales por tramos, reseña histórica toponímica y bloque de ordenanza con enlace externo seguro (`target="_blank" rel="noopener noreferrer"`) al Digesto Jurídico Municipal. Manejo de estado 404 para slugs no registrados y helper `getStreetMetadata`.
- **Comando:** `npm test` y `npm run build`
- **Exit code:** 0.
- **Prueba:** `test/frontend-integration.test.ts` (3 tests de metadatos y contrato de datos aprobados).

### <a id="t-005"></a>T-005: Diseño responsivo mobile-first y suite de pruebas
- **Alcance comprobado:** Drawer/panel deslizable inferior (`bottom sheet`) para dispositivos móviles con botón táctil de apertura y cierre para explorar el mapa sin perder acceso a la ficha técnica o lista de resultados. Suite automatizada de pruebas para módulos cliente y servidor.
- **Comando:** `npm test`
- **Exit code:** 0.
- **Prueba:** `test/frontend-integration.test.ts` aprobada al 100%.

---

## Cobertura total de pruebas
- **Comando:** `npm test`
- **Resultado:** 29 tests aprobados en 13 suites (0 fallos, duración: ~454 ms). Exit code: 0.
- **Comando de compilación:** `npm run build`
- **Resultado:** Build de producción exitoso con Turbopack (0 errores, 0 warnings). Exit code: 0.

## Autocontrol y límites
- **Verificación realizada:** Autocontrol técnico mediante validación de build de producción en Next.js y 29 tests unitarios/integración en Node.js.
- **Límites:** Las estadísticas agregadas a nivel municipal (porcentajes de paridad toponímica, cobertura de ciclovías y ordenanzas) se desarrollarán en `FEAT-004` (`/stats`).
