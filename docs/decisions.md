# Decisiones del producto

## DEC-001: Persistencia y arquitectura de datos para el catálogo (SQLite + FTS5 + R*Tree)

- **Fecha:** 2026-10-06
- **Contexto:** El PRD proponía PostgreSQL 16 + PostGIS. Sin embargo, para un catálogo cívico municipal de solo lectura como el de Posadas (5.000–15.000 tramos de calles, ~200–400 chacras/barrios, dataset total < 20 MB), PostGIS introduce sobrecarga operativa innecesaria (Docker de 1-2 GB de RAM, hosting de base de datos dedicada) sin aprovechar su fuerte (escritura y topología concurrente en tiempo real).
- **Alternativas consideradas:**
  1. *PostgreSQL 16 + PostGIS (Propuesta PRD):* Ideal para SIG municipal con edición concurrente de analistas en QGIS; sobredimensionado para una API web ciudadana de consulta.
  2. *SQLite + SpatiaLite:* Dependencias nativas C complejas y frágiles en entornos Windows y CI.
  3. *DuckDB con extensión spatial:* Excelente para procesamiento analítico de archivos, pero con bindings menos estándar para apps web transaccionales ligeras.
  4. *SQLite embebido + FTS5 + R*Tree nativo + GeoJSON (Opción elegida):*
     - FTS5 nativo para búsqueda unificada de nombres, alias y números con ranking BM25 y prefijos.
     - Módulo R*Tree nativo (compilado por defecto en SQLite) para indexación de Bounding Boxes (minX, maxX, minY, maxY) para consultas espaciales por viewport o proximidad en microsegundos sin librerías C externas.
     - Cruce espacial determinístico (`ST_Intersects` / point-in-polygon) resuelto una sola vez en el pipeline ETL con `@turf/turf`.
     - Persistencia en un archivo único (`calles.db`), compatible con `better-sqlite3`, tests instantáneos en memoria (`:memory:`) y despliegue a costo \$0.
- **Compatibilidad Post-MVP (Fotografía Histórica / OldNYC):** Totalmente compatible. Los puntos de fotos georreferenciadas (`lat, lon`, `calle_id`) se indexan directamente con el módulo R*Tree (consultas de puntos en viewport del mapa) y FTS5 (búsqueda por texto/año), mientras que los archivos de imagen se sirven desde almacenamiento estático/CDN sin exigir PostGIS.
- **Resolución:** Adoptada la alternativa de SQLite con FTS5, R*Tree nativo y ETL con Turf.js.
- **Autoridad:** Acuerdo con el usuario basado en análisis de arquitectura cívica (referencias Datasette y Pelias/Carmen).

## DEC-002: Delimitación de alcance y exclusiones del MVP

- **Fecha:** 2026-10-06
- **Contexto:** Definir con precisión las fronteras del MVP según el PRD para garantizar entregas incrementales sin sobreingeniería.
- **Alternativas consideradas:**
  1. *MVP Ampliado:* Incluir carga de fotos por vecinos (UGC), sistema de usuarios y ruteo GPS. (Descartado: aumenta complejidad, costos y mantenimiento).
  2. *MVP Enfocado:* Exclusivo en consulta, búsqueda unificada, visor cartográfico con ciclovías, trazabilidad de ordenanzas del Digesto y métricas de completitud.
- **Resolución:** Se adopta el MVP Enfocado. Todas las funcionalidades de UGC, autenticación y archivo fotográfico georreferenciado ("Posadas del Ayer") quedan formalmente diferidas a fases posteriores.
- **Autoridad:** Propuesta Leader derivada del PRD, ratificada por el usuario.

## DEC-003: Representación de sentido de circulación, orientación y cobertura por tramos

- **Fecha:** 2026-10-07
- **Contexto:** En el esquema actual (DEC-001), el sentido de circulación de cada arteria se modela a nivel agregado (`calles.sentido_circulacion`) con valores `'MANO_UNICA' | 'DOBLE' | 'PEATONAL'`. La capa oficial `geonode:manos_unicas` de la IDE Posadas provee orientación cardinal (`SENTIDO: "Norte - Sur"`, `"Oeste - Este"`, etc.) y estado de vigencia (`vigente: "SI"`), pero sólo cubre avenidas troncales específicas. Para arterias sin respaldo oficial confirmado en la capa de la IDE, arterias con sentidos mixtos según el tramo o sentidos no relevados, se requiere evaluar cómo extender el modelo de datos.
- **Alternativas consideradas:**
  1. *Conservar modelo actual con asignación estricta por fuente oficial (Opción adoptada en este tramo):*
     - Mantener el enum `'MANO_UNICA' | 'DOBLE' | 'PEATONAL'`.
     - Únicamente asignar `'MANO_UNICA'` cuando exista registro oficial vigente (`vigente: 'SI'`) en `manos_unicas` con correspondencia toponímica estricta de identidad.
     - No inferir mano única mediante heurísticas hardcodeadas ni listas estáticas sin respaldo en el dataset.
     - Las arterias sin confirmación oficial de mano única se mantienen como `'DOBLE'`.
     - No altera el esquema relacional ni introduce migraciones de base de datos.
  2. *Incorporar estado DESCONOCIDO y orientación a nivel arteria:*
     - Extender `sentido_circulacion` para incluir `'DESCONOCIDO'`.
     - Añadir columna `orientacion_circulacion TEXT NULL` (ej. `'NORTE_SUR'`, `'SUR_NORTE'`, etc.).
     - Ventaja: Mayor fidelidad cívica al distinguir arterias relevadas como doble mano de aquellas sin relevar.
     - Impacto: Requiere migración de esquema DDL, actualización de contratos de API, TypeScript y filtros de frontend.
  3. *Modelar sentido y orientación granular a nivel tramo (`tramos_calle`):*
     - Mover `sentido_circulacion` y `orientacion` a la tabla `tramos_calle` para reflejar arterias que cambian de sentido por tramos.
     - Ventaja: Máxima precisión cartográfica y catastral.
     - Impacto: Requiere rediseño del pipeline ETL con cruce espacial geométrico tramo a tramo y ajuste de endpoints.
- **Resolución:** Se adopta la Alternativa 1 para las correcciones operativas vigentes sin alterar el esquema relacional aprobado. Las alternativas 2 y 3 quedan formalmente documentadas para acuerdo previo con el usuario antes de cualquier modificación estructural del modelo.
- **Autoridad:** Propuesta técnica Leader / Architect.
