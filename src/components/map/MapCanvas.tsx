// Real MapLibre + OneMap SG basemap. All overlays painted from the
// shared truth store; coordinates are real lng/lat over Singapore.

import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { Map, Marker, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useAppContext } from '../../AppContext';
import {
  MapPin,
  Hexagon,
  MousePointer2,
  Eraser,
  Undo2,
  Grid3x3,
} from 'lucide-react';
import CoveragePreview from '../primitives/CoveragePreview';
import { severityPinSize } from '../primitives/SeverityChip';
import type { LngLat } from '../../AppContext';

// OneMap SG public basemap tiles. CORS-enabled, no key.
const ONEMAP_GREY = 'https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png';
const ONEMAP_DEFAULT = 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png';

const SG_CENTER: [number, number] = [103.8198, 1.3521];

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerStore = useRef<Marker[]>([]);
  const polygonSourceIds = useRef<string[]>([]);

  const {
    role,
    events,
    responders,
    sosSessions,
    cases,
    setSelectedId,
    setDrawerContent,
  } = useAppContext();

  const [drawMode, setDrawMode] = useState<
    'select' | 'point' | 'polygon' | 'rect' | 'circle' | 'freehand' | 'erase'
  >('select');
  const [snap, setSnap] = useState(true);
  const [acceptedPartialCells, setAcceptedPartialCells] = useState(false);
  const [draftPolygon, setDraftPolygon] = useState<LngLat[]>([]);

  const isDrawing = role === 'ops' && drawMode !== 'select';

  // ---- map init ----
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: {
        version: 8,
        sources: {
          'onemap-grey': {
            type: 'raster',
            tiles: [ONEMAP_GREY],
            tileSize: 256,
            attribution:
              '© <a href="https://www.onemap.gov.sg">OneMap</a> · contributors',
          },
        },
        layers: [
          {
            id: 'onemap-grey-layer',
            type: 'raster',
            source: 'onemap-grey',
          },
        ],
      },
      center: SG_CENTER,
      zoom: 11.2,
      minZoom: 10,
      maxZoom: 18,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

    map.on('load', () => {
      // Severity overlay sources prep
      map.addSource('event-polygons', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'event-polygons-fill',
        type: 'fill',
        source: 'event-polygons',
        paint: {
          'fill-color': [
            'match',
            ['get', 'sev'],
            1, '#1A1A1A',
            2, '#60A5FA',
            3, '#FEF08A',
            4, '#EF4444',
            5, '#EF4444',
            '#1A1A1A',
          ],
          'fill-opacity': 0.18,
        },
      });
      map.addLayer({
        id: 'event-polygons-line',
        type: 'line',
        source: 'event-polygons',
        paint: {
          'line-color': [
            'match',
            ['get', 'sev'],
            1, '#1A1A1A',
            2, '#60A5FA',
            3, '#FEF08A',
            4, '#EF4444',
            5, '#EF4444',
            '#1A1A1A',
          ],
          'line-width': 2,
          'line-dasharray': [3, 2],
        },
      });

      map.addSource('case-halos', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'case-halos-circle',
        type: 'circle',
        source: 'case-halos',
        paint: {
          'circle-color': '#EF4444',
          'circle-opacity': 0.1,
          'circle-radius': 50,
          'circle-stroke-color': '#EF4444',
          'circle-stroke-width': 2,
          'circle-stroke-opacity': 0.7,
        },
      });

      map.addSource('responder-routes', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'responder-routes-line',
        type: 'line',
        source: 'responder-routes',
        paint: {
          'line-color': '#EF4444',
          'line-width': 2.5,
          'line-dasharray': [3, 2],
        },
      });

      map.addSource('draft', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'draft-fill',
        type: 'fill',
        source: 'draft',
        paint: { 'fill-color': '#60A5FA', 'fill-opacity': 0.2 },
      });
      map.addLayer({
        id: 'draft-line',
        type: 'line',
        source: 'draft',
        paint: { 'line-color': '#60A5FA', 'line-width': 2 },
      });
    });

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ---- click to add polygon vertex while drawing ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const handler = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawing || drawMode !== 'polygon') return;
      setDraftPolygon((prev) => [...prev, { lng: e.lngLat.lng, lat: e.lngLat.lat }]);
    };
    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [isDrawing, drawMode]);

  // ---- repaint overlays whenever store changes ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      const interval = setInterval(() => {
        if (mapRef.current?.isStyleLoaded()) {
          clearInterval(interval);
          repaint();
        }
      }, 100);
      return () => clearInterval(interval);
    }
    repaint();
    function repaint() {
      const m = mapRef.current!;
      // polygons
      m.getSource('event-polygons') &&
        (m.getSource('event-polygons') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: events
            .filter((e) => e.area && e.area.length >= 3)
            .map((e) => ({
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [...(e.area as LngLat[]).map((p) => [p.lng, p.lat]), [e.area![0].lng, e.area![0].lat]],
                ],
              },
              properties: { sev: e.severity, id: e.id },
            })),
        } as GeoJSON.FeatureCollection);

      // case halos
      m.getSource('case-halos') &&
        (m.getSource('case-halos') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: cases.map((c) => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [c.centroid.lng, c.centroid.lat] },
            properties: { id: c.id, sev: c.severity },
          })),
        } as GeoJSON.FeatureCollection);

      // responder routes
      m.getSource('responder-routes') &&
        (m.getSource('responder-routes') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: responders
            .filter((r) => r.status === 'en_route' && r.assignedSosId)
            .map((r) => {
              const sos = sosSessions.find((s) => s.id === r.assignedSosId);
              if (!sos) return null;
              return {
                type: 'Feature',
                geometry: {
                  type: 'LineString',
                  coordinates: [
                    [r.location.lng, r.location.lat],
                    [sos.location.lng, sos.location.lat],
                  ],
                },
                properties: {},
              };
            })
            .filter(Boolean) as GeoJSON.Feature[],
        } as GeoJSON.FeatureCollection);

      // draft polygon
      m.getSource('draft') &&
        (m.getSource('draft') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features:
            draftPolygon.length >= 2
              ? [
                  {
                    type: 'Feature',
                    geometry: {
                      type: 'Polygon',
                      coordinates: [[
                        ...draftPolygon.map((p) => [p.lng, p.lat]),
                        [draftPolygon[0].lng, draftPolygon[0].lat],
                      ]],
                    },
                    properties: {},
                  },
                ]
              : [],
        } as GeoJSON.FeatureCollection);

      // markers
      for (const mk of markerStore.current) mk.remove();
      markerStore.current = [];

      const role = roleRef.current;
      const visibleEvents = events;
      const visibleResp = role === 'citizen' ? [] : responders;
      const visibleSos = sosSessions.filter(
        (s) => !['resolved', 'cancelled'].includes(s.status)
      );

      for (const e of visibleEvents) {
        const sz = severityPinSize(e.severity) + 8;
        const el = document.createElement('button');
        el.className = pinClass(e.severity);
        el.style.width = sz + 'px';
        el.style.height = sz + 'px';
        el.title = e.title + (e.liveValue ? ' · ' + e.liveValue : '');
        el.innerHTML = `<span style="font-size:9px;font-weight:900;font-family:ui-monospace">${
          e.kind === 'fire' ? 'F' : e.kind === 'flood' ? '~' : e.kind === 'crash' ? '!' : e.kind === 'medical' ? '+' : e.kind === 'weather' ? '°' : 'i'
        }</span>`;
        el.onclick = (ev) => {
          ev.stopPropagation();
          setSelectedId(e.id);
          setDrawerContent(role === 'ops' ? 'incident_ops' : 'local_alert');
        };
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([e.location.lng, e.location.lat])
          .setPopup(
            new Popup({ offset: 12, closeButton: false }).setHTML(
              `<div style="font-family:ui-sans-serif;font-size:10px;text-transform:uppercase;font-weight:700;letter-spacing:0.1em">${e.title}${
                e.liveValue ? ' · ' + e.liveValue : ''
              }</div>`
            )
          )
          .addTo(m);
        markerStore.current.push(marker);
      }

      for (const s of visibleSos) {
        const el = document.createElement('button');
        el.className =
          'sos-pin w-8 h-8 -ml-4 -mt-4 flex items-center justify-center border-2 border-black bg-red-500 text-white shadow-[3px_3px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer';
        el.style.borderRadius = '0';
        el.title = `${s.id} · ${s.category} · ${s.status}`;
        el.innerHTML = `<span style="font-size:10px;font-weight:900;font-family:ui-monospace">SOS</span>`;
        el.onclick = (ev) => {
          ev.stopPropagation();
          setSelectedId(s.id);
          setDrawerContent(role === 'citizen' ? 'sos_live' : 'distress_oversight');
        };
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([s.location.lng, s.location.lat])
          .addTo(m);
        markerStore.current.push(marker);
      }

      for (const r of visibleResp) {
        const tone =
          r.status === 'en_route'
            ? 'bg-yellow-200 text-black'
            : r.status === 'on_scene'
            ? 'bg-green-400 text-black'
            : 'bg-black text-white';
        const el = document.createElement('div');
        el.className = `responder-pin -ml-3 -mt-3 w-6 h-6 ${tone} border border-black flex items-center justify-center shadow-[2px_2px_0_#000]`;
        el.title = `${r.name} · ${r.org} · ${r.status}`;
        el.innerHTML = `<span style="font-size:9px;font-weight:900;font-family:ui-monospace">${r.name[0]}</span>`;
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([r.location.lng, r.location.lat])
          .addTo(m);
        markerStore.current.push(marker);
      }
    }
  }, [events, responders, sosSessions, cases, draftPolygon, setDrawerContent, setSelectedId]);

  // capture latest role in ref for marker click handlers
  const roleRef = useRef(role);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const drawCellCount = Math.max(1, Math.floor(draftPolygon.length * 1.6));
  useEffect(() => {
    setAcceptedPartialCells(false);
  }, [draftPolygon.length]);

  const finishDraft = () => {
    if (draftPolygon.length >= 3) setDrawerContent('declare');
  };
  const clearDraft = () => setDraftPolygon([]);

  return (
    <div className="absolute inset-0 bg-surface-2">
      <div
        ref={containerRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* viewport label */}
      <div className="absolute top-3 left-3 z-10 bg-black text-white px-2 py-1 text-[9px] font-bold tracking-widest uppercase shadow-[3px_3px_0_#000] border border-black">
        MAP · SG · {role.toUpperCase()}
      </div>

      {/* drawing toolbar (ops only) */}
      {role === 'ops' && (
        <div className="absolute top-1/2 right-3 -translate-y-1/2 z-10 bg-white border border-black shadow-[4px_4px_0_#000] p-1 flex flex-col gap-0.5">
          <ToolBtn icon={MousePointer2} active={drawMode === 'select'} title="Select" onClick={() => setDrawMode('select')} />
          <ToolBtn icon={Hexagon} active={drawMode === 'polygon'} title="Polygon" onClick={() => setDrawMode('polygon')} />
          <div className="h-px bg-black my-1" />
          <ToolBtn icon={Grid3x3} active={snap} title="Snap to cell" onClick={() => setSnap(!snap)} />
          <div className="h-px bg-black my-1" />
          <ToolBtn icon={Undo2} active={false} title="Undo" onClick={() => setDraftPolygon((p) => p.slice(0, -1))} />
          <ToolBtn icon={Eraser} active={false} title="Clear" onClick={clearDraft} />
        </div>
      )}

      {/* coverage preview while drawing */}
      {isDrawing && draftPolygon.length > 0 && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 w-[420px]">
          <CoveragePreview
            cells={drawCellCount}
            precision="gh5"
            estimatedDevices={drawCellCount * 680}
            estimatedResidents={drawCellCount * 2100}
            partialCells={snap || acceptedPartialCells ? 0 : Math.min(2, draftPolygon.length)}
            onSnap={() => setSnap(true)}
            onKeep={() => setAcceptedPartialCells(true)}
          />
        </div>
      )}

      {/* finish polygon */}
      {isDrawing && draftPolygon.length >= 3 && (
        <button
          onClick={finishDraft}
          className="absolute top-3 right-16 z-10 bg-green-400 text-black px-3 py-2 text-[10px] font-black uppercase tracking-widest border border-black shadow-[3px_3px_0_#000]"
        >
          Continue to declare →
        </button>
      )}
    </div>
  );
}

function pinClass(sev: number) {
  const base =
    'event-pin flex items-center justify-center border-2 border-black shadow-[3px_3px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer';
  const tone =
    sev >= 4
      ? 'bg-red-500 text-white'
      : sev === 3
      ? 'bg-yellow-200 text-black'
      : sev === 2
      ? 'bg-blue-400 text-white'
      : 'bg-white text-black';
  return base + ' ' + tone;
}

function ToolBtn({
  icon: Icon,
  active,
  title,
  onClick,
}: {
  icon: typeof MapPin;
  active: boolean;
  title: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 flex items-center justify-center border border-black cursor-pointer transition-colors ${
        active ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
