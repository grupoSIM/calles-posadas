# Tareas — FEAT-009: Vinculación normativa del Digesto Jurídico Municipal y memoria toponímica de calles

| ID | Tarea | AC cubierto | Comprobación para cierre | Estado |
|---|---|---|---|---|
| T-001 | Construir fixture de datos `data/fixtures/digesto_calles.json` con arterias consolidadas de Posadas extraídas de la Ord. XVIII - N° 46 del Digesto Municipal, conteniendo referencia de ordenanza, URL oficial, reseñas biográficas y categorías toponímicas. | AC-001, AC-002 | Validación de estructura JSON y cobertura de al menos 30 arterias troncales representativas (55 integradas). | Completada |
| T-002 | Extender `extract.ts` y `transform.ts` para ingerir `digesto_calles` en el pipeline ETL, poblando `referencia_ordenanza`, `url_ordenanza`, `explicacion` y `categoria_toponimica` en la tabla `calles`. | AC-001, AC-002 | Ejecución de `npm run etl -- --offline` y verificación SQL de campos no nulos en arterias consolidadas. | Completada |
| T-003 | Integrar distintivo visual de categoría toponímica (badge temático) en `src/components/street/StreetDetailCard.tsx` y validar renderizado del botón de acceso externo al Digesto. | AC-003 | Verificación en navegador y captura en `specs/feat-009/artifacts/AC-003-ficha-normativa.png`. | Completada |
| T-004 | Verificar reflejo de métricas de completitud y distribución toponímica en `src/lib/db/stats.ts` y en la vista `/stats`. | AC-004 | Verificación visual y captura en `specs/feat-009/artifacts/AC-004-stats-completitud.png`. | Completada |
| T-005 | Desarrollar suite de tests en `test/digesto-etl.test.ts`, ejecutar `npm test`, `npm run test:data` y `npm run build`. | AC-005 | Salida limpia con exit code 0 (55 tests aprobados, build exitoso). | Completada |
