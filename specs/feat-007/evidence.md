# FEAT-007 — evidencia

Historia de actividades, cambios, errores, ejecuciones y revisiones. Identificar fecha, etapa, rol ejercido, agente responsable y salida real en cada entrada; no inventar intervenciones para completar roles. El estado vigente y la siguiente acción se consultan en el [catálogo](../index.md); el [contrato](spec.md) y las [tareas](tasks.md) explican qué se verifica.

## Discovery: 2026-10-07 — Relevamiento de variantes homónimas vs toponimias independientes

1. **Caso Avenida Vivanco (N° 139):**
   - En `avenidas.json`, la arteria está fragmentada en fid 54 (`AVENIDA ARQ. JORGE EDUARDO VIVANCO(139)`, 4.096 m) y fid 99 (`AVENIDA ARQ.VIVANCO(139)`, 358 m).
   - Ambos tramos comparten el eje longitudinal (`-55.94`), el número catastral (139) y el mismo prócer (Arq. Vivanco), diferenciándose únicamente por la abreviatura del nombre de pila.
2. **Caso Calle N° 98 (Suiza vs Santa Ana):**
   - Conviven `Calle Suiza` (fid 181 y 188, 703 m) y `Calle Santa Ana` (7 tramos, 2.958 m).
   - Corresponden a sectores y ordenanzas diferentes sobre el mismo eje catastral, por lo que deben preservarse estrictamente como entidades independientes.
3. **Casos análogos relevados en el nomenclador:**
   - Gottschalk N° 97: `Calle Emilio Gottschalk` vs `Calle E. Gottschalk`.
   - Semilla N° 101: `Calle Esteban S. Semilla` vs `Calle Semilla` (diferenciada de `Calle Francisco Lesner` en la misma arteria 101).
   - Newbery N° 112: `Calle Jorge Newbery` vs `Calle Newbery`.

## Ejecuciones y comprobaciones

### 2026-10-07 — Implementación y verificación técnica (Developer)

#### T-001: Algoritmo de detección de variantes toponímicas y discriminación
- **Implementación:** `scripts/etl/transform.ts` (`areToponymVariants`, `tokensMatch`, `getToponymTokens`, `getNameScore`).
- **Comprobación:** Pruebas unitarias en `test/transform.test.ts` con casos Vivanco, Gottschalk, Semilla, Newbery, Catalano y verificación estricta de no unificación para Suiza vs Santa Ana, Suecia vs San Javier, Francisco Lesner vs Semilla, General Paz vs Máximo Paz, y Calle 143 vs Maestro Salvador Catalano.
- **Resultado:** 39 tests pasando satisfactoriamente.

#### T-002: Consolidación secundaria de geometrías y tramos en `transformCalles`
- **Implementación:** Agrupación con Disjoint Set Union (DSU) por cluster `(numeroCalle, tipoVia)` que conserva el orden original de inserción. Elección automática del nombre más descriptivo como canonical, fusión de trazas en `MultiLineString` y mantenimiento secuencial de `tramos_calle`.
- **Comprobación:** Caso de prueba en `test/transform.test.ts` para Avenida Vivanco (fid 54 y fid 99). Unificación en 1 única avenida con slug `avenida-arq-jorge-eduardo-vivanco-139` y 2 tramos individuales.

#### T-003: Re-ejecución del ETL y validación en base de datos SQLite
- **Comando:** `npm run etl`
- **Salida:**
  ```text
  === Pipeline ETL finalizado exitosamente ===
  - Barrios y Chacras: 208
  - Calles y Avenidas: 859
  - Tramos geométricos: 2781
  - Tiempo total: 1.69s
  ```
