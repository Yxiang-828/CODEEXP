import { useAppContext } from '../../AppContext';
import { AlertCircle, FileText, Activity } from 'lucide-react';

export default function BottomStrip() {
  const { role, shellState } = useAppContext();

  if (shellState === 'S9') return null; // Hidden in panic mode

  return (
    <div className="bg-surface-1 border-t border-border-strong h-10 flex items-center justify-between px-4 z-10 shadow-[0px_-2px_0px_rgba(26,26,26,1)]">
      <div className="flex items-center gap-4">
        {role === 'ops' && (
          <div className="flex items-center gap-2 border border-border-strong px-2 py-0.5 bg-accent-warning text-surface-3 shadow-[2px_2px_0px_rgba(26,26,26,1)] cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] transition-all">
            <AlertCircle className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest">3 Ack-Debt</span>
          </div>
        )}
        {role === 'responder' && (
          <div className="flex items-center gap-2 border border-border-strong px-2 py-0.5 bg-surface-2 cursor-pointer hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] shadow-[2px_2px_0px_rgba(26,26,26,1)] transition-all">
            <Activity className="w-3 h-3" />
            <span className="text-[9px] font-bold uppercase tracking-widest text-text-primary">Case: Alpha-09</span>
          </div>
        )}
        {role === 'citizen' && (
          <div className="flex items-center gap-2 text-text-secondary">
             <span className="text-[9px] font-bold uppercase tracking-widest opacity-60">System Normal</span>
          </div>
        )}
      </div>
      <div className="flex gap-6 text-[9px] uppercase tracking-widest font-bold text-text-primary"> 
        <span>DB: <span className="text-accent-success">CONNECTED</span></span> 
        <span className="opacity-60 hidden sm:inline">TILES: LATEST</span> 
        <span className="opacity-60">PING: 14MS</span> 
      </div>
    </div>
  );
}
