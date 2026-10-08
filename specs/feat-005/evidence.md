# FEAT-005 — evidencia

Historia de cambios, ejecuciones y comprobaciones de `FEAT-005`. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) detallan qué se verifica.

## Discovery: 2026-10-06 — Relevamiento de necesidades visuales y prototipado Stitch

- **Diseño de referencia en Stitch:** Proyecto `10898805298048153481` ("Calles Posadas").
- **Pantalla generada:** `dc34a92d01b4401283d60918e9ad4c05` (Explorador Cívico y SIG de Nomenclatura).
- **Design System generado:** `assets/383aa19f865049ee861e90c910397f7d`.
- **Hallazgos del discovery:**
  1. El visor actual carece de retención de contexto: seleccionar una calle oculta la búsqueda y obliga a retroceder de forma disruptiva.
  2. Los controles de mapa Leaflet por defecto no tienen coherencia estética ni acceso ágil para destacar ciclovías o ver coordenadas de referencia.
  3. En mobile, el drawer oculta el mapa por completo en pantallas medianas; se requiere un esquema de 3 estados (peek 72px, medio 45vh, completo 90vh).
  4. La paleta visual requiere pasar de tonos grises neutros a la identidad municipal de Posadas (River Azure `#0284c7`, Guaraní Emerald `#10b981`, Midnight Slate `#0f172a`).

## Ejecución: 2026-10-06 — Implementación de rediseño visual y controles espaciales

### <a id="t-001"></a>T-001: Tokens de color y estilos Stitch
- **Alcance comprobado:** Inclusión de `posadas.river` (`#0284C7`), `posadas.emerald` (`#10B981`), `posadas.midnight` (`#0F172A`) en `tailwind.config.js`, utilidades `glass-panel` y `map-hud-shadow` en `globals.css`.
- **Comprobación:** Compilación y renderizado verificado.

### <a id="t-002"></a>T-002: Cabecera institucional Stitch en `layout.tsx`
- **Alcance comprobado:** Barra de navegación superior con isotipo municipal de pin, etiqueta "SIG Cívico", accesos directos y enlace al Digesto Municipal.
- **Comprobación:** `npm run build` y navegación verificada.

### <a id="t-003"></a>T-003: Retención de contexto en panel lateral (`src/app/page.tsx`)
- **Alcance comprobado:** La selección de una arteria preserva los filtros activos y la página de búsqueda; barra superior contextual permite regresar al listado de resultados con un solo clic.
- **Comprobación:** Suite de integración frontend `test/frontend-integration.test.ts`.

### <a id="t-004"></a>T-004: Bottom sheet móvil de 3 estados
- **Alcance comprobado:** Estados `peek` (76px para máxima visualización del mapa), `half` (50vh) y `full` (90vh) con agarradera táctil y pill descriptivo.
- **Comprobación:** `npm run build` y validación de clases responsivas.

### <a id="t-005"></a>T-005: Controles HUD cartográficos en `StreetViewer.tsx`
- **Alcance comprobado:** Controles minimalistas flotantes (+ / - / recentrar), píldora de coordenadas en WGS84 (`-27.367°, -55.896°`), conmutador reactivo de ciclovías y leyenda de referencias con colores Stitch.
- **Comprobación:** Test de módulo Leaflet en `test/frontend-integration.test.ts`.

### <a id="t-006"></a>T-006: Rediseño de Ficha Técnica `StreetDetailCard.tsx`
- **Alcance comprobado:** Tipografía jerarquizada, metadatos viales en grilla, caja destacada de trazabilidad jurídica con botón directo al Digesto Municipal, badges de barrios y tramos catastrales.
- **Comprobación:** Test unitario e integración en `test/frontend-integration.test.ts`.

### <a id="t-007"></a>T-007: Certificación de pruebas y compilación estática
- **Comando:** `npm test` y `npm run build`
- **Exit code:** 0
- **Resultado de pruebas:** 33 tests pasados en 18 suites (0 fallos).
- **Resultado del build:** Compilación exitosa en Next.js con Turbopack (todas las rutas `/`, `/calles/[slug]`, `/stats`, `/api/v1/*` generadas sin errores).
- **Ajuste visual (Viewport & Leaflet):** Se eliminó la restricción residual de `min-h-[400px]` en el contenedor del visor Leaflet, pasando a `absolute inset-0` e invalidación dinámica de tamaño (`map.invalidateSize()`) para cubrir el 100% de la altura de pantalla sin espacios en blanco.

## Errores y correcciones: reporte de producto (2026-10-07)

