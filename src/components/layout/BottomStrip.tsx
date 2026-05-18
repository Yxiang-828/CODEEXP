import { useAppContext } from '../../AppContext';

export default function BottomStrip() {
  const { role, shellState, events, sosSessions } = useAppContext();
  if (shellState === 'S9') return null;

  const live = events.filter((e) => e.status === 'verified').length;
  const sos = sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status)).length;

  return (
    <div className="bg-surface-1 border-t border-border-strong h-8 flex items-center justify-between px-4 z-10">
      <div className="flex items-center gap-3">
        <Pill label={`${live} live events`} tone="info" />
        {sos > 0 && <Pill label={`${sos} distress active`} tone="critical" />}
        {role === 'ops' && <Pill label="3 ack-debt" tone="warning" />}
      </div>
      <div className="flex gap-4 text-[9px] uppercase tracking-widest font-bold text-text-primary">
        <span>
          DB <span className="text-accent-success">CONNECTED</span>
        </span>
        <span className="opacity-60 hidden md:inline">TILES LATEST</span>
        <span className="opacity-60 hidden md:inline">PING 14MS</span>
      </div>
    </div>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone: 'info' | 'warning' | 'critical';
}) {
  const cls =
    tone === 'critical'
      ? 'bg-accent-critical text-text-inverse'
      : tone === 'warning'
      ? 'bg-accent-warning text-text-primary'
      : 'bg-surface-2 text-text-primary';
  return (
    <div
      className={`flex items-center gap-2 px-2 py-0.5 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] ${cls}`}
    >
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </div>
  );
}
