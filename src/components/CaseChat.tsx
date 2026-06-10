import { useState } from 'react';
import { Send } from 'lucide-react';
import { useAppContext, type Role } from '../AppContext';

const ROLE_LABEL: Record<Role, string> = { citizen: 'Citizen', responder: 'Responder', ops: 'Ops' };

// Group chat for an SOS case — shared by the owner + joined responders only
// (the messages live in the private case room; non-members never receive them).
export default function CaseChat({ sosId }: { sosId: string }) {
  const { caseChat, sendCaseChat, askCaseHost, selfResponderId } = useAppContext();
  const [draft, setDraft] = useState('');
  const messages = caseChat(sosId);

  const send = () => {
    const t = draft.trim();
    if (!t) return;
    // "/host …" goes into the room like any message (everyone sees the
    // question), then the Host AI's answer is published back to the room.
    sendCaseChat(sosId, t);
    if (t.toLowerCase().startsWith('/host')) askCaseHost(sosId, t);
    setDraft('');
  };

  return (
    <div>
      <div className="text-[11px] uppercase font-bold tracking-widest text-text-secondary mb-1.5">Chat</div>
      <div className="rounded-xl border border-border-soft bg-surface-1 p-2 space-y-1.5 max-h-48 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-xs text-text-secondary px-1 py-2 text-center">Coordinate here — only people on this case can see it.</p>
        )}
        {messages.map((m) => {
          if (m.kind === 'host' || m.authorId === 'host') {
            return (
              <div key={m.id} className="flex flex-col items-start">
                <span className="text-[10px] font-semibold text-accent-info px-1">Host AI</span>
                <span className="max-w-[92%] rounded-2xl px-3 py-1.5 text-sm bg-surface-0 border border-accent-info text-text-primary whitespace-pre-line">
                  {m.text}
                </span>
                {m.chips && m.chips.length > 0 && (
                  <span className="flex flex-wrap gap-1 px-1 pt-0.5">
                    {m.chips.map((c) => (
                      <span key={`${m.id}-${c.label}`} className="text-[9px] rounded-full border border-border-soft px-1.5 py-px text-text-secondary">
                        {c.label} · {c.ref}
                      </span>
                    ))}
                  </span>
                )}
              </div>
            );
          }
          const mine = m.authorId === selfResponderId;
          return (
            <div key={m.id} className={`flex flex-col ${mine ? 'items-end' : 'items-start'}`}>
              {!mine && (
                <span className="text-[10px] font-semibold text-text-secondary px-1">
                  {m.authorName ? `${m.authorName} · ${ROLE_LABEL[m.authorRole ?? 'responder']}` : ROLE_LABEL[m.authorRole ?? 'responder']}
                </span>
              )}
              <span className={`max-w-[85%] rounded-2xl px-3 py-1.5 text-sm ${mine ? 'bg-accent-info text-white' : 'bg-surface-0 border border-border-soft text-text-primary'}`}>
                {m.text}
              </span>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Message the case… (/host help)"
          className="flex-1 h-10 px-3 rounded-lg border border-border-soft bg-surface-0 text-sm text-text-primary outline-none focus:border-text-primary"
        />
        <button onClick={send} disabled={!draft.trim()} className="w-10 h-10 rounded-lg bg-surface-3 text-text-inverse flex items-center justify-center disabled:opacity-40">
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
