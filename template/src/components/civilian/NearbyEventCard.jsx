import React from 'react';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';

export default function NearbyEventCard({ event, distanceKm }) {
  const spotsLeft = (event.max_volunteers || 0) - (event.registered_volunteers?.length || 0);

  return (
    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-600 bg-green-100 px-2 py-0.5 rounded-full">📍 Nearby</span>
            <span className="text-[10px] text-gray-500">{distanceKm.toFixed(1)} km away</span>
          </div>
          <h3 className="font-bold text-sm text-gray-800 leading-tight">{event.title}</h3>
          <div className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-600">
            <Clock className="w-3 h-3 text-green-500" />
            <span>{event.date} {event.start_time && `· ${event.start_time}`}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
            <MapPin className="w-3 h-3 text-green-500" />
            <span className="truncate">{event.location}</span>
          </div>
          {event.max_volunteers > 0 && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-600">
              <Users className="w-3 h-3 text-green-500" />
              <span>{spotsLeft > 0 ? `${spotsLeft} spots left` : 'Fully booked'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}