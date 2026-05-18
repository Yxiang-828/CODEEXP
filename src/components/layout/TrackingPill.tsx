import { Navigation, Target, Activity } from 'lucide-react';
import { useAppContext } from '../../AppContext';

export default function TrackingPill() {
  const { role, trackingState } = useAppContext();

  if (trackingState === 'none') return null;

  return (
    <div className="absolute top-16 md:top-auto md:bottom-[88px] left-4 md:left-6 z-10 flex gap-2">
      <div className={`border border-border-strong shadow-[4px_4px_0px_rgba(26,26,26,1)] px-3 py-2 md:px-4 md:py-2 flex items-center gap-2 md:gap-3 cursor-pointer hover:brightness-95 transition-colors ${trackingState === 'sos' ? 'bg-accent-critical text-surface-0' : 'bg-surface-0'}`}>
        {trackingState === 'sos' ? (
           <Activity className="w-4 h-4 animate-pulse text-surface-0" />
        ) : (
           <div className="w-2 h-2 bg-accent-success border border-border-strong animate-[pulse_2s_ease-in-out_infinite]"></div>
        )}
        <div className="flex flex-col">
          <span className={`text-[9px] font-black uppercase tracking-widest opacity-80 ${trackingState === 'sos' ? 'text-surface-0' : 'text-text-secondary'}`}>Active Tracking</span>
          <span className={`text-[10px] font-black uppercase tracking-widest ${trackingState === 'sos' ? 'text-surface-0' : 'text-text-primary'}`}>
            {trackingState === 'sos' ? 'SOS BROADCASTING' : 'ECHO-1 LOC'}
          </span>
        </div>
        {!trackingState && <Navigation className="w-4 h-4 ml-2 text-text-primary" />}
      </div>
    </div>
  );
}