### ERR-002: Resalte incorrecto de ciclovía en calles con tramos diferentes (Avenida Vivanco)
- **Origen y fecha:** Reporte de usuario (2026-10-07).
- **AC afectado:** AC-004 (Controles HUD flotantes y resalte diferencial de ciclovías).
- **Síntoma y reproducción:** Avenida Vivanco (N° 139) tiene dos tramos catastrales: Tramo 1 (4111 m) con ciclovía y Tramo 2 (360 m) sin ella. Al activar el resalte de ciclovías en el visor Leaflet, el mapa pintaba ambos tramos de verde (`#10b981`), a pesar de que el tramo norte no posee ciclovía.
- **Esperado:**
  1. Con el resalte activo, cada tramo representa su propio atributo: verde (`#10b981`) con ciclovía y azul (`#0284c7`) sin ella.
  2. Desactivar el resalte conserva todas las geometrías y muestra la traza normal (ambos tramos en azul `#0284c7`).
  3. La representación visual coincide estrictamente con los datos de la ficha y la API.
- **Observado:** La capa GeoJSON de `StreetViewer` evaluaba `hasCycleway` a nivel global de la arteria sobre una geometría unificada `MultiLineString`, por lo que el estilo aplicaba el color verde a toda la traza indistintamente.
- **Cambio correctivo:**
  - En `src/lib/db/streets.ts`: se incluyó la columna `t.geojson` en la consulta de tramos en `getStreetBySlug`, parseando la geometría individual de cada segmento.
  - En `src/components/map/StreetViewer.tsx`: se adaptó `updateGeoJson` para estructurar un `FeatureCollection` normalizado con propiedades independientes por tramo (`orden`, `tiene_ciclovia`, `longitud_m`). La función `style(feature)` extrae el atributo booleano `tiene_ciclovia` de cada feature. Si el resalte está activo (`highlightCycleways === true`), únicamente los tramos con `tiene_ciclovia === true` adoptan Guaraní Emerald (`#10b981`), mientras que los tramos sin ciclovía se pintan en River Azure (`#0284c7`). Al desactivar el resalte (`highlightCycleways === false`), todos los tramos se presentan en River Azure (`#0284c7`), conservando íntegras todas las geometrías y el encuadre `fitBounds`.
  - Se enriqueció el popup interactivo para indicar el número de tramo y el estado de ciclovía específico del tramo pulsado.
