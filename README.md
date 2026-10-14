# 🗺️ Calles de Posadas

Plataforma cívica e interactiva para catalogar, buscar y consultar la memoria urbana, nomenclatura, trazado y fundamentación legal de las arterias de la ciudad de Posadas, Misiones.

---

## 🚀 Características de la Plataforma

- **Visor Cartográfico Interactivo:** Visualización vectorial GeoJSON sobre Leaflet y OpenStreetMap con centrado automático (`fitBounds`), capa interactiva de polígonos de barrios, capa de infraestructura ciclista (ciclovías/bicisendas) activable bajo demanda y controles HUD cartográficos minimalistas.
- **Ficha Integral de Arterias y Trazas Unificadas:** Detalle de sentido de circulación, longitud métrica, alturas por tramo, trazas multi-toponímicas continuas (ejes viales compartidos), reseña histórica curada y enlace directo a la ordenanza de designación en el Digesto Jurídico Municipal.
- **Capa y Ficha Territorial de Barrios:** Polígonos de barrios oficiales enriquecidos con respaldo normativo (ordenanza de creación del Digesto), superficie territorial en hectáreas, chacras comprendidas y listado de arterias asociadas.
- **Motor de Búsqueda Multi-Alias:** Consultas instantáneas (< 15 ms) alimentadas por SQLite **FTS5** (Full-Text Search con BM25) para buscar por nombre canónico, denominación histórica, número catastral/vial, barrio o número de chacra.
- **Pipeline ETL y Harvesting Normativo:** Extracción, normalización y correlación automatizada de ordenanzas de la Rama XVIII del Digesto Municipal (Ordenanzas XVIII - N° 4, N° 46, N° 130 y ordenanzas particulares) con autoridad toponímica canónica y cruce espacial con capas de la IDE Posadas.
- **Métricas de Cobertura (`/stats`):** Auditoría cívica con KPIs de madurez de datos abiertos: porcentaje de calles con reseña histórica, respaldo normativo verificado, red ciclable y desglose vial.
- **Diseño Responsivo con Identidad Cívica:** Sistema de diseño generado con Stitch (River Azure `#0284C7`, Guaraní Emerald `#10B981`, Midnight Slate `#0F172A`), panel lateral colapsable con retención de contexto en escritorio y bottom sheet táctil de 3 estados en dispositivos móviles.

---

## 🏛️ Créditos y Reconocimiento de Datos Abiertos

Este proyecto es una iniciativa de código abierto y acceso cívico que se nutre y fundamenta en los datos públicos provistos por las instituciones de la ciudad de Posadas:

- **[IDE Posadas](https://www.ide.posadas.gob.ar/) (Infraestructura de Datos Espaciales — Municipalidad de Posadas):** Proveedora de la información geográfica de base, geometrías vectoriales de ejes de calles, polígonos de barrios oficiales, delimitaciones de chacras y trazas de la red de ciclovías y bicisendas.
- **[Digesto Jurídico Municipal](https://digesto.hcdposadas.gob.ar/) (Honorable Concejo Deliberante de la Ciudad de Posadas):** Fuente canónica del marco normativo y de la memoria toponímica de la ciudad (Rama XVIII — Obras y Servicios Públicos, Nomenclatura de Calles y Espacios Públicos). Provee las ordenanzas de designación e imposición de nombres (como las Ordenanzas XVIII - N° 4, N° 46 y N° 130, junto a ordenanzas particulares) y la fundamentación histórica de próceres, personalidades y hechos que nombran a nuestras arterias y barrios.

---

## 🛠️ Stack Tecnológico y Arquitectura

- **Frontend:** Next.js (App Router, TypeScript), React, Tailwind CSS, Leaflet (`react-leaflet`).
- **Persistencia y Búsqueda:** SQLite embebido (`better-sqlite3`) con tablas virtuales **FTS5** (búsqueda de texto) y **R*Tree** nativo (consultas espaciales de Bounding Box en microsegundos sin requerir PostGIS ni Docker).
- **Pipeline ETL Geográfico y Normativo:** Scripts en TypeScript con `@turf/turf` para cruce espacial de capas de la [IDE Posadas](https://www.ide.posadas.gob.ar/) y harvester/extractor automatizado de ordenanzas del [Digesto Jurídico Municipal](https://digesto.hcdposadas.gob.ar/).
- **Diseño:** Prototipado y tokens visuales con Stitch.

---

## 📦 Iniciar el Producto Localmente

### Prerrequisitos
- Node.js >= 20.x
- npm >= 10.x

### Instalación y ejecución
```bash
# 1. Clonar el repositorio
git clone https://github.com/grupoSIM/calles-posadas.git
cd calles-posadas

# 2. Instalar dependencias
npm install

# 3. Sincronizar ordenanzas y ejecutar pipeline ETL (genera la base de datos calles.db desde datos de la IDE y el Digesto)
npm run digesto:sync   # Sincroniza ordenanzas normativas del Digesto Municipal
npm run etl            # Procesa, correlaciona y genera la base de datos espacial SQLite

# 4. Iniciar servidor de desarrollo
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🐳 Ejecución con Docker

Podés compilar y ejecutar el contenedor localmente:

```bash
# 1. Compilar imagen Docker
docker build -t calles-posadas .

# 2. Ejecutar contenedor en el puerto 3000
docker run -d -p 3000:3000 --name calles-posadas calles-posadas
```

O utilizando Docker Compose con el archivo genérico incluido en el repositorio:
```bash
docker compose up -d
```

---

## 🧪 Pruebas y Validación Empírica

```bash
# Ejecutar suite de pruebas unitarias y de integración
npm test

# Verificar integridad física e índices espaciales de la base de datos
npm run test:data

# Compilar para producción
npm run build
```

---

## 📋 Documentación del Proyecto

- [Contexto del Producto](docs/project.md)
- [Decisiones de Arquitectura](docs/decisions.md)
- [Auditoría de Métricas de Completitud](docs/completitud.md)
- [Catálogo de Capas de la IDE Posadas](docs/ide-layers.md)

El diseño y construcción del producto se desarrolló bajo la metodología Spec-Driven Development (SDD), con especificaciones de producto, pruebas empíricas automatizadas y trazabilidad documental.

---

## 📄 Licencia

Iniciativa de código abierto para la comunidad de la Ciudad de Posadas, Misiones.
