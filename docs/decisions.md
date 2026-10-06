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
