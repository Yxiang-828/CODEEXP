import { useAppContext } from '../../AppContext';
import { Bell, User, Signal, Newspaper, Activity } from 'lucide-react';

export default function TopChrome() {
  const { role, setRole, briefingInView, sources, setDrawerContent, liveSnapshot } =
    useAppContext();
  const fresh = sources.filter((s) => s.state === 'fresh').length;
  const stale = sources.filter((s) => s.state === 'stale').length;
  const down = sources.filter((s) => s.state === 'down').length;

  return (
    <header className="h-auto py-3 bg-surface-0 border-b-2 border-border-strong flex items-center justify-between px-4 sm:px-6 z-30 relative gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-[11px] font-black uppercase tracking-widest text-text-inverse bg-surface-3 border-2 border-border-strong px-3 py-1 shadow-[3px_3px_0px_rgba(26,26,26,1)] whitespace-nowrap">
          QUICK AID SG
        </div>
        <select
          className="bg-surface-0 text-text-primary text-[10px] font-bold uppercase tracking-widest px-2 py-1 border border-border-strong outline-none cursor-pointer shadow-[2px_2px_0px_rgba(26,26,26,1)]"
          value={role}
          onChange={(e) => setRole(e.target.value as 'citizen' | 'responder' | 'ops')}
        >
          <option value="citizen">01 · Citizen</option>
          <option value="responder">02 · Responder</option>
          <option value="ops">03 · Ops</option>
        </select>
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] bg-surface-0">
          <Signal className="w-3 h-3 text-accent-success" />
          <span className="text-[9px] uppercase font-bold tracking-widest">
            {liveSnapshot ? 'NEA live' : 'fetching…'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => setDrawerContent('briefing')}
          className="flex items-center gap-1.5 px-2 py-1 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all bg-surface-0"
        >
          <Newspaper className="w-3 h-3" />
          <span className="text-[9px] font-bold uppercase tracking-widest whitespace-nowrap">
            Brief ({briefingInView})
          </span>
        </button>
        <button
          onClick={() => setDrawerContent('source_health')}
          className="flex items-center gap-1.5 px-2 py-1 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all bg-surface-0"
        >
          <Activity
            className={`w-3 h-3 ${
              down > 0
                ? 'text-accent-critical'
                : stale > 0
                ? 'text-accent-warning'
                : 'text-accent-success'
            }`}
          />
          <span className="text-[9px] font-mono font-bold whitespace-nowrap">
            {fresh}/{fresh + stale + down}
          </span>
        </button>
        {role === 'responder' && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] bg-surface-0">
            <span className="w-2 h-2 bg-accent-success border border-border-strong"></span>
            <span className="text-[9px] font-bold uppercase tracking-widest">On Duty</span>
          </div>
        )}
        <button
          onClick={() => setDrawerContent('alerts')}
          className="p-1.5 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all bg-surface-0"
        >
          <Bell className="w-3.5 h-3.5" />
        </button>
        <button className="p-1.5 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] bg-surface-0">
          <User className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
