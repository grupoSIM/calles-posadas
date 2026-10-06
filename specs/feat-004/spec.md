# FEAT-004 — Pantalla de métricas de cobertura y completitud del nomenclador (`/stats`)

## Origen y necesidad

- **Antecedente:** [PRD Calles de Posadas](../../docs/prd.md) (Secciones 1.3, 4.3 y Hito 4 del Plan de Trabajo) y [docs/project.md](../../docs/project.md).
- **Problema:** Los ciudadanos, investigadores y administradores municipales necesitan una vista consolidada para auditar y comprender el estado de cobertura del nomenclador urbano de Posadas: cuántas calles están catalogadas, cuántas cuentan con trazabilidad legal en el Digesto Municipal, qué proporción tiene reseñas históricas o infraestructura ciclista y cómo se distribuyen por tipo de vía y categorías toponímicas.
- **Resultado observable:** Endpoint de métricas de alta eficiencia `GET /api/v1/stats` y página web responsiva `/stats` con tarjetas de indicadores clave (KPIs), barras de completitud porcentual, distribución vial/toponímica y enlace de navegación directo desde la cabecera del sitio.

## Alcance y exclusiones

### Alcance
1. **Cálculo de métricas y módulo de persistencia (`src/lib/db/stats.ts`):**
   - Conteo y porcentajes de cobertura del nomenclador:
     - Total de arterias catalogadas.
     - Longitud total de la red vial urbana en kilómetros.
     - Cobertura de numeración catastral (`numero_calle IS NOT NULL`).
     - Cobertura de reseñas históricas y toponímicas (`explicacion IS NOT NULL`).
     - Cobertura de trazabilidad normativa del Digesto Municipal (`referencia_ordenanza IS NOT NULL` o `url_ordenanza IS NOT NULL`).
     - Infraestructura ciclista: total y porcentaje de calles con ciclovía (`tiene_ciclovia = 1`) y longitud total de tramos ciclables.
     - Distribución por tipo de vía (`AVENIDA`, `CALLE`, `PASAJE`, `DIAGONAL`, `COSTANERA`).
     - Distribución por sentido de circulación (`DOBLE`, `MANO_UNICA`, `PEATONAL`).
     - Distribución por categorías toponímicas (`categoria_toponimica`).
     - Conteo de barrios y chacras relevados en la base de datos.
2. **Endpoint REST `GET /api/v1/stats` (`src/app/api/v1/stats/route.ts`):**
   - Retorno en JSON estructurado de los indicadores agregados calculados en microsegundos sobre SQLite.
   - Cabeceras HTTP estándar (`Cache-Control: public, s-maxage=3600, stale-while-revalidate=86400`).
3. **Página de visualización `/stats` (`src/app/stats/page.tsx`):**
   - Renderizado server-side (RSC) o híbrido responsivo con Tailwind CSS.
   - Tarjetas KPI principales (Total de Calles, Red Vial Total en km, Cobertura Normativa, Cobertura Histórica, Calles con Ciclovía, Total de Barrios y Chacras).
   - Barras de completitud visuales que reflejan la madurez de los datos abiertos municipales.
   - Tablas o gráficos visuales desglosados por tipo de vía, sentido de circulación y categorías.
   - Botón o enlace de retorno rápido al explorador cartográfico (`/`).
4. **Navegación global (`src/app/layout.tsx`):**
   - Inclusión del enlace "Métricas" / "Estadísticas" en la barra de navegación superior.
5. **Pruebas automatizadas:**
   - Pruebas unitarias de agregación en base de datos (`test/stats.test.ts`).
   - Pruebas HTTP de contrato para `GET /api/v1/stats`.
   - Pruebas de integración frontend y verificación de compilación (`npm run build`).

### Exclusiones
- Carga comunitaria de datos o edición interactiva de estadísticas desde la UI (acceso de solo lectura).
- Visualización de fotografías históricas georreferenciadas (Fase 2 / OldNYC según [DEC-002](../../docs/decisions.md#dec-002)).
- Consultas analíticas pesadas en tiempo real con tiempos de respuesta superiores a 50 ms.

## Comportamiento y aceptación

- **AC-001 (Endpoint de métricas `GET /api/v1/stats`):** Retorna código HTTP 200 con JSON que contiene totales de calles, longitud en km, métricas de completitud (porcentajes de explicación, ordenanza, numeración y ciclovías), desgloses por tipo de vía, sentido y categorías toponímicas, respondiendo en < 20 ms.
- **AC-002 (Exactitud de agregación sobre SQLite):** Los conteos y porcentajes coinciden de forma determinística con los registros de las tablas `calles`, `barrios` y `tramos_calle`.
- **AC-003 (Interfaz visual `/stats` responsiva):** La página `/stats` muestra indicadores visuales y barras de progreso legibles tanto en dispositivos móviles como en pantallas de escritorio sin desbordamientos de diseño.
- **AC-004 (Navegación e integración en layout):** La barra de navegación superior incluye el enlace directo a `/stats` y permite la navegación fluida entre el mapa (`/`) y la pantalla de estadísticas.
- **AC-005 (Verificación empírica y build sin errores):** `npm test` ejecuta y aprueba las pruebas de estadísticas y `npm run build` compila la ruta `/stats` sin advertencias de tipos ni fallos de SSR.

## Diseño y dependencias

- **Módulos y archivos previstos:**
  - `src/lib/db/stats.ts`: Funciones de consulta agregada sobre SQLite (`getStatsMetrics()`).
  - `src/app/api/v1/stats/route.ts`: Route handler HTTP para `GET /api/v1/stats`.
  - `src/app/stats/page.tsx`: Página Server Component de Next.js con métricas y barras de progreso.
  - `src/app/layout.tsx`: Actualización del menú de navegación.
  - `test/stats.test.ts`: Pruebas de contrato y consistencia de datos de métricas.
- **Dependencias de paquetes:**
  - Sin dependencias externas adicionales; reutiliza `better-sqlite3`, `next`, `react` y `tailwindcss`.

## Aprobación del contrato

- **Estado:** Aprobado.
- **Quién decide:** Usuario (aprobación expresa en chat).
- **Fecha:** 2026-10-06.
- **Alcance aprobado:** Endpoint `GET /api/v1/stats`, agregación en SQLite, pantalla `/stats` con KPIs y barras de cobertura, enlace en layout y suite de pruebas.
