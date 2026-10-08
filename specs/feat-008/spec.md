# FEAT-008 — Capa interactiva de barrios en visor y enriquecimiento vial desde IDE Posadas

## Origen y necesidad

- **Antecedente:** Requerimiento del usuario para incorporar la capa de barrios en el visor cartográfico y revisar las capas/aplicaciones de la IDE Posadas para enriquecer los datos de las arterias (sentidos de circulación oficiales y datos normativos de barrios).
- **Problema:** 
  1. En el visor actual (`StreetViewer.tsx`), solo se renderiza la línea de la arteria activa y la red de ciclovías; los polígonos de los barrios y chacras almacenados en la base de datos no se pueden visualizar ni alternar cartográficamente.
  2. La API carece de un endpoint para servir las geometrías GeoJSON de los barrios para renderizado vectorial en Leaflet.
  3. En el ETL actual (`transform.ts`), todas las arterias tienen `sentidoCirculacion: 'DOBLE'` por defecto, a pesar de que la IDE Posadas provee capas oficiales de sentido único (`geonode:manos_unicas` y `geonode:Jerarquia_Red_Vial_00`) y ordenanzas de barrios (`geonode:Barrios_Posadas1`).
- **Resultado observable:** 
  1. Endpoint `/api/v1/barrios/geojson` que sirve la `FeatureCollection` de barrios y chacras.
  2. Capa interactiva vectorial de barrios en `StreetViewer.tsx` con control HUD toggleable ("🏘️ Barrios"), tooltip/popup con nombre de barrio y chacra, y resaltado contextual.
  3. Pipeline ETL actualizado para ingerir sentidos únicos oficiales desde la IDE Posadas (`manos_unicas`) y asignar sentidos correctos (`MANO_UNICA` con su orientación o `DOBLE`) a las avenidas y calles clave, junto con el enriquecimiento de ordenanzas de creación de barrios (`ORDENANZA` de `Barrios_Posadas1`).

## Alcance y exclusiones

### Alcance
1. **Endpoint GeoJSON de barrios (`src/app/api/v1/barrios/geojson/route.ts`):**
   - Retorna un `FeatureCollection` estándar con geometrías poligonales de barrios, propiedades `id`, `nombre`, `tipo`, `numero_chacra` y `referencia_ordenanza`.
   - Soporta filtrado opcional por `id` o búsqueda por `q`.
2. **Capa interactiva de barrios en el mapa (`src/components/map/StreetViewer.tsx`):**
   - Nueva capa vectorial Leaflet para polígonos de barrios con estilo sutil cívico (River Azure / Slate).
   - Control HUD conmutador en la esquina superior derecha (`🏘️ Barrios`) para encender/apagar la capa.
   - Interacción con tooltip/hover que indica el nombre del barrio y popup al hacer clic con información del barrio.
   - Resaltado automático de los polígonos de los barrios asociados a la calle seleccionada.
3. **Enriquecimiento de datos viales y barrios en ETL (`scripts/etl/`):**
   - Ingesta de `geonode:manos_unicas` y `geonode:Barrios_Posadas1` en `extract.ts`.
   - Cruce toponímico estricto y espacial para asignar `sentidoCirculacion: 'MANO_UNICA'` exclusivamente a arterias con registros oficiales vigentes (`vigente === 'SI'`) en la IDE Posadas (ej. Av. Francisco de Haro, Av. Lavalle, Av. Santa Catalina, Av. Rademacher, Av. Tambor de Tacuarí, Av. Centenario, Av. López y Planes, Av. Blas Parera).
   - Rechazo de registros no vigentes (`vigente: 'NO'`), prevención de falsas colisiones toponímicas (ej. `AV. LAVALLE` no colisiona con `Avenida Lavalleja`) y eliminación de listas hardcodeadas no respaldadas (Avenida Corrientes se preserva como `DOBLE` al carecer de registro en `manos_unicas`).
   - Incorporación de ordenanzas de barrios oficiales en la tabla `barrios`.
   - Alternativas de modelado de sentido desconocido, cardinalidad por tramo y orientación documentadas en DEC-003 ([docs/decisions.md](../../docs/decisions.md)).
4. **Pruebas y validación:**
   - Tests de endpoint `/api/v1/barrios/geojson`.
   - Tests de sentidos de circulación y persistencia en ETL con casos de vigencia, colisión negativa y ausencia de registro oficial.
   - Verificación de compilación (`npm run build`) y tests (`npm test`).

### Exclusiones
- Edición comunitaria o carga manual de polígonos de barrios (solo fuentes oficiales IDE Posadas).
- Enriquecimiento masivo de reseñas históricas y biografías del Digesto (objeto de `FEAT-009`).
- Modelado de tramos bidireccionales mixtos por segmentos o azimut cardinal (documentado como decisión arquitectónica DEC-003 para evaluación posterior).

## Comportamiento y aceptación

- **AC-001 (Endpoint GeoJSON de Barrios):** La llamada a `GET /api/v1/barrios/geojson` devuelve código 200 y un GeoJSON válido `FeatureCollection` con las geometrías poligonales de los barrios de Posadas y sus propiedades.
  - *Comprobación:* Petición HTTP / test de integración en `test/barrios-geojson.test.ts`. Validar tipo `FeatureCollection`, `features.length > 0` y estructura de propiedades.
- **AC-002 (Capa vectorial y conmutador HUD de Barrios en el mapa):** El componente `StreetViewer` incluye un control HUD para alternar la visibilidad de los polígonos de barrios, mostrando tooltip con el nombre del barrio al posar el cursor y popup al hacer clic.
  - *Comprobación:* Inspección visual de la UI en navegador real. Secuencia de capturas de interacción en `specs/feat-008/artifacts/` (activación, hover, clic, resaltado contextual y desactivación).
- **AC-003 (Enriquecimiento de sentidos de circulación desde IDE):** Las avenidas con mano única oficial vigente según la IDE Posadas (Francisco de Haro, Rademacher, Lavalle, Santa Catalina, Centenario, Tambor de Tacuarí, López y Planes, Blas Parera) quedan registradas con `sentido_circulacion = 'MANO_UNICA'`. Registros con `vigente: NO` son descartados, arterias no registradas (ej. Corrientes) preservan `DOBLE`, y no se producen colisiones homónimas parciales (ej. Lavalleja preserva `DOBLE`).
  - *Comprobación:* Test unitario en `test/transform.test.ts` (suite ERR-001) y verificación de `calles.db` en `test/barrios-geojson.test.ts`.
- **AC-004 (Integridad técnica y suite de pruebas):** Ejecución limpia de `npm test`, `npm run test:data` y `npm run build` sin errores.
  - *Comprobación:* Ejecución en entorno local con exit code 0.

## Diseño y dependencias

- **Archivos afectados:**
  - `scripts/etl/extract.ts`: agregar descarga de `manos_unicas` y actualización de `barrios`.
  - `scripts/etl/transform.ts`: cruce de manos únicas y metadatos de barrios.
  - `src/app/api/v1/barrios/geojson/route.ts`: nuevo endpoint GeoJSON.
  - `src/lib/db/streets.ts`: método para consultar FeatureCollection de barrios.
  - `src/components/map/StreetViewer.tsx`: capa GeoJSON de barrios y botón HUD.
  - `test/`: nuevos tests unitarios y de integración.

## Aprobación del contrato

- **Estado:** Aprobada.
- **Quién decide:** Usuario.
- **Fecha:** 2026-10-07.
- **Alcance a aprobar:** Visualización de capa de barrios en mapa con toggle HUD y enriquecimiento de sentidos de circulación desde IDE Posadas.
