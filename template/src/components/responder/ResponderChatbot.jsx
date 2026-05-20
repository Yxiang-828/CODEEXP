import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, User, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SUGGESTED = [
  "What's the fastest route to my mission?",
  "Triage protocol for mass casualty?",
  "How to handle a fire in a high-rise?",
  "CPR steps for unresponsive adult",
  "Defibrillator nearest location?",
];

export default function ResponderChatbot({ onClose, currentMission }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: `Operational AI online. I have access to real-time emergency data.${currentMission ? ` Your current mission: **${currentMission.title}** (${currentMission.severity} severity).` : ''} How can I assist?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    setMessages(p => [...p, { role: 'user', text: text.trim() }]);
    setInput('');
    setLoading(true);

    const ctx = messages.slice(-6).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
    const missionCtx = currentMission
      ? `Current mission: ${currentMission.title}, ${currentMission.category}, ${currentMission.severity} severity, location: ${currentMission.address || 'unknown'}.`
      : 'No active mission assigned.';

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are an AI operational support assistant for a KampungKaki emergency responder in Singapore. You provide real-time tactical guidance, medical protocols, routing suggestions, and safety advice.
      
${missionCtx}

Previous messages:
${ctx}

Responder: ${text.trim()}

Provide a concise, actionable response in 2-4 sentences. Prioritize safety. For life threats, always recommend immediate 995/999.`,
    });

    setLoading(false);
    setMessages(p => [...p, { role: 'assistant', text: response }]);
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-end p-4 pointer-events-none">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col pointer-events-auto" style={{ height: '520px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-amber-600 rounded-t-2xl shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-white font-bold text-sm">Operational AI</p>
              <p className="text-amber-200 text-[10px]">Real-time support</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-amber-500' : 'bg-gray-700'}`}>
                {msg.role === 'user' ? <User className="w-3.5 h-3.5 text-white" /> : <Bot className="w-3.5 h-3.5 text-white" />}
              </div>
              <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${msg.role === 'user' ? 'bg-amber-500 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gray-700 flex items-center justify-center shrink-0">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-3 py-2 shadow-sm">
                <Loader2 className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div className="px-3 pb-2 bg-gray-50">
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-[10px] bg-amber-50 border border-amber-200 text-amber-700 rounded-full px-2 py-1 hover:bg-amber-100 transition-colors font-medium">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="px-3 py-2.5 border-t border-gray-200 bg-white rounded-b-2xl">
          <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 py-1.5">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !loading && sendMessage(input)}
              placeholder="Ask operational question…"
              className="flex-1 bg-transparent text-xs outline-none text-gray-700 placeholder-gray-400"
              disabled={loading}
            />
            <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()}
              className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center disabled:opacity-40 hover:bg-amber-600 transition-colors shrink-0">
              <Send className="w-3 h-3 text-white" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}