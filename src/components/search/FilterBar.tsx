'use client';

import React, { useState, useEffect } from 'react';

export interface FilterState {
  roadType: string;
  hasCycleway: boolean;
  barrioId: string;
}

interface FilterBarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

interface BarrioItem {
  id: number;
  name: string;
  type: string;
  chacra_number: number | null;
}

export default function FilterBar({
  filters,
  onChange,
  className = '',
}: FilterBarProps) {
  const [barrios, setBarrios] = useState<BarrioItem[]>([]);
  const [isLoadingBarrios, setIsLoadingBarrios] = useState(false);

  useEffect(() => {
    async function loadBarrios() {
      try {
        setIsLoadingBarrios(true);
        const res = await fetch('/api/v1/barrios');
        if (res.ok) {
          const json = await res.json();
          const items = Array.isArray(json) ? json : json.data || [];
          setBarrios(items);
        }
      } catch (err) {
        console.error('Error al cargar listado de barrios:', err);
      } finally {
        setIsLoadingBarrios(false);
      }
    }
    loadBarrios();
  }, []);

  const hasActiveFilters = filters.roadType !== '' || filters.hasCycleway || filters.barrioId !== '';

  return (
    <div className={`flex flex-wrap items-center gap-2 text-xs ${className}`}>
      {/* Tipo de vía */}
      <select
        value={filters.roadType}
        onChange={(e) => onChange({ ...filters, roadType: e.target.value })}
        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-posadas-river font-medium shadow-sm transition-colors"
      >
        <option value="">Vía: Todas</option>
        <option value="AVENIDA">Avenidas</option>
        <option value="CALLE">Calles</option>
        <option value="PASAJE">Pasajes</option>
        <option value="DIAGONAL">Diagonales</option>
        <option value="COSTANERA">Costaneras</option>
      </select>

      {/* Selector de Barrio / Chacra */}
      <select
        value={filters.barrioId}
        onChange={(e) => onChange({ ...filters, barrioId: e.target.value })}
        className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-posadas-river font-medium max-w-[180px] truncate shadow-sm transition-colors"
      >
        <option value="">Barrio: Todos</option>
        {(Array.isArray(barrios) ? barrios : []).map((b) => (
          <option key={b.id} value={b.id.toString()}>
            {b.name}
          </option>
        ))}
      </select>

      {/* Switch / Botón de ciclovía */}
      <button
        type="button"
        onClick={() => onChange({ ...filters, hasCycleway: !filters.hasCycleway })}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium border transition-all shadow-sm ${
          filters.hasCycleway
            ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-semibold ring-1 ring-emerald-500/20'
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <span>🚲</span>
        <span>Ciclovía</span>
      </button>

      {/* Botón de limpiar filtros si hay activos */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={() => onChange({ roadType: '', hasCycleway: false, barrioId: '' })}
          className="text-slate-500 hover:text-rose-600 font-medium px-2 py-1 text-[11px] underline hover:no-underline ml-auto transition-colors"
        >
          Limpiar filtros
        </button>
      )}
    </div>
  );
}
