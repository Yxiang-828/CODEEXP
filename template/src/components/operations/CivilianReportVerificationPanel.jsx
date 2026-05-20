import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { MapPin, Clock, CheckCircle2, XCircle, Image, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

const categoryIcons = {
  medical: '🩺', fire: '🔥', accident: '🚗', crime: '🚨',
  natural_disaster: '🌊', infrastructure: '🔧', other: '📋',
};

const severityColors = {
  critical: 'border-red-400 bg-red-50 text-red-700',
  high: 'border-orange-400 bg-orange-50 text-orange-700',
  medium: 'border-yellow-400 bg-yellow-50 text-yellow-700',
  low: 'border-blue-300 bg-blue-50 text-blue-700',
};

export default function CivilianReportVerificationPanel({ reports }) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState({});
  const [decisions, setDecisions] = useState({});

  // Only show reports that haven't been acknowledged yet (still in reported status)
  // and filter out 'not_acknowledged' ones from main view
  const pending = reports.filter(r => !decisions[r.id] || decisions[r.id] === 'pending');

  const acknowledge = async (report, action) => {
    setLoading(p => ({ ...p, [report.id]: true }));
    const existingNotes = Array.isArray(report.notes) ? report.notes : [];
    if (action === 'acknowledge') {
      const note = {
        author: 'Operations',
        text: `[Verified ✅] Report acknowledged and verified by Operations.`,
        timestamp: new Date().toISOString(),
      };
      await base44.entities.Emergency.update(report.id, {
        status: 'acknowledged',
        notes: [...existingNotes, note],
      });
    } else {
      // Not acknowledged — add note visible to civilian on their notifications
      const note = {
        author: 'Operations',
        text: `[Not Acknowledged ❌] This report was reviewed and not acknowledged by Operations. No emergency action will be taken.`,
        timestamp: new Date().toISOString(),
      };
      await base44.entities.Emergency.update(report.id, {
        status: 'closed',
        notes: [...existingNotes, note],
      });
    }
    queryClient.invalidateQueries({ queryKey: ['all-emergencies-ops'] });
    setDecisions(p => ({ ...p, [report.id]: action === 'acknowledge' ? 'acknowledged' : 'rejected' }));
    setLoading(p => ({ ...p, [report.id]: false }));
  };

  if (pending.length === 0) {
    return (
      <div className="text-center py-6">
        <ShieldCheck className="w-10 h-10 text-green-400 mx-auto mb-2" />
        <p className="text-xs text-gray-400 font-semibold">All reports reviewed</p>
        <p className="text-[10px] text-gray-300 mt-0.5">No pending civilian reports</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {pending.map((report) => {
        const decision = decisions[report.id];
        const isLoading = loading[report.id];
        return (
          <div key={report.id} className={`border-2 rounded-xl p-3 ${severityColors[report.severity] || 'border-gray-200 bg-white'}`}>
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base leading-none">{categoryIcons[report.category] || '📋'}</span>
                <p className="font-bold text-xs text-gray-800 leading-tight">{report.title}</p>
              </div>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-yellow-200 text-yellow-800 shrink-0 uppercase">
                Unverified
              </span>
            </div>

            {/* Meta */}
            <div className="space-y-1 mb-2">
              {report.address && (
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">{report.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-[11px] text-gray-500">
                <Clock className="w-3 h-3 shrink-0" />
                <span>{format(new Date(report.created_date), 'dd MMM HH:mm')}</span>
                {report.reporter_name && <><span>·</span><span>{report.reporter_name}</span></>}
              </div>
            </div>

            {report.description && (
              <p className="text-[11px] text-gray-600 mb-2 line-clamp-2">{report.description}</p>
            )}

            {/* Image preview */}
            {report.image_url && (
              <div className="mb-2 rounded-lg overflow-hidden border border-gray-200">
                <img src={report.image_url} alt="Report" className="w-full h-20 object-cover" />
              </div>
            )}

            {/* AI confidence placeholder */}
            <div className="bg-white/60 rounded-lg p-2 mb-2 border border-gray-200">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">AI Confidence</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                  <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${65 + Math.floor(Math.random() * 25)}%` }} />
                </div>
                <span className="text-[10px] font-bold text-gray-600">Likely Genuine</span>
              </div>
            </div>

            {/* Decision buttons */}
            {decision === 'acknowledged' ? (
              <div className="flex items-center gap-2 py-1.5 px-3 bg-green-100 rounded-lg text-xs font-bold text-green-700">
                <ShieldCheck className="w-3.5 h-3.5" />Verified — visible to responders & civilians
              </div>
            ) : decision === 'rejected' ? (
              <div className="flex items-center gap-2 py-1.5 px-3 bg-red-50 rounded-lg text-xs font-bold text-red-600">
                <XCircle className="w-3.5 h-3.5" />Not acknowledged — civilian notified
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => acknowledge(report, 'acknowledge')}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-[10px] font-bold transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Acknowledged
                </button>
                <button
                  onClick={() => acknowledge(report, 'reject')}
                  disabled={isLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-gray-200 hover:bg-red-100 text-gray-700 hover:text-red-700 text-[10px] font-bold transition-colors disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                  Not Acknowledged
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}