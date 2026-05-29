// Real MapLibre + OneMap SG basemap. All overlays painted from the
// shared truth store; coordinates are real lng/lat over Singapore.

import { useEffect, useMemo, useRef, useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
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
  Radio,
  Siren,
  Hospital,
  Zap,
  TrafficCone,
  Train,
  Flame,
  Waves,
  HeartPulse,
  Car,
  TriangleAlert,
  CloudRain,
  CircleHelp,
  ShieldCheck,
} from 'lucide-react';
import CoveragePreview from '../primitives/CoveragePreview';
import { severityPinSize } from '../primitives/SeverityChip';
import type { LngLat } from '../../AppContext';
import { fetchMapLayers, type LiveMapLayers, type MapPoi } from '../../services/mapLayers';

// OneMap SG public basemap tiles. CORS-enabled, no key.
const ONEMAP_GREY = 'https://www.onemap.gov.sg/maps/tiles/Grey/{z}/{x}/{y}.png';
const ONEMAP_DEFAULT = 'https://www.onemap.gov.sg/maps/tiles/Default/{z}/{x}/{y}.png';

const SG_CENTER: [number, number] = [103.8198, 1.3521];
const POI_LABEL_ZOOM = 15.5;
const SEVERITY_COLORS = {
  1: '#D1D5DB',
  2: '#60A5FA',
  3: '#FACC15',
  4: '#F97316',
  5: '#DC2626',
} as const;
const RESOURCE_COLORS = {
  hospital: '#0EA5E9',
  aed: '#10B981',
  responder: '#1A1A1A',
  official: '#2563EB',
  self: '#2563EB',
  route: '#7C3AED',
} as const;
const TRANSPORT_COLORS = {
  ok: '#22C55E',
  warning: '#F59E0B',
  critical: '#DC2626',
} as const;

const RESOURCE_LEGEND = [
  { label: 'AED', detail: 'rescue item', color: RESOURCE_COLORS.aed, icon: Zap },
  { label: 'Hospital', detail: 'care site', color: RESOURCE_COLORS.hospital, icon: Hospital },
  { label: 'Responder', detail: 'volunteer unit', color: RESOURCE_COLORS.responder, icon: Radio },
  { label: 'Official', detail: 'SCDF/SPF/SAF', color: RESOURCE_COLORS.official, icon: ShieldCheck },
];

const SEVERITY_LEGEND = [
  { level: 1, label: 'Advisory', size: 14 },
  { level: 2, label: 'Notice', size: 18 },
  { level: 3, label: 'Warning', size: 22 },
  { level: 4, label: 'Severe', size: 26 },
  { level: 5, label: 'Emergency', size: 30 },
] as const;

const TRANSPORT_LEGEND = [
  { label: 'OK', color: TRANSPORT_COLORS.ok },
  { label: 'Slow', color: TRANSPORT_COLORS.warning },
  { label: 'Crash', color: TRANSPORT_COLORS.critical },
] as const;

const DEMO_HOSPITAL_POIS: MapPoi[] = [
  { id: 'H-SGH', name: 'SGH', detail: 'Hospital · demo fallback', lng: 103.8359, lat: 1.2806, source: 'demo' },
  { id: 'H-CGH', name: 'CGH', detail: 'Hospital · demo fallback', lng: 103.9493, lat: 1.3401, source: 'demo' },
  { id: 'H-TTSH', name: 'TTSH', detail: 'Hospital · demo fallback', lng: 103.8469, lat: 1.3214, source: 'demo' },
  { id: 'H-NUH', name: 'NUH', detail: 'Hospital · demo fallback', lng: 103.7836, lat: 1.2949, source: 'demo' },
  { id: 'H-KTPH', name: 'KTPH', detail: 'Hospital · demo fallback', lng: 103.8386, lat: 1.4245, source: 'demo' },
];

const DEMO_AED_POIS: MapPoi[] = [
  { id: 'AED-CITYHALL', name: 'AED', detail: 'Public AED · demo fallback', lng: 103.8521, lat: 1.2931, source: 'demo' },
  { id: 'AED-SGH', name: 'AED', detail: 'Public AED · demo fallback', lng: 103.8322, lat: 1.2848, source: 'demo' },
  { id: 'AED-BEDOK', name: 'AED', detail: 'Public AED · demo fallback', lng: 103.9298, lat: 1.324, source: 'demo' },
  { id: 'AED-JE', name: 'AED', detail: 'Public AED · demo fallback', lng: 103.7423, lat: 1.3331, source: 'demo' },
];

