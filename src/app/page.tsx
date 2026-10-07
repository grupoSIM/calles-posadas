'use client';

import React, { useState, useEffect, useCallback } from 'react';
import SearchBar from '@/components/search/SearchBar';
import FilterBar, { FilterState } from '@/components/search/FilterBar';
import StreetDetailCard from '@/components/street/StreetDetailCard';
import StreetViewerClient from '@/components/map/StreetViewerClient';
import type { CalleSummary, CalleDetail } from '@/lib/db/streets';

type MobileSheetState = 'peek' | 'half' | 'full';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    roadType: '',
    hasCycleway: false,
    barrioId: '',
  });

  const [streets, setStreets] = useState<CalleSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<CalleDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // Control de bottom sheet móvil con 3 estados
  const [mobileSheetState, setMobileSheetState] = useState<MobileSheetState>('half');

  // Carga de catálogo de calles
  const fetchStreets = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (query.trim()) params.set('q', query.trim());
      if (filters.roadType) params.set('road_type', filters.roadType);
      if (filters.hasCycleway) params.set('has_cycleway', 'true');
      if (filters.barrioId) params.set('barrio_id', filters.barrioId);
      params.set('page', page.toString());
      params.set('limit', '25');

      const res = await fetch(`/api/v1/streets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStreets(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('Error al consultar calles:', err);
    } finally {
      setIsLoading(false);
    }
  }, [query, filters, page]);

  useEffect(() => {
    fetchStreets();
  }, [fetchStreets]);

  // Resetear a página 1 cuando cambia búsqueda o filtros
  const handleQueryChange = (q: string) => {
    setQuery(q);
    setPage(1);
  };

  const handleFiltersChange = (f: FilterState) => {
    setFilters(f);
    setPage(1);
  };

  // Carga del detalle al seleccionar una calle
  const handleSelectStreet = async (slug: string) => {
    setSelectedSlug(slug);
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/v1/streets/${slug}`);
      if (res.ok) {
        const data: CalleDetail = await res.json();
        setSelectedDetail(data);
        // En mobile, abrir el drawer a mitad para ver mapa y datos
        setMobileSheetState('half');
      }
    } catch (err) {
      console.error('Error al cargar detalle de calle:', err);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedSlug(null);
    setSelectedDetail(null);
  };

  // Alternar estados móviles cíclicamente o por acción
  const toggleMobileSheet = () => {
    setMobileSheetState((prev) => {
      if (prev === 'peek') return 'half';
      if (prev === 'half') return 'full';
      return 'peek';
    });
  };

  const mobileHeightClass =
    mobileSheetState === 'peek'
      ? 'h-[76px]'
      : mobileSheetState === 'half'
      ? 'h-[50vh]'
      : 'h-[90vh]';

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full h-full min-h-0 overflow-hidden relative">
      {/* Panel lateral izquierdo (Escritorio) / Bottom Sheet (Mobile) */}
      <div
        className={`
          md:w-[420px] lg:w-[450px] flex-shrink-0 bg-white border-r border-slate-200/90 z-20 flex flex-col
          transition-all duration-300 ease-in-out
          fixed md:relative inset-x-0 bottom-0 md:bottom-auto md:h-full
          ${mobileHeightClass} md:max-h-full
          shadow-xl md:shadow-none rounded-t-2xl md:rounded-none
        `}
      >
        {/* Agarradera / Barra de control móvil */}
        <div
          onClick={toggleMobileSheet}
          className="md:hidden flex flex-col items-center justify-center py-2 px-4 bg-slate-50 border-b border-slate-200/80 cursor-pointer rounded-t-2xl select-none"
        >
          <div className="w-10 h-1.5 bg-slate-300 rounded-full mb-1.5" />
          <div className="w-full flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 truncate max-w-[240px]">
              {selectedDetail
                ? `📍 ${selectedDetail.official_name}`
                : `🔍 Catálogo (${total} arterias)`}
            </span>
            <span className="text-[11px] font-medium text-posadas-riverDark bg-sky-50 px-2 py-0.5 rounded-full border border-sky-200">
              {mobileSheetState === 'peek'
                ? 'Expandir ↑'
                : mobileSheetState === 'half'
                ? 'Completo ↑'
                : 'Minimizar ↓'}
            </span>
          </div>
        </div>

        {/* Ficha técnica activa con retención de contexto */}
        {selectedDetail ? (
          <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/30">
            {/* Barra contextual superior para volver al listado */}
            <div className="px-3.5 py-2.5 bg-white border-b border-slate-200 flex items-center justify-between shadow-xs">
              <button
                type="button"
                onClick={handleCloseDetail}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-posadas-riverDark hover:text-posadas-river transition-colors px-2 py-1 rounded hover:bg-slate-50"
              >
                <span>← Volver al catálogo</span>
                <span className="text-slate-400 font-normal">({total} arterias)</span>
              </button>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="text-slate-400 hover:text-slate-700 text-xs p-1 rounded"
                title="Cerrar ficha"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-3 flex flex-col">
              <StreetDetailCard
                street={selectedDetail}
                onClose={handleCloseDetail}
              />
            </div>
          </div>
        ) : (
          /* Vista de Catálogo y Búsqueda */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Cabecera de filtros y búsqueda */}
            <div className="p-3.5 border-b border-slate-100 space-y-2.5 bg-slate-50/60">
              <SearchBar value={query} onChange={handleQueryChange} />
              <FilterBar filters={filters} onChange={handleFiltersChange} />
              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-0.5 px-0.5">
                <span className="font-medium text-slate-600">
                  {isLoading
                    ? 'Buscando en nomenclador...'
                    : `${total} ${total === 1 ? 'arteria encontrada' : 'arterias encontradas'}`}
                </span>
                {total > 25 && (
                  <span className="text-slate-400 font-mono">
                    Pág. {page} / {Math.ceil(total / 25)}
                  </span>
                )}
              </div>
            </div>

            {/* Listado de resultados scrolleable */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-1">
              {isLoading && streets.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  Cargando catálogo municipal...
                </div>
              ) : streets.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs px-4">
                  No se encontraron arterias con los filtros seleccionados.
                </div>
              ) : (
                streets.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSelectStreet(s.slug)}
                    className={`p-2.5 rounded-lg cursor-pointer transition-all border group ${
                      selectedSlug === s.slug
                        ? 'bg-sky-50/90 border-posadas-river border-l-4 shadow-xs'
                        : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50/70 border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                          {s.road_type}
                        </span>
                        {s.street_number && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-posadas-riverDark border border-posadas-river/20">
                            N° {s.street_number}
                          </span>
                        )}
                      </div>
                      {s.has_cycleway && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                          <span>🚲</span> Ciclovía
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug group-hover:text-posadas-riverDark transition-colors">
                        {s.official_name}
                      </h3>
                      <span className="text-slate-300 group-hover:text-posadas-river group-hover:translate-x-0.5 transition-all text-xs">
                        →
                      </span>
                    </div>

                    {s.barrios && s.barrios.length > 0 && (
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {s.barrios.join(', ')}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Paginador */}
            {total > 25 && (
              <div className="p-2.5 border-t border-slate-100 flex justify-between items-center text-xs bg-slate-50/80">
                <button
                  type="button"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium shadow-xs text-xs"
                >
                  ← Anterior
                </button>
                <span className="text-slate-600 font-mono text-[11px]">
                  {page} / {Math.ceil(total / 25)}
                </span>
                <button
                  type="button"
                  disabled={page >= Math.ceil(total / 25) || isLoading}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 font-medium shadow-xs text-xs"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Visor cartográfico en área principal (100% viewport) */}
      <div className="flex-1 h-full relative z-10 min-w-0">
        <div className="absolute inset-0 w-full h-full">
          <StreetViewerClient
            geojson={selectedDetail?.geojson}
            activeStreetName={selectedDetail?.official_name}
            hasCycleway={selectedDetail?.has_cycleway}
            cyclewayType={selectedDetail?.cycleway_type}
            tramos={selectedDetail?.tramos}
            barrios={selectedDetail?.barrios}
            className="w-full h-full"
          />
        </div>
      </div>
    </div>
  );
}
