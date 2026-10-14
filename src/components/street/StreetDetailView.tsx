'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import StreetDetailCard from './StreetDetailCard';
import StreetViewerClient from '../map/StreetViewerClient';
import type { CalleDetail } from '@/lib/db/streets';

export default function StreetDetailView({ street }: { street: CalleDetail }) {
  const [showCorredor, setShowCorredor] = useState(false);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-0 overflow-hidden">
      {/* Columna izquierda: Ficha técnica y botón volver */}
      <div className="md:w-[460px] lg:w-[500px] bg-slate-50 border-r border-slate-200 flex flex-col p-4 overflow-y-auto">
        <div className="mb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-sky-700 bg-white border border-slate-300 hover:border-sky-400 px-3 py-1.5 rounded-lg shadow-sm transition-colors"
          >
            <span>←</span>
            <span>Volver al explorador</span>
          </Link>
        </div>

        <div className="flex-1">
          <StreetDetailCard
            street={street}
            showCorredor={showCorredor}
            onToggleCorredor={() => setShowCorredor((v) => !v)}
          />
        </div>
      </div>

      {/* Columna derecha: Visor de mapa centrado en la traza */}
      <div className="flex-1 h-full p-2 bg-slate-100">
        <StreetViewerClient
          geojson={street.geojson}
          activeStreetName={street.official_name}
          hasCycleway={street.has_cycleway}
          cyclewayType={street.cycleway_type}
          tramos={street.tramos}
          barrios={street.barrios}
          ejeVial={street.eje_vial}
          showCorredor={showCorredor}
          onToggleCorredor={() => setShowCorredor((v) => !v)}
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
