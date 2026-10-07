'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, Layer } from 'leaflet';

export interface TramoInfo {
  orden: number;
  tiene_ciclovia: boolean;
  altura_inicio: number | null;
  altura_fin: number | null;
  longitud_m: number;
  geojson?: any;
}

export interface StreetViewerProps {
  geojson?: any | null;
  activeStreetName?: string;
  hasCycleway?: boolean;
  cyclewayType?: string | null;
  tramos?: TramoInfo[];
  barrios?: string[];
  barriosGeojson?: any | null;
  className?: string;
}

const POSADAS_CENTER: [number, number] = [-27.36708, -55.89608];
const DEFAULT_ZOOM = 13;

export default function StreetViewer({
  geojson,
  activeStreetName,
  hasCycleway = false,
  cyclewayType,
  tramos = [],
  barrios = [],
  barriosGeojson = null,
  className = 'w-full h-full',
}: StreetViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const geojsonLayerRef = useRef<LeafletGeoJSON | null>(null);
  const barriosLayerRef = useRef<LeafletGeoJSON | null>(null);
  const [highlightCycleways, setHighlightCycleways] = useState(true);
  const [showBarrios, setShowBarrios] = useState(false);
  const [barriosData, setBarriosData] = useState<any>(barriosGeojson || null);

  // Inicialización del mapa en cliente con controles HUD personalizados
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = await import('leaflet');

      if (!isMounted || !mapContainerRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: POSADAS_CENTER,
        zoom: DEFAULT_ZOOM,
        zoomControl: false, // Desactivar controles por defecto para usar HUD Stitch
        attributionControl: true,
      });

      // Capa base abierta OpenStreetMap CartoDB / Positron
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      mapInstanceRef.current = map;
      if (isMounted) {
        setMapInstance(map);
      }

      // InvalidateSize para garantizar que Leaflet ocupe el 100% del viewport
      const timer1 = setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
          if (geojsonLayerRef.current) {
            const bounds = geojsonLayerRef.current.getBounds();
            if (bounds.isValid()) {
              mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: false });
            }
          }
        }
      }, 100);

      const timer2 = setTimeout(() => {
        if (isMounted && mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 500);

      const handleResize = () => {
        mapInstanceRef.current?.invalidateSize();
      };
      window.addEventListener('resize', handleResize);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        window.removeEventListener('resize', handleResize);
      };
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      setMapInstance(null);
    };
  }, []);

  // Actualización de capa GeoJSON y ajuste de encuadre (fitBounds)
  useEffect(() => {
    let isCancelled = false;

    async function updateGeoJson() {
      if (!mapInstance) return;
      const L = await import('leaflet');
      if (isCancelled) return;

      const map = mapInstance;

      // Limpiar capa previa
      if (geojsonLayerRef.current) {
        map.removeLayer(geojsonLayerRef.current);
        geojsonLayerRef.current = null;
      }

      if (!geojson) {
        map.setView(POSADAS_CENTER, DEFAULT_ZOOM);
        return;
      }

      // Determinar la estructura GeoJSON a renderizar
      // Si hay tramos con información geométrica o multi-trazas, construir un FeatureCollection
      // con propiedades individuales por tramo para permitir estilización y popups diferenciales
      let dataToRender: any = geojson;

      if (tramos && tramos.length > 0) {
        const hasGeometries = tramos.some((t) => t.geojson);
        if (hasGeometries) {
          dataToRender = {
            type: 'FeatureCollection',
            features: tramos
              .filter((t) => t.geojson)
              .map((t) => ({
                type: 'Feature',
                properties: {
                  orden: t.orden,
                  tiene_ciclovia: t.tiene_ciclovia,
                  longitud_m: t.longitud_m,
                  altura_inicio: t.altura_inicio,
                  altura_fin: t.altura_fin,
                },
                geometry: t.geojson,
              })),
          };
        } else if (geojson?.type === 'MultiLineString' && Array.isArray(geojson.coordinates)) {
          if (geojson.coordinates.length === tramos.length) {
            dataToRender = {
              type: 'FeatureCollection',
              features: tramos.map((t, idx) => ({
                type: 'Feature',
                properties: {
                  orden: t.orden,
                  tiene_ciclovia: t.tiene_ciclovia,
                  longitud_m: t.longitud_m,
                  altura_inicio: t.altura_inicio,
                  altura_fin: t.altura_fin,
                },
                geometry: {
                  type: 'LineString',
                  coordinates: geojson.coordinates[idx],
                },
              })),
            };
          }
        }
      }

      const layer = L.geoJSON(dataToRender, {
        style: (feature) => {
          let tramoCycle = false;
          if (feature?.properties && typeof feature.properties.tiene_ciclovia === 'boolean') {
            tramoCycle = feature.properties.tiene_ciclovia;
          } else if (tramos && tramos.length === 1) {
            tramoCycle = tramos[0].tiene_ciclovia;
          } else {
            tramoCycle = hasCycleway;
          }

          const isCycle = highlightCycleways && tramoCycle;
          return {
            color: isCycle ? '#10b981' : '#0284c7', // Guaraní Emerald vs River Azure (Stitch)
            weight: isCycle ? 6 : 5,
            opacity: 0.95,
            lineJoin: 'round',
            lineCap: 'round',
          };
        },
        onEachFeature: (feature, featureLayer: Layer) => {
          const props = feature.properties || {};
          const tramoCycle =
            typeof props.tiene_ciclovia === 'boolean' ? props.tiene_ciclovia : hasCycleway;
          const tramoOrden = props.orden || null;
          const tramoLongitud = props.longitud_m ? Math.round(props.longitud_m) : null;

          const popupHtml = `
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
              <strong style="color: #0f172a; font-size: 14px;">${activeStreetName || 'Arteria seleccionada'}</strong>
              ${tramoOrden ? `<div style="color: #64748b; font-size: 11px; margin-top: 2px;">Tramo ${tramoOrden} ${tramoLongitud ? `(${tramoLongitud} m)` : ''}</div>` : ''}
              ${tramoCycle ? `<div style="color: #047857; font-weight: 600; margin-top: 4px;">🚲 Posee ciclovía / bicisenda</div>` : ''}
              ${cyclewayType && tramoCycle ? `<div style="color: #64748b; font-size: 11px;">Tipo: ${cyclewayType}</div>` : ''}
              ${props.start_height && props.end_height ? `<div style="color: #475569; margin-top: 2px;">Alturas: ${props.start_height} — ${props.end_height}</div>` : ''}
            </div>
          `;
          featureLayer.bindPopup(popupHtml);
        },
      });

      layer.addTo(map);
      geojsonLayerRef.current = layer;

      // Ajuste automático de encuadre (fitBounds)
      map.invalidateSize();
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 16,
          animate: true,
        });
      }
    }

    updateGeoJson();

    return () => {
      isCancelled = true;
    };
  }, [mapInstance, geojson, activeStreetName, hasCycleway, cyclewayType, tramos, highlightCycleways]);

  // Carga asíncrona de polígonos GeoJSON de barrios al activar el conmutador
  useEffect(() => {
    if (barriosGeojson) {
      setBarriosData(barriosGeojson);
      return;
    }
    if (showBarrios && !barriosData) {
      fetch('/api/v1/barrios/geojson')
        .then((res) => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then((data) => setBarriosData(data))
        .catch((err) => console.error('Error al cargar capa GeoJSON de barrios:', err));
    }
  }, [showBarrios, barriosData, barriosGeojson]);

  // Renderizado y sincronización de la capa vectorial de barrios en Leaflet
  useEffect(() => {
    let isCancelled = false;

    async function updateBarriosLayer() {
      if (!mapInstance) return;
      const L = await import('leaflet');
      if (isCancelled) return;

      if (barriosLayerRef.current) {
        mapInstance.removeLayer(barriosLayerRef.current);
        barriosLayerRef.current = null;
      }

      if (!showBarrios || !barriosData) return;

      const activeBarriosSet = new Set((barrios || []).map((b) => b.toLowerCase().trim()));

      const layer = L.geoJSON(barriosData, {
        style: (feature) => {
          const props = feature?.properties || {};
          const bName = (props.nombre || '').toLowerCase().trim();
          const isContextual = activeBarriosSet.has(bName);

          if (isContextual) {
            return {
              color: '#0284c7', // River Azure resaltado
              weight: 2.5,
              fillColor: '#38bdf8',
              fillOpacity: 0.22,
            };
          }

          return {
            color: '#64748b', // Slate sutil
            weight: 1.2,
            fillColor: '#94a3b8',
            fillOpacity: 0.08,
            dashArray: '4, 4',
          };
        },
        onEachFeature: (feature, featureLayer: Layer) => {
          const props = feature.properties || {};
          const name = props.nombre || 'Barrio sin nombre';
          const chacra = props.numero_chacra ? `Chacra ${props.numero_chacra}` : null;
          const tipo = props.tipo === 'CHACRA' ? 'Chacra' : props.tipo === 'BARRIO_OFICIAL' ? 'Barrio Oficial' : 'Barrio';
          const ordenanza = props.referencia_ordenanza;

          featureLayer.bindTooltip(
            `<strong>${name}</strong>${chacra ? ` (${chacra})` : ''}`,
            { sticky: true }
          );

          const popupHtml = `
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4;">
              <div style="font-weight: 700; color: #0f172a; font-size: 14px;">🏘️ ${name}</div>
              <div style="color: #64748b; font-size: 11px; margin-top: 2px;">${tipo}${chacra ? ` • ${chacra}` : ''}</div>
              ${ordenanza ? `<div style="color: #0369a1; font-weight: 500; font-size: 11px; margin-top: 4px; background: #f0f9ff; padding: 2px 6px; border-radius: 4px; border: 1px solid #bae6fd;">📜 ${ordenanza}</div>` : ''}
            </div>
          `;
          featureLayer.bindPopup(popupHtml);
        },
      });

      layer.addTo(mapInstance);

      // Traer la capa de trazas de calles al frente para no ocultar la arteria activa
      if (geojsonLayerRef.current) {
        geojsonLayerRef.current.bringToFront();
      }

      barriosLayerRef.current = layer;
    }

    updateBarriosLayer();

    return () => {
      isCancelled = true;
    };
  }, [mapInstance, showBarrios, barriosData, barrios]);

  // Controles HUD de navegación
  const handleZoomIn = useCallback(() => {
    (mapInstance || mapInstanceRef.current)?.zoomIn();
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    (mapInstance || mapInstanceRef.current)?.zoomOut();
  }, [mapInstance]);

  const handleRecenter = useCallback(() => {
    const map = mapInstance || mapInstanceRef.current;
    if (!map) return;
    if (geojsonLayerRef.current) {
      const bounds = geojsonLayerRef.current.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        return;
      }
    }
    map.setView(POSADAS_CENTER, DEFAULT_ZOOM);
  }, [mapInstance]);

  return (
    <div className={`relative ${className} w-full h-full overflow-hidden`}>
      <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

      {/* Controles HUD flotantes (Stitch Map Controls) */}
      <div className="absolute top-4 right-4 z-[1000] flex flex-col items-end gap-2 pointer-events-auto">
        <div className="w-9 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/90 overflow-hidden flex flex-col divide-y divide-slate-100">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-full h-9 flex items-center justify-center text-slate-700 hover:text-posadas-river hover:bg-slate-50 transition-colors font-bold text-lg select-none"
            title="Acercar mapa (+)"
          >
            +
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-full h-9 flex items-center justify-center text-slate-700 hover:text-posadas-river hover:bg-slate-50 transition-colors font-bold text-lg select-none"
            title="Alejar mapa (-)"
          >
            −
          </button>
        </div>

        <button
          type="button"
          onClick={handleRecenter}
          className="w-9 h-9 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-slate-200/90 flex items-center justify-center text-slate-700 hover:text-posadas-river hover:bg-slate-50 transition-colors text-sm"
          title="Centrar en Posadas / Traza"
        >
          🎯
        </button>

        {/* Conmutador de ciclovías HUD */}
        <button
          type="button"
          onClick={() => setHighlightCycleways((v) => !v)}
          className={`px-2.5 py-1.5 rounded-xl shadow-md border text-xs font-semibold flex items-center gap-1.5 transition-all backdrop-blur-md ${
            highlightCycleways
              ? 'bg-emerald-500/95 text-white border-emerald-600 shadow-emerald-500/20'
              : 'bg-white/95 text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Alternar resalte de ciclovías"
        >
          <span>🚲</span>
          <span className="hidden sm:inline">Ciclovías</span>
        </button>

        {/* Conmutador de barrios HUD (FEAT-008) */}
        <button
          type="button"
          onClick={() => setShowBarrios((v) => !v)}
          className={`px-2.5 py-1.5 rounded-xl shadow-md border text-xs font-semibold flex items-center gap-1.5 transition-all backdrop-blur-md ${
            showBarrios
              ? 'bg-sky-600/95 text-white border-sky-700 shadow-sky-600/20'
              : 'bg-white/95 text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Alternar capa interactiva de barrios y chacras"
        >
          <span>🏘️</span>
          <span className="hidden sm:inline">Barrios</span>
        </button>
      </div>

      {/* Píldora de referencia espacial Stitch (inferior izquierda) */}
      <div className="absolute bottom-3 left-3 z-[1000] hidden md:flex items-center gap-2 bg-slate-900/85 text-slate-200 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-mono shadow-md border border-slate-700/80">
        <span className="text-posadas-river font-sans font-semibold">Posadas</span>
        <span className="text-slate-400">•</span>
        <span>-27.367°, -55.896°</span>
        <span className="text-slate-400">•</span>
        <span className="text-emerald-400">WGS84</span>
      </div>

      {/* Leyenda visual superpuesta (inferior derecha) */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200/90 text-xs flex flex-col gap-1.5 pointer-events-auto">
        <span className="font-semibold text-slate-800 text-[11px] tracking-wide uppercase">Referencias</span>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 bg-[#0284c7] rounded-full"></span>
          <span className="text-slate-600 text-[11px]">Traza oficial</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1.5 bg-[#10b981] rounded-full"></span>
          <span className="text-slate-600 text-[11px]">Infraestructura ciclista</span>
        </div>
        {showBarrios && (
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-2 bg-[#38bdf8]/30 border border-[#0284c7] rounded-sm"></span>
            <span className="text-slate-600 text-[11px]">Límites de barrio / chacra</span>
          </div>
        )}
      </div>
    </div>
  );
}
