'use client';

import React from 'react';
import type { CalleDetail } from '../../lib/db/streets.js';

interface StreetDetailCardProps {
  street: CalleDetail;
  onClose?: () => void;
  onSelectStreet?: (slug: string) => void;
  showCorredor?: boolean;
  onToggleCorredor?: () => void;
  isCompact?: boolean;
}

const TOPONYM_BADGES: Record<string, { label: string; icon: string; className: string }> = {
  PROCER: {
    label: 'Prócer / Figura Histórica',
    icon: '🏛️',
    className: 'bg-amber-100 text-amber-900 border-amber-300'
  },
  PUEBLOS_ORIGINARIOS: {
    label: 'Pueblos Originarios',
    icon: '🏹',
    className: 'bg-orange-100 text-orange-900 border-orange-300'
  },
  GEOGRAFIA: {
    label: 'Geografía',
    icon: '🌎',
    className: 'bg-blue-100 text-blue-900 border-blue-300'
  },
  FECHA_PATRIA: {
    label: 'Fecha Patria',
    icon: '🇦🇷',
    className: 'bg-sky-100 text-sky-900 border-sky-300'
  },
  BOTANICA_FAUNA: {
    label: 'Flora y Fauna',
    icon: '🌿',
    className: 'bg-emerald-100 text-emerald-900 border-emerald-300'
  },
  CIENCIA_CULTURA: {
    label: 'Ciencia y Cultura',
    icon: '🎨',
    className: 'bg-purple-100 text-purple-900 border-purple-300'
  },
  NUMERICA: {
    label: 'Sistema Numérico',
    icon: '🔢',
    className: 'bg-indigo-100 text-indigo-900 border-indigo-300'
  },
  SIN_NOMBRE: {
    label: 'Sin Denominación Oficial',
    icon: '❓',
    className: 'bg-zinc-100 text-zinc-700 border-zinc-300'
  },
  OTRO: {
    label: 'General',
    icon: '🏷️',
    className: 'bg-slate-100 text-slate-700 border-slate-300'
  }
};

