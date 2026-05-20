import { useAppContext } from '../../AppContext';
import { Bell, User, Signal, Newspaper, LogOut } from 'lucide-react';

export default function TopChrome() {
  const { role, briefingInView, setDrawerContent, liveSnapshot, demoLogout } =
    useAppContext();
  return (
    <header className="h-auto py-3 bg-surface-0 border-b-2 border-border-strong flex items-center justify-between px-4 sm:px-6 z-30 relative gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <div className="text-[11px] font-black uppercase tracking-widest text-text-inverse bg-surface-3 border-2 border-border-strong px-3 py-1 shadow-[3px_3px_0px_rgba(26,26,26,1)] whitespace-nowrap">
          KAMPUNG KAKI
        </div>
        <div className="bg-accent-warning text-text-primary text-[10px] font-black uppercase tracking-widest px-2 py-1 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] whitespace-nowrap">
          Demo · {role}
        </div>
        <div className="hidden md:flex items-center gap-1.5 px-2 py-1 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] bg-surface-0">
          <Signal className={`w-3 h-3 ${liveSnapshot ? 'text-accent-success' : 'text-accent-warning'}`} />
          <span className="text-[9px] uppercase font-bold tracking-widest">
            {liveSnapshot ? 'NEA live' : 'live off'}
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
        <button
          onClick={() => setDrawerContent('profile')}
          title="Open profile"
          aria-label="Open profile"
          className="p-1.5 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all bg-surface-0"
        >
          <User className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={demoLogout}
          title="Return to demo login"
          aria-label="Return to demo login"
          className="p-1.5 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all bg-surface-0"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
}
