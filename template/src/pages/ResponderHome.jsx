import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ResponderMapView from '@/components/responder/ResponderMapView';
import OperationalSidePanel from '@/components/responder/OperationalSidePanel';
import ResponderChatbot from '@/components/responder/ResponderChatbot';

// Simulated other responder units on the map
const OTHER_UNITS = [
  { name: 'SCDF Unit 3', lat: 1.3560, lng: 103.8250, eta: 6 },
  { name: 'SPF Patrol Alpha', lat: 1.3490, lng: 103.8150, eta: 4, isCurrentMission: true },
  { name: 'SCDF Unit 9', lat: 1.3540, lng: 103.8120, eta: 11 },
];

export default function ResponderHome() {
  const { currentUser } = useAppAuth();
  const queryClient = useQueryClient();
  const [userLocation, setUserLocation] = useState(null);
  const [responderUnits, setResponderUnits] = useState(OTHER_UNITS);
  const [showChatbot, setShowChatbot] = useState(false);
  const [mapFilters, setMapFilters] = useState({ responders: true, reports: true, heatZones: true });

  // Get user location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setUserLocation({ lat: 1.3521, lng: 103.8198 }),
      { timeout: 8000 }
    ) ?? setUserLocation({ lat: 1.3521, lng: 103.8198 });
  }, []);

  // Animate responder unit movements
  useEffect(() => {
    const interval = setInterval(() => {
      setResponderUnits(prev =>
        prev.map(unit => ({
          ...unit,
          lat: unit.lat + (Math.random() - 0.5) * 0.0004,
          lng: unit.lng + (Math.random() - 0.5) * 0.0004,
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { data: emergencies = [] } = useQuery({
    queryKey: ['emergencies-active-responder'],
    queryFn: () => base44.entities.Emergency.filter(
      { status: ['reported', 'responding'] },
      '-created_date', 30
    ),
    refetchInterval: 15000,
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events-active'],
    queryFn: () => base44.entities.VolunteerEvent.filter(
      { status: ['upcoming', 'ongoing'] },
      'date', 20
    ),
  });

  // Current mission: latest emergency where this responder is assigned
  const userId = currentUser?.id || currentUser?.username;
  const currentMission = emergencies.find(
    e => Array.isArray(e.assigned_responders) && e.assigned_responders.includes(userId) && e.status === 'responding'
  ) || null;

  // Assignments: reported emergencies not yet assigned to anyone (pending)
  const assignments = emergencies.filter(
    e => e.status === 'reported' && !(Array.isArray(e.assigned_responders) && e.assigned_responders.length > 0)
  );

  const filtersWithToggle = {
    ...mapFilters,
    toggle: (key) => setMapFilters(p => ({ ...p, [key]: !p[key] })),
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Responder sub-header with single chatbot tab */}
      <div className="bg-amber-700 border-b border-amber-800 shrink-0 px-4 flex items-center gap-3 h-11">
        <div className="flex items-center gap-2 text-amber-200 text-xs font-semibold">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          On Duty — {currentUser?.display_name?.split(' ')[0]}
        </div>
        <div className="ml-auto">
          <Button
            size="sm"
            onClick={() => setShowChatbot(true)}
            className="bg-white/15 hover:bg-white/25 text-white border border-white/20 text-xs h-7 gap-1.5"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Ask Chatbot
          </Button>
        </div>
      </div>

      {/* Main layout: map + side panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Leaflet map */}
        <div className="flex-1 min-w-0 relative">
          <ResponderMapView
            userLocation={userLocation}
            emergencies={emergencies}
            responderUnits={responderUnits}
            filters={filtersWithToggle}
          />
        </div>

        {/* Right: Operational side panel */}
        <div className="w-80 shrink-0 hidden md:flex flex-col border-l border-gray-200">
          <OperationalSidePanel
            currentMission={currentMission}
            assignments={assignments}
            emergencies={emergencies}
            events={events}
            userLocation={userLocation}
            onMissionUpdate={() => queryClient.invalidateQueries({ queryKey: ['emergencies-active-responder'] })}
          />
        </div>
      </div>

      {/* Chatbot overlay */}
      {showChatbot && (
        <ResponderChatbot
          onClose={() => setShowChatbot(false)}
          currentMission={currentMission}
        />
      )}
    </div>
  );
}