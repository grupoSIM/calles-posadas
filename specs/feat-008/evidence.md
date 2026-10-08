# Evidencia de comprobación — FEAT-008: Capa interactiva de barrios en visor y enriquecimiento vial desde IDE Posadas

Historia de cambios, ejecuciones y comprobaciones de `FEAT-008`. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) detallan qué se verifica.

## Registro de actividades y responsables

- **2026-10-07:** Leader / Analyst (sesión `4583cdf7-2873-4280-9b44-48454e0b17d2`) — Discovery de capas IDE Posadas (`manos_unicas`, `Materialidad_red_vial_2026_0`, `Jerarquia_Red_Vial_00`, `Barrios_Posadas1`) y formulación del contrato de `FEAT-008`.
- **2026-10-07T14:14:23-03:00:** Usuario — Aprobación formal del contrato de `FEAT-008` (registro textual en log: *"Si apruebo"*).
- **2026-10-07:** Developer (sesión `4583cdf7-2873-4280-9b44-48454e0b17d2`) — Implementación de T-001 (enriquecimiento ETL), T-002 (endpoint GeoJSON), T-003 (capa interactiva Leaflet) y T-004 (suite de pruebas y build). Autocontrol completado.
- **2026-10-07:** Verifier independiente (subagente `e33379a2-99ab-4e9e-8cdb-f72e862984c8`) — Primera auditoría de cierre.
- **2026-10-07 / 2026-10-08:** Leader / Developer (sesión `5b29833f-0ba0-4f51-8514-ff44c9c3bae2`) — Reapertura por detección de ERR-001: corrección de discriminación de vigencia en `manos_unicas`, prevención de colisiones homónimas parciales, eliminación de inferencias hardcodeadas, formulación de DEC-003 para modelado vial futuro, y captura en navegador real de la secuencia completa de interacción de la capa de barrios.

## Estado de criterios de aceptación

| AC | Descripción | Estado | Método de comprobación |
|---|---|---|---|
| AC-001 | Endpoint `GET /api/v1/barrios/geojson` | Cumplido | Test de integración en `test/barrios-geojson.test.ts`. |
| AC-002 | Capa vectorial de barrios y conmutador HUD en `StreetViewer.tsx` con secuencia interactiva | Cumplido | Secuencia de capturas reales: [01-inicial](artifacts/AC-002-barrios-01-inicial-desactivado.png), [02-activado](artifacts/AC-002-barrios-02-hud-activado.png), [03-hover](artifacts/AC-002-barrios-03-hover-tooltip.png), [04-click](artifacts/AC-002-barrios-04-click-popup.png), [05-contextual](artifacts/AC-002-barrios-05-resaltado-contextual.png), [06-desactivado](artifacts/AC-002-barrios-06-hud-desactivado.png). |
| AC-003 | Enriquecimiento de `sentido_circulacion: 'MANO_UNICA'` y ordenanzas desde IDE | Cumplido | Verificación SQL en `calles` (8 avenidas oficiales vigentes confirmadas, Corrientes y Lavalleja estrictamente en `DOBLE`), suites `test/transform.test.ts` y `test/barrios-geojson.test.ts`. |
| AC-004 | Integridad técnica y suite de pruebas (`npm test`, `npm run build`) | Cumplido | Ejecución local limpia con exit code 0 (56 tests pasados en 29 suites, build exitoso con Turbopack y Webpack). |

## Ejecución y comprobaciones empíricas

### T-001: Enriquecimiento de datos viales y barrios en ETL
- **Archivos modificados:** `scripts/etl/extract.ts`, `scripts/etl/transform.ts`, `scripts/etl/run-etl.ts`, `data/fixtures/manos_unicas.json`, `data/fixtures/barrios_normativa.json`.
- **Comprobación:**
  - Ejecución de `npm run etl -- --offline`:
    - 208 barrios y chacras procesados.
    - 874 calles y avenidas procesadas.
    - 2781 tramos geométricos.
  - 147 barrios enriquecidos con `referencia_ordenanza` oficial (ej. `ORD. XVIII N° 130`).

