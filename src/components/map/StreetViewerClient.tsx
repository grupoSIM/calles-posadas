'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { StreetViewerProps } from './StreetViewer';

const StreetViewerDynamic = dynamic(() => import('./StreetViewer'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400 text-sm">
      Cargando visor cartográfico...
    </div>
  ),
});

export default function StreetViewerClient(props: StreetViewerProps) {
  return <StreetViewerDynamic {...props} />;
}