- **Consultas de validación (`data/calles.db`):**
  - **AC-001 (Avenida Vivanco N° 139):**
    ```json
    [
      {
        "id": 8091,
        "slug": "avenida-arq-jorge-eduardo-vivanco-139",
        "nombre_oficial": "Avenida Arq. Jorge Eduardo Vivanco",
        "numero_calle": 139,
        "tipo_via": "AVENIDA",
        "longitud_total_m": 4470.32
      }
    ]
    ```
  - **AC-003 (Tramos de Avenida Vivanco):**
    ```json
    [
      { "id": 13745, "calle_id": 8091, "orden_tramo": 1, "longitud_m": 4110.51, "tiene_ciclovia": 1 },
      { "id": 13746, "calle_id": 8091, "orden_tramo": 2, "longitud_m": 359.81, "tiene_ciclovia": 0 }
    ]
    ```
  - **AC-002 (Preservación N° 98 - Calle Suiza vs Calle Santa Ana):**
    ```json
    [
      { "id": 7398, "slug": "calle-98", "nombre_oficial": "Calle 98", "numero_calle": 98, "longitud_total_m": 1716.37 },
      { "id": 7399, "slug": "pasaje-98", "nombre_oficial": "Pasaje 98", "numero_calle": 98, "longitud_total_m": 346.59 },
      { "id": 7404, "slug": "calle-suiza-98", "nombre_oficial": "Calle Suiza", "numero_calle": 98, "longitud_total_m": 703.12 },
      { "id": 7576, "slug": "calle-santa-ana-98", "nombre_oficial": "Calle Santa Ana", "numero_calle": 98, "longitud_total_m": 2957.58 }
    ]
    ```
  - **Validación adicional de casos relevados:**
    - N° 97: `Calle Emilio Gottschalk` consolidada (2682.59 m), `Calle 97` y `Pasaje 97` preservados.
    - N° 101: `Calle Esteban Servando Semilla` consolidada (2407.26 m), `Calle Francisco Lesner` preservada (835.08 m).
    - N° 112: `Calle Jorge Newbery` consolidada (3945.22 m), `Calle 112` y `Avenida Los Tilos` preservados.

#### T-004: Suite de pruebas técnicas y compilación de producción
- **`npm test`:** 39 tests pasando, 19 suites, 0 fallos.
- **`npm run build`:** Compilación exitosa de Next.js (Turbopack) sin errores de tipado ni advertencias. Exit code 0.

## Revisión independiente

### 2026-10-07 — Auditoría formal por Verifier independiente (`12e43dd7-0c7c-42a2-b358-faa41c449b7e`)

1. **Ronda inicial de auditoría:**
   - **Observación crítica en AC-002:** Detección de colisiones espurias en datos reales donde iniciales intermedias en nombres largos absorbieron arterias completas no relacionadas que compartían número (ej. `Campanillas` en `Marchesini` en N° 164; `Guatambú` en `Acosta` en N° 178; `Moconá` en `Aráos` en N° 53; `Pasillo` en `Morcillo` en N° 55; y `S/N` en `Neuquén` en N° 82).
   - **Dictamen inicial:** Observado / No favorable.
2. **Subsanación por Developer:**
   - En `scripts/etl/transform.ts`: restricción estricta en `isTokenAbbreviation` y exigencia de coincidencia sustantiva idéntica (`s === l` con longitud >= 3) en `isNameVariantOf`. Normalización de `s/n` en `isNumericOrUnnamed`.
   - En `test/transform.test.ts`: agregado de suite de aserciones de protección negativa contra colisiones por iniciales.
   - Re-ejecución del pipeline ETL (`npm run etl`): recuperación y separación plena de todas las arterias observadas en `data/calles.db` (total 865 calles y avenidas, 2781 tramos).
3. **Dictamen final definitivo (cierre inicial):**
   - **Estado:** APROBADO / FAVORABLE.
   - **Conformidad:** AC-001, AC-002, AC-003 y AC-004 plenamente satisfechos de forma empírica. Apto para cierre y marcado de Verificada en el catálogo.

## Errores y correcciones: reporte de producto (2026-10-07)

