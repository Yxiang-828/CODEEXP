import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const emergencyColors = {
  medical: '#ef4444',
  fire: '#f97316',
  accident: '#f59e0b',
  crime: '#8b5cf6',
  natural_disaster: '#3b82f6',
  infrastructure: '#6b7280',
  other: '#ec4899',
};

const createUserIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
  iconSize: [20, 20], iconAnchor: [10, 10],
});

const createEmergencyIcon = (category, severity) => {
  const color = emergencyColors[category] || '#ef4444';
  const size = severity === 'critical' ? 34 : severity === 'high' ? 28 : 22;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;">
      <div style="width:${size*0.35}px;height:${size*0.35}px;border-radius:50%;background:white;opacity:0.9;"></div>
    </div>`,
    iconSize: [size, size], iconAnchor: [size / 2, size / 2],
  });
};

const createAnimatedResponderIcon = (name, isCurrentMission) => {
  const color = isCurrentMission ? '#ef4444' : '#f59e0b';
  const pulse = isCurrentMission ? `box-shadow:0 0 0 6px rgba(239,68,68,0.25);` : `box-shadow:0 0 0 5px rgba(245,158,11,0.2);`;
  return L.divIcon({
    className: '',
    html: `<div title="${name}" style="width:28px;height:28px;border-radius:50%;background:${color};border:3px solid white;${pulse}cursor:pointer;transition:transform 0.4s ease;">
      <div style="width:10px;height:10px;border-radius:50%;background:white;margin:6px auto;"></div>
    </div>`,
    iconSize: [28, 28], iconAnchor: [14, 14],
  });
};

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => { if (center) map.setView(center, 14); }, [center]);
  return null;
}

// Generate heat zone polygon around a point
function heatZonePolygon(lat, lng, radiusKm, sides = 8, color = '#ef4444') {
  const pts = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * 2 * Math.PI;
    const dlat = (radiusKm / 111) * Math.cos(angle);
    const dlng = (radiusKm / (111 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
    pts.push([lat + dlat, lng + dlng]);
  }
  return pts;
}

export default function ResponderMapView({ userLocation, emergencies, responderUnits, filters }) {
  const defaultCenter = [1.3521, 103.8198];
  const center = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  return (
    <div className="w-full h-full relative">
      <MapContainer center={center} zoom={14} style={{ width: '100%', height: '100%' }} zoomControl={true}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <>
            <RecenterMap center={center} />
            <Marker position={center} icon={createUserIcon()}>
              <Popup><strong>📍 Your Position</strong><br /><span style={{ fontSize: 11 }}>{userLocation.lat.toFixed(5)}, {userLocation.lng.toFixed(5)}</span></Popup>
            </Marker>
            <Circle
              center={center}
              radius={1000}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.04, weight: 1.5, dashArray: '6 4' }}
            />
          </>
        )}

        {/* Emergency heat zones */}
        {filters.heatZones && emergencies.map((e) =>
          e.latitude && e.longitude ? (
            <Polygon
              key={`heat-${e.id}`}
              positions={heatZonePolygon(e.latitude, e.longitude, 0.18, 8)}
              pathOptions={{
                color: emergencyColors[e.category] || '#ef4444',
                fillColor: emergencyColors[e.category] || '#ef4444',
                fillOpacity: e.severity === 'critical' ? 0.22 : 0.12,
                weight: 1.5,
                dashArray: '4 3',
              }}
            />
          ) : null
        )}

        {/* Civilian report markers */}
        {filters.reports && emergencies.map((e) =>
          e.latitude && e.longitude ? (
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
          ) : null
        )}

        {/* Responder units */}
        {filters.responders && responderUnits.map((ru, i) =>
          ru.lat && ru.lng ? (
            <Marker
              key={`ru-${i}`}
              position={[ru.lat, ru.lng]}
              icon={createAnimatedResponderIcon(ru.name, ru.isCurrentMission)}
            >
              <Popup>
                <div style={{ minWidth: 150 }}>
                  <strong style={{ fontSize: 13 }}>🚑 {ru.name}</strong><br />
                  <span style={{ fontSize: 11, color: '#666' }}>{ru.lat.toFixed(5)}, {ru.lng.toFixed(5)}</span><br />
                  {ru.eta && <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>ETA: {ru.eta} min</span>}
                </div>
              </Popup>
            </Marker>
          ) : null
        )}
      </MapContainer>

      {/* Filter controls */}
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 z-[1000] space-y-2 text-xs min-w-[140px]">
        <p className="font-bold text-gray-600 text-[10px] uppercase tracking-wider mb-1">Map Filters</p>
        {[
          { key: 'responders', label: 'Responder Units', dot: 'bg-amber-500' },
          { key: 'reports', label: 'Civilian Reports', dot: 'bg-red-500' },
          { key: 'heatZones', label: 'Heat Zones', dot: 'bg-orange-400' },
        ].map(({ key, label, dot }) => (
          <label key={key} className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={filters[key]}
              onChange={() => filters.toggle(key)}
              className="w-3.5 h-3.5 accent-amber-500"
            />
            <span className={`w-2.5 h-2.5 rounded-full ${dot} inline-block`}></span>
            <span className="text-gray-700">{label}</span>
          </label>
        ))}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 z-[1000] text-xs space-y-1.5">
        <div className="font-semibold text-gray-700 text-[10px] uppercase tracking-wider mb-1">Legend</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm inline-block"></span><span className="text-gray-600">Your Location</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 border-2 border-white shadow-sm inline-block"></span><span className="text-gray-600">Emergency</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm inline-block"></span><span className="text-gray-600">Responder</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-400 border-2 border-white shadow-sm inline-block opacity-60"></span><span className="text-gray-600">Heat Zone</span></div>
      </div>
    </div>
  );
}