import React, { useState } from 'react';
import { Bell, MapPin, Loader2, AlertTriangle, Calendar, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import NearbyEventCard from './NearbyEventCard';
import ResponderTrackingCard from './ResponderTrackingCard';

export function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function AccordionSection({ title, icon: Icon, iconColor, count, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <span className="font-bold text-sm text-gray-800 flex-1 text-left">{title}</span>
        {count > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1">{count}</span>
        )}
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-2 border-t border-gray-100 pt-2">
          {children}
        </div>
      )}
    </div>
  );
}

function EmergencyMiniCard({ emergency, distKm }) {
  const severityColor = {
    critical: 'bg-red-100 text-red-700 border-red-300',
    high: 'bg-orange-100 text-orange-700 border-orange-300',
    medium: 'bg-amber-100 text-amber-700 border-amber-300',
    low: 'bg-blue-100 text-blue-700 border-blue-300',
  }[emergency.severity] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <div className={`rounded-xl border p-3 ${severityColor}`}>
      <div className="flex items-start justify-between gap-2">
        <p className="font-bold text-xs leading-tight">{emergency.title}</p>
        <span className="text-[10px] font-bold uppercase shrink-0">{emergency.severity}</span>
      </div>
      <p className="text-[11px] mt-1 opacity-80 truncate">{emergency.address}</p>
      <div className="flex items-center justify-between mt-1.5">
        <span className="text-[10px] font-semibold uppercase">{emergency.status}</span>
        <span className="text-[10px] opacity-70">{distKm.toFixed(1)} km</span>
      </div>
    </div>
  );
}

export default function NotificationsPanel({ userLocation, events, emergencies = [], activeEmergency, locationLoading }) {
  const nearbyEvents = userLocation
    ? events
        .filter((ev) => {
          if (!ev.latitude || !ev.longitude) return false;
          return getDistanceKm(userLocation.lat, userLocation.lng, ev.latitude, ev.longitude) <= 1;
        })
        .map((ev) => ({ ...ev, dist: getDistanceKm(userLocation.lat, userLocation.lng, ev.latitude, ev.longitude) }))
        .sort((a, b) => a.dist - b.dist)
    : [];

  const nearbyEmergencies = userLocation
    ? emergencies
        .filter((e) => {
          if (!e.latitude || !e.longitude) return false;
          return getDistanceKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude) <= 1;
        })
        .map((e) => ({ ...e, dist: getDistanceKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude) }))
        .sort((a, b) => a.dist - b.dist)
    : [];

  const totalCount = nearbyEvents.length + nearbyEmergencies.length + (activeEmergency ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-200 bg-white shrink-0">
        <Bell className="w-4 h-4 text-blue-500" />
        <h2 className="font-bold text-sm text-gray-800">Notifications</h2>
        {totalCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{totalCount}</span>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {locationLoading && (
          <div className="flex items-center gap-2 text-xs text-gray-500 px-1 py-2">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Getting your location…
          </div>
        )}

        {/* Responder tracking */}
        {activeEmergency && (
          <AccordionSection title="Dispatched Responders" icon={Radio} iconColor="text-amber-500" count={1} defaultOpen={true}>
            <ResponderTrackingCard emergency={activeEmergency} />
          </AccordionSection>
        )}

        {/* Emergencies accordion */}
        <AccordionSection
          title="Nearby Emergencies"
          icon={AlertTriangle}
          iconColor="text-red-500"
          count={nearbyEmergencies.length}
          defaultOpen={nearbyEmergencies.length > 0}
        >
          {nearbyEmergencies.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">No active emergencies within 1 km</p>
          ) : (
            nearbyEmergencies.map((e) => <EmergencyMiniCard key={e.id} emergency={e} distKm={e.dist} />)
          )}
        </AccordionSection>

        {/* Volunteer Events accordion */}
        <AccordionSection
          title="Volunteer Events"
          icon={Calendar}
          iconColor="text-green-500"
          count={nearbyEvents.length}
          defaultOpen={nearbyEvents.length > 0}
        >
          {nearbyEvents.length === 0 ? (
            <p className="text-xs text-gray-400 py-2 text-center">No events within 1 km</p>
          ) : (
            nearbyEvents.map((ev) => <NearbyEventCard key={ev.id} event={ev} distanceKm={ev.dist} />)
          )}
        </AccordionSection>

        {!userLocation && !locationLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-xs text-blue-700">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span>Enable location to see nearby notifications within 1 km.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}