# FEAT-009 — Vinculación normativa del Digesto Jurídico Municipal y memoria toponímica de calles

## Origen y necesidad

- **Antecedente:** Requerimiento del [PRD](../../docs/prd.md) (secciones 1.1, 1.3, 4.2 y 6) y solicitud para integrar la fundamentación legal y memoria toponímica de las arterias de Posadas.
- **Problema:** En el catálogo consolidado de `calles.db`, las arterias contaban inicialmente con valores nulos en fundamentación legal (`referencia_ordenanza` y `url_ordenanza` en `null`) y memoria urbana (`explicacion` en `null`, `categoria_toponimica: 'OTRO'`). Una primera versión asoció erróneamente de forma masiva la **Ordenanza XVIII - N° 46** a todo el lote de 55 calles históricas. Sin embargo, en el Digesto Jurídico Municipal de Posadas (`https://digesto.hcdposadas.gob.ar/`):
  1. La **Ordenanza XVIII - N° 4** (ex Decreto-Ordenanza 487/76, texto definitivo en PDF oficial `uploads/textos_definitivos_normas/XVIII%20-%204.pdf`) es la norma que rige las denominaciones de las principales avenidas (ej. Av. Lucas Braulio Areco N° 115 en su Art. 10; Zapiola Art. 9; Vivanco Art. 14; Eva Perón Art. 15; Moriñigo Art. 19; Andresito Art. 20; 17 de Agosto Art. 23; Roque Pérez Art. 33; Uruguay Art. 1).
  2. La **Ordenanza XVIII - N° 46** (ex Ordenanza 192/95) rige exclusivamente un conjunto específico de 76 calles periféricas o barriales (ej. Favaloro Art. 12, Frondizi Art. 3, Grismado Art. 26, Abitbol Art. 45, Illia Art. 65, Forés Art. 66).
  3. Múltiples arterias fundacionales del casco histórico (ej. San Martín, Belgrano, Rivadavia, Corrientes) no poseen norma identificada en estos textos y deben catalogarse como `PENDIENTE` sin atribuirles respaldo normativo falso.
- **Resultado observable:** Pipeline de enriquecimiento legislativo y toponímico en ETL que distingue estrictamente el **respaldo normativo** (ordenanza comprobada, artículo, documento, URL oficial del digesto, fecha de consulta y procedencia) de la **fuente biográfica** y la **síntesis editorial** (`explicacion`, `categoria_toponimica`). Las arterias sin norma comprobada quedan explícitamente en `estado_normativo: "PENDIENTE"` con ordenanza nula. Ambas situaciones son comprobables en la ficha técnica (`StreetDetailCard.tsx`) y en las métricas de `/stats`.

## Alcance y exclusiones

### Alcance
1. **Diccionario normativo y toponímico municipal:**
   - Creación y mantenimiento del dataset reproducible `data/fixtures/digesto_calles.json` y `data/raw/digesto_calles.json`.
   - Incorporación de campos de trazabilidad: `referencia_ordenanza`, `url_ordenanza`, `documento_normativo`, `articulo_normativo`, `fecha_consulta`, `procedencia_normativa`, `estado_normativo` ("CONFIRMADO" | "PENDIENTE") y `fuente_biografica`.
   - Registro de 19 arterias con respaldo normativo comprobado (artículo y norma específica de XVIII-4 y XVIII-46 con enlace oficial verificado).
   - Registro de 48 arterias con memoria toponímica y reseña biográfica pero con `estado_normativo: "PENDIENTE"`, `referencia_ordenanza: null` y `url_ordenanza: null`.
   - Taxonomía toponímica normalizada completa en 7 categorías:
     - `PROCER`: Próceres, próceres misioneros y personalidades históricas.
     - `PUEBLOS_ORIGINARIOS`: Topónimos y personalidades de la cultura guaraní y pueblos originarios.
     - `GEOGRAFIA`: Provincias, ciudades, ríos, accidentes geográficos o regiones.
     - `FECHA_PATRIA`: Fechas patrias, efemérides y batallas históricas.
     - `BOTANICA_FAUNA`: Árboles, flora autóctona, fauna regional.
     - `CIENCIA_CULTURA`: Artistas, escritores, científicos y educadores.
     - `OTRO`: Nombres genéricos o en proceso de catalogación.
