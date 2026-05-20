import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar, Clock, Users } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function EventCard({ event }) {
  const spotsLeft = (event.max_volunteers || 0) - (event.registered_volunteers?.length || 0);

  return (
    <Link to={`/event/${event.id}`}>
      <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-sm leading-tight">{event.title}</h3>
            <StatusBadge status={event.status} />
          </div>
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{event.description}</p>
          <div className="space-y-1.5 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3 h-3" />
              {event.date}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {event.start_time} – {event.end_time}
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{event.location}</span>
            </div>
            {event.max_volunteers && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3 h-3" />
                {spotsLeft > 0 ? `${spotsLeft} spots left` : 'Full'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}