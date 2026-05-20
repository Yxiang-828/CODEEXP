import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, XCircle, MapPin, AlertTriangle, Loader2 } from 'lucide-react';

const severityColors = {
  critical: 'border-red-400 bg-red-50',
  high: 'border-orange-400 bg-orange-50',
  medium: 'border-amber-300 bg-amber-50',
  low: 'border-blue-300 bg-blue-50',
};

const severityBadge = {
  critical: 'bg-red-500 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-400 text-white',
  low: 'bg-blue-400 text-white',
};

export default function AssignmentsPanel({ assignments }) {
  const { currentUser } = useAppAuth();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState({});
  const [responded, setResponded] = useState({});

  const respond = async (emergency, action) => {
    setLoading((p) => ({ ...p, [emergency.id]: true }));
    const note = {
      author: currentUser?.display_name || 'Responder',
      text: `[Assignment ${action === 'accept' ? 'ACCEPTED ✅' : 'REJECTED ❌'}] by ${currentUser?.display_name}`,
      timestamp: new Date().toISOString(),
    };
    const existing = Array.isArray(emergency.notes) ? emergency.notes : [];
    const newStatus = action === 'accept' ? 'responding' : emergency.status;
    await base44.entities.Emergency.update(emergency.id, {
      status: newStatus,
      notes: [...existing, note],
    });
    setResponded((p) => ({ ...p, [emergency.id]: action }));
    setLoading((p) => ({ ...p, [emergency.id]: false }));
    queryClient.invalidateQueries({ queryKey: ['emergencies-active-responder'] });
  };

  if (assignments.length === 0) {
    return (
      <div className="text-center py-6 px-4">
        <CheckCircle2 className="w-8 h-8 text-green-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-gray-500">No pending assignments</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {assignments.map((e) => {
        const done = responded[e.id];
        return (
          <div key={e.id} className={`border-2 rounded-xl p-3 ${severityColors[e.severity] || 'border-gray-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                <p className="font-bold text-xs text-gray-800 leading-tight">{e.title}</p>
              </div>
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase shrink-0 ${severityBadge[e.severity] || 'bg-gray-400 text-white'}`}>
                {e.severity}
              </span>
            </div>
            {e.address && (
              <div className="flex items-center gap-1 text-[11px] text-gray-500 mb-2">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{e.address}</span>
              </div>
            )}
            {e.description && <p className="text-[11px] text-gray-600 mb-2 line-clamp-2">{e.description}</p>}

            {done ? (
              <div className={`text-xs font-bold py-1.5 rounded-lg text-center ${done === 'accept' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {done === 'accept' ? '✅ Assignment Accepted' : '❌ Assignment Rejected'}
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => respond(e, 'accept')}
                  disabled={!!loading[e.id]}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {loading[e.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Accept
                </button>
                <button
                  onClick={() => respond(e, 'reject')}
                  disabled={!!loading[e.id]}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-400 hover:bg-red-500 text-white text-xs font-bold transition-colors disabled:opacity-50"
                >
                  {loading[e.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Reject
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}