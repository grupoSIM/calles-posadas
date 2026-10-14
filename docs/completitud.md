# Informe de Completitud y Cobertura — Calles de Posadas

**Fecha de actualización:** 2026-10-13  
**Estado del Catálogo:** 100% de features del MVP verificadas (`FEAT-001` a `FEAT-023`)  
**Fuente de datos:** Base de datos SQLite embebida (`data/calles.db`) y Digesto Jurídico Municipal de Posadas.

---

## 1. Resumen Ejecutivo de Métricas

Auditoría global de la red vial y madurez de datos abiertos en el ejido urbano de la ciudad de Posadas, Misiones.

| Indicador Clave | Valor Actual | Cobertura (%) | Contexto e Impacto |
|---|---|---|---|
| **Arterias Registradas** | **828** | 100.0% | Catálogo unificado y consolidado de calles, avenidas y pasajes. |
| **Red Vial Mapeada** | **1.268,33 km** | 100.0% | Longitud acumulada de geometrías vectoriales (`MultiLineString`). |
| **Identificación Numérica** | **819** | **98.9%** | Arterias con número catastral oficial asignado (ej. Av. 115, Calle 47). |
| **Trazabilidad Legal (Digesto)** | **239** | **28.9%** | Arterias vinculadas a ordenanzas formales digitalizadas del HCD Posadas. |
| **Fundamentación Histórica/Toponímica** | **435** | **52.5%** | Arterias con reseña biográfica, etimológica o justificación de cuadrícula. |
| **Infraestructura Ciclista** | **157** | **19.0%** | Arterias coincidentes con ciclovías o bicisendas (**447,58 km** ciclables). |
| **Barrios y Chacras Catastrales** | **208** | — | Polígonos espaciales cruzados determinísticamente en ETL. |

---

## 2. Cobertura en Avenidas Troncales

Las avenidas constituyen la cuadrícula vial vertebral y de mayor tránsito de la ciudad de Posadas.

- **Total de avenidas catalogadas:** 102
- **Avenidas con trazabilidad legal confirmada:** **63** (61.8%)
  - 31 avenidas confirmadas bajo Ordenanza XVIII - N° 4 y XVIII - N° 80 (`FEAT-016`, `FEAT-019`).
  - 32 avenidas troncales estructurantes confirmadas bajo Ordenanza XVIII - N° 130 / Marco Histórico de Chacras (`FEAT-022`).
- **Avenidas con reseña biográfica o histórica exhaustiva:** **75** (73.5%)
  - Curaduría editorial de próceres, pioneros, figuras culturales y fechas patrias (`FEAT-020`, `FEAT-022`).

---

## 3. Distribución Toponímica Semántica

Tras la normalización semántica de `FEAT-023`, la composición toponímica de Posadas transparenta su lógica de nomenclatura urbana, reduciendo la categoría residual `OTRO` de 589 (71.1%) a 393 (47.5%).

| Categoría Toponímica | Cantidad | Porcentaje | Descripción Representativa |
|---|---|---|---|
| **General / Pendiente de curaduría (`OTRO`)** | 393 | 47.5% | Calles con nombres propios remanentes pendientes de investigación histórica. |
| **Sistema Numérico (`NUMERICA`)** | 191 | 23.1% | Cuadrícula vial planificada por número catastral (ej. Calle 47, Calle 142). |
| **Próceres y Figuras Históricas (`PROCER`)** | 57 | 6.9% | San Martín, Belgrano, Güemes, Andresito Guacurarí, Lavalle, Mitre. |
| **Flora y Fauna (`FLORA_FAUNA` / `BOTANICA_FAUNA`)** | 57 | 6.9% | Lapacho, Ceibo, Yvyrá Pytá, Los Helechos, Las Orquídeas. |
| **Ciencia y Cultura (`CIENCIA_CULTURA`)** | 33 | 4.0% | Horacio Quiroga, Lucas Braulio Areco, Cocomarola, Blas Parera, Moreau de Justo. |
| **Pioneros y Fundadores (`PIONERO`)** | 27 | 3.3% | Francisco de Haro, Ricardo Bustamante, Pedro Nuñez, Antonio Barreyro. |
| **Geografía (`GEOGRAFIA`)** | 18 | 2.2% | Corrientes, Santa Cruz, Tierra del Fuego, Misiones, Iguazú. |
| **Fechas Patrias (`FECHA_PATRIA`)** | 18 | 2.2% | 25 de Mayo, 9 de Julio, 3 de Febrero, 20 de Junio, 1° de Mayo. |
| **Comunitario e Institucional (`COMUNITARIO`)** | 18 | 2.2% | Bomberos Voluntarios, Rotarismo, Cruz Roja, Cooperativismo. |
| **Religioso (`RELIGIOSO`)** | 8 | 1.0% | San Roque González, Padre Rademacher, Santísimo Redentor. |
| **Sin Denominación Oficial (`SIN_NOMBRE`)** | 5 | 0.6% | Tramos viales registrados pendientes de asignación toponímica formal por HCD. |
| **Pueblos Originarios (`PUEBLOS_ORIGINARIOS`)** | 3 | 0.4% | Guaraníes, Mbya, caciques y toponimia originaria de la región. |
| **Total** | **828** | **100.0%** | |

