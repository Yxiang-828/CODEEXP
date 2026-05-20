import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { useQueryClient } from '@tanstack/react-query';
import { X, AlertTriangle, Loader2, Eye } from 'lucide-react';

const CATEGORIES = ['health', 'fire', 'flood', 'accident', 'hazard'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];

const severityColors = {
  critical: { bg: 'bg-red-600', border: 'border-red-500', text: 'text-red-700', light: 'bg-red-50' },
  high: { bg: 'bg-orange-500', border: 'border-orange-400', text: 'text-orange-700', light: 'bg-orange-50' },
  medium: { bg: 'bg-yellow-500', border: 'border-yellow-400', text: 'text-yellow-700', light: 'bg-yellow-50' },
  low: { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-700', light: 'bg-green-50' },
};

const catIcon = { health: '🏥', fire: '🔥', flood: '🌊', accident: '🚗', hazard: '⚠️' };

export default function DeclareEventModal({ polygonCoords, onClose, onDeclared }) {
  const { currentUser } = useAppAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', category: 'hazard', severity: 'medium', description: '' });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);

  const sc = severityColors[form.severity];

  const handleDeclare = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const center = polygonCoords.reduce(
      (acc, [lat, lng]) => ({ lat: acc.lat + lat / polygonCoords.length, lng: acc.lng + lng / polygonCoords.length }),
      { lat: 0, lng: 0 }
    );
    await base44.entities.EmergencyZone.create({
      ...form,
      polygon_coords: polygonCoords,
      center_lat: center.lat,
      center_lng: center.lng,
      status: 'declared',
      declared_by: currentUser?.display_name,
    });
    // Also create an Emergency record so civilians/responders see it
    await base44.entities.Emergency.create({
      title: form.title,
      description: form.description,
      category: form.category === 'health' ? 'medical' : form.category === 'flood' ? 'natural_disaster' : form.category === 'hazard' ? 'other' : form.category,
      severity: form.severity,
      status: 'reported',
      latitude: center.lat,
      longitude: center.lng,
      address: `Zone declared by Operations (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)})`,
    });
    queryClient.invalidateQueries({ queryKey: ['emergency-zones'] });
    queryClient.invalidateQueries({ queryKey: ['all-emergencies-ops'] });
    setSaving(false);
    if (onDeclared) onDeclared();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-green-800 text-white">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            <h2 className="font-bold text-base">Declare Emergency Zone</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {!preview ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Event Title *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="e.g. Building Fire — Blk 45"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{catIcon[c]} {c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Severity</label>
                  <select
                    value={form.severity}
                    onChange={e => setForm(p => ({ ...p, severity: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {SEVERITIES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Additional details about the zone…"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 resize-none"
                />
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 rounded-xl p-3">
                <span className="font-semibold">Zone:</span> {polygonCoords.length} vertices drawn
              </div>
            </>
          ) : (
            /* Preview card */
            <div className={`rounded-2xl border-2 ${sc.border} ${sc.light} p-4`}>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Notification Preview</p>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl ${sc.bg} flex items-center justify-center shrink-0 text-lg`}>
                  {catIcon[form.category]}
                </div>
                <div>
                  <p className={`font-bold text-sm ${sc.text}`}>{form.title || 'Untitled Event'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{form.category} · {form.severity} severity</p>
                  {form.description && <p className="text-xs text-gray-600 mt-1 leading-relaxed">{form.description}</p>}
                  <p className="text-[10px] text-gray-400 mt-2 font-semibold">⚠️ Emergency zone declared by Operations</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <button
            onClick={() => setPreview(p => !p)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            {preview ? 'Edit' : 'Preview'}
          </button>
          <button
            onClick={handleDeclare}
            disabled={saving || !form.title.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            Declare Event
          </button>
        </div>
      </div>
    </div>
  );
}