- **Comprobación posterior:**
  - Test unitario/integración en `test/frontend-integration.test.ts` verificando que Avenida Vivanco contiene tramos mixtos con geometrías y atributos de ciclovía diferenciados.
  - Comprobación visual en la interfaz real de Next.js (`http://localhost:3000/calles/avenida-arq-jorge-eduardo-vivanco-139`) en viewport desktop (1280x800).
  - Capturas reales guardadas en `specs/feat-005/artifacts/`:
    - [ERR-002-vivanco-ciclovia-resalte-activo.png](artifacts/ERR-002-vivanco-ciclovia-resalte-activo.png): Viewport desktop 1280x800. Escenario con botón HUD de ciclovías activo (verde). Tramo 1 (4111 m) pintado en verde (#10b981) y Tramo 2 (360 m) pintado en azul (#0284c7). Coincide exactamente con la lista de tramos catastrales de la ficha.
    - [ERR-002-vivanco-ciclovia-resalte-inactivo.png](artifacts/ERR-002-vivanco-ciclovia-resalte-inactivo.png): Viewport desktop 1280x800. Escenario con botón HUD de ciclovías desactivado (blanco). Ambos tramos se pintan en azul (#0284c7), preservando todas las geometrías de la traza oficial.

### <a id="t-008"></a>T-008: Resalte cartográfico y estilización diferencial por tramo (Developer)
- **Fecha y rol:** 2026-10-07, Developer (Autocontrol).
- **Archivos modificados:** `src/lib/db/streets.ts`, `src/components/map/StreetViewer.tsx`, `test/frontend-integration.test.ts`.
- **Comandos de comprobación:** `npm test` y validación visual automatizada mediante navegador headless sobre la interfaz real.
- **Exit code:** 0 (41 tests pasados en 19 suites, 0 fallos).
- **Artefactos visuales generados:**
  - [ERR-002-vivanco-ciclovia-resalte-activo.png](artifacts/ERR-002-vivanco-ciclovia-resalte-activo.png)
  - [ERR-002-vivanco-ciclovia-resalte-inactivo.png](artifacts/ERR-002-vivanco-ciclovia-resalte-inactivo.png)
- **Estado AC-004:** Cumplido con evidencia empírica.

### <a id="revisión-independiente-err-002"></a>Revisión independiente de ERR-002
- **Fecha y rol:** 2026-10-07, Verifier independiente (`42e38864-ff41-4539-b74a-00783a5a3cc6`).
- **Material inspeccionado:**
  - Contrato en `specs/feat-005/spec.md` (AC-004 y AC-005).
  - Diff en `src/components/map/StreetViewer.tsx` y `src/lib/db/streets.ts` (manejo de GeoJSON individual por tramo, FeatureCollection y estilización diferencial según `tiene_ciclovia`).
  - Artefactos visuales reales:
    - [ERR-002-vivanco-ciclovia-resalte-activo.png](artifacts/ERR-002-vivanco-ciclovia-resalte-activo.png)
    - [ERR-002-vivanco-ciclovia-resalte-inactivo.png](artifacts/ERR-002-vivanco-ciclovia-resalte-inactivo.png)
- **Comprobaciones ejecutadas personalmente y resultados:**
  1. Inspección visual directa de capturas:
     - Resalte activo: Tramo 1 (4111 m) se visualiza en verde Guaraní Emerald (`#10b981`), mientras que Tramo 2 (360 m) se visualiza en azul River Azure (`#0284c7`), reflejando con exactitud los atributos de ciclovía por tramo.
     - Resalte inactivo: Ambos tramos se visualizan uniformemente en azul River Azure (`#0284c7`), conservando íntegras las geometrías de la traza oficial.
  2. `npm test`: 41 tests pasados en 19 suites, 0 fallos (incluyendo la prueba de integración de tramos mixtos).
  3. `npm run build`: Compilación limpia en Next.js (Turbopack) sin errores ni advertencias (exit code 0).
- **Hallazgos:** Ninguno.
- **Dictamen:** FAVORABLE. AC-001 a AC-005 plenamente verificados. Conforme para cierre definitivo.

### ERR-003: Desbordamiento horizontal en cabecera móvil y colapso irrecuperable del panel de búsqueda en viewport móvil
- **Origen y fecha:** Reporte de usuario (2026-10-07) con captura de pantalla en dispositivo móvil Android (`posadas.ferchamorro.cloud`).
- **AC afectado:** AC-001 (Cabecera institucional y responsiva), AC-003 (Bottom Sheet móvil ergonómico de 3 estados).
- **Síntoma y reproducción:**
  1. En pantallas móviles angostas (≤ 390px), la cabecera mostraba todos los enlaces institucionales (`Explorador`, `Métricas`, `IDE Posadas`, `Digesto`) en una sola línea no envuelta, sumando un ancho intrínseco > 620px que forzaba desbordamiento horizontal en la raíz del documento. Al tocar o deslizar la pantalla, la vista se desplazaba horizontalmente hacia la derecha, cortando el logo ("Calles de Posadas" reducido a "de as") y dejando un área blanca a la derecha.
  2. El contenedor raíz usaba `h-screen` (`100vh`), el cual en navegadores móviles con barra de navegación dinámica se extiende 70-80px por debajo del área visible. Al deslizar o colapsar el drawer inferior, éste quedaba oculto completamente fuera de pantalla (offscreen) sin ningún botón o tirador accesible para reabrirlo o buscar ("la parte de búsqueda desaparece y no se puede recuperar").
  3. La caja de "Referencias" del mapa en `StreetViewer.tsx` se ubicaba en la esquina inferior derecha colisionando con el panel táctil móvil.
- **Esperado:**
  1. Cabecera 100% responsiva sin desbordamiento horizontal en anchos estrechos (≤ 390px), con botón de acceso a Métricas y menú desplegable para accesos externos (IDE Posadas, Digesto).
  2. El layout utiliza unidades dinámicas de viewport (`h-dvh` / `max-h-dvh`) y safe-area insets (`pb-[env(safe-area-inset-bottom)]`).
  3. En modo colapsado (`peek`), el campo de búsqueda (`SearchBar`) permanece visible y al enfocarlo se auto-expande a `half`.
  4. Si el panel se oculta (`hidden`) para explorar el mapa completo, se muestra un botón flotante persistente `🔍 Buscar arterias` en la esquina inferior para recuperarlo con un solo toque.
  5. La leyenda de Referencias se oculta en mobile (`hidden md:flex`) previniendo solapamientos.
- **Cambio correctivo:**
  - `src/components/layout/Header.tsx`: componente de cabecera responsivo con menú desplegable accesible.
  - `src/app/layout.tsx`: integración de `Header`, `h-dvh` en `html` y `body`, `overflow-x-hidden`.
  - `src/components/search/SearchBar.tsx`: soporte de prop `onFocus`.
  - `src/app/page.tsx`: soporte de estados `hidden`, `peek`, `half`, `full`, auto-expansión al foco, botones compactos y botón flotante de recuperación.
  - `src/components/map/StreetViewer.tsx`: leyenda de Referencias oculta en pantallas pequeñas (`hidden md:flex`).
  - `test/frontend-integration.test.ts`: test de integración para contratos de Header, SearchBar y HomePage.
- **Comprobación:**
  - `npm test`: 57 tests pasados en 29 suites (0 fallos).
  - `npm run build`: compilación de producción exitosa en Turbopack (exit code 0).
  - Comprobación visual y métrica en Chrome con emulación móvil real (viewport 390x844):
    - Detección de desbordamiento horizontal: `docW === 390`, `bodyW === 390`, `overflowing: []` (0 elementos fuera de pantalla).
    - Capturas generadas en `specs/feat-005/artifacts/`:
      - [ERR-003-mobile-emulado-390px.png](artifacts/ERR-003-mobile-emulado-390px.png): Vista inicial en `half` con cabecera adaptada, menú, mapa y catálogo de arterias visibles sin scroll horizontal.
      - [ERR-003-mobile-01-peek.png](artifacts/ERR-003-mobile-01-peek.png): Estado colapsado `peek`, mapa amplio y barra de búsqueda visible y enfocable al pie.
      - [ERR-003-mobile-02-hidden.png](artifacts/ERR-003-mobile-02-hidden.png): Estado `hidden` con 100% mapa y botón flotante `🔍 Buscar arterias (874) [ Abrir ↑ ]`.
      - [ERR-003-mobile-03-recuperado.png](artifacts/ERR-003-mobile-03-recuperado.png): Estado recuperado tras pulsar el botón flotante.
      - [ERR-003-mobile-04-menu.png](artifacts/ERR-003-mobile-04-menu.png): Menú de navegación móvil desplegado con accesos limpios.
      - [ERR-003-mobile-05-urban-center.png](artifacts/ERR-003-mobile-05-urban-center.png): Carga inicial en modo `peek` (125px) con centro cartográfico en el centroide urbano de Posadas (-27.382°, -55.902°), mostrando la cuadrícula de avenidas y barrios en lugar del río.

### <a id="t-010"></a>T-010: Cabecera móvil responsiva y persistencia del panel de búsqueda móvil (Developer)
- **Fecha y rol:** 2026-10-07, Developer (Autocontrol).
- **Archivos modificados:** `src/components/layout/Header.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/search/SearchBar.tsx`, `src/components/map/StreetViewer.tsx`, `src/app/calles/[slug]/page.tsx`, `test/frontend-integration.test.ts`.
- **Salida empírica:** 57 tests pasados, build exitoso y 5 capturas en viewport móvil sin desbordamientos.
- **Estado:** Cumplida. Pasa a revisión independiente.

### <a id="revisión-independiente-err-003"></a>Revisión independiente de ERR-003
- **Fecha y rol:** 2026-10-07, Verifier independiente (`b827af84-cf2f-49b0-bfbd-c3482b88dcb4`).
- **Material inspeccionado:**
  - Contrato en `specs/feat-005/spec.md` (AC-001, AC-003 y AC-005).
  - Diff en `src/components/layout/Header.tsx`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/components/search/SearchBar.tsx`, `src/components/map/StreetViewer.tsx`, `src/app/calles/[slug]/page.tsx`, `test/frontend-integration.test.ts`.
  - Artefactos visuales reales en `specs/feat-005/artifacts/`:
    - `ERR-003-mobile-emulado-390px.png` (viewport móvil 390px, cabecera intacta, catálogo visible, sin scroll horizontal).
    - `ERR-003-mobile-01-peek.png` (estado colapsado peek 125px con barra de búsqueda accesible).
    - `ERR-003-mobile-02-hidden.png` (estado hidden con botón flotante persistente `🔍 Buscar arterias`).
    - `ERR-003-mobile-03-recuperado.png` (re-expansión instantánea a half tras pulsar botón flotante).
    - `ERR-003-mobile-04-menu.png` (menú de navegación móvil desplegado).
- **Comprobaciones ejecutadas personalmente y resultados:**
  1. Inspección visual directa de capturas: ausencia total de desbordamiento horizontal (`docW === 390`, `bodyW === 390`, `overflowing: []`), recuperación garantizada del panel de búsqueda y menú responsive funcional.
  2. `npm test`: 57 tests pasados en 29 suites (0 fallos, 0 saltados) en 522 ms.
  3. `npm run build`: compilación limpia en Next.js (Turbopack) con TypeScript estricto en 864 ms y 9 rutas generadas sin errores (exit code 0).
- **Hallazgos:** Ninguno.
- **Dictamen:** FAVORABLE. AC-001, AC-003 y AC-005 plenamente verificados. Conforme para cierre definitivo.




