# Tareas — FEAT-008: Capa interactiva de barrios en visor y enriquecimiento vial desde IDE Posadas

| ID | Tarea | AC cubierto | Comprobación para cierre | Estado |
|---|---|---|---|---|
| T-001 | Extender ETL (`extract.ts` y `transform.ts`) para ingerir capa `manos_unicas` y enriquecer `sentido_circulacion` y ordenanzas de barrios. | AC-003 | Re-ejecutar ETL y verificar vía SQL que avenidas clave tengan `MANO_UNICA`. | Completada |
| T-002 | Implementar consulta en `src/lib/db/streets.ts` y endpoint `src/app/api/v1/barrios/geojson/route.ts` que sirva la FeatureCollection de barrios. | AC-001 | Test automatizado en `test/barrios-geojson.test.ts`. | Completada |
| T-003 | Integrar capa vectorial de barrios y botón HUD toggleable en `src/components/map/StreetViewer.tsx` con tooltips y popups. | AC-002 | Inspección visual en navegador y captura en `specs/feat-008/artifacts/AC-002-capa-barrios.png`. | Completada |
| T-004 | Ejecutar suite de pruebas completa (`npm test`), verificación de datos (`npm run test:data`) y build (`npm run build`). | AC-004 | Ejecución limpia con exit code 0 documentada en `evidence.md`. | Completada |
