import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, User } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const SUGGESTED = [
  "What should I do in a flood?",
  "How do I perform CPR?",
  "Nearest community emergency shelter?",
  "What is SCDF's role?",
  "How to prepare an emergency kit?",
];

export default function ChatbotTab() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I'm KampungKaki's emergency assistant. I can help you with emergency preparedness, first aid tips, and Singapore emergency services. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    const context = messages
      .slice(-6)
      .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n');

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `You are KampungKaki's helpful emergency assistant for Singapore residents. You help with emergency preparedness, first aid guidance, Singapore emergency services info (SCDF, SPF, SG Red Cross), and community safety tips. Be concise, clear, and compassionate — many users may be elderly or in distress.

Previous conversation:
${context}

User: ${text.trim()}

Respond helpfully in 2-4 sentences. If it's a life-threatening emergency, always advise calling 995 or 999 first.`,
    });

    setLoading(false);
    setMessages((prev) => [...prev, { role: 'assistant', text: response }]);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-blue-500' : 'bg-amber-400'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-500 text-white rounded-tr-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'}`}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2">
          <p className="text-xs text-gray-400 mb-2 font-medium">Suggested questions</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors font-medium"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-200 bg-white">
        <div className="flex items-center gap-2 bg-gray-100 rounded-2xl px-4 py-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && sendMessage(input)}
            placeholder="Ask about emergency preparedness…"
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
            disabled={loading}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={loading || !input.trim()}
            className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center disabled:opacity-40 hover:bg-blue-600 transition-colors shrink-0"
          >
            <Send className="w-3.5 h-3.5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}