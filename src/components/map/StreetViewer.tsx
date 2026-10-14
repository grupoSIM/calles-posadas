'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import type { Map as LeafletMap, GeoJSON as LeafletGeoJSON, Layer } from 'leaflet';
import type { EjeVialInfo } from '@/lib/db/streets';

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
  cicloviasGeojson?: any | null;
  ejeVial?: EjeVialInfo | null;
  showCorredor?: boolean;
  onToggleCorredor?: () => void;
  showCiclovias?: boolean;
  onToggleCiclovias?: () => void;
  onSelectStreet?: (slug: string) => void;
  onSelectBarrio?: (barrio: { id: number; name: string }) => void;
  className?: string;
}

const POSADAS_CENTER: [number, number] = [-27.382, -55.902];
const DEFAULT_ZOOM = 13;

let cachedLeaflet: typeof import('leaflet') | null = null;

export default function StreetViewer({
  geojson,
  activeStreetName,
  hasCycleway = false,
  cyclewayType,
  tramos = [],
  barrios = [],
  barriosGeojson = null,
  cicloviasGeojson = null,
  ejeVial = null,
  showCorredor: showCorredorProp,
  onToggleCorredor,
  showCiclovias: showCicloviasProp,
  onToggleCiclovias,
  onSelectStreet,
  onSelectBarrio,
  className = 'w-full h-full',
}: StreetViewerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [mapInstance, setMapInstance] = useState<LeafletMap | null>(null);
  const geojsonLayerRef = useRef<LeafletGeoJSON | null>(null);
  const barriosLayerRef = useRef<LeafletGeoJSON | null>(null);
  const corredorLayerRef = useRef<LeafletGeoJSON | null>(null);
  const cicloviasLayerRef = useRef<LeafletGeoJSON | null>(null);
  const onSelectStreetRef = useRef(onSelectStreet);
  useEffect(() => {
    onSelectStreetRef.current = onSelectStreet;
  }, [onSelectStreet]);

  const onSelectBarrioRef = useRef(onSelectBarrio);
  useEffect(() => {
    onSelectBarrioRef.current = onSelectBarrio;
  }, [onSelectBarrio]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__posadasSelectBarrio = (id: number, name: string) => {
        if (onSelectBarrioRef.current && id) {
          onSelectBarrioRef.current({ id, name });
        } else if (id) {
          window.location.href = `/?barrio_id=${id}`;
        }
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__posadasSelectBarrio;
      }
    };
  }, []);

  const [highlightCycleways, setHighlightCycleways] = useState(true);
  const [showBarrios, setShowBarrios] = useState(false);
  const [internalShowCiclovias, setInternalShowCiclovias] = useState(false);
  const isCicloviasVisible = typeof showCicloviasProp === 'boolean' ? showCicloviasProp : internalShowCiclovias;

  const handleToggleCiclovias = () => {
    if (onToggleCiclovias) {
      onToggleCiclovias();
    } else {
      setInternalShowCiclovias((prev) => !prev);
    }
  };

  const [cicloviasData, setCicloviasData] = useState<any>(cicloviasGeojson || null);
  const [internalShowCorredor, setInternalShowCorredor] = useState(false);
  const isCorredorVisible = typeof showCorredorProp === 'boolean' ? showCorredorProp : internalShowCorredor;

  // Resetear corredor a false cuando cambia la calle activa en modo no controlado (sin provocar ciclos de re-render)
  const [prevStreetName, setPrevStreetName] = useState(activeStreetName);
  if (prevStreetName !== activeStreetName) {
    setPrevStreetName(activeStreetName);
    if (typeof showCorredorProp !== 'boolean') {
      setInternalShowCorredor(false);
    }
  }

  const handleToggleCorredor = () => {
    if (onToggleCorredor) {
      onToggleCorredor();
    } else {
      setInternalShowCorredor((prev) => !prev);
    }
  };

  const [barriosData, setBarriosData] = useState<any>(barriosGeojson || null);

  // Inicialización del mapa en cliente con controles HUD personalizados
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (typeof window === 'undefined' || !mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      const L = cachedLeaflet || (await import('leaflet'));
      if (!cachedLeaflet) cachedLeaflet = L;

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

      // ResizeObserver para detectar cambios de dimensiones del contenedor (ej. colapso de panel lateral FEAT-013)
      let resizeObserver: ResizeObserver | null = null;
      if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
        resizeObserver = new ResizeObserver(() => {
          mapInstanceRef.current?.invalidateSize();
        });
        resizeObserver.observe(mapContainerRef.current);
      }

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        window.removeEventListener('resize', handleResize);
        if (resizeObserver) {
          resizeObserver.disconnect();
        }
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
      const L = cachedLeaflet || (await import('leaflet'));
      if (!cachedLeaflet) cachedLeaflet = L;
      if (isCancelled) return;

      const map = mapInstance;

      // Limpiar capas previas
      if (geojsonLayerRef.current) {
        map.removeLayer(geojsonLayerRef.current);
        geojsonLayerRef.current = null;
      }
      if (corredorLayerRef.current) {
        map.removeLayer(corredorLayerRef.current);
        corredorLayerRef.current = null;
      }

      if (!geojson) {
        map.setView(POSADAS_CENTER, DEFAULT_ZOOM);
        return;
      }

      // 1. Renderizar trazas complementarias del corredor vial (FEAT-014)
      let corredorLayer: LeafletGeoJSON | null = null;
      if (ejeVial && ejeVial.arterias && ejeVial.arterias.length > 1 && isCorredorVisible) {
        const companionArterias = ejeVial.arterias.filter(a => !a.is_current && a.geojson);
        if (companionArterias.length > 0) {
          const features: any[] = [];
          companionArterias.forEach(art => {
            const g = art.geojson;
            if (g.type === 'FeatureCollection' && Array.isArray(g.features)) {
              g.features.forEach((f: any) => {
                features.push({
                  ...f,
                  properties: {
                    ...f.properties,
                    slug: art.slug,
                    official_name: art.official_name,
                    total_length_m: art.total_length_m,
                  }
                });
              });
            } else if (g.type === 'Feature') {
              features.push({
                ...g,
                properties: {
                  ...g.properties,
                  slug: art.slug,
                  official_name: art.official_name,
                  total_length_m: art.total_length_m,
                }
              });
            } else if (g.type === 'LineString' || g.type === 'MultiLineString') {
              features.push({
                type: 'Feature',
                properties: {
                  slug: art.slug,
                  official_name: art.official_name,
                  total_length_m: art.total_length_m,
                },
                geometry: g
              });
            }
          });

          if (features.length > 0) {
            corredorLayer = L.geoJSON({ type: 'FeatureCollection', features } as any, {
              style: () => ({
                color: '#6366f1', // Indigo 500
                weight: 4,
                opacity: 0.8,
                dashArray: '6, 6',
                lineJoin: 'round',
                lineCap: 'round',
              }),
              onEachFeature: (feature, cLayer: Layer) => {
                const p = feature.properties || {};
                const name = p.official_name || 'Tramo del corredor';
                const len = p.total_length_m
                  ? (p.total_length_m >= 1000 ? `${(p.total_length_m / 1000).toFixed(2)} km` : `${Math.round(p.total_length_m)} m`)
                  : '';

                cLayer.bindTooltip(`
                  <div style="font-family: inherit; font-size: 11px; padding: 2px;">
                    <strong style="color: #1e1b4b; font-size: 12px;">${name}</strong>
                    <div style="color: #4f46e5; font-size: 10px; font-weight: 600;">Parte de ${ejeVial.nombre_eje} ${len ? `(${len})` : ''}</div>
                    <div style="color: #64748b; font-size: 9px; margin-top: 2px;">Clic para consultar ficha técnica</div>
                  </div>
                `, { sticky: true, opacity: 0.95 });

                cLayer.on('click', () => {
                  if (p.slug) {
                    if (onSelectStreetRef.current) {
                      onSelectStreetRef.current(p.slug);
                    } else if (typeof window !== 'undefined') {
                      window.location.href = `/calles/${p.slug}`;
                    }
                  }
                });

                if ('setStyle' in cLayer) {
                  const pathL = cLayer as any;
                  pathL.on('mouseover', () => {
                    pathL.setStyle({ color: '#4338ca', weight: 6, opacity: 1 });
                  });
                  pathL.on('mouseout', () => {
                    pathL.setStyle({ color: '#6366f1', weight: 4, opacity: 0.8 });
                  });
                }
              }
            });

            corredorLayer.addTo(map);
            corredorLayerRef.current = corredorLayer;
          }
        }
      }

      // Determinar la estructura GeoJSON de la arteria activa
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
      layer.bringToFront();
      geojsonLayerRef.current = layer;

      // Ajuste automático de encuadre (fitBounds)
      map.invalidateSize();
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        if (corredorLayer && isCorredorVisible) {
          const cBounds = corredorLayer.getBounds();
          if (cBounds.isValid()) {
            bounds.extend(cBounds);
          }
        }
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
  }, [mapInstance, geojson, activeStreetName, hasCycleway, cyclewayType, tramos, highlightCycleways, ejeVial, isCorredorVisible]);

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

  // Carga asíncrona de GeoJSON de red ciclable al activar el conmutador (FEAT-012)
  useEffect(() => {
    if (cicloviasGeojson) {
      setCicloviasData(cicloviasGeojson);
      return;
    }
    if (isCicloviasVisible && !cicloviasData) {
      fetch('/api/v1/ciclovias/geojson')
        .then((res) => {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then((data) => setCicloviasData(data))
        .catch((err) => console.error('Error al cargar capa GeoJSON de ciclovías:', err));
    }
  }, [isCicloviasVisible, cicloviasData, cicloviasGeojson]);

  // Renderizado y sincronización de la capa vectorial de barrios en Leaflet
  useEffect(() => {
    let isCancelled = false;

    async function updateBarriosLayer() {
      if (!mapInstance) return;
      const L = cachedLeaflet || (await import('leaflet'));
      if (!cachedLeaflet) cachedLeaflet = L;
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
          const rawOrdenanza = props.referencia_ordenanza ? props.referencia_ordenanza.trim() : null;
          const ordenanza = rawOrdenanza && !['no', '-', 'null', 's/d', 's/n', 'sin ordenanza'].includes(rawOrdenanza.toLowerCase()) ? rawOrdenanza : null;
          const rawArticulo = props.articulo_ordenanza ? props.articulo_ordenanza.trim() : null;
          const articulo = rawArticulo && !['no', '-', 'null'].includes(rawArticulo.toLowerCase())
            ? (rawArticulo.toLowerCase().startsWith('art') ? rawArticulo : `Art. ${rawArticulo}`)
            : null;
          const delegacion = props.delegacion || null;
          const seccion = props.seccion ? `Sección ${props.seccion}` : null;
          const superficieM2 = typeof props.superficie_m2 === 'number' ? props.superficie_m2 : 0;
          let superficieStr = null;
          if (superficieM2 > 0) {
            const ha = (superficieM2 / 10000).toFixed(1);
            const km2 = (superficieM2 / 1000000).toFixed(2);
            superficieStr = `${ha} ha (${km2} km²)`;
          }
          const bName = (props.nombre || '').toLowerCase().trim();
          const isContextual = activeBarriosSet.has(bName);

          featureLayer.bindTooltip(
            `<strong>${name}</strong>${chacra ? ` (${chacra})` : ''}`,
            { sticky: true }
          );

          const safeName = (props.nombre || name).replace(/'/g, "\\'");
          const popupHtml = `
            <div class="posadas-barrio-popup" style="font-family: inherit; font-size: 13px; line-height: 1.45; min-width: 240px; max-width: 280px; padding: 2px;">
              <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px;">
                <div>
                  <div style="font-weight: 700; color: #0f172a; font-size: 15px; display: flex; align-items: center; gap: 4px;">
                    <span>🏘️</span>
                    <span>${name}</span>
                  </div>
                  <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
                    ${tipo}${chacra ? ` • ${chacra}` : ''}
                  </div>
                </div>
                <span style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 9999px; white-space: nowrap;">
                  ${tipo}
                </span>
              </div>

              <div style="display: flex; flex-direction: column; gap: 5px; margin-bottom: 10px;">
                ${delegacion ? `
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #334155;">
                    <span style="font-size: 13px;">🏛️</span>
                    <span><strong style="color: #475569;">Delegación:</strong> ${delegacion}</span>
                  </div>` : ''}

                ${seccion ? `
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #334155;">
                    <span style="font-size: 13px;">📐</span>
                    <span><strong style="color: #475569;">Catastro:</strong> ${seccion}</span>
                  </div>` : ''}

                ${superficieStr ? `
                  <div style="display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: #334155;">
                    <span style="font-size: 13px;">🗺️</span>
                    <span><strong style="color: #475569;">Superficie:</strong> ${superficieStr}</span>
                  </div>` : ''}

                ${ordenanza ? `
                  <div style="margin-top: 2px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 4px 8px; font-size: 11px; color: #0369a1;">
                    <div style="font-weight: 600; display: flex; align-items: center; gap: 4px;">
                      <span>📜</span>
                      <span>${ordenanza}</span>
                    </div>
                    ${articulo ? `<div style="color: #64748b; font-size: 10.5px; margin-left: 18px;">${articulo}</div>` : ''}
                  </div>` : ''}
              </div>

              <button
                type="button"
                class="btn-filter-barrio"
                data-barrio-id="${props.id || ''}"
                data-barrio-name="${safeName}"
                onclick="window.__posadasSelectBarrio && window.__posadasSelectBarrio(${props.id || 0}, '${safeName}')"
                style="width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px; background: #0284c7; color: #ffffff; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 6px; border: none; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: background 0.15s ease;"
              >
                <span>🔍</span>
                <span>Ver calles en este barrio</span>
              </button>
            </div>
          `;
          featureLayer.bindPopup(popupHtml);

          // Resaltado reactivo sobre el contorno poligonal real al abrir/cerrar popup (ERR-002)
          if ('setStyle' in featureLayer && typeof (featureLayer as any).setStyle === 'function') {
            const pathLayer = featureLayer as import('leaflet').Path;
            pathLayer.on('popupopen', (e: any) => {
              pathLayer.setStyle({
                color: '#0284c7', // River Azure destacado
                weight: 2.5,
                fillColor: '#38bdf8',
                fillOpacity: 0.28,
                dashArray: '',
              });
              pathLayer.bringToFront();
              if (geojsonLayerRef.current) {
                geojsonLayerRef.current.bringToFront();
              }

              const popupEl = (e?.popup?.getElement ? e.popup.getElement() : null) || (e?.popup?._contentNode) || document.querySelector('.leaflet-popup');
              const filterBtn = popupEl?.querySelector('.btn-filter-barrio') as HTMLButtonElement | null;
              if (filterBtn) {
                filterBtn.onclick = (evt: MouseEvent) => {
                  evt.stopPropagation();
                  if (onSelectBarrioRef.current && props.id) {
                    onSelectBarrioRef.current({ id: props.id, name: props.nombre || name });
                  } else if (props.id && typeof window !== 'undefined') {
                    window.location.href = `/?barrio_id=${props.id}`;
                  }
                };
              }
            });

            pathLayer.on('popupclose', () => {
              pathLayer.setStyle(
                isContextual
                  ? {
                      color: '#0284c7',
                      weight: 2.5,
                      fillColor: '#38bdf8',
                      fillOpacity: 0.22,
                      dashArray: '',
                    }
                  : {
                      color: '#64748b',
                      weight: 1.2,
                      fillColor: '#94a3b8',
                      fillOpacity: 0.08,
                      dashArray: '4, 4',
                    }
              );
            });
          }
        },
      });

      layer.addTo(mapInstance);

      // Traer la capa de trazas de calles al frente para no ocultar la arteria activa
      if (geojsonLayerRef.current) {
        geojsonLayerRef.current.bringToFront();
      }

      barriosLayerRef.current = layer;
      if (typeof window !== 'undefined') {
        (window as any).__barriosLayer = layer;
      }
    }

    updateBarriosLayer();

    return () => {
      isCancelled = true;
    };
  }, [mapInstance, showBarrios, barriosData, barrios]);

  // Renderizado y sincronización de la capa vectorial de ciclovías en Leaflet (FEAT-012)
  useEffect(() => {
    let isCancelled = false;

    async function updateCicloviasLayer() {
      if (!mapInstance) return;
      const L = cachedLeaflet || (await import('leaflet'));
      if (!cachedLeaflet) cachedLeaflet = L;
      if (isCancelled) return;

      if (cicloviasLayerRef.current) {
        mapInstance.removeLayer(cicloviasLayerRef.current);
        cicloviasLayerRef.current = null;
      }

      if (!isCicloviasVisible || !cicloviasData) return;

      const layer = L.geoJSON(cicloviasData, {
        style: (feature) => {
          const props = feature?.properties || {};
          const tipo = props.tipo || 'CICLOVIA';
          const isSegregada = tipo === 'CICLOVIA';

          return {
            color: '#10b981', // Guaraní Emerald de Stitch
            weight: isSegregada ? 3.5 : 3.0,
            opacity: 0.9,
            dashArray: isSegregada ? undefined : '5, 5',
            lineCap: 'round',
            lineJoin: 'round',
          };
        },
        onEachFeature: (feature, featureLayer: Layer) => {
          const props = feature.properties || {};
          const nombre = props.nombre || 'Ciclovía';
          const tramo = props.tramo || null;
          const ubicacion = props.ubicacion || null;
          const anio = props.anio_instalacion ? `Año ${props.anio_instalacion}` : null;
          const longitud = props.longitud_km ? `${props.longitud_km} km` : null;
          const tipoLabel = props.tipo === 'BICISENDA' ? 'Bicisenda' : props.tipo === 'USO_MIXTO' ? 'Ciclovía de Uso Mixto' : 'Ciclovía Segregada';

          featureLayer.bindTooltip(
            `<strong>🚲 ${nombre}</strong>${tramo ? `<br/><span style="font-size: 11px; color: #475569;">${tramo}</span>` : ''}`,
            { sticky: true }
          );

          const popupHtml = `
            <div style="font-family: inherit; font-size: 13px; line-height: 1.4; min-width: 180px;">
              <div style="font-weight: 700; color: #065f46; font-size: 14px;">
                🚲 ${nombre}
              </div>
              <div style="color: #64748b; font-size: 11px; margin-top: 2px;">
                ${tipoLabel}${anio ? ` • ${anio}` : ''}${longitud ? ` • ${longitud}` : ''}
              </div>
              ${tramo ? `<div style="color: #1e293b; font-size: 12px; margin-top: 6px; background: #f8fafc; padding: 4px 6px; border-radius: 4px; border: 1px solid #e2e8f0;"><strong>Tramo:</strong> ${tramo}</div>` : ''}
              ${ubicacion && ubicacion !== tramo ? `<div style="color: #475569; font-size: 11px; margin-top: 4px;"><strong>Ubicación:</strong> ${ubicacion}</div>` : ''}
            </div>
          `;
          featureLayer.bindPopup(popupHtml);

          if ('setStyle' in featureLayer && typeof (featureLayer as any).setStyle === 'function') {
            const pathLayer = featureLayer as import('leaflet').Path;
            pathLayer.on('popupopen', () => {
              pathLayer.setStyle({
                color: '#059669',
                weight: 5,
                opacity: 1,
              });
              pathLayer.bringToFront();
              if (geojsonLayerRef.current) {
                geojsonLayerRef.current.bringToFront();
              }
            });

            pathLayer.on('popupclose', () => {
              const p = feature.properties || {};
              const seg = (p.tipo || 'CICLOVIA') === 'CICLOVIA';
              pathLayer.setStyle({
                color: '#10b981',
                weight: seg ? 3.5 : 3.0,
                opacity: 0.9,
                dashArray: seg ? undefined : '5, 5',
              });
            });
          }
        },
      });

      layer.addTo(mapInstance);

      if (geojsonLayerRef.current) {
        geojsonLayerRef.current.bringToFront();
      }

      cicloviasLayerRef.current = layer;
    }

    updateCicloviasLayer();

    return () => {
      isCancelled = true;
    };
  }, [mapInstance, isCicloviasVisible, cicloviasData]);

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

        {/* Conmutador de red de ciclovías HUD (FEAT-012) */}
        <button
          type="button"
          onClick={handleToggleCiclovias}
          className={`px-2.5 py-1.5 rounded-xl shadow-md border text-xs font-semibold flex items-center gap-1.5 transition-all backdrop-blur-md ${
            isCicloviasVisible
              ? 'bg-emerald-600/95 text-white border-emerald-700 shadow-emerald-600/20 ring-2 ring-emerald-500/30'
              : 'bg-white/95 text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
          title="Alternar capa global de la red ciclable de Posadas"
        >
          <span>🚲</span>
          <span className="hidden sm:inline">Red ciclable</span>
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

        {/* Conmutador de corredor vial multi-toponímico HUD (FEAT-014 - ERR-001) */}
        {ejeVial && ejeVial.arterias && ejeVial.arterias.length > 1 && (
          <button
            type="button"
            onClick={handleToggleCorredor}
            className={`px-3 py-1.5 rounded-xl shadow-md border text-xs font-semibold flex items-center gap-1.5 transition-all backdrop-blur-md ${
              isCorredorVisible
                ? 'bg-indigo-600/95 text-white border-indigo-700 shadow-indigo-600/20'
                : 'bg-white/95 text-indigo-700 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 ring-2 ring-indigo-500/20 shadow-2xs'
            }`}
            title={
              isCorredorVisible
                ? 'Ajustar mapa exclusivamente a esta calle'
                : `Acomodar mapa para ver la traza completa de ${ejeVial.nombre_eje} (${ejeVial.arterias.length} arterias)`
            }
          >
            <span>🛣️</span>
            <span>
              {isCorredorVisible
                ? `Corredor N° ${ejeVial.numero_eje} activo`
                : `Ver corredor completo (N° ${ejeVial.numero_eje})`}
            </span>
          </button>
        )}
      </div>

      {/* Píldora de referencia espacial Stitch (inferior izquierda) */}
      <div className="absolute bottom-3 left-3 z-[1000] hidden md:flex items-center gap-2 bg-slate-900/85 text-slate-200 backdrop-blur-md px-3 py-1.5 rounded-lg text-[11px] font-mono shadow-md border border-slate-700/80">
        <span className="text-posadas-river font-sans font-semibold">Posadas</span>
        <span className="text-slate-400">•</span>
        <span>-27.382°, -55.902°</span>
        <span className="text-slate-400">•</span>
        <span className="text-emerald-400">WGS84</span>
      </div>

      {/* Leyenda visual superpuesta (inferior derecha) */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-md border border-slate-200/90 text-xs hidden md:flex flex-col gap-1.5 pointer-events-auto">
        <span className="font-semibold text-slate-800 text-[11px] tracking-wide uppercase">Referencias</span>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-1 bg-[#0284c7] rounded-full"></span>
          <span className="text-slate-600 text-[11px]">Traza oficial</span>
        </div>
        {ejeVial && ejeVial.arterias && ejeVial.arterias.length > 1 && isCorredorVisible && (
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1 border-b-2 border-dashed border-[#6366f1]"></span>
            <span className="text-slate-600 text-[11px]">{ejeVial.nombre_eje} (eje)</span>
          </div>
        )}
        {isCicloviasVisible && (
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#10b981] rounded-full"></span>
            <span className="text-slate-600 text-[11px]">Red ciclable urbana</span>
          </div>
        )}
        {hasCycleway && !isCicloviasVisible && (
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-1.5 bg-[#10b981] rounded-full"></span>
            <span className="text-slate-600 text-[11px]">Calle con ciclovía</span>
          </div>
        )}
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