### T-002: Endpoint GeoJSON de Barrios (`/api/v1/barrios/geojson`)
- **Archivos creados/modificados:** `src/lib/db/streets.ts` (`getBarriosGeoJson`), `src/app/api/v1/barrios/geojson/route.ts`.
- **Comprobación:**
  - Test de integración `test/barrios-geojson.test.ts`:
    - Código 200 y FeatureCollection con 208 features y atributos completos.
    - Filtro por `id` devuelve exactamente la feature requerida.
    - Filtro por texto `q` filtra barrios correctamente.

### T-003 y T-006: Capa vectorial interactiva, HUD y secuencia de capturas
- **Archivos modificados:** `src/components/map/StreetViewer.tsx`, `src/app/page.tsx`, `src/app/calles/[slug]/page.tsx`.
- **Comprobación de secuencia interactiva en navegador real (Chrome headless, 1280x900):**
  1. *Estado inicial (HUD desactivado):* El visor arranca limpio mostrando arterias y ciclovías; la capa de polígonos de barrios permanece oculta. Artefacto: [AC-002-barrios-01-inicial-desactivado.png](artifacts/AC-002-barrios-01-inicial-desactivado.png).
  2. *Activación vía HUD:* Clic en el botón conmutador `🏘️ Barrios` en el HUD superior derecho. Leaflet descarga `/api/v1/barrios/geojson` y renderiza los polígonos con estilo cívico sutil (#64748b, línea punteada). La leyenda dinámica incorpora la referencia "Límites de barrio / chacra". Artefacto: [AC-002-barrios-02-hud-activado.png](artifacts/AC-002-barrios-02-hud-activado.png) (también preservado en [AC-002-capa-barrios.png](artifacts/AC-002-capa-barrios.png)).
  3. *Hover / Tooltip:* Al posar el cursor sobre un polígono de barrio interactivo, se despliega el tooltip flotante con el nombre del barrio. Artefacto: [AC-002-barrios-03-hover-tooltip.png](artifacts/AC-002-barrios-03-hover-tooltip.png).
  4. *Clic / Popup:* Al hacer clic sobre el polígono, se abre el popup con los metadatos completos del barrio (nombre, chacra, tipo y ordenanza municipal asociada). Artefacto: [AC-002-barrios-04-click-popup.png](artifacts/AC-002-barrios-04-click-popup.png).
  5. *Resaltado contextual:* En la vista de detalle de arteria (`/calles/avenida-lucas-braulio-areco-115`), los polígonos de los barrios atravesados o colindantes se resaltan automáticamente en color azul cívico destacado (#0284c7 con opacidad de relleno 0.22). Artefacto: [AC-002-barrios-05-resaltado-contextual.png](artifacts/AC-002-barrios-05-resaltado-contextual.png).
  6. *Desactivación:* Clic nuevamente en el botón `🏘️ Barrios`; la capa vectorial de polígonos y su entrada en la leyenda se remueven limpiamente sin alterar el mapa ni la traza activa. Artefacto: [AC-002-barrios-06-hud-desactivado.png](artifacts/AC-002-barrios-06-hud-desactivado.png).

### T-004 y T-005: Corrección ERR-001 (Sentidos de circulación) y suite técnica
- **Identificador de error:** ERR-001 (FEAT-008).
- **Origen:** Auditoría de precisión en `isManoUnica` (`scripts/etl/transform.ts`).
- **Síntoma / Reproducción:**
  1. Un registro de Rademacher con campo `vigente: "NO"` era evaluado como mano única positiva debido a que la función omitía validar la vigencia del registro oficial.
  2. El registro `AV. LAVALLE` colisionaba con `Avenida Lavalleja` por coincidencia parcial de prefijo/subcadena o iniciales de una sola letra.
  3. En ausencia de registro oficial, el código aplicaba una lista hardcodeada con inferencias no respaldadas (ej. catalogando Avenida Corrientes como mano única).
- **Esperado vs Observado:**
  - *Esperado:* Sólo asignar `MANO_UNICA` si existe registro en `geonode:manos_unicas` con `vigente === 'SI'`; exigir coincidencia exacta de tokens o tabla de abreviaturas conocidas sin colisiones homónimas; preservar `DOBLE` ante falta de respaldo oficial.
  - *Observado:* Rademacher no vigente producía mano única, Lavalleja se alteraba por colisión y Corrientes se infería de lista estática.
- **Cambio aplicado:**
  - Validación estricta de `vigente === 'SI'`.
  - Normalización de prefijos viales con regex `^(avda?|avenida|calle|pasaje|diagonal|bvd?|boulevard)\b\.?\s*`.
  - Tokenización estricta por palabras completas (longitud >= 3) o mapeo explícito de diccionario (`TOPONYM_ABBREVIATIONS`), bloqueando prefijos iniciales de una sola letra.
  - Eliminación absoluta de listas hardcodeadas y de la inferencia de Corrientes (que permanece en `DOBLE`).
  - Documentación de decisión arquitectónica DEC-003 en [docs/decisions.md](../../docs/decisions.md).
- **Comprobación:**
  - Suite dedicada en `test/transform.test.ts`:
    - Registro positivo vigente (`AV. FRANCISCO DE HARO`, vigente SI) -> `MANO_UNICA`.
    - Registro no vigente (`AV. RADEMACHER`, vigente NO) -> `DOBLE`.
    - Prevención de colisión homónima (`AV. LAVALLE` frente a `Avenida Lavalleja`) -> `DOBLE`.
    - Arteria sin registro oficial (`Avenida Corrientes`) -> `DOBLE`.
  - En `calles.db`, exactamente 8 avenidas oficiales vigentes tienen `MANO_UNICA` (Francisco de Haro, Rademacher, Lavalle, Santa Catalina, Centenario, Tambor de Tacuarí, López y Planes, Blas Parera).
  - 56 tests pasados en 29 suites (0 fallos).
- **Estado de ERR-001:** Corregido y verificado con tests automatizados.

## Revisión independiente y dictamen de cierre

- **Fecha y rol:** 2026-10-08, Verifier independiente (`6fd10e05-1cfd-49b1-bd96-ab5d12cc4cff`).
- **Material inspeccionado:**
  - Contrato en [spec.md](spec.md) (AC-001 a AC-004), tareas en [tasks.md](tasks.md), registro en [evidence.md](evidence.md) y [docs/decisions.md](../../docs/decisions.md) (DEC-003).
  - Diff en `scripts/etl/transform.ts`, `test/transform.test.ts`, `test/barrios-geojson.test.ts` y base de datos `calles.db`.
  - Secuencia de artefactos visuales en `specs/feat-008/artifacts/`:
    - [AC-002-barrios-01-inicial-desactivado.png](artifacts/AC-002-barrios-01-inicial-desactivado.png)
    - [AC-002-barrios-02-hud-activado.png](artifacts/AC-002-barrios-02-hud-activado.png)
    - [AC-002-barrios-03-hover-tooltip.png](artifacts/AC-002-barrios-03-hover-tooltip.png)
    - [AC-002-barrios-04-click-popup.png](artifacts/AC-002-barrios-04-click-popup.png)
    - [AC-002-barrios-05-resaltado-contextual.png](artifacts/AC-002-barrios-05-resaltado-contextual.png)
    - [AC-002-barrios-06-hud-desactivado.png](artifacts/AC-002-barrios-06-hud-desactivado.png)
- **Comprobaciones ejecutadas personalmente por el revisor:**
  1. `npm test`: 56 tests aprobados en 29 suites (0 fallos).
  2. `npm run test:data`: SQLite íntegro, FTS5 y R*Tree ejecutando en 0.11 - 0.26 ms (< 10 ms).
  3. `npm run build`: Compilación limpia en Next.js Turbopack (exit code 0).
  4. `npx next build --webpack`: Compilación alternativa limpia (exit code 0).
  5. Inspección visual de la secuencia interactiva completa de la capa de barrios.
- **Hallazgos:** Ninguno.
- **Dictamen:** **FAVORABLE**. Criterios AC-001 a AC-004 y corrección ERR-001 plenamente verificados. Cierre formal como **Verificada**.
