import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppAuth } from '@/lib/authContext.jsx';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  User, Phone, MapPin, LogOut, Shield, Radio, Users,
  ArrowLeftRight, Tag
} from 'lucide-react';

const roleConfig = {
  civilian: { label: 'Civilian', color: 'bg-blue-100 text-blue-700', icon: Users },
  responder: { label: 'Responder', color: 'bg-amber-100 text-amber-700', icon: Radio },
  operations: { label: 'Operations', color: 'bg-green-100 text-green-700', icon: Shield },
};

export default function Profile() {
  const { currentUser, logout, switchRole } = useAppAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.entities.AppUser.update(currentUser.id, data),
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const handleToggleAvailability = () => {
    const newVal = !currentUser?.is_available;
    updateMutation.mutate({ is_available: newVal });
    // Update local state too
    const updated = { ...currentUser, is_available: newVal };
    localStorage.setItem('kampungkaki_user', JSON.stringify(updated));
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const activeRole = currentUser?.active_role || 'civilian';
  const canSwitch = currentUser?.secondary_role && currentUser.secondary_role !== 'none';

  const getOtherRole = () => {
    if (activeRole === currentUser?.primary_role) return currentUser?.secondary_role;
    return currentUser?.primary_role;
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-bold flex items-center gap-2 mb-6">
        <User className="w-5 h-5" />
        Profile
      </h1>

      {/* User Info */}
      <Card className="mb-4">
        <CardContent className="p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {currentUser?.display_name?.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="font-heading text-lg font-bold">{currentUser?.display_name}</h2>
              <p className="text-sm text-muted-foreground">@{currentUser?.username}</p>
              <Badge className={`${roleConfig[activeRole]?.color} mt-1 text-[10px] uppercase`}>
                {roleConfig[activeRole]?.label} Mode
              </Badge>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{currentUser?.phone || 'No phone set'}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>{currentUser?.address || 'No address set'}</span>
            </div>
          </div>

          {currentUser?.skills?.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center gap-1.5 text-sm font-medium mb-2">
                <Tag className="w-4 h-4" /> Skills
              </div>
              <div className="flex flex-wrap gap-1.5">
                {currentUser.skills.map((skill, i) => (
                  <span key={i} className="text-xs bg-muted px-2.5 py-1 rounded-full">{skill}</span>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Switching */}
      {canSwitch && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" /> Switch Role
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground mb-3">
              You can switch between your {roleConfig[currentUser?.primary_role]?.label} and {roleConfig[currentUser?.secondary_role]?.label} roles.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => switchRole(getOtherRole())}
            >
              Switch to {roleConfig[getOtherRole()]?.label} Mode
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Availability Toggle (for responders) */}
      {currentUser?.primary_role === 'responder' && (
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="font-semibold text-sm">Availability Status</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentUser?.is_available ? 'You are available for duty' : 'You are currently off duty'}
                </p>
              </div>
              <Switch
                checked={currentUser?.is_available}
                onCheckedChange={handleToggleAvailability}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Logout */}
      <Button variant="outline" className="w-full text-destructive border-destructive/20 hover:bg-destructive/5" onClick={handleLogout}>
        <LogOut className="w-4 h-4 mr-2" /> Log Out
      </Button>
    </div>
  );
}