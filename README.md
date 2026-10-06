# 🗺️ Calles de Posadas

Plataforma cívica e interactiva para catalogar, buscar y consultar la memoria urbana, nomenclatura, trazado y fundamentación legal de las arterias de la ciudad de Posadas, Misiones.

---

## 🚀 Características del MVP

- **Visor Cartográfico Interactivo:** Visualización vectorial GeoJSON sobre Leaflet y OpenStreetMap con centrado automático (`fitBounds`), diferenciación cromática de infraestructura ciclista (ciclovías/bicisendas) y controles HUD cartográficos minimalistas.
- **Motor de Búsqueda Multi-Alias:** Consultas instantáneas (< 15 ms) alimentadas por SQLite **FTS5** (Full-Text Search con BM25) para buscar por nombre oficial, denominación histórica, número catastral, barrio o número de chacra.
- **Ficha Técnica y Trazabilidad Normativa:** Detalle de sentido de circulación, longitud en metros/kilómetros, alturas por tramo, reseña biográfica/toponímica y enlace directo a la ordenanza municipal en el [Digesto Jurídico Municipal](https://digesto.hcdposadas.gob.ar/).
- **Métricas de Cobertura (`/stats`):** Auditoría cívica con KPIs de madurez de datos abiertos: porcentaje de calles con reseña histórica, respaldo normativo, red ciclable y desglose vial.
- **Diseño Responsivo con Identidad Cívica:** Sistema de diseño generado con Stitch (River Azure `#0284C7`, Guaraní Emerald `#10B981`, Midnight Slate `#0F172A`), panel lateral con retención de contexto en escritorio y bottom sheet táctil de 3 estados en dispositivos móviles.

---

## 🛠️ Stack Tecnológico y Arquitectura

- **Frontend:** Next.js (App Router, TypeScript), React, Tailwind CSS, Leaflet.
- **Persistencia y Búsqueda:** SQLite embebido (`better-sqlite3`) con tablas virtuales **FTS5** (búsqueda de texto) y **R*Tree** nativo (consultas espaciales de Bounding Box en microsegundos sin requerir PostGIS ni Docker).
- **Pipeline ETL Geográfico:** Scripts en TypeScript con `@turf/turf` para normalización toponímica y cruce espacial de capas de la [IDE Posadas](https://www.ide.posadas.gob.ar/).
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

# 3. Ejecutar pipeline ETL (genera la base de datos calles.db desde datos abiertos)
npm run etl

# 4. Iniciar servidor de desarrollo
npm run dev
```
La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

---

## 🐳 Despliegue en VPS (Hostinger con Docker)

El repositorio incluye compilación automatizada y publicación continua en GitHub Container Registry (`ghcr.io`).

Para desplegar en tu VPS con Docker Compose:
```bash
curl -sO https://raw.githubusercontent.com/grupoSIM/calles-posadas/main/docker-compose.yml
docker compose pull
docker compose up -d
```
Consultá la [Guía completa de Despliegue](docs/deployment.md) para configuración con Traefik (`posadas.ferchamorro.cloud`) o Nginx y certificados SSL automáticos.

---

## 🧪 Pruebas y Validación Empírica

```bash
# Ejecutar suite de pruebas unitarias y de integración (33 tests)
npm test

# Verificar integridad física e índices espaciales de la base de datos
npm run test:data

# Compilar para producción
npm run build
```

---

## 📋 Catálogo de Especificaciones y Gobernanza SDD

El desarrollo del MVP se gestionó mediante el arnés SDD liviano, con especificaciones ejecutables, contratos aprobados y evidencia histórica fechada:

| Feature | Descripción | Estado |
|---|---|---|
| [FEAT-001](specs/feat-001/spec.md) | Ingesta, normalización y esquema de datos base (Calles, Barrios, Ciclovías) | Verificada |
| [FEAT-002](specs/feat-002/spec.md) | Motor de búsqueda unificado y endpoints de catálogo (`/api/v1/streets`) | Verificada |
| [FEAT-003](specs/feat-003/spec.md) | Visor cartográfico interactivo y maquetación de fichas en Leaflet | Verificada |
| [FEAT-004](specs/feat-004/spec.md) | Pantalla de métricas de cobertura y completitud del nomenclador (`/stats`) | Verificada |
| [FEAT-005](specs/feat-005/spec.md) | Rediseño visual responsivo del visor y optimización espacial con Stitch | Verificada |

Para más detalles consultar:
- [Catálogo de Specs](specs/index.md)
- [Contexto del Producto](docs/project.md)
- [Decisiones de Arquitectura](docs/decisions.md)
