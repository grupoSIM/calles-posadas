# Software Design Document (SDD) — Calles de Posadas (MVP)

**Proyecto:** Calles de Posadas — Catálogo e Historial Urbano  
**Tipo:** Especificación de Software / Documento de Diseño (SDD)  
**Versión:** 1.0.0 (MVP)  
**Fecha:** 2026-09-11  
**Estado:** Listo para Desarrollo

---

## 1\. Resumen Ejecutivo y Objetivos

### 1.1. Contexto y Problemática

La ciudad de Posadas cuenta con datos geoespaciales abiertos a través de la [IDE Posadas](https://www.ide.posadas.gob.ar/) y un archivo normativo en el [Digesto Jurídico Municipal de Posadas](https://digesto.hcdposadas.gob.ar/). Sin embargo, esta información se encuentra dispersa, en formatos técnicos o documentos PDF de difícil acceso para el ciudadano. Asimismo, en Posadas conviven particularidades toponímicas complejas:

1. **Doble nomenclatura:** Uso simultáneo de nombres de próceres/personalidades y números de arteria (ej. *Av. 115* vs. *Av. Lucas Braulio Areco*; *Calle 134* vs. *Mahatma Gandhi*).  
2. **Sistema de Chacras y Barrios:** Convivencia de la cuadrícula catastral histórica (Chacras 1 a 200+) con barrios tradicionales e informales (Villa Sarita, Villa Blosset, Itaembé Miní, Itaembé Guazú).  
3. **Pérdida de memoria urbana:** Desconocimiento general del origen histórico o de los fundamentos de las ordenanzas que dieron nombre a las arterias.

### 1.2. Objetivo del MVP

Construir una aplicación web interactiva, responsiva y de acceso público que permita catalogar, buscar, visualizar sobre mapas y consultar la fundamentación histórica y legal de las calles, avenidas, ciclovías, chacras y barrios de Posadas.

### 1.4. Referencias y Casos de Estudio

El diseño de esta plataforma se nutre de las mejores prácticas de proyectos de referencia internacionales:

* **Calles CABA:** Modelo de trazabilidad legislativa y exposición de datos abiertos gubernamentales.  
* **EqualStreetNames:** Estrategia de automatización mediante vinculación con Wikidata y análisis de brecha de género en el nomenclador.  
* **Mapping Diversity:** Taxonomía temática avanzada y clasificación por profesiones u origen de las personalidades.  
* **OldNYC:** Integración de fotografía histórica georreferenciada para visualizar la evolución del paisaje urbano.

### 1.3. Alcance del MVP (Scope)

#### En Alcance (In-Scope):

* Catálogo completo de calles y avenidas consolidadas del ejido urbano.  
* Motor de búsqueda unificado: por nombre formal, por número de arteria, por barrio y por número de chacra.  
* Ficha de detalle de cada calle con:  
  * Metadatos técnicos (longitud, sentido de circulación, tipo de vía, alturas aproximadas).  
  * Geometría renderizada en mapa interactivo (Leaflet / OpenStreetMap).  
  * Trazado de ciclovías o bicisendas superpuestas (si posee).  
  * Historial de denominaciones anteriores y ordenanza de respaldo con enlace al Digesto Municipal.  
  * Resumen biográfico/histórico del nombre.  
* Vista de Cobertura de Datos (`/stats`): métricas de completitud y estado del nomenclador municipal.

#### Fuera de Alcance para el MVP (Fases Posteriores):

* Carga comunitaria de fotos (*UGC*).  
* Sistema de autenticación para usuarios finales (el sitio es 100% público de solo lectura, con administración protegida por variables de entorno o basic auth si aplica).  
* Navegación GPS / Ruteo paso a paso.

---

## 2\. Arquitectura del Sistema

El sistema sigue una arquitectura moderna, desacoplada y orientada a costos mínimos de operación (\$0 a \$5 USD/mes).

![graph TD    subgraph Fuentes \["Fuentes de Datos Abiertas"\]        IDE\[IDE Posadas: calles, barrios, ciclovías\]        Digesto\[Digesto HCD Posadas: ordenanzas y nombres históricos\]        OSM\[OpenStreetMap: sentidos y etimología\]        Wiki\[Wikidata API: biografías, género, fechas\]    end    subgraph Pipeline \["Pipeline de Ingesta y Normalización"\]        ETL\[Script ETL: Python/TypeScript - limpieza, cruce espacial ST\_Intersects y enriquecimiento biográfico\]    end    subgraph Persistencia \["Capa de Persistencia (Base de Datos)"\]        DB\[(PostgreSQL 16 + PostGIS: streets, street\_segments, neighborhoods, street\_name\_history)\]    end    subgraph Servicios \["Capa de Servicios y API"\]        API\[Next.js Route Handlers / REST API: resolución de alias, endpoints GeoJSON y estadísticas\]    end    subgraph Presentacion \["Capa de Presentación (Frontend)"\]        FE\[Next.js + Tailwind CSS y Visor Cartográfico Leaflet / OSM tiles\]    end    subgraph Usuarios \["Usuario"\]        User\[Vecino / Ciudadano: dispositivos móviles y de escritorio\]    end    IDE --\> ETL    Digesto --\> ETL    OSM --\> ETL    Wiki --\> ETL    ETL --\> DB    DB --\> API    API --\> FE    FE --\> User][image1]

```
graph TD
    subgraph Fuentes ["Fuentes de Datos Abiertas"]
        IDE[IDE Posadas: calles, barrios, ciclovías]
        Digesto[Digesto HCD Posadas: ordenanzas y nombres históricos]
        OSM[OpenStreetMap: sentidos y etimología]
        Wiki[Wikidata API: biografías, género, fechas]
    end
    subgraph Pipeline ["Pipeline de Ingesta y Normalización"]
        ETL[Script ETL: Python/TypeScript - limpieza, cruce espacial ST_Intersects y enriquecimiento biográfico]
    end
    subgraph Persistencia ["Capa de Persistencia (Base de Datos)"]
        DB[(PostgreSQL 16 + PostGIS: streets, street_segments, neighborhoods, street_name_history)]
    end
    subgraph Servicios ["Capa de Servicios y API"]
        API[Next.js Route Handlers / REST API: resolución de alias, endpoints GeoJSON y estadísticas]
    end
    subgraph Presentacion ["Capa de Presentación (Frontend)"]
        FE[Next.js + Tailwind CSS y Visor Cartográfico Leaflet / OSM tiles]
    end
    subgraph Usuarios ["Usuario"]
        User[Vecino / Ciudadano: dispositivos móviles y de escritorio]
    end
    IDE --> ETL
    Digesto --> ETL
    OSM --> ETL
    Wiki --> ETL
    ETL --> DB
    DB --> API
    API --> FE
    FE --> User
```

### 2.1. Componentes del Stack

* **Frontend:** Next.js (App Router, TypeScript), Tailwind CSS, Lucide Icons.  
* **Mapeo:** Leaflet (`react-leaflet`) con teselas vectoriales o raster abiertas (OpenStreetMap / CartoDB Positron).  
* **Capa de Datos:** PostgreSQL con extensión PostGIS.  
* **ORM:** Prisma o Drizzle ORM con soporte de tipos espaciales.  
* **Despliegue:** Vercel / Cloudflare Pages para el frontend y Supabase para PostGIS en Free Tier.

---

## 3\. Modelo de Datos (Esquema PostGIS)

\-- Extensión PostGIS habilitada  
CREATE EXTENSION IF NOT EXISTS postgis;

\-- 1\. Tabla de Barrios / Chacras  
CREATE TABLE neighborhoods (  
    id SERIAL PRIMARY KEY,  
    name VARCHAR(150) NOT NULL,  
    type VARCHAR(30) NOT NULL, \-- 'BARRIO\_OFICIAL', 'BARRIO\_SOCIAL', 'CHACRA'  
    chacra\_number INT NULL,  
    ordinance\_reference VARCHAR(100) NULL, \-- Ej: 'Ordenanza XVIII \- N° 130'  
    geom GEOMETRY(MultiPolygon, 4326),  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP  
);

\-- 2\. Tabla Principal de Calles / Avenidas  
CREATE TABLE streets (  
    id SERIAL PRIMARY KEY,  
    slug VARCHAR(200) UNIQUE NOT NULL,  
    official\_name VARCHAR(200) NOT NULL,  
    street\_number INT NULL,              \-- Ej: 115 para Av. 115  
    road\_type VARCHAR(50) NOT NULL,      \-- 'AVENIDA', 'CALLE', 'PASAJE', 'DIAGONAL', 'COSTANERA'  
    traffic\_direction VARCHAR(30) NOT NULL DEFAULT 'DOBLE', \-- 'MANO\_UNICA', 'DOBLE', 'PEATONAL'  
    total\_length\_m NUMERIC(10, 2\) NOT NULL DEFAULT 0,  
    has\_cycleway BOOLEAN DEFAULT FALSE,  
    cycleway\_type VARCHAR(50) NULL,      \-- 'CICLOVIA\_SEGREGADA', 'BICISENDA\_COMPARTIDA', NULL  
    current\_explanation TEXT NULL,       \-- Resumen biográfico/histórico  
    current\_ordinance VARCHAR(100) NULL, \-- Ej: 'Ordenanza XVIII \- N° 46'  
    ordinance\_url VARCHAR(500) NULL,     \-- Enlace al PDF del Digesto Jurídico  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP  
    wikidata\_id VARCHAR(50) NULL,        \-- Identificador para federar con API de Wikidata  
    person\_gender VARCHAR(20) NULL,      \-- 'MASCULINO', 'FEMENINO', 'NO\_APLICA'  
    toponym\_category VARCHAR(50) NOT NULL DEFAULT 'OTRO', \-- 'FIGURA\_MISIONERA\_REGIONAL', 'FIGURA\_NACIONAL', 'MUNDO\_GUARANI', 'FLORA\_FAUNA', 'FECHA\_PATRIA', 'OTRO'  
    created\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP,  
    updated\_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT\_TIMESTAMP  
);

\-- 3\. Segmentos y Trazas Geométricas (Tramos)  
CREATE TABLE street\_segments (  
    id SERIAL PRIMARY KEY,  
    street\_id INT NOT NULL REFERENCES streets(id) ON DELETE CASCADE,  
    segment\_order INT NOT NULL DEFAULT 1,  
    start\_height INT NULL,  
    end\_height INT NULL,  
    neighborhood\_id INT NULL REFERENCES neighborhoods(id),  
    chacra\_number INT NULL,  
    geom GEOMETRY(LineString, 4326\) NOT NULL  
);

\-- 4\. Historial de Denominaciones de Calles  
CREATE TABLE street\_name\_history (  
    id SERIAL PRIMARY KEY,  
    street\_id INT NOT NULL REFERENCES streets(id) ON DELETE CASCADE,  
    former\_name VARCHAR(200) NOT NULL,  
    start\_date DATE NULL,  
    end\_date DATE NULL,  
    legal\_reference VARCHAR(150) NULL, \-- Ej: 'Ordenanza 192/95'  
    document\_url VARCHAR(500) NULL,  
    explanation TEXT NULL  
);

\-- Índices Espaciales y de Búsqueda  
CREATE INDEX idx\_streets\_official\_name ON streets(official\_name);  
CREATE INDEX idx\_streets\_number ON streets(street\_number);  
CREATE INDEX idx\_street\_segments\_geom ON street\_segments USING GIST(geom);  
CREATE INDEX idx\_neighborhoods\_geom ON neighborhoods USING GIST(geom);  
---

## 4\. Contratos de API (REST / JSON)

### 4.1. Búsqueda y Catálogo

`GET /api/v1/streets`

* **Query Params:**  
  * `q`: Búsqueda de texto libre (soporta texto o número: ej. *"Areco"*, *"115"*, *"San Lorenzo"*).  
  * `barrio_id`: Filtrar por ID de barrio.  
  * `chacra`: Filtrar por número de chacra.  
  * `road_type`: `AVENIDA` | `CALLE` | `PASAJE`.  
  * `has_cycleway`: `true` | `false`.  
  * `has_explanation`: `true` | `false`.  
  * `toponym_category`: Filtrar por categoría temática.  
  * `gender`: Filtrar por género de la personalidad.  
  * `page`: Entero (default: 1).  
  * `limit`: Entero (default: 20, max: 100).  
* **Respuesta Exitosa (200 OK):**

{  
  "total": 2480,  
  "page": 1,  
  "limit": 20,  
  "data": \[  
    {  
      "id": 115,  
      "slug": "av-lucas-braulio-areco",  
      "official\_name": "Avenida Lucas Braulio Areco",  
      "street\_number": 115,  
      "road\_type": "AVENIDA",  
      "traffic\_direction": "DOBLE",  
      "total\_length\_m": 4250.80,  
      "has\_cycleway": true,  
      "preview\_explanation": "Músico, poeta y pintor misionero, autor de la canción oficial provincial 'Misionerita'...",  
      "barrios": \["Chacra 148", "Villa Cabello", "Santa Rita"\]  
    }  
  \]  
}

### 4.2. Detalle de Calle

`GET /api/v1/streets/{slug}`

* **Respuesta Exitosa (200 OK):** Retorna metadatos completos, historial normativo y GeoJSON de la traza para renderizar directamente en Leaflet.

{  
  "id": 115,  
  "slug": "av-lucas-braulio-areco",  
  "official\_name": "Avenida Lucas Braulio Areco",  
  "street\_number": 115,  
  "road\_type": "AVENIDA",  
  "traffic\_direction": "DOBLE",  
  "total\_length\_m": 4250.80,  
  "has\_cycleway": true,  
  "cycleway\_type": "CICLOVIA\_SEGREGADA",  
  "explanation": "Lucas Braulio Areco (1915-1994) fue un destacado artista polifacético misionero...",  
  "ordinance": {  
    "reference": "Ordenanza XVIII \- N° 46",  
    "url": "https\://digesto.hcdposadas.gob.ar/texto-sin-consolidar/774"  
  },  
  "history": \[  
    {  
      "former\_name": "Avenida 115",  
      "legal\_reference": "Decreto Territorial 1958",  
      "end\_date": "1995-10-12",  
      "document\_url": null  
    }  
  \],  
  "geojson": {  
    "type": "FeatureCollection",  
    "features": \[  
      {  
        "type": "Feature",  
        "geometry": {  
          "type": "LineString",  
          "coordinates": \[  
            \[-55.9234, \-27.3781\],  
            \[-55.9240, \-27.4120\]  
          \]  
        },  
        "properties": {  
          "tramo\_id": 1,  
          "start\_height": 2000,  
          "end\_height": 3500  
        }  
      }  
    \]  
  }  
}

### 4.3. Estadísticas de Cobertura

`GET /api/v1/stats`

* Retorna porcentajes de cobertura para la pantalla de métricas:  
  * Total de arterias registradas.  
  * Porcentaje con denominación explicada.  
  * Porcentaje con referencia a ordenanza del Digesto.  
  * Calles con infraestructura ciclista.  
  * Métricas de paridad de género.  
  * Distribución por categorías toponímicas.

---

## 5\. Requerimientos Funcionales (User Stories)

* **RF-01 (Búsqueda multi-alias):** Si el usuario busca *"115"*, *"Lucas Braulio Areco"* o *"Areco"*, el sistema debe resolver la misma avenida. Si busca *"Chacra 148"*, debe listar todas las calles perimetrales e internas asociadas.  
* **RF-02 (Filtros en catálogo):** El usuario puede filtrar combinando tipo de vía, presencia de ciclovía y si cuenta con fundamentación histórica.  
* **RF-03 (Visualización cartográfica):** Al entrar a la ficha de una calle, el mapa debe hacer un `fitBounds` automático sobre la geometría de la arteria y destacarla con un estilo vectorial nítido, diferenciando si el tramo cuenta con ciclovía.  
* **RF-04 (Trazabilidad normativa):** La ficha debe incluir el número de ordenanza del Digesto Municipal con enlace directo a la norma digitalizada en PDF para permitir verificación cívica.  
* **RF-05 (Diseño responsivo / Mobile-first):** La interfaz debe adaptarse a dispositivos móviles, permitiendo deslizar la ficha de información sobre el mapa en pantallas pequeñas.

---

## 6\. Pipeline de Datos (ETL para Carga Inicial)

1. **Extracción (Extract):**  
   * Descargar capa vectorial de calles: [CALLES DE POSADAS \- IDE Posadas](https://www.ide.posadas.gob.ar/layers/geonode:calles_Posadas1/metadata_detail) en formato GeoJSON.  
   * Descargar capa de [Barrios de la ciudad de Posadas \- IDE Posadas](https://www.ide.posadas.gob.ar/layers/geonode:barrios_posadas).  
   * Descargar capa de [Bicisendas y Ciclovías \- IDE Posadas](https://www.ide.posadas.gob.ar/layers/geonode:bicisendas_ciclovias0).  
2. **Transformación y Normalización (Transform):**  
   * Limpiar strings: normalizar prefijos (*"Av."*, *"Avenida"*, *"C."*, *"Calle"*, *"Pje."*).  
   * Extraer número de calle cuando exista en el nombre (*"Av. 115"* \-\> `street_number = 115`).  
   * Cruzar espacialmente tramos con polígonos de barrios (`ST_Intersects`).  
   * Correlacionar con los textos de la Ordenanza XVIII \- N° 46 del [Digesto Jurídico Municipal de Posadas](https://digesto.hcdposadas.gob.ar/) para poblar la explicación histórica y los nombres anteriores.  
   * Enriquecimiento automático: Consulta a la API de Wikidata utilizando la etiqueta `name:etymology:wikidata` de OpenStreetMap para obtener biografías, género y categorías automáticamente.  
3. **Carga (Load):**  
   * Script de seed en TypeScript/Python que inserta los registros en PostgreSQL/PostGIS.

---

## 7\. Plan de Trabajo e Hitos (Sprints SDD)

* **Hito 1 — Preparación de Datos y DB (1 semana):**  
  * Descarga y limpieza de capas de la IDE Posadas.  
  * Configuración de PostgreSQL \+ PostGIS.  
  * Ejecución del script de carga inicial (seed) de calles y barrios.  
* **Hito 2 — Desarrollo Backend y Endpoints (1 semana):**  
  * Implementación de endpoints de búsqueda (`/api/v1/streets`).  
  * Consultas espaciales optimizadas con índices GiST.  
  * Pruebas unitarias de resolución de alias (nombre vs. número).  
* **Hito 3 — Frontend y Mapas Interactivos (1.5 semanas):**  
  * Maquetación del catálogo con Tailwind CSS.  
  * Integración de Leaflet con zoom y centrado dinámico.  
  * Vista de detalle de calle con línea de tiempo y ficha técnica.  
* **Hito 4 — Estadísticas, QA y Despliegue (0.5 semanas):**  
  * Pantalla de cobertura de datos (`/stats`).  
  * Auditoría de rendimiento web (Lighthouse) y responsividad móvil.  
  * Despliegue en producción con dominio asignado.

---

## 8\. Roadmap de Fases Posteriores (Memoria Urbana y Fotografía)

Siguiendo el modelo de OldNYC, la Fase 2 integrará el archivo fotográfico de "Posadas del Ayer". Se implementará un sistema de visualización de puntos históricos sobre el mapa que permitirá a los usuarios consultar fotografías antiguas de las calles y edificios emblemáticos, vinculando la traza actual con el registro visual histórico georreferenciado.

[image1]: <data:image/png;base64,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9NQyguQBAADkHiSvdprdi1ekIHkAAAA5p4iS999ftLm9O3a75/+2yz3xwC738C273B9m7HLzL9vp84cZbe5Pc/e45b/b51YuOuj+8ZfD7sUnP3Evr/vM7Xj1v92enf9yHx783h0+7I462o62p+1q+9qP9qf9av9qh9rz77b90F61W+3X+9D7id9j3oPkAQAA5Jy8St57b7e5java3PL5PwjS7ybtdH+963239q8fuV3bv07JVpGj96P3pfen96n3q/et96/PIf5s8hAkDwAAIOd0l+RtXbfL/eX2Nnf3lW3usd9/4N7Y8mVKfkg6+pz0eelz0+enzzH+bJsRJA8AACDnNEvyXly1y917TZtb9cAB9/brX6XkhXQ9+jz1uerz3bi6OdKH5AEAAOScRkjeV1/udn9d0Ob+tvC9lJCQ5uXvf3jP/x2++jL7S75IHgAAQM7JWvL+fk8bPXU5i/4eX3z2bupvdTRB8gAAAHJOVpK3543dKbkg+cue7dn06iF5AAAAOScryXtwzp6UUJD85cHZe1J/u64EyQMAAMg5WUmeHvsRCwXJX/R3iv92XQmSBwAAkHOykrxnHjnsNj39aUoqSH6yee0//d8p/tt1JUgeAABAzslS8kwmFkzZhfDlJPo76O9h80geAABASWiE5Fk0tNef5u71w33Fy0jjos9bn7s+/3gZkgcAAFASGil5YZ5acsgP2SXx4BEr2Uafpz5Xfb76nOPlYZA8AACAktAsyauVLc/+0/393gP+hoAl8/b5y4t7dv0rVa/M0eehz0Wfjz4nfV763OJ69QTJAwAAKAndLXnV8uGB793zKz52y+a/76Xmd5N3uQfn7HVrHj7kZWdv2zepdYocvR+9L70/vU+9X71vvX99Dvo84nW6GiQPAACgJORR8rqa9/d+63Zu/8r3ckmOnlpy2D32+wPuL3fsc4uu3+PuufqHR71YFhyRqbuvbPPl917zjrv/2j3ugdnvusU37XUP3/ae7znTq+ZVruWqp/paT+uH21O59qP9ab/av9qh9qhdal/c5mYHyQMAACgJrSR5pOMgeQAAACUByStXkDwAAICSgOSVK0geAABASUDyyhUkDwAAoCQgeeUKkgcAAFASkLxyBckDAAAoCUheuYLkAQAAlIRmSl7//gPcMccc43PgQPsPNH7vvS/c5MnTUuX1xPahaP7ddz9L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> "mermaid-graph/default"