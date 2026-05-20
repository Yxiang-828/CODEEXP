import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, MapPin, Calendar, Clock, Users, User, Tag, CheckCircle2 } from 'lucide-react';
import StatusBadge from '@/components/shared/StatusBadge';

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAppAuth();
  const queryClient = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id],
    queryFn: async () => {
      const results = await base44.entities.VolunteerEvent.filter({ id });
      return results[0];
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.VolunteerEvent.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event', id] }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-center text-muted-foreground">Event not found.</p>
      </div>
    );
  }

  const volunteers = event.registered_volunteers || [];
  const isRegistered = volunteers.includes(currentUser?.id);
  const spotsLeft = (event.max_volunteers || 0) - volunteers.length;
  const canRegister = event.status === 'upcoming' && spotsLeft > 0 && !isRegistered;

  const handleRegister = () => {
    updateMutation.mutate({
      registered_volunteers: [...volunteers, currentUser.id],
    });
  };

  const handleUnregister = () => {
    updateMutation.mutate({
      registered_volunteers: volunteers.filter(v => v !== currentUser.id),
    });
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h1 className="font-heading text-xl font-bold leading-tight">{event.title}</h1>
          <StatusBadge status={event.status} />
        </div>
        <p className="text-sm text-muted-foreground">{event.description}</p>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>{event.date}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{event.start_time} – {event.end_time}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{event.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground" />
            <span>Organized by {event.organizer}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{volunteers.length} / {event.max_volunteers || '∞'} volunteers registered</span>
          </div>
        </CardContent>
      </Card>

      {event.skills_needed?.length > 0 && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm font-semibold mb-2">
              <Tag className="w-4 h-4" /> Skills Needed
            </div>
            <div className="flex flex-wrap gap-1.5">
              {event.skills_needed.map((skill, i) => (
                <span key={i} className="text-xs bg-muted px-2.5 py-1 rounded-full">{skill}</span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Map Link */}
      {event.latitude && event.longitude && (
        <a
          href={`https://www.google.com/maps?q=${event.latitude},${event.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Card className="mb-4 hover:shadow-md transition-all cursor-pointer border-primary/20">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="font-semibold text-sm">View on Google Maps</div>
                <div className="text-[11px] text-muted-foreground">{event.location}</div>
              </div>
            </CardContent>
          </Card>
        </a>
      )}

      {/* Register/Unregister */}
      {event.status === 'upcoming' && (
        <div>
          {isRegistered ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-lg">
                <CheckCircle2 className="w-4 h-4" />
                You're registered for this event!
              </div>
              <Button variant="outline" className="w-full" onClick={handleUnregister} disabled={updateMutation.isPending}>
                Cancel Registration
              </Button>
            </div>
          ) : canRegister ? (
            <Button className="w-full h-12" onClick={handleRegister} disabled={updateMutation.isPending}>
              Register as Volunteer ({spotsLeft} spots left)
            </Button>
          ) : spotsLeft <= 0 ? (
            <Button className="w-full h-12" disabled>Event is Full</Button>
          ) : null}
        </div>
      )}
    </div>
  );
}