export default function StreetDetailCard({
  street,
  onClose,
  onSelectStreet,
  showCorredor = false,
  onToggleCorredor,
  isCompact = false,
}: StreetDetailCardProps) {
  const formattedLength =
    street.total_length_m >= 1000
      ? `${(street.total_length_m / 1000).toFixed(2)} km`
      : `${Math.round(street.total_length_m)} m`;

  const directionLabel =
    street.traffic_direction === 'MANO_UNICA'
      ? 'Mano única'
      : street.traffic_direction === 'DOBLE'
      ? 'Doble sentido'
      : street.traffic_direction === 'PEATONAL'
      ? 'Peatonal'
      : street.traffic_direction || 'Sin registrar';

  const toponymBadge = street.toponym_category && street.toponym_category !== 'OTRO'
    ? TOPONYM_BADGES[street.toponym_category] || null
    : null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200/80 overflow-hidden flex flex-col h-full">
      {/* Encabezado de la Ficha */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/70 relative">
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/60 transition-colors"
            title="Cerrar ficha"
            aria-label="Cerrar ficha"
          >
            ✕
          </button>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mb-2 pr-6">
          <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-slate-200/80 text-slate-700">
            {street.road_type}
          </span>
          {street.street_number && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-posadas-riverDark border border-posadas-river/30">
              Arteria N° {street.street_number}
            </span>
          )}
          {street.has_cycleway && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-300 flex items-center gap-1">
              <span>🚲</span> {street.cycleway_type ? street.cycleway_type.replace('_', ' ') : 'Ciclovía'}
            </span>
          )}
          {toponymBadge && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${toponymBadge.className}`}
              title={`Categoría toponímica: ${toponymBadge.label}`}
            >
              <span>{toponymBadge.icon}</span> {toponymBadge.label}
            </span>
          )}
        </div>

        <h1 className="text-xl font-bold text-slate-900 leading-snug">
          {street.official_name}
        </h1>
        {street.aliases && street.aliases.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-baseline gap-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-600 flex items-center gap-1">
              <span>🏷️</span> También conocida como:
            </span>
            <span className="text-slate-700 font-normal">
              {street.aliases.join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* Contenido scrolleable */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-sm">
        {/* Corredor Vial Multi-Toponímico (FEAT-014) */}
        {street.eje_vial && street.eje_vial.arterias && street.eje_vial.arterias.length > 1 && (
          <div className="bg-gradient-to-r from-sky-50 to-indigo-50/70 p-3.5 rounded-xl border border-sky-200/80 space-y-2.5 shadow-2xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-sm">🛣️</span>
                <span className="text-xs font-bold text-sky-950 uppercase tracking-wider truncate">
                  {street.eje_vial.nombre_eje}
                </span>
              </div>
              <span className="text-[10px] font-semibold text-sky-800 bg-sky-100/90 px-2 py-0.5 rounded-full border border-sky-300/60 shrink-0">
                {street.eje_vial.arterias.length} toponimias · {street.eje_vial.longitud_total_eje_m >= 1000 ? `${(street.eje_vial.longitud_total_eje_m / 1000).toFixed(2)} km` : `${Math.round(street.eje_vial.longitud_total_eje_m)} m`}
              </span>
            </div>

            {/* Control explícito para ver traza completa en el mapa (ERR-001) */}
            {onToggleCorredor && (
              <button
                type="button"
                onClick={onToggleCorredor}
                className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between border transition-all shadow-2xs ${
                  showCorredor
                    ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-200'
                    : 'bg-white hover:bg-indigo-50 text-indigo-700 border-indigo-200 hover:border-indigo-300'
                }`}
                title={showCorredor ? 'Ajustar mapa exclusivamente a esta calle' : 'Acomodar mapa para ver toda la traza del corredor'}
              >
                <span className="flex items-center gap-1.5">
                  <span>{showCorredor ? '🔍' : '🗺️'}</span>
                  <span>{showCorredor ? 'Ajustar mapa solo a esta calle' : 'Ver traza completa en el mapa'}</span>
                </span>
                <span className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${showCorredor ? 'bg-indigo-700 text-indigo-100' : 'bg-indigo-100 text-indigo-800'}`}>
                  {showCorredor ? 'Mapa ampliado' : `Ver ${street.eje_vial.arterias.length} tramos`}
                </span>
              </button>
            )}

            <p className="text-[11px] text-slate-600 leading-snug">
              Corredor vial continuo. Hacé clic en cualquier tramo para navegar a su ficha y enfocar su traza:
            </p>
            <div className="flex flex-col gap-1.5 pt-0.5">
              {street.eje_vial.arterias.map((art) => {
                const isCurrent = art.is_current;
                const artLength = art.total_length_m >= 1000 ? `${(art.total_length_m / 1000).toFixed(2)} km` : `${Math.round(art.total_length_m)} m`;
                return (
                  <button
                    key={art.slug}
                    type="button"
                    onClick={() => {
                      if (!isCurrent) {
                        if (onSelectStreet) {
                          onSelectStreet(art.slug);
                        } else if (typeof window !== 'undefined') {
                          window.location.href = `/calles/${art.slug}`;
                        }
                      }
                    }}
                    disabled={isCurrent}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                      isCurrent
                        ? 'bg-sky-600 text-white font-semibold shadow-xs cursor-default ring-1 ring-sky-400'
                        : 'bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-900 border border-slate-200/90 hover:border-sky-300 hover:shadow-xs active:scale-[0.99]'
                    }`}
                    title={isCurrent ? 'Arteria actualmente visualizada' : `Ver ficha de ${art.official_name}`}
                  >
                    <div className="flex items-center gap-1.5 truncate pr-2">
                      <span className="text-[10px]">{isCurrent ? '►' : '•'}</span>
                      <span className="truncate">{art.official_name}</span>
                      {isCurrent && (
                        <span className="text-[9px] uppercase tracking-wider font-bold bg-sky-700/90 text-sky-100 px-1.5 py-0.5 rounded">
                          Actual
                        </span>
                      )}
                    </div>
                    <span className={`text-[11px] font-mono shrink-0 ${isCurrent ? 'text-sky-100' : 'text-slate-400'}`}>
                      {artLength}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* Metadatos técnicos viales */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-50/90 p-3 rounded-lg border border-slate-200/70 text-xs">
          <div>
            <span className="text-slate-500 block text-[11px]">Longitud total</span>
            <span className="font-bold text-slate-900 text-sm">{formattedLength}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[11px]">Sentido de circulación</span>
            <span className="font-bold text-slate-900 text-sm">{directionLabel}</span>
          </div>
        </div>

        {/* Reseña toponímica e histórica */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>📜</span> Reseña Histórica / Toponímica
          </h2>
          {street.explanation ? (
            <div className="text-slate-700 leading-relaxed text-xs sm:text-sm bg-amber-50/50 p-3 rounded-lg border border-amber-200/70">
              {street.explanation}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
              Esta arteria aún no cuenta con reseña biográfica documentada en el catálogo municipal.
            </p>
          )}
        </div>

        {/* Trazabilidad jurídica y Digesto Municipal */}
        <div>
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
            <span>⚖️</span> Trazabilidad Normativa
          </h2>
          <div className="bg-slate-50/90 p-3.5 rounded-lg border border-slate-200/80 space-y-2.5">
            {street.ordinance?.reference ? (
              <div className="text-xs">
                <span className="text-slate-500 block text-[11px]">Ordenanza de denominación</span>
                <span className="font-bold text-slate-900 text-xs sm:text-sm">{street.ordinance.reference}</span>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">
                Sin ordenanza de denominación formal vinculada en los registros del Digesto.
              </p>
            )}

            {street.ordinance?.url && (
              <a
                href={street.ordinance.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full gap-1.5 text-xs font-semibold text-white bg-posadas-river hover:bg-posadas-riverDark px-3 py-2 rounded-lg transition-colors shadow-sm"
              >
                <span>Consultar en Digesto Jurídico Municipal</span>
                <span className="text-[11px]">↗</span>
              </a>
            )}
          </div>
        </div>

        {/* Barrios y chacras atravesadas */}
        {street.barrios && street.barrios.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>🏘️</span> Barrios y Chacras ({Array.from(new Set(street.barrios)).length})
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {Array.from(new Set(street.barrios)).map((b, idx) => (
                <span
                  key={`${b}-${idx}`}
                  className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-medium"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tramos y alturas catastrales */}
        {street.tramos && street.tramos.length > 0 && (
          <div>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <span>📐</span> Tramos catastrales ({street.tramos.length})
            </h2>
            <div className="space-y-1 max-h-36 overflow-y-auto text-xs border border-slate-200 rounded-lg p-2 bg-slate-50/70">
              {(street.tramos || []).map((t) => (
                <div
                  key={t.orden}
                  className="flex items-center justify-between py-1 px-2 border-b border-slate-200/50 last:border-0"
                >
                  <span className="font-medium text-slate-700">Tramo {t.orden}</span>
                  <div className="flex items-center gap-2 text-slate-500 font-mono">
                    {t.altura_inicio && t.altura_fin && (
                      <span className="font-sans text-[11px]">Alt: {t.altura_inicio}–{t.altura_fin}</span>
                    )}
                    <span className="text-[11px]">{Math.round(t.longitud_m)} m</span>
                    {t.tiene_ciclovia && (
                      <span className="text-emerald-600 font-bold" title="Tramo con ciclovía">🚲</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pie de la Ficha con enlace permanente */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/70 flex justify-between items-center text-xs">
        <a
          href={`/calles/${street.slug}`}
          className="text-posadas-riverDark hover:text-posadas-river font-semibold hover:underline flex items-center gap-1"
        >
          <span>Enlace permanente</span>
          <span>🔗</span>
        </a>
        <span className="text-slate-400 font-mono text-[11px]">ID #{street.id}</span>
      </div>
    </div>
  );
}