const DEMO_TRAFFIC_POIS: MapPoi[] = [
  { id: 'TR-AYE', name: 'AYE crash', detail: 'Traffic incident · demo fallback', lng: 103.79, lat: 1.28, tone: 'critical', source: 'demo' },
  { id: 'TR-CTE', name: 'CTE slow', detail: 'Speed band · demo fallback', lng: 103.843, lat: 1.329, tone: 'warning', source: 'demo' },
  { id: 'TR-PIE', name: 'PIE heavy', detail: 'Speed band · demo fallback', lng: 103.882, lat: 1.337, tone: 'warning', source: 'demo' },
  { id: 'TR-ECP', name: 'ECP clear', detail: 'Speed band · demo fallback', lng: 103.905, lat: 1.304, tone: 'ok', source: 'demo' },
];

const MRT_STATUS = [
  {
    id: 'MRT-EW',
    name: 'EWL crowding',
    detail: 'MRT congestion · no live source wired',
    tone: 'warning',
    path: [
      [103.7423, 1.3331],
      [103.772, 1.317],
      [103.8198, 1.307],
      [103.8521, 1.2931],
      [103.9493, 1.3401],
    ],
  },
  {
    id: 'MRT-NS',
    name: 'NSL normal',
    detail: 'MRT congestion · no live source wired',
    tone: 'ok',
    path: [
      [103.8386, 1.4245],
      [103.8469, 1.3214],
      [103.8521, 1.2931],
    ],
  },
];

