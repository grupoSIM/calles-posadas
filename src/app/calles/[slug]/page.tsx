import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStreetBySlug } from '@/lib/db/streets';
import StreetDetailCard from '@/components/street/StreetDetailCard';
import StreetViewerClient from '@/components/map/StreetViewerClient';

import { getStreetMetadata } from '@/lib/metadata';

interface StreetPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: StreetPageProps) {
  const { slug } = await props.params;
  return getStreetMetadata(slug);
}

export default async function StreetDetailPage(props: StreetPageProps) {
  const { slug } = await props.params;
  const street = getStreetBySlug(slug);

  if (!street) {
    notFound();
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-57px)] overflow-hidden">
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
          <StreetDetailCard street={street} />
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
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
