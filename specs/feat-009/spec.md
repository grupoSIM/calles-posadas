# FEAT-009 — Vinculación normativa del Digesto Jurídico Municipal y memoria toponímica de calles

## Origen y necesidad

- **Antecedente:** Requerimiento del [PRD](../../docs/prd.md) (secciones 1.1, 1.3, 4.2 y 6) y solicitud para integrar la fundamentación legal y memoria toponímica de las arterias de Posadas.
- **Problema:** En el catálogo consolidado de `calles.db`, las arterias cuentan actualmente con valores nulos en fundamentación legal (`referencia_ordenanza` y `url_ordenanza` en `null`) y memoria urbana (`explicacion` en `null`, `categoria_toponimica: 'OTRO'`). En el Digesto Jurídico Municipal de Posadas (`https://digesto.hcdposadas.gob.ar/`), la **Ordenanza XVIII - N° 46** (originaria Ordenanza 192/95 y textos complementarios) fija el nomenclador oficial, los antecedentes históricos de imposición de nombres y la reseña biográfica o etimológica de cada arteria.
- **Resultado observable:** Pipeline de enriquecimiento legislativo y toponímico en ETL que puebla ordenanzas de designación, enlaces directos a la ficha oficial del Digesto, reseñas históricas/biográficas y categorías toponímicas, visualizadas con distintivos temáticos en la ficha técnica de la arteria (`StreetDetailCard.tsx`) y reflejadas en las métricas de completitud (`/stats`).

## Alcance y exclusiones

### Alcance
1. **Diccionario normativo y toponímico municipal:**
   - Creación de dataset reproducible `data/fixtures/digesto_calles.json` y `data/raw/digesto_calles.json` basado en la Ordenanza XVIII - N° 46 del Digesto Jurídico Municipal (`https://digesto.hcdposadas.gob.ar/ver_ordenanza/774`).
   - Mapeo de nombres oficiales y alias a su ordenanza de respaldo (`referencia_ordenanza`, ej. `Ordenanza XVIII - N° 46`), enlace web oficial (`url_ordenanza`), reseña biográfica/etimológica (`explicacion`) y categoría toponímica (`categoria_toponimica`).
   - Taxonomía toponímica normalizada:
     - `PROCER`: Próceres, próceres misioneros y personalidades históricas.
     - `PUEBLOS_ORIGINARIOS`: Topónimos y personalidades de la cultura guaraní y pueblos originarios.
     - `GEOGRAFIA`: Provincias, ciudades, ríos, accidentes geográficos o regiones.
     - `FECHA_PATRIA`: Fechas patrias, efemérides y batallas históricas.
     - `BOTANICA_FAUNA`: Árboles, flora autóctona, fauna regional.
     - `CIENCIA_CULTURA`: Artistas, escritores, científicos y educadores.
     - `OTRO`: Nombres genéricos o en proceso de catalogación.
2. **Pipeline ETL de enriquecimiento:**
   - Incorporación de `digesto_calles` en `scripts/etl/extract.ts` (con soporte offline idéntico a las capas IDE).
   - Cruce e inyección en `scripts/etl/transform.ts` para asignar los metadatos normativos y toponímicos durante la normalización y consolidación de arterias.
   - Preservación en base de datos SQLite (`calles.db`) a través de `scripts/etl/load.ts` (esquema DDL existente sin migraciones destructivas).
3. **Exposición en interfaz de usuario:**
   - Enriquecimiento de `StreetDetailCard.tsx` con badges visuales temáticos de categoría toponímica en el encabezado de la arteria.
   - Visualización de la reseña histórica y el botón de enlace directo externo al Digesto Jurídico Municipal.
   - Reflejo automático en los indicadores de completitud y distribución toponímica de la página `/stats`.
4. **Verificación y suite técnica:**
   - Tests automatizados en `test/digesto-etl.test.ts` y assertions en `test/stats.test.ts`.
   - Capturas visuales reales en `specs/feat-009/artifacts/`.

### Exclusiones
- Carga comunitaria sin respaldo en ordenanzas del Digesto Municipal.
- Rascado web en tiempo real sin caché local reproducible (el pipeline opera de forma desacoplada y determinística).
- Modificaciones al esquema relacional de `schema.sql` (las columnas requeridas ya existen en la tabla `calles`).

## Diseño de interfaz (StreetDetailCard)

```
+------------------------------------------------------------------------+
| [AVENIDA] [Arteria N° 115] [🚲 Ciclovía] [🎨 Ciencia y Cultura]        |
| Avenida Lucas Braulio Areco                                            |
+------------------------------------------------------------------------+
| Longitud total: 4.25 km            | Sentido: Doble sentido            |
+------------------------------------------------------------------------+
| 📜 Reseña Histórica / Toponímica                                       |
| Lucas Braulio Areco (1915-1994) fue un destacado músico, poeta y       |
| pintor misionero, autor de la canción oficial provincial "Misionerita".|
+------------------------------------------------------------------------+
| ⚖️ Trazabilidad Normativa                                               |
| Ordenanza de denominación: Ordenanza XVIII - N° 46                     |
| [ Consultar en Digesto Jurídico Municipal ↗ ]                          |
+------------------------------------------------------------------------+
| 🏘️ Barrios y Chacras (3)                                              |
| [Chacra 148] [Villa Cabello] [Santa Rita]                              |
+------------------------------------------------------------------------+
```

