import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, MapPin, AlertTriangle, Calendar, Loader2 } from 'lucide-react';

function getDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const severityBg = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-blue-100 text-blue-700',
};

export default function JoinableMissionsPanel({ emergencies, events, userLocation }) {
  const { currentUser } = useAppAuth();
  const queryClient = useQueryClient();
  const [loadingId, setLoadingId] = useState(null);
  const [joined, setJoined] = useState({});

  if (!userLocation) {
    return <p className="text-xs text-gray-400 py-4 text-center">Enable location to see nearby missions</p>;
  }

  const nearbyEmergencies = emergencies
    .filter(e => e.latitude && e.longitude &&
      getDistanceKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude) <= 1)
    .map(e => ({ ...e, dist: getDistanceKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude), type: 'emergency' }));

  const nearbyEvents = events
    .filter(e => e.latitude && e.longitude &&
      getDistanceKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude) <= 1)
    .map(e => ({ ...e, dist: getDistanceKm(userLocation.lat, userLocation.lng, e.latitude, e.longitude), type: 'event' }));

  const all = [...nearbyEmergencies, ...nearbyEvents].sort((a, b) => a.dist - b.dist);

  if (all.length === 0) {
    return <p className="text-xs text-gray-400 py-4 text-center">No joinable missions within 1 km</p>;
  }

  const handleJoin = async (item) => {
    setLoadingId(item.id);
    const userId = currentUser?.id || currentUser?.username;
    if (item.type === 'emergency') {
      const existing = Array.isArray(item.assigned_responders) ? item.assigned_responders : [];
      await base44.entities.Emergency.update(item.id, {
        assigned_responders: [...new Set([...existing, userId])],
        status: 'responding',
      });
      queryClient.invalidateQueries({ queryKey: ['emergencies-active-responder'] });
    } else {
      const existing = Array.isArray(item.registered_volunteers) ? item.registered_volunteers : [];
      await base44.entities.VolunteerEvent.update(item.id, {
        registered_volunteers: [...new Set([...existing, userId])],
      });
      queryClient.invalidateQueries({ queryKey: ['events-active'] });
    }
    setJoined(p => ({ ...p, [item.id]: true }));
    setLoadingId(null);
  };

  const handleLeave = async (item) => {
    setLoadingId(item.id);
    const userId = currentUser?.id || currentUser?.username;
    if (item.type === 'emergency') {
      const existing = Array.isArray(item.assigned_responders) ? item.assigned_responders : [];
      await base44.entities.Emergency.update(item.id, {
        assigned_responders: existing.filter(id => id !== userId),
      });
      queryClient.invalidateQueries({ queryKey: ['emergencies-active-responder'] });
    } else {
      const existing = Array.isArray(item.registered_volunteers) ? item.registered_volunteers : [];
      await base44.entities.VolunteerEvent.update(item.id, {
        registered_volunteers: existing.filter(id => id !== userId),
      });
      queryClient.invalidateQueries({ queryKey: ['events-active'] });
    }
    setJoined(p => ({ ...p, [item.id]: false }));
    setLoadingId(null);
  };

  return (
    <div className="space-y-2.5">
      {all.map((item) => {
        const isJoined = joined[item.id] ?? false;
        const isLoading = loadingId === item.id;
        const isEvent = item.type === 'event';
        return (
          <div key={item.id} className={`rounded-xl border p-3 bg-white ${isEvent ? 'border-green-200' : 'border-amber-200'}`}>
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                {isEvent
                  ? <Calendar className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  : <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                }
                <p className="font-bold text-xs text-gray-800 truncate">{item.title}</p>
              </div>
              {item.severity && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${severityBg[item.severity] || 'bg-gray-100 text-gray-600'}`}>
                  {item.severity}
                </span>
              )}
            </div>
            {(item.address || item.location) && (
              <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-2">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{item.address || item.location}</span>
                <span className="ml-auto text-[10px] text-gray-400 shrink-0">{item.dist.toFixed(2)} km</span>
              </div>
            )}
            <button
              onClick={() => isJoined ? handleLeave(item) : handleJoin(item)}
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isJoined
                  ? 'bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-700'
                  : isEvent
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isJoined ? (
                <><LogOut className="w-3.5 h-3.5" /> Leave Mission</>
              ) : (
                <><LogIn className="w-3.5 h-3.5" /> Join Mission</>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}