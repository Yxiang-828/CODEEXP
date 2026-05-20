import React, { useState, useEffect } from 'react';
import { Truck, Clock, MessageCircle, MapPin, Radio, ChevronDown, ChevronUp } from 'lucide-react';

// Simulated responder messages that update over time
const messagePool = [
  "We are on our way. Please stay calm.",
  "Approximately 3 minutes from your location.",
  "SCDF unit dispatched. ETA updated.",
  "Unit arriving shortly. Please keep the area clear.",
  "We have received your report. Help is coming.",
  "Please call 995 if situation worsens.",
  "Unit is at the junction of your street.",
  "Arrived on scene. Heading to you now.",
];

function getSimulatedETA(base, elapsed) {
  return Math.max(1, base - Math.floor(elapsed / 30));
}

export default function ResponderTrackingCard({ emergency }) {
  const [elapsed, setElapsed] = useState(0);
  const [messages, setMessages] = useState([
    { text: messagePool[0], time: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' }) }
  ]);
  const [showMessages, setShowMessages] = useState(true);

  useEffect(() => {
    const ticker = setInterval(() => {
      setElapsed(e => e + 1);
    }, 1000);
    return () => clearInterval(ticker);
  }, []);

  // Add new messages periodically
  useEffect(() => {
    if (elapsed > 0 && elapsed % 45 === 0) {
      const idx = Math.min(Math.floor(elapsed / 45), messagePool.length - 1);
      setMessages(prev => [
        ...prev,
        {
          text: messagePool[idx] || messagePool[messagePool.length - 1],
          time: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [elapsed]);

  const units = [
    { name: 'SCDF Unit 7', type: 'Ambulance', baseETA: 8 },
    { name: 'SPF Patrol', type: 'Police', baseETA: 5 },
  ];

  return (
    <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 shadow-md">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl bg-amber-500 flex items-center justify-center shrink-0">
          <Radio className="w-4 h-4 text-white animate-pulse" />
        </div>
        <div>
          <h3 className="font-bold text-sm text-amber-900">Help is On the Way!</h3>
          <p className="text-xs text-amber-700 truncate max-w-[180px]">{emergency?.title || 'Your Report'}</p>
        </div>
        <span className="ml-auto text-[10px] bg-amber-200 text-amber-800 font-bold px-2 py-0.5 rounded-full animate-pulse">LIVE</span>
      </div>

      {/* Responder units */}
      <div className="space-y-2 mb-3">
        {units.map((unit, i) => (
          <div key={i} className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-3 border border-amber-200">
            <Truck className="w-4 h-4 text-amber-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-xs text-gray-800">{unit.name}</div>
              <div className="text-[11px] text-gray-500">{unit.type}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-amber-600">
                <Clock className="w-3 h-3" />
                <span className="font-bold text-xs">{getSimulatedETA(unit.baseETA, elapsed)} min</span>
              </div>
              <div className="text-[10px] text-gray-400">ETA</div>
            </div>
          </div>
        ))}
      </div>

      {/* Messages */}
      <div>
        <button
          onClick={() => setShowMessages(!showMessages)}
          className="flex items-center gap-2 text-xs font-semibold text-amber-800 mb-2 w-full"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          Messages from Responders
          {showMessages ? <ChevronUp className="w-3.5 h-3.5 ml-auto" /> : <ChevronDown className="w-3.5 h-3.5 ml-auto" />}
        </button>
        {showMessages && (
          <div className="space-y-1.5 max-h-28 overflow-y-auto">
            {messages.map((msg, i) => (
              <div key={i} className="bg-white rounded-xl px-3 py-2 border border-amber-100">
                <p className="text-xs text-gray-700">{msg.text}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{msg.time}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}