export default function MapCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerStore = useRef<Marker[]>([]);
  const hoverPopupStore = useRef<Popup[]>([]);
  const polygonSourceIds = useRef<string[]>([]);
  const selfMarkerRef = useRef<Marker | null>(null);

  const {
    role,
    events,
    responders,
    sosSessions,
    cases,
    drawerContent,
    setSelectedId,
    setDrawerContent,
    setSelectedMapItem,
    selfLocation,
    draftPolygon,
    setDraftPolygon,
  } = useAppContext();

  const [mapReady, setMapReady] = useState(false);
  const [drawMode, setDrawMode] = useState<
    'select' | 'point' | 'polygon' | 'rect' | 'circle' | 'freehand' | 'erase'
  >('select');
  const [snap, setSnap] = useState(true);
  const [acceptedPartialCells, setAcceptedPartialCells] = useState(false);
  const [liveLayers, setLiveLayers] = useState<LiveMapLayers | null>(null);
  const [layerStatus, setLayerStatus] = useState<'loading' | 'live' | 'demo' | 'partial'>('loading');
  const [showLabels, setShowLabels] = useState(true);
  const [markerOpacity, setMarkerOpacity] = useState(1);
  const [visibleLayers, setVisibleLayers] = useState({
    disaster: true,
    hospital: true,
    aed: true,
    traffic: true,
    mrt: true,
    responders: true,
    sos: true,
  });

  const drawingSession = role === 'ops' && (drawerContent === 'declare' || drawerContent === 'broadcast');
  const isDrawing = drawingSession && drawMode === 'polygon';

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      try {
        const layers = await fetchMapLayers();
        if (!alive) return;
        setLiveLayers(layers);
        if (!layers) {
          setLayerStatus('demo');
          return;
        }
        const liveCount =
          layers.hospitals.length +
          layers.aeds.length +
          layers.traffic.length +
          layers.speedBands.length;
        const configuredSources = layers.sources.filter((s) => s.state === 'fresh').length;
        setLayerStatus(liveCount > 0 && configuredSources > 0 ? 'live' : 'partial');
      } catch {
        if (alive) setLayerStatus('demo');
      }
    };
    pull();
    const timer = setInterval(pull, 5 * 60_000);
    return () => {
      alive = false;
      clearInterval(timer);
    };
  }, []);

  const hospitalPois = liveLayers?.hospitals.length ? liveLayers.hospitals : DEMO_HOSPITAL_POIS;
  const allAedPois = liveLayers?.aeds.length ? liveLayers.aeds : DEMO_AED_POIS;
  const allTrafficPois = liveLayers && (liveLayers.traffic.length || liveLayers.speedBands.length)
    ? [...liveLayers.traffic, ...liveLayers.speedBands]
    : DEMO_TRAFFIC_POIS;
  const mrtStatus = liveLayers?.mrt.length ? liveLayers.mrt : MRT_STATUS;
  const aedPois = allAedPois;
  const trafficPois = allTrafficPois;

  useEffect(() => {
    if (drawingSession) return;
    setDrawMode('select');
    setDraftPolygon([]);
  }, [drawingSession]);

  // ---- self-location marker ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!selfLocation) {
      selfMarkerRef.current?.remove();
      selfMarkerRef.current = null;
      return;
    }
    if (!selfMarkerRef.current) {
      const el = document.createElement('div');
      el.setAttribute('aria-label', 'Your location');
      el.style.cssText = [
        'width:18px', 'height:18px', 'border-radius:50%',
        `background:${RESOURCE_COLORS.self}`, 'border:3px solid #fff',
        `box-shadow:0 0 0 2px ${RESOURCE_COLORS.self}`,
        'position:relative', 'cursor:default',
      ].join(';');
      const ring = document.createElement('div');
      ring.style.cssText = [
        'position:absolute', 'inset:-6px', 'border-radius:50%',
        `border:2px solid ${RESOURCE_COLORS.self}`, 'opacity:0.5',
        'animation:selfping 1.8s cubic-bezier(0,0,0.2,1) infinite',
      ].join(';');
      if (!document.getElementById('kk-self-ping-style')) {
        const s = document.createElement('style');
        s.id = 'kk-self-ping-style';
        s.textContent = '@keyframes selfping{0%{transform:scale(.8);opacity:.8}100%{transform:scale(2.2);opacity:0}}';
        document.head.appendChild(s);
      }
      el.appendChild(ring);
      selfMarkerRef.current = new maplibregl.Marker({ element: el, anchor: 'center' })
        .setLngLat([selfLocation.lng, selfLocation.lat])
        .addTo(map);
    } else {
      selfMarkerRef.current.setLngLat([selfLocation.lng, selfLocation.lat]);
    }
  }, [selfLocation, mapReady]);

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
            1, SEVERITY_COLORS[1],
            2, SEVERITY_COLORS[2],
            3, SEVERITY_COLORS[3],
            4, SEVERITY_COLORS[4],
            5, SEVERITY_COLORS[5],
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
            1, SEVERITY_COLORS[1],
            2, SEVERITY_COLORS[2],
            3, SEVERITY_COLORS[3],
            4, SEVERITY_COLORS[4],
            5, SEVERITY_COLORS[5],
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
          'circle-color': [
            'match',
            ['get', 'sev'],
            1, SEVERITY_COLORS[1],
            2, SEVERITY_COLORS[2],
            3, SEVERITY_COLORS[3],
            4, SEVERITY_COLORS[4],
            5, SEVERITY_COLORS[5],
            SEVERITY_COLORS[4],
          ],
          'circle-opacity': 0.12,
          'circle-radius': ['interpolate', ['linear'], ['get', 'sev'], 1, 28, 5, 68],
          'circle-stroke-color': [
            'match',
            ['get', 'sev'],
            1, '#6B7280',
            2, SEVERITY_COLORS[2],
            3, SEVERITY_COLORS[3],
            4, SEVERITY_COLORS[4],
            5, SEVERITY_COLORS[5],
            SEVERITY_COLORS[4],
          ],
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
          'line-color': RESOURCE_COLORS.route,
          'line-width': 2.5,
          'line-dasharray': [3, 2],
        },
      });

      map.addSource('mrt-status-lines', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'mrt-status-lines-layer',
        type: 'line',
        source: 'mrt-status-lines',
        paint: {
          'line-color': [
            'match',
            ['get', 'tone'],
            'warning', TRANSPORT_COLORS.warning,
            'critical', TRANSPORT_COLORS.critical,
            'ok', TRANSPORT_COLORS.ok,
            '#1A1A1A',
          ],
          'line-width': 4,
          'line-opacity': 0.75,
          'line-dasharray': [2, 1],
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
      setMapReady(true);
    });

    map.on('zoom', () => {
      const z = map.getZoom();
      const pois = containerRef.current?.querySelectorAll('.qa-poi-marker');
      if (!pois) return;
      pois.forEach((el) => {
        if (z >= POI_LABEL_ZOOM && labelsRef.current) {
          el.classList.remove('qa-poi-compact');
        } else {
          el.classList.add('qa-poi-compact');
        }
      });
    });

    mapRef.current = map;
    return () => {
      for (const popup of hoverPopupStore.current) popup.remove();
      hoverPopupStore.current = [];
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

      m.getSource('mrt-status-lines') &&
        (m.getSource('mrt-status-lines') as maplibregl.GeoJSONSource).setData({
          type: 'FeatureCollection',
          features: mrtStatus.map((line) => ({
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: line.path },
            properties: { id: line.id, tone: line.tone },
          })),
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
      for (const popup of hoverPopupStore.current) popup.remove();
      hoverPopupStore.current = [];
      for (const mk of markerStore.current) mk.remove();
      markerStore.current = [];

      const role = roleRef.current;
      const visibleEvents = visibleLayers.disaster ? events : [];
      const visibleResp = role === 'citizen' || !visibleLayers.responders ? [] : responders;
      const visibleSos = sosSessions.filter(
        (s) => visibleLayers.sos && !['resolved', 'cancelled'].includes(s.status)
      );

      for (const e of visibleEvents) {
        const sz = severityPinSize(e.severity) + 8;
        const el = document.createElement('button');
        el.className = pinClass(e.severity);
        el.style.width = sz + 'px';
        el.style.height = sz + 'px';
        const classification = e.kind.toUpperCase();
        el.title = `${classification} · ${e.title}${e.liveValue ? ' · ' + e.liveValue : ''}`;
        el.innerHTML = mapIconMarkup(eventIcon(e.kind), 15);
        el.onclick = (ev) => {
          ev.stopPropagation();
          setSelectedId(e.id);
          setDrawerContent(role === 'ops' ? 'dispatch' : 'local_alert');
        };
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([e.location.lng, e.location.lat])
          .addTo(m);
        markerStore.current.push(marker);
      }

      for (const s of visibleSos) {
        const el = document.createElement('button');
        el.className =
          'sos-pin w-8 h-8 -ml-4 -mt-4 flex items-center justify-center border-2 border-black bg-red-600 text-white ring-4 ring-red-200 shadow-[3px_3px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer';
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
        const isOfficial = r.unitType === 'professional';
        const tone =
          isOfficial
            ? 'bg-blue-400 text-white'
            : r.status === 'en_route'
            ? 'bg-yellow-200 text-black'
            : r.status === 'on_scene'
            ? 'bg-green-400 text-black'
            : 'bg-black text-white';
        const label = isOfficial
          ? role === 'ops'
            ? r.org.slice(0, 3)
            : r.covert
            ? 'OFF'
            : r.org.slice(0, 3)
          : r.name[0];
        const title = isOfficial && r.covert && role !== 'ops'
          ? 'Official unit · movement visible · label hidden'
          : `${r.name} · ${r.org} · ${r.status}${r.demo ? ' · demo professional' : ''}`;
        const el = document.createElement('div');
        el.className = `responder-pin -ml-3 -mt-3 w-6 h-6 ${tone} border border-black flex items-center justify-center shadow-[2px_2px_0_#000]`;
        el.title = title;
        el.innerHTML = `<span style="font-size:9px;font-weight:900;font-family:ui-monospace">${label}</span>`;
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([r.location.lng, r.location.lat])
          .addTo(m);
        markerStore.current.push(marker);
      }

      if (visibleLayers.hospital) for (const h of hospitalPois) {
        markerStore.current.push(
          addIconMarker(m, [h.lng, h.lat], {
            title: h.name,
            body: h.detail,
            tone: 'hospital',
            icon: Hospital,
            label: 'Hospital',
            medium: false,
            labels: showLabels,
            popupStore: hoverPopupStore.current,
            onClick: () => {
              setSelectedMapItem(toSelectedMapItem(h, 'Hospital', 'OneMap'));
              setDrawerContent('map_item');
            },
          })
        );
      }

      if (visibleLayers.aed) for (const aed of aedPois) {
        markerStore.current.push(
          addIconMarker(m, [aed.lng, aed.lat], {
            title: aed.name,
            body: aed.detail,
            tone: 'aed',
            icon: Zap,
            label: 'AED',
            medium: false,
            labels: showLabels,
            popupStore: hoverPopupStore.current,
            onClick: () => {
              setSelectedMapItem(toSelectedMapItem(aed, 'AED', 'OneMap'));
              setDrawerContent('map_item');
            },
          })
        );
      }

      if (visibleLayers.traffic) for (const traffic of trafficPois) {
        markerStore.current.push(
          addIconMarker(m, [traffic.lng, traffic.lat], {
            title: traffic.name,
            body: traffic.detail,
            tone: traffic.tone,
            icon: TrafficCone,
            label: traffic.tone === 'ok' ? 'Traffic OK' : 'Traffic',
            medium: false,
            labels: showLabels,
            popupStore: hoverPopupStore.current,
            onClick: () => {
              setSelectedMapItem(toSelectedMapItem(traffic, 'Traffic', 'LTA DataMall'));
              setDrawerContent('map_item');
            },
          })
        );
      }

      if (visibleLayers.mrt) for (const line of mrtStatus) {
        const mid = line.path[Math.floor(line.path.length / 2)];
        markerStore.current.push(
          addIconMarker(m, mid as [number, number], {
            title: line.name,
            body: line.detail,
            tone: line.tone,
            icon: Train,
            label: 'MRT',
            medium: false,
            labels: showLabels,
            popupStore: hoverPopupStore.current,
            onClick: () => {
              setSelectedMapItem({
                id: line.id,
                category: 'MRT',
                title: line.name,
                detail: line.detail,
                source: line.source === 'live' ? 'Live transit feed' : 'Demo status',
                lng: mid[0],
                lat: mid[1],
                tone: line.tone,
              });
              setDrawerContent('map_item');
            },
          })
        );
      }
    }
  }, [
    events,
    responders,
    sosSessions,
    cases,
    draftPolygon,
    setDrawerContent,
    setSelectedId,
    setSelectedMapItem,
    hospitalPois,
    aedPois,
    trafficPois,
    mrtStatus,
    visibleLayers,
    showLabels,
  ]);

  // capture latest role in ref for marker click handlers
  const roleRef = useRef(role);
  const labelsRef = useRef(showLabels);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);
  useEffect(() => {
    labelsRef.current = showLabels;
  }, [showLabels]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--kk-poi-opacity', String(markerOpacity));
    }
  }, [markerOpacity]);

  const drawCellCount = Math.max(1, Math.floor(draftPolygon.length * 1.6));
  useEffect(() => {
    setAcceptedPartialCells(false);
  }, [draftPolygon.length]);

  const finishDraft = () => {
    if (draftPolygon.length >= 3) setDrawerContent(drawerContent === 'broadcast' ? 'broadcast' : 'declare');
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
        MAP · SG · {role.toUpperCase()} · {layerStatus.toUpperCase()}
      </div>

      <div className="absolute top-12 left-3 z-10 bg-white border border-black shadow-[3px_3px_0_#000] p-1.5 flex flex-wrap items-center gap-1 max-w-[min(420px,calc(100vw-110px))]">
        <FilterBtn icon={Siren} label="Disaster" active={visibleLayers.disaster} onClick={() => setVisibleLayers((v) => ({ ...v, disaster: !v.disaster }))} />
        <FilterBtn icon={Hospital} label="Hospital" active={visibleLayers.hospital} onClick={() => setVisibleLayers((v) => ({ ...v, hospital: !v.hospital }))} />
        <FilterBtn icon={Zap} label="AED" active={visibleLayers.aed} onClick={() => setVisibleLayers((v) => ({ ...v, aed: !v.aed }))} />
        <FilterBtn icon={TrafficCone} label="Traffic" active={visibleLayers.traffic} onClick={() => setVisibleLayers((v) => ({ ...v, traffic: !v.traffic }))} />
        <FilterBtn icon={Train} label="MRT" active={visibleLayers.mrt} onClick={() => setVisibleLayers((v) => ({ ...v, mrt: !v.mrt }))} />
        {role !== 'citizen' && (
          <FilterBtn icon={Radio} label="Units" active={visibleLayers.responders} onClick={() => setVisibleLayers((v) => ({ ...v, responders: !v.responders }))} />
        )}
        <FilterBtn icon={Siren} label="SOS" active={visibleLayers.sos} onClick={() => setVisibleLayers((v) => ({ ...v, sos: !v.sos }))} />
        <button
          onClick={() => setShowLabels((v) => !v)}
          className={`px-2 py-1 border border-black text-[8px] font-black uppercase tracking-widest ${showLabels ? 'bg-yellow-200' : 'bg-white text-gray-500'}`}
        >
          Labels {showLabels ? 'on' : 'off'}
        </button>
        <div className="flex items-center gap-1">
          <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">α</span>
          <input
            type="range"
            min={0.15}
            max={1}
            step={0.05}
            value={markerOpacity}
            onChange={(e) => setMarkerOpacity(Number(e.target.value))}
            className="w-16 accent-black h-1 cursor-pointer"
            title={`Marker opacity ${Math.round(markerOpacity * 100)}%`}
          />
        </div>
      </div>

      <MapLegend />

      {/* drawing toolbar (ops only) */}
      {drawingSession && (
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
      {drawingSession && draftPolygon.length > 0 && (
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
      {drawingSession && draftPolygon.length >= 3 && (
        <button
          onClick={finishDraft}
          className="absolute top-3 right-16 z-10 bg-green-400 text-black px-3 py-2 text-[10px] font-black uppercase tracking-widest border border-black shadow-[3px_3px_0_#000]"
        >
          Continue
        </button>
      )}
    </div>
  );
}

function MapLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`absolute top-[104px] right-2 sm:top-3 sm:right-3 z-10 bg-white border border-black shadow-[4px_4px_0_#000] text-black ${
        open ? 'w-[184px] sm:w-[260px]' : 'w-auto'
      }`}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-controls="map-legend-body"
        title={open ? 'Hide map legend' : 'Show map legend'}
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-2 py-1.5 bg-black text-white text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-gray-800"
      >
        <span>{open ? 'Hide legend' : 'Legend'}</span>
        <span className="text-[10px] leading-none">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div id="map-legend-body" className="max-h-[calc(100vh-220px)] overflow-y-auto">
      <div className="p-2 border-b border-black">
        <div className="text-[8px] uppercase font-black tracking-widest text-gray-600 mb-1">
          Supplies / rescue
        </div>
        <div className="grid grid-cols-2 gap-1">
          {RESOURCE_LEGEND.map(({ label, detail, color, icon: Icon }) => (
            <div key={label} className="flex items-center gap-1.5 min-w-0">
              <span
                className="w-6 h-6 border border-black flex items-center justify-center shrink-0"
                style={{ backgroundColor: color, color: '#F4F4F1' }}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={3} />
              </span>
              <span className="min-w-0">
                <strong className="block text-[8px] uppercase font-black tracking-widest leading-none truncate">
                  {label}
                </strong>
                <em className="block text-[8px] not-italic uppercase tracking-widest text-gray-600 leading-tight truncate">
                  {detail}
                </em>
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-2">
        <div className="text-[8px] uppercase font-black tracking-widest text-gray-600 mb-1">
          Incidents / events
        </div>
        <div className="flex items-end justify-between gap-1">
          {SEVERITY_LEGEND.map((item) => (
            <div key={item.level} className="flex flex-col items-center gap-1 min-w-0">
              <span
                className="block border-2 border-black shadow-[1px_1px_0_#000]"
                style={{
                  width: item.size,
                  height: item.size,
                  backgroundColor: SEVERITY_COLORS[item.level],
                }}
              />
              <span className="text-[8px] font-mono font-black leading-none">L{item.level}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-2 gap-x-2 gap-y-0.5">
          {SEVERITY_LEGEND.map((item) => (
            <div key={item.label} className="text-[8px] uppercase tracking-widest text-gray-700 truncate">
              L{item.level} {item.label}
            </div>
          ))}
        </div>
        <div className="mt-2 pt-1 border-t border-black/30 flex items-center gap-1">
          <TrafficCone className="w-3 h-3 shrink-0" />
          <div className="flex flex-1 gap-1">
            {TRANSPORT_LEGEND.map((item) => (
              <span
                key={item.label}
                className="flex-1 px-1 py-0.5 border border-black text-center text-[7px] font-black uppercase tracking-widest"
                style={{ backgroundColor: item.color, color: item.label === 'Crash' ? '#F4F4F1' : '#1A1A1A' }}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      </div>
        </div>
      )}
    </div>
  );
}

function addIconMarker(
  map: maplibregl.Map,
  lngLat: [number, number],
  opts: {
    title: string;
    body: string;
    tone: string;
    icon: typeof Hospital;
    label: string;
    medium: boolean;
    labels: boolean;
    popupStore: Popup[];
    onClick: () => void;
  }
) {
  const el = document.createElement('button');
  const zoomed = map.getZoom() >= POI_LABEL_ZOOM;
  el.className = `qa-poi-marker qa-poi-${opts.tone}${zoomed && opts.labels ? '' : ' qa-poi-compact'}`;
  el.type = 'button';
  el.setAttribute('aria-label', `${opts.label}: ${opts.title}`);
  el.innerHTML = `<span aria-hidden="true">${mapIconMarkup(opts.icon, 16)}</span><strong>${escapeHtml(opts.label)}</strong><em>${escapeHtml(opts.title)}</em>`;
  const popup = new Popup({ offset: 12, closeButton: false, className: 'qa-hover-popup' }).setHTML(
    `<div style="font-family:ui-sans-serif;max-width:240px"><strong style="display:block;font-size:11px;text-transform:uppercase;letter-spacing:.08em">${escapeHtml(
      opts.title
    )}</strong><span style="display:block;font-size:10px;margin-top:4px">${escapeHtml(opts.body)}</span></div>`
  );
  opts.popupStore.push(popup);
  const showPopup = () => popup.setLngLat(lngLat).addTo(map);
  const hidePopup = () => popup.remove();
  el.addEventListener('pointerenter', showPopup);
  el.addEventListener('pointerleave', hidePopup);
  el.addEventListener('blur', hidePopup);
  el.onclick = (ev) => {
    ev.stopPropagation();
    hidePopup();
    opts.onClick();
  };
  return new maplibregl.Marker({ element: el, anchor: 'left' }).setLngLat(lngLat).addTo(map);
}

function toSelectedMapItem(item: MapPoi, category: string, fallbackSource: string) {
  return {
    id: item.id,
    category,
    title: item.name,
    detail: item.detail,
    source: item.source === 'live' ? fallbackSource : 'Demo fallback',
    lng: item.lng,
    lat: item.lat,
    tone: item.tone,
  };
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === '&') return '&amp;';
    if (char === '<') return '&lt;';
    if (char === '>') return '&gt;';
    if (char === '"') return '&quot;';
    return '&#039;';
  });
}

function eventIcon(kind: string) {
  if (kind === 'fire') return Flame;
  if (kind === 'flood') return Waves;
  if (kind === 'medical') return HeartPulse;
  if (kind === 'crash') return Car;
  if (kind === 'hazard') return TriangleAlert;
  if (kind === 'weather') return CloudRain;
  return CircleHelp;
}

function mapIconMarkup(Icon: typeof Hospital, size: number) {
  return renderToStaticMarkup(<Icon size={size} strokeWidth={3} />);
}

function FilterBtn({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: typeof MapPin;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1 px-1.5 py-1 border border-black text-[8px] font-black uppercase tracking-widest whitespace-nowrap ${
        active ? 'bg-white text-black' : 'bg-gray-200 text-gray-500'
      }`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </button>
  );
}

function pinClass(sev: number) {
  const base =
    'event-pin flex items-center justify-center border-2 border-black shadow-[3px_3px_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all cursor-pointer';
  const tone =
    sev >= 5
      ? 'bg-red-600 text-white ring-4 ring-red-200'
      : sev === 4
      ? 'bg-orange-500 text-black'
        : sev === 3
      ? 'bg-amber-300 text-black'
      : sev === 2
      ? 'bg-sky-400 text-black'
      : 'bg-gray-300 text-black';
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
