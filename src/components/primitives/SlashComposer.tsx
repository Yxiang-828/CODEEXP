// Slash-aware chat composer for the case room.
// Per DESIGN.md § 13.3 + 14.2.

import { useMemo, useState } from 'react';
import { Mic, Map as MapIcon, Send } from 'lucide-react';

const HOST_COMMANDS: { cmd: string; desc: string }[] = [
  { cmd: '/host status', desc: 'terse case summary' },
  { cmd: '/host route <m> to <p>', desc: 'ETA + path to assigned point' },
  { cmd: '/host nearest aed', desc: 'nearest AED + load' },
  { cmd: '/host hospital load', desc: 'A&E loads ranked' },
  { cmd: '/host weather', desc: 'forecast for area' },
  { cmd: '/host check <m>', desc: 'live position, last beat' },
  { cmd: '/host suggest formation', desc: 'role split for current roster' },
  { cmd: '/host new pings?', desc: 'unabsorbed SOSes nearby' },
  { cmd: '/host playback 5m', desc: 'summarise last 5 min' },
  { cmd: '/host escalate?', desc: 'yes/no + rationale' },
  { cmd: '/host pause watchdog 10m', desc: 'mute proactive (captain)' },
  { cmd: '/host draft aar', desc: 'begin AAR (consolidating)' },
  { cmd: '/host help', desc: 'command list' },
  { cmd: '/ack', desc: 'acknowledge last message' },
];

interface Props {
  onSend?: (text: string) => void;
}

export default function SlashComposer({ onSend }: Props) {
  const [value, setValue] = useState('');
  const [recording, setRecording] = useState(false);
  const [whiteboardOpen, setWhiteboardOpen] = useState(false);

  const isSlash = value.startsWith('/');
  const suggestions = useMemo(() => {
    if (!isSlash) return [];
    const q = value.toLowerCase();
    return HOST_COMMANDS.filter((c) => c.cmd.toLowerCase().startsWith(q)).slice(0, 5);
  }, [value, isSlash]);

  const send = () => {
    if (!value.trim()) return;
    onSend?.(value);
    setValue('');
  };

  return (
    <div className="relative">
      {suggestions.length > 0 && (
        <div className="absolute left-0 right-0 bottom-full mb-2 bg-surface-0 border border-border-strong shadow-[4px_4px_0px_rgba(26,26,26,1)] z-30">
          <div className="px-3 py-1 border-b border-border-strong bg-surface-3 text-text-inverse text-[9px] font-bold uppercase tracking-widest">
            Slash commands
          </div>
          {suggestions.map((s) => (
            <button
              key={s.cmd}
              onClick={() => setValue(s.cmd + ' ')}
              className="w-full flex items-center justify-between px-3 py-1.5 hover:bg-surface-2 text-left border-b border-border-strong last:border-b-0"
            >
              <span className="text-[10px] font-mono font-bold text-text-primary">
                {s.cmd}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-text-secondary">
                {s.desc}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="MESSAGE OR /HOST COMMAND..."
          className="flex-1 bg-surface-0 border border-border-strong p-3 text-[10px] font-bold uppercase tracking-widest shadow-[inset_2px_2px_0px_rgba(26,26,26,0.1)] outline-none focus:border-text-primary"
        />
        <button
          onClick={() => setRecording(!recording)}
          className={`px-3 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] ${
            recording ? 'bg-accent-critical text-text-inverse' : 'bg-surface-0'
          }`}
          title="Push to talk"
        >
          <Mic className="w-4 h-4" />
        </button>
        <button
          onClick={() => setWhiteboardOpen((open) => !open)}
          className="px-3 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] bg-surface-0 hover:bg-surface-2"
          title={whiteboardOpen ? 'Close whiteboard summary' : 'Open whiteboard summary'}
        >
          <MapIcon className="w-4 h-4" />
        </button>
        <button
          onClick={send}
          className="bg-surface-3 text-text-inverse px-4 border border-border-strong shadow-[4px_4px_0px_rgba(26,26,26,1)] text-[10px] font-black uppercase cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-1"
        >
          <Send className="w-3 h-3" />
          Send
        </button>
      </div>

      {recording && (
        <div className="absolute -top-7 right-0 bg-accent-critical text-text-inverse px-2 py-1 text-[9px] font-mono font-bold border border-border-strong">
          REC 00:07
        </div>
      )}
      {whiteboardOpen && (
        <div className="mt-2 border border-border-strong bg-surface-2 p-2 text-[9px] uppercase font-bold tracking-widest">
          Shared board: case map, assignments, and pinned Host outputs stay visible in this room.
        </div>
      )}
    </div>
  );
}