### ERR-001: Fusión indebida por una variante ambigua ("Calle Perez")
- **Origen y fecha:** Reporte de usuario (2026-10-07).
- **AC afectado:** AC-002 (Preservación de entidades toponímicas independientes).
- **Síntoma y reproducción:** Con igual número y tipo de vía, "Calle Juan Perez", "Calle Perez" y "Calle Pedro Perez" terminaban fusionadas en una sola entidad por una cadena de coincidencias transitiva en el algoritmo DSU (`union(i, j)`), a pesar de que "Juan Perez" y "Pedro Perez" no son variantes entre sí.
- **Esperado:**
  1. Juan Perez y Pedro Perez permanecen separados como entidades independientes.
  2. La variante ambigua "Perez" no fuerza su unión ni se asigna arbitrariamente a ninguna de ellas.
  3. Se conservan las consolidaciones legítimas (Vivanco N° 139, Gottschalk N° 97, Semilla N° 101, Newbery N° 112) y las separaciones comprobadas (Suiza vs Santa Ana N° 98).
  4. No se pierden geometrías, longitudes ni atributos de los tramos.
- **Observado:** Las 3 arterias se unificaban en un único registro con el nombre más largo debido al cierre transitivo ciego del grafo de variantes.
- **Cambio correctivo:** En `scripts/etl/transform.ts`, se incorporó análisis de grafos y detección estricta de nodos ambiguos. Un nodo $i$ es marcado como ambiguo si posee dos o más vecinos $j, k$ que no son variantes mutuas entre sí (`!isVariant[j][k]`). Los nodos ambiguos quedan excluidos de fusiones automáticas para evitar uniones indebidas o asignaciones arbitrarias. Únicamente se unifican clusters de variantes mutuas libres de ambigüedad.
- **Comprobación posterior:** Test de regresión con los tres nombres añadido en `test/transform.test.ts` y re-ejecución del pipeline ETL (`npm run etl`) con 874 arterias consolidadas en `data/calles.db` sin regresiones. Resuelto.

### <a id="t-006"></a>T-006: Corrección algorítmica y comprobación de no regresión (Developer)
- **Fecha y rol:** 2026-10-07, Developer (Autocontrol).
- **Archivos modificados:** `scripts/etl/transform.ts`, `test/transform.test.ts`, `data/calles.db`.
- **Comando:** `node --test --import tsx test/transform.test.ts`
- **Exit code:** 0 (11 tests pasados en 2 suites, 0 fallos).
- **Verificación en base de datos:** `npm run etl` ejecutado en 2.78s; consultas de validación confirman que Avenida Vivanco (N° 139) permanece consolidada con 4470.32 m, Calle Suiza (N° 98) y Calle Santa Ana (N° 98) permanecen separadas, y no hay fusiones transitivas espurias.
- **Estado AC-002:** Cumplido.

### <a id="revisión-independiente-err-001"></a>Revisión independiente de ERR-001
- **Fecha y rol:** 2026-10-07, Verifier independiente (`42e38864-ff41-4539-b74a-00783a5a3cc6`).
- **Material inspeccionado:**
  - Contrato en `specs/feat-007/spec.md` (AC-001 y AC-002).
  - Diff en `scripts/etl/transform.ts` (detección de nodos ambiguos en el grafo de variantes toponímicas).
  - Prueba de regresión en `test/transform.test.ts` (caso Juan Perez vs Perez vs Pedro Perez N° 50).
  - Base de datos de producción `data/calles.db`.
- **Comprobaciones ejecutadas personalmente y resultados:**
  1. `npm test`: 41 tests pasados en 19 suites, 0 fallos (incluye la prueba de regresión ERR-001).
  2. `npm run test:data`: Integridad total de 874 calles, 208 barrios, 2781 tramos geométricos y consultas FTS5/R*Tree en < 1 ms.
  3. Verificación SQL en `data/calles.db`:
     - Avenida Vivanco N° 139: exactamente 1 registro (`avenida-arq-jorge-eduardo-vivanco-139`), longitud 4470.32 m, con 2 tramos vectoriales.
     - Calle Suiza N° 98 y Calle Santa Ana N° 98: permanecen estrictamente separadas (`calle-suiza-98` con 703.12 m y `calle-santa-ana-98` con 2957.58 m).
     - Calles homónimas con número compartido en el nomenclador (ej. Calle Lucho Perez N° 121 y Calle Roque Jose Perez N° 121): preservadas de forma independiente sin fusiones transitivas espurias.
- **Hallazgos:** Ninguno.
- **Dictamen:** FAVORABLE. AC-001 a AC-004 plenamente verificados. Conforme para cierre definitivo.

