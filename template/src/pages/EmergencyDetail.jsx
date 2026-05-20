import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft, MapPin, Phone, User, Clock, Send, AlertTriangle,
  Flame, Car, CloudRain, Shield, Wrench
} from 'lucide-react';
import { format } from 'date-fns';
import SeverityBadge from '@/components/shared/SeverityBadge';
import StatusBadge from '@/components/shared/StatusBadge';

const categoryIcons = {
  medical: AlertTriangle, fire: Flame, accident: Car,
  crime: Shield, natural_disaster: CloudRain, infrastructure: Wrench, other: AlertTriangle,
};

export default function EmergencyDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAppAuth();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState('');

  const { data: emergency, isLoading } = useQuery({
    queryKey: ['emergency', id],
    queryFn: async () => {
      const results = await base44.entities.Emergency.filter({ id });
      return results[0];
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ data }) => base44.entities.Emergency.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emergency', id] }),
  });

  const handleStatusChange = (newStatus) => {
    const data = { status: newStatus };
    if (newStatus === 'resolved') data.resolved_at = new Date().toISOString();
    updateMutation.mutate({ data });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    const notes = [...(emergency.notes || []), {
      author: currentUser.display_name,
      text: newNote.trim(),
      timestamp: new Date().toISOString(),
    }];
    updateMutation.mutate({ data: { notes } });
    setNewNote('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!emergency) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-center text-muted-foreground">Emergency not found.</p>
      </div>
    );
  }

  const Icon = categoryIcons[emergency.category] || AlertTriangle;
  const isResponderOrOps = currentUser?.active_role === 'responder' || currentUser?.active_role === 'operations';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-6 h-6 text-foreground" />
          </div>
          <div className="flex-1">
            <h1 className="font-heading text-xl font-bold leading-tight">{emergency.title}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <SeverityBadge severity={emergency.severity} />
              <StatusBadge status={emergency.status} />
            </div>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{emergency.description}</p>
      </div>

      {/* Details */}
      <Card className="mb-4">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>{emergency.address || 'No address provided'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <User className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>Reported by {emergency.reporter_name || 'Unknown'}</span>
          </div>
          {emergency.reporter_phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <a href={`tel:${emergency.reporter_phone}`} className="text-primary underline">{emergency.reporter_phone}</a>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
            <span>{format(new Date(emergency.created_date), 'dd MMM yyyy, HH:mm')}</span>
          </div>
        </CardContent>
      </Card>

      {/* Map Link */}
      {emergency.latitude && emergency.longitude && (
        <a
          href={`https://www.google.com/maps?q=${emergency.latitude},${emergency.longitude}`}
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
                <div className="text-[11px] text-muted-foreground">
                  {emergency.latitude.toFixed(4)}, {emergency.longitude.toFixed(4)}
                </div>
              </div>
            </CardContent>
          </Card>
        </a>
      )}

      {/* Status Update (Responder/Ops only) */}
      {isResponderOrOps && emergency.status !== 'resolved' && emergency.status !== 'closed' && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Update Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Select value={emergency.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="reported">Reported</SelectItem>
                <SelectItem value="acknowledged">Acknowledged</SelectItem>
                <SelectItem value="responding">Responding</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      {/* Activity Notes */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Activity Log</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {emergency.notes?.length > 0 ? (
            <div className="space-y-3 mb-4">
              {emergency.notes.map((note, i) => (
                <div key={i} className="border-l-2 border-primary/20 pl-3 py-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-semibold">{note.author}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {format(new Date(note.timestamp), 'dd MMM, HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{note.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground mb-4">No activity notes yet.</p>
          )}

          {/* Add Note */}
          <div className="flex gap-2">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note..."
              className="min-h-[40px] text-sm"
              rows={2}
            />
            <Button size="icon" onClick={handleAddNote} disabled={!newNote.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}