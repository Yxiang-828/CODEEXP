import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { useGeolocation } from '@/lib/geolocation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, MapPin, Loader2, AlertTriangle, Navigation } from 'lucide-react';

export default function ReportEmergency() {
  const navigate = useNavigate();
  const { currentUser } = useAppAuth();
  const { location: geoLocation, loading: geoLoading } = useGeolocation();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    severity: 'medium',
    address: '',
    reporter_name: currentUser?.display_name || '',
    reporter_phone: currentUser?.phone || '',
    latitude: null,
    longitude: null,
  });

  useEffect(() => {
    if (geoLocation) {
      setForm(prev => ({
        ...prev,
        latitude: geoLocation.latitude,
        longitude: geoLocation.longitude,
      }));
    }
  }, [geoLocation]);

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Emergency.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergencies'] });
      navigate('/emergencies');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      status: 'reported',
      notes: [{
        author: currentUser.display_name,
        text: 'Emergency reported.',
        timestamp: new Date().toISOString(),
      }],
    });
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back
      </Button>

      <div className="mb-6">
        <h1 className="font-heading text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-destructive" />
          Report Emergency
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Provide as much detail as possible</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Brief description of the emergency"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={form.category} onValueChange={(v) => updateField('category', v)} required>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="medical">Medical</SelectItem>
                  <SelectItem value="fire">Fire</SelectItem>
                  <SelectItem value="accident">Accident</SelectItem>
                  <SelectItem value="crime">Crime</SelectItem>
                  <SelectItem value="natural_disaster">Natural Disaster</SelectItem>
                  <SelectItem value="infrastructure">Infrastructure</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severity *</Label>
              <Select value={form.severity} onValueChange={(v) => updateField('severity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe what's happening..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Location
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <div className="space-y-2">
              <Label>Address</Label>
              <Input
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Enter the location address"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {geoLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Detecting your location...
                </>
              ) : form.latitude ? (
                <>
                  <Navigation className="w-3 h-3 text-green-500" />
                  GPS: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}
                </>
              ) : (
                <>
                  <MapPin className="w-3 h-3 text-amber-500" />
                  Location unavailable
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-2">
              <Label>Your Name</Label>
              <Input
                value={form.reporter_name}
                onChange={(e) => updateField('reporter_name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input
                value={form.reporter_phone}
                onChange={(e) => updateField('reporter_phone', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Button
          type="submit"
          className="w-full h-12 bg-destructive hover:bg-destructive/90"
          disabled={!form.title || !form.category || createMutation.isPending}
        >
          {createMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Submit Emergency Report
        </Button>
      </form>
    </div>
  );
}