import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Edit2, Archive, CheckCircle2, Clock, FileText, Loader2 } from 'lucide-react';

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-200 text-gray-700', icon: FileText },
  pending_review: { label: 'Pending Review', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  declared: { label: 'Declared', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  archived: { label: 'Archived', color: 'bg-gray-100 text-gray-500', icon: Archive },
};

const severityColors = {
  critical: 'border-red-500 bg-red-50',
  high: 'border-orange-400 bg-orange-50',
  medium: 'border-yellow-400 bg-yellow-50',
  low: 'border-green-400 bg-green-50',
};

const catIcon = { health: '🏥', fire: '🔥', flood: '🌊', accident: '🚗', hazard: '⚠️' };

export default function EmergencyEventsPanel({ zones }) {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState({});

  const updateZone = async (id, data) => {
    setLoading(p => ({ ...p, [id]: true }));
    await base44.entities.EmergencyZone.update(id, data);
    queryClient.invalidateQueries({ queryKey: ['emergency-zones'] });
    setLoading(p => ({ ...p, [id]: false }));
    setEditingId(null);
  };

  if (zones.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
          <AlertTriangle className="w-6 h-6 text-gray-300" />
        </div>
        <p className="text-xs text-gray-400">No emergency zones yet</p>
        <p className="text-[10px] text-gray-300 mt-0.5">Draw a polygon on the map to create one</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {zones.map((zone) => {
        const sc = statusConfig[zone.status] || statusConfig.draft;
        const StatusIcon = sc.icon;
        const isEditing = editingId === zone.id;
        return (
          <div key={zone.id} className={`border-2 rounded-xl p-3 ${severityColors[zone.severity] || 'border-gray-200 bg-white'}`}>
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{catIcon[zone.category] || '⚠️'}</span>
                <p className="font-bold text-xs text-gray-800 leading-tight">{zone.title}</p>
              </div>
              <span className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full ${sc.color} shrink-0`}>
                <StatusIcon className="w-2.5 h-2.5" />{sc.label}
              </span>
            </div>

            {isEditing ? (
              <div className="space-y-2 mt-2">
                <input
                  value={editForm.title || ''}
                  onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))}
                  className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none"
                  placeholder="Event title"
                />
                <div className="grid grid-cols-2 gap-2">
                  <select value={editForm.severity || zone.severity} onChange={e => setEditForm(p => ({ ...p, severity: e.target.value }))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                    {['low', 'medium', 'high', 'critical'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select value={editForm.status || zone.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 outline-none">
                    {['draft', 'pending_review', 'declared', 'archived'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateZone(zone.id, editForm)}
                    disabled={loading[zone.id]}
                    className="flex-1 py-1.5 rounded-lg bg-green-700 text-white text-[10px] font-bold hover:bg-green-800 disabled:opacity-50 flex items-center justify-center gap-1">
                    {loading[zone.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    Save
                  </button>
                  <button onClick={() => setEditingId(null)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-[10px] font-semibold text-gray-600 hover:bg-gray-50">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-2">
                  <span className="capitalize">{zone.category}</span>
                  <span>·</span>
                  <span className="capitalize font-semibold">{zone.severity}</span>
                  {zone.declared_by && <><span>·</span><span>by {zone.declared_by}</span></>}
                </div>
                {zone.description && <p className="text-[11px] text-gray-600 mb-2 line-clamp-2">{zone.description}</p>}
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(zone.id); setEditForm({ title: zone.title, severity: zone.severity, status: zone.status }); }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 text-[10px] font-semibold text-gray-700 hover:bg-gray-50">
                    <Edit2 className="w-3 h-3" />Edit
                  </button>
                  {zone.status !== 'archived' && (
                    <button onClick={() => updateZone(zone.id, { status: 'archived' })}
                      disabled={loading[zone.id]}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg border border-gray-200 text-[10px] font-semibold text-gray-500 hover:bg-gray-100">
                      {loading[zone.id] ? <Loader2 className="w-3 h-3 animate-spin" /> : <Archive className="w-3 h-3" />}Archive
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}