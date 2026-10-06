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