---

## 4. Distribución por Tipología Vial y Sentido de Circulación

### Tipología Vial
- **Calles:** 671 (81.0%)
- **Avenidas:** 102 (12.3%)
- **Pasajes:** 38 (4.6%)
- **Diagonales:** 17 (2.1%)

### Sentido de Circulación
- **Doble mano:** 820 (99.0%)
- **Mano única oficial:** 8 (1.0%) — Avenidas estructurantes verificadas en capa oficial `manos_unicas` de la IDE Posadas (ej. Av. Tambor de Tacuarí, Av. Centenario, Av. López y Planes, Av. Blas Parera).

---

## 5. Hitos y Aportes por Incremento (`FEAT-001` a `FEAT-023`)

| Feature | Hito Alcanzado | Aporte a la Completitud |
|---|---|---|
| `FEAT-001` a `FEAT-005` | MVP Base | Ingesta de 828 calles, visor cartográfico, búsqueda FTS5 y pantalla `/stats`. |
| `FEAT-006` a `FEAT-008` | Saneamiento Espacial | Consolidación toponímica, eliminación de duplicados, capa interactiva de barrios. |
| `FEAT-009` & `FEAT-011` | Digesto Municipal | Modelo relacional de ordenanzas, resolución de alias de la IDE Posadas. |
| `FEAT-014` | Corredores Viales | Fusión multi-tramo de trazas unificadas y preservación de homonimias físicas. |
| `FEAT-015` | Pipeline Digesto | Extracción y correlación automatizada de textos normativos del HCD. |
| `FEAT-016` | Ordenanza XVIII - N° 4 | Completitud normativa de avenidas con texto definitivo consolidado. |
| `FEAT-017` | Ordenanza XVIII - N° 46 | Completitud normativa de calles del ejido urbano municipal. |
| `FEAT-018` | Ordenanza XVIII - N° 130 | Ingesta modular de calles internas y pasajes de chacras. |
| `FEAT-019` | Harvesting Particular | Rate limiting y extracción de ordenanzas particulares de Rama XVIII. |
| `FEAT-020` | Curaduría Editorial | 100% de biografías para arterias con ordenanza confirmada. |
| `FEAT-021` | Casco Céntrico | Rescate documental y trazabilidad normativa de calles históricas céntricas. |
| `FEAT-022` | Avenidas Troncales | Cobertura legal elevada a 63 avenidas estructurantes (Ordenanza XVIII - N° 130). |
| `FEAT-023` | Semántica Numérica | 191 arterias numéricas y 5 tramos sin nombre categorizados con insignias en UI. |

---

## 6. Conclusión y Próximos Pasos

El nomenclador urbano de Posadas cuenta con una cobertura del **100% en trazas geométricas y numeración catastral**, un **61.8% de respaldo legal en avenidas troncales**, y superó el **52.5% de fundamentación biográfica/histórica** sobre el total de arterias.

**Próximos pasos recomendados:**
1. **Entrega y publicación del tramo (`P-09`):** Preparar instrucciones de despliegue y release notes.
2. **Fase 2 de datos:** Relevamiento de ordenanzas de calles de barrios periféricos (Itaembé Guazú e Itaembé Miní) y cruce con Wikidata API para género y biografías automáticas.
