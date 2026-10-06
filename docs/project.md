# Calles Posadas — contexto del producto

Plataforma cívica e interactiva para catalogar, buscar y consultar la memoria urbana, nomenclatura, trazado y fundamentación legal de las arterias de la ciudad de Posadas, Misiones.

## Antecedentes y problema

- **Documento base:** [PRD Calles de Posadas (MVP)](prd.md) (versión 1.0.0, 2026-09-11).
- **Problema:** En Posadas convive una doble nomenclatura (números vs. nombres de próceres y personalidades), una compleja distribución catastral (chacras históricas vs. barrios consolidados e informales) y una dispersión de datos oficiales entre la [IDE Posadas](https://www.ide.posadas.gob.ar/) y el [Digesto Jurídico Municipal](https://digesto.hcdposadas.gob.ar/).
- **Resultado buscado:** Unificar el nomenclador urbano en una web pública de consulta ágil con mapas interactivos, trazabilidad normativa e información histórica.

## Alcance y exclusiones acordados

### Alcance del MVP (In-Scope)
1. **Catálogo unificado:** Listado de calles, avenidas y pasajes consolidados de Posadas.
2. **Motor de búsqueda multi-alias:** Búsqueda por nombre oficial, número de arteria, barrio y número de chacra (alimentado por FTS5).
3. **Ficha de detalle de calle:**
   - Metadatos viales: longitud, sentido de circulación, tipo de vía, alturas aproximadas.
   - Mapa interactivo: geometría de la traza sobre Leaflet / OpenStreetMap.
   - Superposición de infraestructura ciclista (ciclovías y bicisendas).
   - Trazabilidad legal: número de ordenanza de designación y enlace al Digesto Municipal.
   - Reseña histórica o biográfica de la personalidad o denominación.
4. **Métricas de cobertura:** Pantalla de estadísticas (`/stats`) con porcentajes de completitud de datos y categorización toponímica.

### Exclusiones del MVP (Out-of-Scope)
- Carga comunitaria de contenido o fotografías (UGC).
- Autenticación o cuentas de usuario para ciudadanos (acceso 100% público de solo lectura).
- Navegación asistida por GPS y ruteo punto a punto.
- Integración de archivo fotográfico histórico georreferenciado estilo OldNYC (diferido a Fase 2).

## Arquitectura, datos y restricciones

- **Frontend:** Next.js (App Router, TypeScript), Tailwind CSS, Leaflet (`react-leaflet`).
- **Persistencia y motor de búsqueda:** SQLite embebido con tablas virtuales **FTS5** (búsqueda de texto completo y alias con prefijos/BM25) y **R*Tree** nativo (índice espacial de Bounding Boxes para consultas de proximidad/viewport) (ver [decisions.md](decisions.md#dec-001)).
- **Pipeline de datos (ETL):** Scripts en TypeScript / Node utilizando `@turf/turf` para resolver el cruce espacial de segmentos con barrios/ciclovías durante la ingesta. El inventario de las 138 capas geográficas de la IDE Posadas para futuras fases se documenta en [ide-layers.md](ide-layers.md).
- **Restricciones:** Operación con costo mínimo (\$0/mes), ejecución local sin necesidad de Docker ni servicios en segundo plano, licencias de datos abiertos municipales.

## Iniciar el producto

### Prerrequisitos
- Node.js >= 20.x (detectado localmente: v22.14.0 / npm 10.9.2).
- Conectividad a IDE Posadas (`https://www.ide.posadas.gob.ar/`).

### Comandos de inicio (a configurar en FEAT-001/002)
- Instalación de dependencias: `npm install`
- Ejecución de ingesta: `npm run etl`
- Ejecución en desarrollo: `npm run dev`

## Ejecutar comprobaciones

- Pruebas unitarias y de integración: `npm test`
- Verificación de consistencia de datos: `npm run test:data`
- Evidencia histórica por feature: consultable en `specs/<id>/evidence.md`.

## Operación y límites

El sistema operará como aplicación web de solo lectura, consumiendo datos embebidos en el archivo SQLite local (`calles.db`), garantizando latencia en microsegundos y consumo de memoria inferior a 30 MB.
