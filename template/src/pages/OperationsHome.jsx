import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { Pencil, Eraser, MousePointer, RefreshCw, LocateFixed } from 'lucide-react';
import OpsMap from '@/components/operations/OpsMap';
import OpsAccordionPanel from '@/components/operations/OpsAccordionPanel';
import DeclareEventModal from '@/components/operations/DeclareEventModal';

// Simulated responder units on the map
const BASE_UNITS = [
  { name: 'SCDF Unit 1', lat: 1.3540, lng: 103.8190, isBusy: false },
  { name: 'SCDF Unit 3', lat: 1.3560, lng: 103.8250, isBusy: true },
  { name: 'SPF Alpha', lat: 1.3490, lng: 103.8150, isBusy: false },
  { name: 'SCDF Unit 9', lat: 1.3510, lng: 103.8120, isBusy: false },
];

export default function OperationsHome() {
  const queryClient = useQueryClient();
  const [userLocation, setUserLocation] = useState(null);
  const [responderUnits, setResponderUnits] = useState(BASE_UNITS);
  const [drawMode, setDrawMode] = useState('select'); // 'select' | 'draw'
  const [pendingPolygon, setPendingPolygon] = useState(null);
  const [mapFilters, setMapFilters] = useState({
    responders: true, reports: true, emergencyZones: true, heatZones: true,
  });

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 1.3521, lng: 103.8198 }),
      { timeout: 8000 }
    ) ?? setUserLocation({ lat: 1.3521, lng: 103.8198 });
  }, []);

  // Animate responder unit movements
  useEffect(() => {
    const iv = setInterval(() => {
      setResponderUnits(prev => prev.map(u => ({
        ...u,
        lat: u.lat + (Math.random() - 0.5) * 0.0005,
        lng: u.lng + (Math.random() - 0.5) * 0.0005,
      })));
    }, 3500);
    return () => clearInterval(iv);
  }, []);

  const { data: emergencies = [] } = useQuery({
    queryKey: ['all-emergencies-ops'],
    queryFn: () => base44.entities.Emergency.list('-created_date', 50),
    refetchInterval: 10000,
  });

  const { data: responders = [] } = useQuery({
    queryKey: ['responders-ops'],
    queryFn: () => base44.entities.AppUser.filter({ primary_role: 'responder' }),
    refetchInterval: 20000,
  });

  const { data: emergencyZones = [] } = useQuery({
    queryKey: ['emergency-zones'],
    queryFn: () => base44.entities.EmergencyZone.list('-created_date', 30),
    refetchInterval: 15000,
  });

  const filtersWithToggle = {
    ...mapFilters,
    toggle: (key) => setMapFilters(p => ({ ...p, [key]: !p[key] })),
  };

  const handleDrawComplete = (coords) => {
    setPendingPolygon(coords);
    setDrawMode('select');
  };

  const drawTools = [
    { key: 'select', icon: MousePointer, label: 'Select' },
    { key: 'draw', icon: Pencil, label: 'Draw Zone' },
  ];

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Ops sub-toolbar */}
      <div className="bg-green-900 border-b border-green-950 px-4 flex items-center gap-2 h-10 shrink-0">
        <span className="text-green-300 text-[10px] font-bold uppercase tracking-widest mr-2">Map Tools</span>
        {drawTools.map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setDrawMode(key)}
            title={label}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
              drawMode === key
                ? 'bg-white text-green-900'
                : 'text-green-200 hover:bg-white/10'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => queryClient.invalidateQueries()}
            title="Refresh all data"
            className="flex items-center gap-1.5 text-green-300 hover:text-white text-xs font-semibold hover:bg-white/10 px-2 py-1 rounded-lg transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <div className="flex items-center gap-1.5 text-green-300 text-xs">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wide">Live Feed Active</span>
          </div>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Full Leaflet map */}
        <div className="flex-1 min-w-0 relative">
          <OpsMap
            userLocation={userLocation}
            emergencies={emergencies}
            responderUnits={responderUnits}
            emergencyZones={emergencyZones}
            filters={filtersWithToggle}
            drawMode={drawMode}
            onDrawComplete={handleDrawComplete}
          />
        </div>

        {/* Right: Operational panel */}
        <div className="w-80 xl:w-96 shrink-0 hidden md:flex flex-col border-l border-gray-200 overflow-hidden">
          <OpsAccordionPanel
            responders={responders}
            emergencies={emergencies}
            emergencyZones={emergencyZones}
            userLocation={userLocation}
            onMapRefresh={() => queryClient.invalidateQueries()}
          />
        </div>
      </div>

      {/* Declare Event Modal (after polygon draw) */}
      {pendingPolygon && (
        <DeclareEventModal
          polygonCoords={pendingPolygon}
          onClose={() => setPendingPolygon(null)}
          onDeclared={() => {
            setPendingPolygon(null);
            queryClient.invalidateQueries({ queryKey: ['emergency-zones'] });
          }}
        />
      )}
    </div>
  );
}