import { ChevronUp, X } from 'lucide-react';
import { useAppContext } from '../../AppContext';

export default function TrackingPill() {
  const { tracking, setTracking, setDrawerContent } = useAppContext();
  if (!tracking) return null;
  const expand = () => tracking.drawerId && setDrawerContent(tracking.drawerId);
  const ratio = Math.max(0, Math.min(1, tracking.progress ?? 0));

  return (
    <div
      className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 bg-surface-0 border border-border-strong shadow-[6px_6px_0px_rgba(26,26,26,1)] flex items-stretch min-w-[300px] max-w-[480px]"
      role="status"
    >
      <div
        className={`px-3 py-2 flex items-center justify-center text-[9px] font-black uppercase tracking-widest border-r border-border-strong ${
          tracking.tone === 'critical'
            ? 'bg-accent-critical text-text-inverse'
            : tracking.tone === 'warning'
            ? 'bg-accent-warning text-text-primary'
            : 'bg-surface-3 text-text-inverse'
        }`}
      >
        {tracking.kind}
      </div>
      <button onClick={expand} className="flex-1 flex flex-col gap-1 px-3 py-2 cursor-pointer hover:bg-surface-2 text-left">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] font-bold uppercase tracking-widest text-text-primary truncate">
            {tracking.title}
          </span>
          <span className="text-[10px] font-mono text-text-secondary whitespace-nowrap">
            {tracking.eta}
          </span>
        </div>
        <div className="h-1 bg-surface-2 border border-border-strong relative overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-text-primary transition-[width] duration-300"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </button>
      <button onClick={expand} className="px-2 flex items-center justify-center border-l border-border-strong hover:bg-surface-2" title="Expand">
        <ChevronUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => setTracking(null)}
        className="px-2 flex items-center justify-center border-l border-border-strong hover:bg-accent-critical hover:text-text-inverse"
        title="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
