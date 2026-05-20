import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
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

const createEmergencyIcon = (category, severity) => {
  const color = emergencyColors[category] || '#ef4444';
  const size = severity === 'critical' ? 36 : severity === 'high' ? 30 : 24;
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <div style="width:${size * 0.4}px;height:${size * 0.4}px;border-radius:50%;background:white;opacity:0.9;"></div>
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

const createUserIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:20px;height:20px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

const createEventIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:22px;height:22px;border-radius:50%;background:#22c55e;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;">
    <div style="width:8px;height:8px;border-radius:50%;background:white;"></div>
  </div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const createResponderIcon = () => L.divIcon({
  className: '',
  html: `<div style="width:26px;height:26px;border-radius:50%;background:#f59e0b;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
    <div style="width:10px;height:10px;border-radius:50%;background:white;"></div>
  </div>`,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 14);
  }, [center, map]);
  return null;
}

export default function MapView({ userLocation, emergencies, events, responderUnits }) {
  const defaultCenter = [1.3521, 103.8198]; // Singapore
  const center = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

  return (
    <div className="w-full h-full relative">
      <MapContainer
        center={center}
        zoom={14}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {userLocation && (
          <>
            <RecenterMap center={center} />
            <Marker position={center} icon={createUserIcon()}>
              <Popup><strong>📍 You are here</strong></Popup>
            </Marker>
            <Circle
              center={center}
              radius={1000}
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05, weight: 1.5, dashArray: '6 4' }}
            />
          </>
        )}

        {emergencies.map((e) => (
          e.latitude && e.longitude && (
            <Marker
              key={e.id}
              position={[e.latitude, e.longitude]}
              icon={createEmergencyIcon(e.category, e.severity)}
            >
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ fontSize: 13 }}>{e.title}</strong>
                  <br />
                  <span style={{ fontSize: 11, color: '#666' }}>{e.address}</span>
                  <br />
                  <span style={{ fontSize: 11, fontWeight: 600, color: emergencyColors[e.category] }}>
                    {e.severity?.toUpperCase()} — {e.status}
                  </span>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {events.map((ev) => (
          ev.latitude && ev.longitude && (
            <Marker key={ev.id} position={[ev.latitude, ev.longitude]} icon={createEventIcon()}>
              <Popup>
                <div style={{ minWidth: 160 }}>
                  <strong style={{ fontSize: 13 }}>{ev.title}</strong>
                  <br />
                  <span style={{ fontSize: 11, color: '#666' }}>{ev.location}</span>
                  <br />
                  <span style={{ fontSize: 11, color: '#22c55e', fontWeight: 600 }}>{ev.date}</span>
                </div>
              </Popup>
            </Marker>
          )
        ))}

        {responderUnits.map((ru, i) => (
          ru.lat && ru.lng && (
            <Marker key={i} position={[ru.lat, ru.lng]} icon={createResponderIcon()}>
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <strong style={{ fontSize: 13 }}>🚑 {ru.name}</strong>
                  <br />
                  <span style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>ETA: {ru.eta} min</span>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur rounded-xl shadow-lg p-3 z-[1000] text-xs space-y-1.5">
        <div className="font-semibold text-gray-700 mb-1 text-xs">Legend</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500 inline-block border-2 border-white shadow-sm"></span><span className="text-gray-600">Your Location</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500 inline-block border-2 border-white shadow-sm"></span><span className="text-gray-600">Emergency</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500 inline-block border-2 border-white shadow-sm"></span><span className="text-gray-600">Volunteer Event</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block border-2 border-white shadow-sm"></span><span className="text-gray-600">Responder</span></div>
      </div>
    </div>
  );
}