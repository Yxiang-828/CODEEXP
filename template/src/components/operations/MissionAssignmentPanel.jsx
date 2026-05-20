import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Radio, CheckCircle2, AlertCircle, MinusCircle, Loader2, Crosshair } from 'lucide-react';

const statusConfig = {
  available: { label: 'Available', dot: 'bg-green-500', text: 'text-green-700', bg: 'bg-green-50' },
  busy: { label: 'Busy', dot: 'bg-orange-500', text: 'text-orange-700', bg: 'bg-orange-50' },
  offline: { label: 'Offline', dot: 'bg-gray-400', text: 'text-gray-500', bg: 'bg-gray-50' },
};

export default function MissionAssignmentPanel({ responders, emergencies, userLocation }) {
  const queryClient = useQueryClient();
  const [selectedEmergency, setSelectedEmergency] = useState('');
  const [assigning, setAssigning] = useState({});
  const [assigned, setAssigned] = useState({});

  const activeEmergencies = emergencies.filter(e => ['reported', 'acknowledged'].includes(e.status));

  const getStatus = (r) => {
    if (!r.is_available) return 'offline';
    const hasMission = emergencies.some(e =>
      Array.isArray(e.assigned_responders) && e.assigned_responders.includes(r.id || r.username) && e.status === 'responding'
    );
    return hasMission ? 'busy' : 'available';
  };

  const getMissionCount = (r) =>
    emergencies.filter(e =>
      Array.isArray(e.assigned_responders) && e.assigned_responders.includes(r.id || r.username)
    ).length;

  const handleAssign = async (responder, emergencyId) => {
    if (!emergencyId) return;
    const rid = responder.id || responder.username;
    setAssigning(p => ({ ...p, [rid]: true }));
    const emergency = emergencies.find(e => e.id === emergencyId);
    if (!emergency) return;
    const existing = Array.isArray(emergency.assigned_responders) ? emergency.assigned_responders : [];
    const note = {
      author: 'Operations',
      text: `[Assigned] ${responder.display_name} assigned to this mission`,
      timestamp: new Date().toISOString(),
    };
    const existingNotes = Array.isArray(emergency.notes) ? emergency.notes : [];
    await base44.entities.Emergency.update(emergencyId, {
      assigned_responders: [...new Set([...existing, rid])],
      status: 'responding',
      notes: [...existingNotes, note],
    });
    queryClient.invalidateQueries({ queryKey: ['all-emergencies-ops'] });
    setAssigned(p => ({ ...p, [rid]: emergencyId }));
    setAssigning(p => ({ ...p, [rid]: false }));
  };

  if (responders.length === 0) {
    return <p className="text-xs text-gray-400 py-4 text-center">No responders registered</p>;
  }

  return (
    <div className="space-y-3">
      {/* Select emergency */}
      <div>
        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Assign to Emergency</label>
        <select
          value={selectedEmergency}
          onChange={e => setSelectedEmergency(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-green-600"
        >
          <option value="">— Select an emergency —</option>
          {activeEmergencies.map(e => (
            <option key={e.id} value={e.id}>{e.title} ({e.severity})</option>
          ))}
        </select>
      </div>

      {/* Responder cards */}
      {responders.map((r) => {
        const status = getStatus(r);
        const sc = statusConfig[status];
        const missionCount = getMissionCount(r);
        const rid = r.id || r.username;
        const isAssigned = assigned[rid] === selectedEmergency;
        const isLoading = assigning[rid];
        return (
          <div key={rid} className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`w-9 h-9 rounded-full ${sc.bg} border-2 border-white shadow-sm flex items-center justify-center shrink-0`}>
                  <span className="text-sm font-bold text-gray-600">{r.display_name?.charAt(0)}</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-xs text-gray-800 truncate">{r.display_name}</p>
                  <p className="text-[10px] text-gray-400 truncate">@{r.username}</p>
                </div>
              </div>
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text} shrink-0`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} ${status === 'available' ? 'animate-pulse' : ''}`} />
                {sc.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
              <span className="flex items-center gap-1"><Radio className="w-3 h-3" />{missionCount} mission{missionCount !== 1 ? 's' : ''}</span>
              {r.address && <span className="flex items-center gap-1 truncate"><MapPin className="w-3 h-3 shrink-0" />{r.address}</span>}
            </div>
            {r.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {r.skills.slice(0, 3).map(s => (
                  <span key={s} className="text-[9px] bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">{s}</span>
                ))}
              </div>
            )}
            <button
              onClick={() => handleAssign(r, selectedEmergency)}
              disabled={isLoading || isAssigned || status === 'offline' || !selectedEmergency}
              className={`mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                isAssigned ? 'bg-green-100 text-green-700' :
                status === 'offline' || !selectedEmergency ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                'bg-green-700 hover:bg-green-800 text-white'
              }`}
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> :
               isAssigned ? <><CheckCircle2 className="w-3.5 h-3.5" /> Assigned</> :
               <><Crosshair className="w-3.5 h-3.5" /> Assign Mission</>}
            </button>
          </div>
        );
      })}
    </div>
  );
}