2. **Pipeline ETL de enriquecimiento:**
   - Ingesta de `digesto_calles` en `scripts/etl/extract.ts` y cruce en `scripts/etl/transform.ts` preservando los campos normativos y biográficos.
   - Preservación en base de datos SQLite (`calles.db`) a través de `scripts/etl/load.ts`.
3. **Exposición en interfaz de usuario:**
   - Enriquecimiento de `StreetDetailCard.tsx` con badges temáticos para las 7 categorías toponímicas.
   - Ficha con sección de "Trazabilidad Normativa" sólo cuando existe respaldo oficial confirmado; las arterias pendientes no exhiben enlaces ni normas falsas.
   - Métricas de completitud y distribución toponímica en `/stats`.
4. **Verificación y suite técnica:**
   - Tests de no-regresión en `test/digesto-etl.test.ts` con aserciones positivas (Areco en XVIII-4 Art. 10, Favaloro en XVIII-46 Art. 12) y aserciones negativas (Corrientes con `referencia_ordenanza: null`).
   - Compilación con Next.js App Router tipando correctamente `params: Promise<{ slug: string }>` tanto en Turbopack como en Webpack.

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

### AC-001: Trazabilidad normativa, discriminación de fuentes y persistencia
- **Escenario:** Ingesta y persistencia de ordenanzas del Digesto en `calles.db`.
- **Condición inicial:** Fixture `data/fixtures/digesto_calles.json` con 19 arterias con respaldo normativo comprobado (XVIII-4 y XVIII-46 con artículo, norma y URL oficial) y 48 arterias en estado `PENDIENTE` con ordenanza y URL nulas.
- **Acción:** Ejecutar `npm run etl -- --offline`.
- **Resultado esperado:**
  1. *Aserción positiva XVIII-4:* Arterias de la Ordenanza XVIII - N° 4 (ej. Av. Lucas Braulio Areco N° 115) contienen `referencia_ordenanza = 'Ordenanza XVIII - N° 4, Art. 10'` y `url_ordenanza = 'https://digesto.hcdposadas.gob.ar/uploads/textos_definitivos_normas/XVIII%20-%204.pdf'`.
  2. *Aserción positiva XVIII-46:* Arterias de la Ordenanza XVIII - N° 46 (ej. Dr. René Favaloro) contienen `referencia_ordenanza = 'Ordenanza XVIII - N° 46, Art. 12'` y `url_ordenanza = 'https://digesto.hcdposadas.gob.ar/ver_ordenanza/774'`.
  3. *Aserción negativa (sin falsas atribuciones):* Arterias sin ordenanza comprobada en el digesto (ej. Av. Corrientes) preservan estrictamente `referencia_ordenanza: null` y `url_ordenanza: null`.
- **Método de comprobación:** Tests automatizados en `test/digesto-etl.test.ts` y verificación directa en SQLite.
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
  3. Para arterias con respaldo normativo comprobado (ej. Areco N° 115), la sección "Trazabilidad Normativa" muestra la ordenanza correcta (XVIII-4 Art. 10) y el enlace oficial al PDF definitivo. Para arterias pendientes (ej. Corrientes N° 51), la sección de trazabilidad no muestra vínculos falsos.
- **Método de comprobación:** Navegación en entorno real y captura de pantalla.
- **Artefacto:** [AC-003-ficha-normativa-areco.png](artifacts/AC-003-ficha-normativa-areco.png) y [AC-003-ficha-normativa-pendiente.png](artifacts/AC-003-ficha-normativa-pendiente.png).

### AC-004: Métricas de cobertura y completitud en `/stats`
- **Escenario:** Monitoreo cívico de avance en completitud del nomenclador.
- **Condición inicial:** Base de datos con enriquecimiento normativo y toponímico aplicado.
- **Acción:** Navegar a `/stats` y consultar `GET /api/v1/stats`.
- **Resultado esperado:**
  1. Los indicadores de "Trazabilidad Legal (Digesto Municipal)" reflejan el porcentaje real verificado (19 arterias / 2.2%).
  2. La sección de distribución toponímica muestra cantidades, porcentajes y barras para las 7 categorías toponímicas completas visibles al desplegar/scrollear el contenedor.
- **Método de comprobación:** Test de endpoint `/api/v1/stats` e inspección visual en `/stats` con viewport vertical extendido.
- **Artefacto:** [AC-004-stats-completitud-7categorias.png](artifacts/AC-004-stats-completitud-7categorias.png).

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
