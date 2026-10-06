# FEAT-005 — Rediseño visual responsivo del visor y optimización espacial con Stitch

## Origen y necesidad

- **Antecedente:** [PRD Calles de Posadas](../../docs/prd.md) (Secciones 2, 4.2), visor preliminar de `FEAT-003` y diseño en Stitch (`projects/10898805298048153481`).
- **Problema:** El visor cartográfico inicial de `FEAT-003` resolvió la funcionalidad básica pero presenta limitaciones de usabilidad y distribución espacial:
  1. **Rigidez del panel lateral:** El ancho fijo en escritorio y el reemplazo destructivo de la lista de búsqueda al abrir una ficha obligan a cerrar el detalle para retomar los resultados anteriores.
  2. **Controles cartográficos básicos:** Los controles de Leaflet por defecto no ofrecen una estética cívica moderna ni integran controles directos para capas como ciclovías o información de coordenadas/escala urbana.
  3. **Experiencia móvil:** El bottom sheet actual carece de estados de interacción fluidos (peek para ver el mapa vs. lectura extendida de la ordenanza) y la barra de búsqueda consume espacio vertical en pantallas reducidas.
  4. **Falta de identidad cívica municipal:** El diseño visual en grises genéricos no refleja la jerarquía de un portal cívico cartográfico de Posadas ni la riqueza de los datos urbanos.
- **Resultado observable:** Rediseño completo de la interfaz del explorador cartográfico incorporando el Design System "Calles de Posadas" creado con Stitch (River Azure `#0284c7`, Guaraní Emerald `#10b981`, Midnight Slate `#0f172a`), un panel lateral asimétrico que retiene el contexto de búsqueda, controles HUD cartográficos minimalistas flotantes y un bottom sheet móvil optimizado con estados colapsado/expandido.

## Alcance y exclusiones

### Alcance
1. **Sistema de diseño y tokens visuales (Stitch DS `assets/383aa19f865049ee861e90c910397f7d`):**
   - Incorporación de tokens y paleta municipal: River Azure (`#0284c7`), Guaraní Emerald (`#10b981`), Midnight Slate (`#0f172a`), y acabados estilo glassmorphism sutil para paneles flotantes.
   - Refinamiento tipográfico con alineación numérica tabular para datos viales y ordenanzas.
2. **Layout y panel lateral de escritorio (`src/app/page.tsx`):**
   - Panel lateral flotante/acoplado con navegación bidireccional ágil (búsqueda/lista ↔ ficha técnica) preservando términos de búsqueda y filtros.
   - Micro-indicadores visuales por tipo de vía y presencia de ciclovía en cada elemento de la lista.
3. **Experiencia móvil responsiva (`src/app/page.tsx` y componentes de vista):**
   - Barra de búsqueda superior flotante compacta.
   - Bottom sheet inferior con 3 estados ergonómicos: colapsado (peek de 72px para máxima visualización del mapa), intermedio (45vh) y pantalla completa (90vh).
4. **Controles cartográficos flotantes HUD (`src/components/map/StreetViewer.tsx`):**
   - Controles de zoom y centrado rediseñados con estilo minimalista sobre el mapa.
   - Conmutador directo de resalte de red de ciclovías.
   - Píldora informativa de referencia espacial de Posadas (coordenadas urbanas y datum).
5. **Rediseño de la Ficha Técnica de Arteria (`src/components/street/StreetDetailCard.tsx`):**
   - Cabecera con jerarquía clara de nombre oficial y número de arteria.
   - Tarjeta destacada de trazabilidad jurídica del Digesto Municipal con icono y llamada a la acción.
   - Grilla de atributos técnicos (sentido, longitud, tipo de calzada, barrios atravesados) y reseña histórica destacada.

### Exclusiones
- Carga comunitaria de contenidos o fotografías por vecinos (UGC).
- Modificación del esquema de base de datos SQLite o de los endpoints de API existentes de `FEAT-002` y `FEAT-004`.
- Ruteo punto a punto o geolocalización continua por GPS.

## Comportamiento y aceptación

- **AC-001 (Tokens y paleta cívica Stitch):** La interfaz general, barra de navegación, paneles y componentes reflejan la paleta aprobada (River Azure, Guaraní Emerald, Midnight Slate) con contraste accesible WCAG AAA en textos clave.
- **AC-002 (Panel lateral con retención de contexto en escritorio):** Al abrir una ficha técnica desde los resultados de búsqueda, el usuario puede regresar inmediatamente al listado con un clic conservando la consulta previa, filtros y paginación sin recargas.
- **AC-003 (Bottom Sheet móvil ergonómico):** En pantallas ≤ 768px, el usuario puede alternar fluidamente entre explorar el mapa con el panel colapsado (peek) y leer la ficha técnica extendida de la calle seleccionada.
- **AC-004 (Controles HUD flotantes en el visor Leaflet):** El visor cartográfico presenta controles de zoom rediseñados, píldora de referencia espacial y botón de conmutación de resalte para ciclovías.
- **AC-005 (Preservación funcional y verificación de pruebas):** El 100% de la suite de pruebas automatizadas (`npm test`) y la compilación estática (`npm run build`) se ejecutan con éxito sin advertencias ni regresiones.

## Diseño y dependencias

- **Proyecto Stitch:** `projects/10898805298048153481` ("Calles Posadas").
- **Pantalla Stitch de referencia:** `dc34a92d01b4401283d60918e9ad4c05` (Explorador Cívico y SIG de Nomenclatura).
- **Design System Stitch:** `assets/383aa19f865049ee861e90c910397f7d`.
- **Archivos a intervenir:**
  - `src/app/globals.css`: tokens y utilidades de estilo.
  - `src/app/layout.tsx`: actualización de cabecera institucional.
  - `src/app/page.tsx`: layout principal y lógica de interacción panel/mapa.
  - `src/components/map/StreetViewer.tsx`: controles HUD y estilización cartográfica.
  - `src/components/street/StreetDetailCard.tsx`: maquetación de la ficha técnica.
  - `src/components/search/SearchBar.tsx` y `FilterBar.tsx`: estética y ergonomía de búsqueda.

## Aprobación del contrato

- **Estado:** Aprobado.
- **Quién decide:** Usuario (aprobación expresa en chat).
- **Fecha:** 2026-10-06.
- **Alcance aprobado:** Rediseño visual responsivo del visor y optimización espacial con Design System Stitch, retención de contexto en catálogo, bottom sheet móvil y controles HUD cartográficos.