### Estilos de Badges Toponímicos:
- `PROCER`: Fondo ámbar (`bg-amber-100 text-amber-900 border-amber-300`).
- `PUEBLOS_ORIGINARIOS`: Fondo naranja (`bg-orange-100 text-orange-900 border-orange-300`).
- `GEOGRAFIA`: Fondo azul (`bg-blue-100 text-blue-900 border-blue-300`).
- `FECHA_PATRIA`: Fondo celeste patrio (`bg-sky-100 text-sky-900 border-sky-300`).
- `BOTANICA_FAUNA`: Fondo verde esmeralda (`bg-emerald-100 text-emerald-900 border-emerald-300`).
- `CIENCIA_CULTURA`: Fondo violeta (`bg-purple-100 text-purple-900 border-purple-300`).
- `OTRO`: Fondo pizarra neutro (`bg-slate-100 text-slate-700 border-slate-300`).

## Comportamiento y criterios de aceptación

### AC-001: Trazabilidad normativa y persistencia en base de datos
- **Escenario:** Ingesta y persistencia de ordenanzas del Digesto en `calles.db`.
- **Condición inicial:** Fixture `data/fixtures/digesto_calles.json` con arterias consolidadas de Posadas (ej. Av. Lucas Braulio Areco, Av. Corrientes, Av. Bartolomé Mitre, Av. Urquiza, Av. Tambor de Tacuarí, Calle San Lorenzo, Calle Ayacucho, Av. Lavalle, Av. Santa Catalina, etc.).
- **Acción:** Ejecutar `npm run etl -- --offline`.
- **Resultado esperado:** Las arterias asociadas en la tabla `calles` contienen `referencia_ordenanza = 'Ordenanza XVIII - N° 46'` (u ordenanza específica de designación) y `url_ordenanza` con URL válida de consulta en el Digesto Jurídico Municipal (`https://digesto.hcdposadas.gob.ar/...`).
- **Método de comprobación:** Test automatizado en `test/digesto-etl.test.ts` y consulta directa en SQLite.
- **Artefacto:** Salida de tests y conteo de registros en evidencia.

### AC-002: Reseña histórica y taxonomía toponímica
- **Escenario:** Normalización de explicaciones biográficas y clasificación toponímica.
- **Condición inicial:** Arterias consolidadas procesadas durante la transformación de datos.
- **Acción:** `transformCalles` aplica el cruce con el diccionario toponímico.
- **Resultado esperado:** Las arterias enriquecidas tienen `explicacion` de texto legible sobre la personalidad o evento conmemorativo, y `categoria_toponimica` asignada con una de las categorías válidas (`PROCER`, `PUEBLOS_ORIGINARIOS`, `GEOGRAFIA`, `FECHA_PATRIA`, `BOTANICA_FAUNA`, `CIENCIA_CULTURA`).
- **Método de comprobación:** Test unitario en `test/transform.test.ts` validando categorías y textos no vacíos.
- **Artefacto:** Assertions en suite de tests.

### AC-003: Visualización en Ficha Técnica (`StreetDetailCard`) y Badge Toponímico
- **Escenario:** Consulta de ficha técnica en visor o enlace permanente `/calles/[slug]`.
- **Condición inicial:** Arteria enriquecida cargada en la vista de detalle.
- **Acción:** Renderizado de la ficha en el navegador.
- **Resultado esperado:**
  1. Se renderiza el badge de categoría toponímica temático en el encabezado.
  2. La tarjeta "Reseña Histórica / Toponímica" muestra el texto explicativo con estilo destacado.
  3. La sección "Trazabilidad Normativa" muestra la ordenanza y el botón con enlace externo al Digesto.
- **Método de comprobación:** Navegación en entorno real y captura de pantalla.
- **Artefacto:** [AC-003-ficha-normativa.png](artifacts/AC-003-ficha-normativa.png).

### AC-004: Métricas de cobertura y completitud en `/stats`
- **Escenario:** Monitoreo cívico de avance en completitud del nomenclador.
- **Condición inicial:** Base de datos con enriquecimiento normativo y toponímico aplicado.
- **Acción:** Navegar a `/stats` y consultar `GET /api/v1/stats`.
- **Resultado esperado:**
  1. Los indicadores de "Trazabilidad Legal (Digesto Municipal)" y "Fundamentación Histórica y Toponímica" reflejan valores mayores a 0%.
  2. La sección de distribución toponímica muestra cantidades y porcentajes para las distintas categorías cargadas.
- **Método de comprobación:** Test de endpoint `/api/v1/stats` e inspección visual en `/stats`.
- **Artefacto:** [AC-004-stats-completitud.png](artifacts/AC-004-stats-completitud.png).

### AC-005: Integridad técnica, rendimiento y no-regresión
- **Escenario:** Suite completa de pruebas técnicas y build de producción.
- **Condición inicial:** Base de datos y componentes integrados.
- **Acción:** Ejecución de `npm test`, `npm run test:data` y `npm run build`.
- **Resultado esperado:** Todos los tests pasan (código de salida 0), consultas FTS5 y R*Tree se mantienen en < 10 ms, y compilación Next.js exitosa sin advertencias bloqueantes.
- **Método de comprobación:** Ejecución en terminal.
- **Artefacto:** Registro de salida en `evidence.md`.

## Estado de aprobación

- **Estado:** Aprobada (contrato aprobado formalmente por el usuario el 2026-10-07).
- **Quién decide:** Usuario.
