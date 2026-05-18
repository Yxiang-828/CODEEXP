import { useAppContext } from '../../AppContext';
import { Search, Bell, User, Signal } from 'lucide-react';

export default function TopChrome() {
  const { role, setRole } = useAppContext();

  return (
    <header className="h-auto py-4 bg-surface-0 border-b border-border-strong flex items-center justify-between px-8 z-20 relative">
      <div className="flex items-center gap-6">
        <select
          className="bg-surface-3 text-text-inverse text-[11px] font-bold uppercase tracking-widest px-4 py-2 rounded-none border-none outline-none cursor-pointer appearance-none"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="citizen">01. Citizen</option>
          <option value="responder">02. Responder</option>
          <option value="ops">03. Ops</option>
        </select>
        <div className="flex items-center gap-2 px-3 py-1 border border-border-strong rounded-none shadow-[2px_2px_0px_rgba(26,26,26,1)]">
          <Signal className="w-4 h-4 text-accent-success" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-text-primary">Live</span>
        </div>
      </div>

      <div className="flex-1 max-w-md px-6">
        <div className="relative flex items-center border border-border-strong bg-surface-1 shadow-[2px_2px_0px_rgba(26,26,26,1)]">
          <Search className="w-4 h-4 absolute left-3 text-text-primary" />
          <input
            type="text"
            placeholder="SEARCH..."
            className="w-full bg-transparent pl-9 pr-3 py-2 text-[10px] font-bold tracking-widest uppercase outline-none text-text-primary placeholder:text-text-muted"
            readOnly
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-text-primary">
        {role === 'responder' && (
          <div className="flex items-center gap-2 mr-4 border-l border-border-strong pl-4">
            <span className="w-2 h-2 bg-accent-success border border-border-strong"></span>
            <span className="text-[10px] font-bold uppercase tracking-widest">On Shift</span>
          </div>
        )}
        <button className="p-1.5 border border-transparent hover:border-border-strong transition-colors text-text-primary">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-1.5 border border-transparent hover:border-border-strong transition-colors text-text-primary">
          <User className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
