# FEAT-003 — Visor cartográfico interactivo y maquetación de fichas en Leaflet

## Origen y necesidad

- **Antecedente:** [PRD Calles de Posadas](../../docs/prd.md) (Secciones 1.3, 2, 4.2 y Requerimientos Funcionales RF-03, RF-04, RF-05).
- **Problema:** Los vecinos y usuarios necesitan consultar de forma visual y accesible las arterias de Posadas, entender su traza geográfica en el plano urbano, identificar tramos con infraestructura ciclista y acceder a una ficha comprensible con metadatos técnicos, fundamentación histórica y respaldo de ordenanzas del Digesto Municipal tanto en escritorio como en dispositivos móviles.
- **Resultado observable:** Interfaz web interactiva en Next.js con Tailwind CSS que incluye visor cartográfico en Leaflet (con centrado y `fitBounds` automático sobre la traza GeoJSON), catálogo y buscador reactivo con filtros, y maquetación responsiva de la ficha de detalle de calle con enlaces verificables a la normativa municipal.

## Alcance y exclusiones

### Alcance
1. **Configuración y base frontend:**
   - Incorporación de dependencias: `next`, `react`, `react-dom`, `leaflet`, `@types/leaflet`, `tailwindcss`, `postcss`, `autoprefixer`.
   - Layout base responsivo y configuración de estilos con Tailwind CSS.
2. **Visor cartográfico Leaflet (`src/components/map/StreetViewer.tsx`):**
   - Carga dinámica del lado del cliente (`ssr: false` o `'use client'`) para prevenir errores de hidratación y acceso a `window`.
   - Centrado inicial en Posadas (`lat: -27.36708, lng: -55.89608`, zoom 13) con teselas raster abiertas (CartoDB Positron / OpenStreetMap).
   - Capa vectorial GeoJSON que renderiza la traza de la arteria activa y ajusta automáticamente la vista (`fitBounds`) a su extensión.
   - Estilizado condicional de tramos: diferenciación visual nítida para tramos que cuentan con ciclovía o bicisenda (`has_cycleway = true`).
3. **Catálogo y búsqueda interactiva:**
   - Barra de búsqueda con debounce conectada a `/api/v1/streets?q=...`.
   - Filtros de consulta por tipo de vía (`road_type`) y presencia de ciclovía (`has_cycleway`).
   - Listado de resultados con paginación y selección directa de arterias que actualiza el mapa.
4. **Ficha de detalle de calle (`src/components/street/StreetDetailCard.tsx` y `/calles/[slug]`):**
   - Metadatos técnicos viales: nombre oficial, número alternativo, tipo de vía, sentido de circulación, longitud total formateada (m/km) y barrios atravesados.
   - Trazabilidad legal: número de ordenanza municipal y enlace externo seguro (`target="_blank" rel="noopener noreferrer"`) al Digesto Jurídico Municipal.
   - Reseña toponímica e histórica y detalle de alturas por tramos.
   - Manejo de estado no encontrado (404) para slugs inexistentes.
5. **Diseño responsivo mobile-first:**
   - Adaptación para dispositivos móviles (≤ 768px) mediante panel deslizable / bottom sheet que permite alternar o convivir entre la ficha técnica y el mapa sin perder usabilidad.

### Exclusiones
- Pantalla de métricas de completitud y estadísticas agregadas `/stats` (corresponde a `FEAT-004`).
- Carga comunitaria de contenido, fotografías de usuarios (UGC) o autenticación ciudadana (diferido a Fase 2 según [DEC-002](../../docs/decisions.md#dec-002)).
- Ruteo GPS punto a punto y navegación asistida en tiempo real (fuera del alcance del MVP).

## Comportamiento y aceptación

- **AC-001 (Visor cartográfico Leaflet sin fallos SSR):** El mapa base se monta exclusivamente en el cliente sin disparar excepciones de SSR (`window is not defined`) ni desajustes de hidratación, centrándose inicialmente en las coordenadas urbanas de Posadas con capa CartoDB/OSM y controles de zoom.
- **AC-002 (Búsqueda y catálogo reactivo):** La barra de búsqueda ejecuta consultas debounced contra `/api/v1/streets`, permitiendo aplicar filtros de vía y ciclovía y desplegando los resultados en una lista con paginación funcional.
- **AC-003 (Renderizado vectorial GeoJSON y fitBounds):** Al seleccionar una calle del catálogo o cargar la ruta `/calles/:slug`, el visor recupera el GeoJSON, ajusta la vista mediante `map.fitBounds(bounds)` al polígono/línea de la arteria y renderiza la traza destacando los tramos con ciclovía en color distintivo.
- **AC-004 (Maquetación de ficha técnica y trazabilidad normativa):** La ficha expone nombre oficial, número, sentido de circulación, longitud en formato legible, barrios, reseña histórica y el bloque de ordenanza con link al Digesto Municipal. Para slugs no registrados, se muestra una vista 404 informativa.
- **AC-005 (Experiencia responsiva mobile-first):** En pantallas móviles (ancho ≤ 768px), la ficha de información se despliega en un panel inferior accesible que no obstaculiza la exploración del mapa.

## Diseño y dependencias

- **Componentes y arquitectura frontend:**
  - `src/components/map/StreetViewer.tsx`: Componente de mapa Leaflet con soporte de trazas GeoJSON y control de límites.
  - `src/components/search/SearchBar.tsx`: Caja de búsqueda con debounce y filtros.
  - `src/components/street/StreetDetailCard.tsx`: Ficha técnica de la arteria con metadatos, reseña y enlace normativo.
  - `src/app/page.tsx`: Vista principal integrada (catálogo, buscador y mapa general).
  - `src/app/calles/[slug]/page.tsx`: Vista detallada canónica de la arteria.
- **Servicios backend consumidos:**
  - Endpoints REST de `FEAT-002`: `/api/v1/streets`, `/api/v1/streets/:slug` y `/api/v1/barrios`.
- **Dependencias de paquetes:**
  - `next`, `react`, `react-dom`, `leaflet`, `@types/leaflet`, `tailwindcss`, `postcss`, `autoprefixer`.

## Aprobación del contrato

- **Estado:** Aprobado.
- **Quién decide:** Usuario (aprobación expresa en chat).
- **Fecha:** 2026-10-06.
- **Alcance aprobado:** Visor cartográfico Leaflet cliente con `fitBounds`, renderizado vectorial de GeoJSON con diferenciación de ciclovías, buscador reactivo y maquetación responsiva de la ficha técnica con enlace al Digesto.
