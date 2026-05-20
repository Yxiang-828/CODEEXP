import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const emergencyColors = {
  medical: '#ef4444', fire: '#f97316', accident: '#f59e0b',
  crime: '#8b5cf6', natural_disaster: '#3b82f6', infrastructure: '#6b7280', other: '#ec4899',
  health: '#ef4444', flood: '#3b82f6', hazard: '#f59e0b',
};

const severityColors = { critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#22c55e' };

const createEmergencyIcon = (category, severity) => {
  const color = emergencyColors[category] || '#ef4444';
  const size = severity === 'critical' ? 34 : severity === 'high' ? 28 : 22;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 10px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;">
      <div style="width:${size * 0.35}px;height:${size * 0.35}px;border-radius:50%;background:white;opacity:0.9;"></div>
    </div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
};

const createUserIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 5px rgba(37,99,235,0.25);"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

const createResponderIcon = (isActive) => L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:50%;background:${isActive ? '#f97316' : '#f59e0b'};border:3px solid white;box-shadow:0 0 0 5px rgba(245,158,11,0.25);display:flex;align-items:center;justify-content:center;">
    <div style="width:10px;height:10px;border-radius:50%;background:white;"></div>
  </div>`,
  iconSize: [28, 28], iconAnchor: [14, 14],
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 14); }, [center]);
  return null;
}

// Polygon drawing handler
function PolygonDrawer({ drawing, onPointAdd, onCancel }) {
  useMapEvents({
    click(e) {
      if (drawing) onPointAdd([e.latlng.lat, e.latlng.lng]);
    },
    contextmenu(e) {
      if (drawing) { e.originalEvent.preventDefault(); onCancel(); }
    },
  });
  return null;
}

function heatZonePolygon(lat, lng, radiusKm = 0.2, sides = 8) {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * 2 * Math.PI;
    pts.push([
      lat + (radiusKm / 111) * Math.cos(angle),
      lng + (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle),
    ]);
  }
  return pts;
}

export default function OpsMap({
  userLocation, emergencies, responderUnits, emergencyZones,
  filters, drawMode, onDrawComplete,
}) {
  const defaultCenter = [1.3521, 103.8198];
  const center = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [drawingActive, setDrawingActive] = useState(false);

  useEffect(() => {
    if (drawMode === 'draw') { setDrawingActive(true); setDrawnPoints([]); }
    else { setDrawingActive(false); setDrawnPoints([]); }
  }, [drawMode]);

  const handlePointAdd = (pt) => setDrawnPoints(p => [...p, pt]);

  const handleFinish = () => {
    if (drawnPoints.length >= 3) {
      onDrawComplete(drawnPoints);
      setDrawnPoints([]);
      setDrawingActive(false);
    }
  };

  const handleCancel = () => { setDrawnPoints([]); setDrawingActive(false); };

  return (
    <div className="w-full h-full relative">
      {drawingActive && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 pointer-events-auto">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Click map to place points · Right-click to cancel
          {drawnPoints.length >= 3 && (
            <button onClick={handleFinish} className="ml-2 bg-white text-blue-700 rounded-full px-2 py-0.5 text-[10px] font-bold hover:bg-blue-100">
              Finish ({drawnPoints.length} pts)
            </button>
          )}
        </div>
      )}

      <MapContainer
        center={center} zoom={14}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
        className={drawingActive ? 'cursor-crosshair' : ''}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {userLocation && <RecenterMap center={center} />}
        <PolygonDrawer drawing={drawingActive} onPointAdd={handlePointAdd} onCancel={handleCancel} />

        {/* User location */}
        {userLocation && (
          <>
            <Marker position={center} icon={createUserIcon()}>
              <Popup><strong>📍 Operations Centre</strong></Popup>
            </Marker>
            <Circle center={center} radius={1000}
              pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.04, weight: 1.5, dashArray: '6 4' }} />
          </>
        )}

        {/* Heat zones */}
        {filters.heatZones && emergencies.filter(e => e.latitude && e.longitude).map(e => (
          <Polygon key={`heat-${e.id}`}
            positions={heatZonePolygon(e.latitude, e.longitude, 0.2, 8)}
            pathOptions={{ color: emergencyColors[e.category] || '#ef4444', fillColor: emergencyColors[e.category] || '#ef4444', fillOpacity: e.severity === 'critical' ? 0.2 : 0.1, weight: 1.5, dashArray: '4 3' }}
          />
        ))}

        {/* Emergency zones from DB */}
        {filters.emergencyZones && emergencyZones.filter(z => z.polygon_coords?.length >= 3).map(z => (
          <Polygon key={`zone-${z.id}`}
            positions={z.polygon_coords}
            pathOptions={{ color: severityColors[z.severity] || '#f97316', fillColor: severityColors[z.severity] || '#f97316', fillOpacity: 0.2, weight: 2.5 }}
          >
            <Popup>
              <strong>{z.title}</strong><br />
              <span style={{ fontSize: 11, color: '#666' }}>{z.category} · {z.severity}</span><br />
              <span style={{ fontSize: 11, fontWeight: 700, color: severityColors[z.severity] }}>{z.status?.toUpperCase()}</span>
            </Popup>
          </Polygon>
        ))}

        {/* Civilian reports */}
        {filters.reports && emergencies.filter(e => e.latitude && e.longitude).map(e => (
          <Marker key={`em-${e.id}`} position={[e.latitude, e.longitude]} icon={createEmergencyIcon(e.category, e.severity)}>
            <Popup>
              <div style={{ minWidth: 160 }}>
                <strong style={{ fontSize: 13 }}>{e.title}</strong><br />
                <span style={{ fontSize: 11, color: '#666' }}>{e.address}</span><br />
                <span style={{ fontSize: 11, fontWeight: 700, color: emergencyColors[e.category] }}>
                  {e.severity?.toUpperCase()} · {e.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Responder units */}
        {filters.responders && responderUnits.map((ru, i) => ru.lat && ru.lng && (
          <Marker key={`ru-${i}`} position={[ru.lat, ru.lng]} icon={createResponderIcon(ru.isBusy)}>
            <Popup>
              <div style={{ minWidth: 140 }}>
                <strong style={{ fontSize: 13 }}>🚑 {ru.name}</strong><br />
                <span style={{ fontSize: 11, color: '#666' }}>{ru.lat.toFixed(5)}, {ru.lng.toFixed(5)}</span><br />
                <span style={{ fontSize: 11, fontWeight: 700, color: ru.isBusy ? '#f97316' : '#22c55e' }}>
                  {ru.isBusy ? 'On Mission' : 'Available'}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Drawing preview polygon */}
        {drawnPoints.length >= 2 && (
          <Polygon positions={drawnPoints}
            pathOptions={{ color: '#2563eb', fillColor: '#2563eb', fillOpacity: 0.15, weight: 2, dashArray: '6 4' }} />
        )}
        {drawnPoints.map((pt, i) => (
          <Marker key={`pt-${i}`} position={pt} icon={L.divIcon({
            className: '', html: `<div style="width:10px;height:10px;border-radius:50%;background:#2563eb;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
            iconSize: [10, 10], iconAnchor: [5, 5],
          })} />
        ))}
      </MapContainer>

      {/* Layer filter panel */}
      <div className="absolute top-3 right-3 bg-white/97 backdrop-blur rounded-xl shadow-lg p-3 z-[1000] text-xs min-w-[148px]">
        <p className="font-bold text-gray-500 text-[10px] uppercase tracking-wider mb-2">Layers</p>
        {[
          { key: 'responders', label: 'Responders', dot: 'bg-amber-500' },
          { key: 'reports', label: 'Civil Reports', dot: 'bg-red-500' },
          { key: 'emergencyZones', label: 'Event Zones', dot: 'bg-orange-500' },
          { key: 'heatZones', label: 'Heat Zones', dot: 'bg-red-400/60' },
        ].map(({ key, label, dot }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer select-none mb-1.5">
            <input type="checkbox" checked={filters[key]} onChange={() => filters.toggle(key)} className="w-3.5 h-3.5 accent-green-600" />
            <span className={`w-2.5 h-2.5 rounded-full ${dot} inline-block shrink-0`} />
            <span className="text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/97 backdrop-blur rounded-xl shadow-lg p-3 z-[1000] text-xs space-y-1.5">
        <p className="font-bold text-gray-500 text-[10px] uppercase tracking-wider">Legend</p>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-600 border-2 border-white shadow-sm inline-block" /><span className="text-gray-600">Ops Centre</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm inline-block" /><span className="text-gray-600">Critical</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500 border-2 border-white shadow-sm inline-block" /><span className="text-gray-600">Active</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-400 border-2 border-white shadow-sm inline-block" /><span className="text-gray-600">Caution</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 border-2 border-white shadow-sm inline-block" /><span className="text-gray-600">Resolved</span></div>
      </div>
    </div>
  );
}