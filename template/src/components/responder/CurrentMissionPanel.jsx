import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { MapPin, Clock, Send, Radio, AlertTriangle } from 'lucide-react';

const categoryLabels = {
  medical: 'Medical', fire: 'Fire', accident: 'Accident',
  crime: 'Crime', natural_disaster: 'Natural Disaster', infrastructure: 'Infrastructure', other: 'Other',
};

const severityColors = {
  critical: 'text-red-600 bg-red-100',
  high: 'text-orange-600 bg-orange-100',
  medium: 'text-amber-600 bg-amber-100',
  low: 'text-blue-600 bg-blue-100',
};

export default function CurrentMissionPanel({ mission, onMessageSent }) {
  const { currentUser } = useAppAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [eta, setEta] = useState(null);

  // Simulate countdown ETA
  useEffect(() => {
    if (!mission) return;
    let t = 8;
    setEta(t);
    const iv = setInterval(() => {
      t = Math.max(0, t - 1);
      setEta(t);
    }, 60000);
    return () => clearInterval(iv);
  }, [mission?.id]);

  const sendMessage = async () => {
    if (!message.trim() || !mission) return;
    setSending(true);
    const note = {
      author: currentUser?.display_name || 'Responder',
      text: `[Responder] ${message.trim()}`,
      timestamp: new Date().toISOString(),
    };
    const existing = Array.isArray(mission.notes) ? mission.notes : [];
    await base44.entities.Emergency.update(mission.id, { notes: [...existing, note] });
    setMessage('');
    setSending(false);
    if (onMessageSent) onMessageSent();
  };

  if (!mission) {
    return (
      <div className="text-center py-6 px-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
          <Radio className="w-6 h-6 text-gray-400" />
        </div>
        <p className="text-sm font-semibold text-gray-500">No active mission</p>
        <p className="text-xs text-gray-400 mt-1">You haven't been dispatched yet</p>
      </div>
    );
  }

  const notes = Array.isArray(mission.notes) ? mission.notes : [];
  const responderMessages = notes.filter(n => n.text?.startsWith('[Responder]'));

  return (
    <div className="space-y-3">
      {/* Mission header */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <p className="font-bold text-sm text-gray-800 leading-tight">{mission.title}</p>
          </div>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${severityColors[mission.severity] || 'bg-gray-100 text-gray-600'}`}>
            {mission.severity}
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-1.5">{categoryLabels[mission.category] || mission.category}</p>
        {mission.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{mission.description}</p>}
      </div>

      {/* ETA & location */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500 shrink-0" />
          <div>
            <p className="text-[10px] text-amber-600 font-semibold uppercase">ETA</p>
            <p className="text-base font-bold text-amber-700">{eta !== null ? `${eta} min` : '—'}</p>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
          <div>
            <p className="text-[10px] text-blue-600 font-semibold uppercase">Location</p>
            <p className="text-xs font-semibold text-blue-700 truncate">{mission.address || `${mission.latitude?.toFixed(3)}, ${mission.longitude?.toFixed(3)}`}</p>
          </div>
        </div>
      </div>

      {/* Live updates / notes */}
      {notes.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 max-h-28 overflow-y-auto space-y-1.5">
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Live Updates</p>
          {notes.map((n, i) => (
            <div key={i} className="text-xs text-gray-700">
              <span className="font-semibold text-gray-500">{n.author}: </span>{n.text?.replace('[Responder] ', '')}
            </div>
          ))}
        </div>
      )}

      {/* Message box */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">Message Civilian</p>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !sending && sendMessage()}
            placeholder="Send a message to the reporter…"
            className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !message.trim()}
            className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center disabled:opacity-40 hover:bg-amber-600 transition-colors shrink-0"
          >
            <Send className="w-3 h-3 text-white" />
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">Messages are visible to the civilian in their notifications</p>
      </div>
    </div>
  );
}