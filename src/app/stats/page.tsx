import type { Metadata } from 'next';
import Link from 'next/link';
import { getStatsMetrics } from '@/lib/db/stats';

export const metadata: Metadata = {
  title: 'Métricas de Cobertura — Calles de Posadas',
  description: 'Auditoría cívica y estadísticas de completitud, trazabilidad legal y red vial de Posadas, Misiones.',
};

export default function StatsPage() {
  const stats = getStatsMetrics();

  const kpis = [
    {
      title: 'Arterias Registradas',
      value: stats.calles.total.toLocaleString('es-AR'),
      subtitle: 'En el ejido urbano de Posadas',
      icon: '🛣️',
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      title: 'Red Vial Mapeada',
      value: `${stats.calles.longitud_total_km.toLocaleString('es-AR')} km`,
      subtitle: 'Longitud acumulada de trazas',
      icon: '📏',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200'
    },
    {
      title: 'Calles con Ciclovía',
      value: `${stats.calles.con_ciclovia.toLocaleString('es-AR')} (${stats.calles.porcentaje_ciclovia}%)`,
      subtitle: `${stats.calles.longitud_ciclovia_km.toLocaleString('es-AR')} km ciclables`,
      icon: '🚴',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200'
    },
    {
      title: 'Barrios y Chacras',
      value: stats.barrios.total.toLocaleString('es-AR'),
      subtitle: `${stats.barrios.total_chacras} chacras catastrales`,
      icon: '🏘️',
      color: 'bg-amber-50 text-amber-700 border-amber-200'
    }
  ];

  const completitudMetrics = [
    {
      label: 'Identificación Numérica (N° de arteria)',
      count: stats.calles.con_numero,
      total: stats.calles.total,
      percentage: stats.calles.porcentaje_con_numero,
      description: 'Calles con número asignado (ej. Av. 115, Calle 134)',
      barColor: 'bg-sky-500'
    },
    {
      label: 'Trazabilidad Legal (Digesto Municipal)',
      count: stats.calles.con_ordenanza,
      total: stats.calles.total,
      percentage: stats.calles.porcentaje_ordenanza,
      description: 'Arterias vinculadas a ordenanzas digitalizadas del HCD Posadas',
      barColor: 'bg-purple-500'
    },
    {
      label: 'Fundamentación Histórica y Toponímica',
      count: stats.calles.con_explicacion,
      total: stats.calles.total,
      percentage: stats.calles.porcentaje_explicacion,
      description: 'Reseña biográfica o etimológica sobre el origen del nombre',
      barColor: 'bg-amber-500'
    },
    {
      label: 'Infraestructura Ciclista Integrada',
      count: stats.calles.con_ciclovia,
      total: stats.calles.total,
      percentage: stats.calles.porcentaje_ciclovia,
      description: 'Trazas coincidentes con red de ciclovías o bicisendas',
      barColor: 'bg-emerald-500'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 w-full space-y-8">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📊</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Métricas de Cobertura y Nomenclador
            </h1>
          </div>
          <p className="text-sm sm:text-base text-slate-600 mt-1 max-w-2xl">
            Estado de completitud de datos abiertos, trazabilidad normativa en el Digesto y distribución urbana de Posadas, Misiones.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors self-start sm:self-auto"
        >
          <span>← Volver al Explorador</span>
        </Link>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => (
          <div key={idx} className={`p-5 rounded-xl border shadow-sm ${kpi.color}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs uppercase font-semibold tracking-wider text-slate-500">
                {kpi.title}
              </span>
              <span className="text-2xl">{kpi.icon}</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {kpi.value}
            </div>
            <div className="text-xs text-slate-600 mt-1 font-medium">
              {kpi.subtitle}
            </div>
          </div>
        ))}
      </div>

      {/* Estado de Completitud del Nomenclador */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <span>📈</span>
            <span>Completitud y Madurez de Datos Abiertos</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Porcentaje de cobertura de cada dimensión de información cívica sobre el total de arterias registradas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {completitudMetrics.map((item, idx) => (
            <div key={idx} className="space-y-2 p-4 rounded-lg bg-slate-50 border border-slate-100">
              <div className="flex justify-between items-start text-sm">
                <div>
                  <span className="font-semibold text-slate-800">{item.label}</span>
                  <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 text-base">{item.percentage}%</span>
                  <p className="text-xs text-slate-500">
                    {item.count.toLocaleString('es-AR')} / {item.total.toLocaleString('es-AR')}
                  </p>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full ${item.barColor} transition-all duration-500`}
                  style={{ width: `${Math.max(2, item.percentage)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-sky-50 border border-sky-100 text-xs sm:text-sm text-sky-800 flex items-start space-x-3">
          <span className="text-lg">💡</span>
          <div className="space-y-1">
            <span className="font-semibold">Plan de Enriquecimiento Cívico Continuo</span>
            <p className="text-sky-700">
              Las reseñas biográficas y las ordenanzas digitalizadas del Digesto Jurídico Municipal se incorporan progresivamente mediante los pipelines de normalización y vinculación con fuentes abiertas municipales.
            </p>
          </div>
        </div>
      </div>

      {/* Desglose por Tipo de Vía, Sentido, Toponimia y Catastro */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Tipos de Vía */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>🚗</span>
            <span>Tipo de Vía</span>
          </h2>
          <div className="space-y-3">
            {stats.distribucion_tipo_via.map((via, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{via.tipo}</span>
                  <span>{via.cantidad.toLocaleString('es-AR')} ({via.porcentaje}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-blue-600"
                    style={{ width: `${Math.max(1, via.porcentaje)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sentido de Circulación */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>🔄</span>
            <span>Sentido de Circulación</span>
          </h2>
          <div className="space-y-3">
            {stats.distribucion_sentido.map((sent, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium text-slate-700">
                  <span>{sent.sentido.replace('_', ' ')}</span>
                  <span>{sent.cantidad.toLocaleString('es-AR')} ({sent.porcentaje}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-indigo-600"
                    style={{ width: `${Math.max(1, sent.porcentaje)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución Toponímica */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>🏛️</span>
            <span>Categorías Toponímicas</span>
          </h2>
          <div className="space-y-3">
            {stats.distribucion_toponimica.map((topo, idx) => {
              const labelMap: Record<string, string> = {
                PROCER: 'Próceres / Figuras Históricas',
                PUEBLOS_ORIGINARIOS: 'Pueblos Originarios',
                GEOGRAFIA: 'Geografía',
                FECHA_PATRIA: 'Fechas Patrias',
                BOTANICA_FAUNA: 'Flora y Fauna',
                CIENCIA_CULTURA: 'Ciencia y Cultura',
                OTRO: 'General / Otros'
              };
              const label = labelMap[topo.categoria] || topo.categoria;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="truncate pr-1" title={label}>{label}</span>
                    <span className="whitespace-nowrap">{topo.cantidad.toLocaleString('es-AR')} ({topo.porcentaje}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-amber-500"
                      style={{ width: `${Math.max(1, topo.porcentaje)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* División Catastral y Territorial */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>🗺️</span>
            <span>Composición Catastral</span>
          </h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Chacras Históricas</span>
              <span className="font-semibold text-slate-900">{stats.barrios.total_chacras}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Barrios Oficiales</span>
              <span className="font-semibold text-slate-900">{stats.barrios.total_oficiales}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-slate-600">Barrios Sociales / Regulares</span>
              <span className="font-semibold text-slate-900">{stats.barrios.total_sociales}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Otras Áreas Relevadas</span>
              <span className="font-semibold text-slate-900">{stats.barrios.total_otros}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Accesos directos cívicos */}
      <div className="bg-slate-900 text-white rounded-xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-lg text-white">¿Querés consultar las arterias en el mapa?</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Explorá el nomenclador interactivo con soporte de búsqueda multi-alias y visualización de ciclovías.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/?has_cycleway=true"
            className="text-xs sm:text-sm bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            Ver Ciclovías en Mapa
          </Link>
          <Link
            href="/"
            className="text-xs sm:text-sm bg-white/10 hover:bg-white/20 text-white font-medium px-4 py-2.5 rounded-lg transition-colors border border-white/20"
          >
            Explorador General
          </Link>
        </div>
      </div>
    </div>
  );
}
