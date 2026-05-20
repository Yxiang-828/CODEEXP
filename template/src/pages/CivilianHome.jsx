import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { Map, AlertTriangle, MessageCircle, Loader2, MapPin } from 'lucide-react';
import MapView from '@/components/civilian/MapView';
import NotificationsPanel from '@/components/civilian/NotificationsPanel';
import ReportTab from '@/components/civilian/ReportTab';
import ChatbotTab from '@/components/civilian/ChatbotTab';

const TABS = [
  { key: 'map', label: 'View Map', icon: Map },
  { key: 'report', label: 'Report', icon: AlertTriangle },
  { key: 'chat', label: 'Ask Chatbot', icon: MessageCircle },
];

// Simulated responder units (live-updating positions)
const BASE_RESPONDERS = [
  { name: 'SCDF Unit 7', lat: 1.3530, lng: 103.8220, eta: 8 },
  { name: 'SPF Patrol', lat: 1.3498, lng: 103.8185, eta: 5 },
];

export default function CivilianHome() {
  const { currentUser } = useAppAuth();
  const [activeTab, setActiveTab] = useState('map');
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [responderUnits, setResponderUnits] = useState(BASE_RESPONDERS);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setLocationLoading(false);
        },
        () => {
          // Default to central Singapore if denied
          setUserLocation({ lat: 1.3521, lng: 103.8198 });
          setLocationLoading(false);
        },
        { timeout: 8000 }
      );
    } else {
      setUserLocation({ lat: 1.3521, lng: 103.8198 });
      setLocationLoading(false);
    }
  }, []);

  // Simulate responder units moving toward user
  useEffect(() => {
    const interval = setInterval(() => {
      setResponderUnits((prev) =>
        prev.map((unit) => ({
          ...unit,
          lat: userLocation
            ? unit.lat + (userLocation.lat - unit.lat) * 0.02
            : unit.lat,
          lng: userLocation
            ? unit.lng + (userLocation.lng - unit.lng) * 0.02
            : unit.lng,
        }))
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [userLocation]);

  const { data: emergencies = [] } = useQuery({
    queryKey: ['emergencies-active'],
    queryFn: () => base44.entities.Emergency.filter(
      { status: ['reported', 'responding'] },
      '-created_date', 20
    ),
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events-active'],
    queryFn: () => base44.entities.VolunteerEvent.filter(
      { status: ['upcoming', 'ongoing'] },
      'date', 20
    ),
  });

  // Check if the current user has a recent report (simulated: use latest emergency by current user)
  const myReport = emergencies.find(
    (e) => e.reporter_name === currentUser?.display_name && e.status !== 'resolved' && e.status !== 'closed'
  ) || null;

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Civilian Tab Bar */}
      <div className="bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center px-4 gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-all border-b-2 ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[tab.label.split(' ').length - 1]}</span>
              </button>
            );
          })}

          {/* Location pill */}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 pr-1">
            {locationLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <MapPin className="w-3 h-3 text-green-500" />
            )}
            <span className="hidden sm:inline">{locationLoading ? 'Locating…' : 'Location on'}</span>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'map' && (
          <div className="flex h-full">
            {/* Map - takes most of the space */}
            <div className="flex-1 min-w-0">
              <MapView
                userLocation={userLocation}
                emergencies={emergencies}
                events={events}
                responderUnits={myReport ? responderUnits : []}
              />
            </div>
            {/* Notifications side panel */}
            <div className="w-80 shrink-0 hidden md:flex flex-col" style={{ borderLeft: '1px solid #e5e7eb' }}>
              <NotificationsPanel
                userLocation={userLocation}
                events={events}
                emergencies={emergencies}
                activeEmergency={myReport}
                locationLoading={locationLoading}
              />
            </div>
          </div>
        )}

        {activeTab === 'map' && (
          /* Mobile notifications — shown below map on small screens */
          <div className="md:hidden bg-gray-50 border-t border-gray-200" style={{ display: 'none' }}>
            {/* Hidden on desktop, shown on mobile via separate render */}
          </div>
        )}

        {activeTab === 'report' && (
          <div className="h-full overflow-y-auto bg-gray-50">
            <ReportTab userLocation={userLocation} />
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full flex flex-col bg-gray-50">
            <ChatbotTab />
          </div>
        )}
      </div>

      {/* Mobile Notifications drawer — only visible on map tab + mobile */}
      {activeTab === 'map' && (
        <div className="md:hidden bg-white border-t border-gray-200 shrink-0 max-h-52 overflow-y-auto">
          <NotificationsPanel
            userLocation={userLocation}
            events={events}
            emergencies={emergencies}
            activeEmergency={myReport}
            locationLoading={locationLoading}
          />
        </div>
      )}
    </div>
  );
}