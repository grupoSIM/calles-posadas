'use client';

import React from 'react';
import type { CalleDetail } from '../../lib/db/streets.js';

interface StreetDetailCardProps {
  street: CalleDetail;
  onClose?: () => void;
  isCompact?: boolean;
}

export default function StreetDetailCard({
  street,
  onClose,
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
        </div>

        <h1 className="text-xl font-bold text-slate-900 leading-snug">
          {street.official_name}
        </h1>
      </div>

      {/* Contenido scrolleable */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-sm">
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
              <span>🏘️</span> Barrios y Chacras ({street.barrios.length})
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {(street.barrios || []).map((b) => (
                <span
                  key={b}
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
