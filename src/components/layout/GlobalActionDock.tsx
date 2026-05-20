import { useAppContext } from '../../AppContext';
import { Shield, Megaphone, CheckCircle, Navigation, Radio, Target, FileText, Bot, ScrollText, LocateFixed, LocateOff } from 'lucide-react';

export default function GlobalActionDock() {
  const { role, setDrawerContent, shellState, liveTracking, setLiveTracking, selfLocation } = useAppContext();
  if (shellState === 'S4' || shellState === 'S6') return null;

  const action = (id: string) => () => setDrawerContent(id);

  const handleGpsToggle = () => {
    if (!liveTracking) {
      navigator.geolocation?.getCurrentPosition(
        () => setLiveTracking(true),
        () => { /* permission denied — do not enable */ }
      );
    } else {
      setLiveTracking(false);
    }
  };

  const set: Record<string, { label: string; icon: typeof Shield; primary?: boolean; action: () => void }[]> = {
    citizen: [
      { label: 'Need help', icon: Radio, primary: true, action: action('sos_draft') },
      { label: 'Report', icon: Shield, action: action('report_compose') },
      { label: 'AI', icon: Bot, action: action('citizen_ai') },
      { label: 'Brief', icon: FileText, action: action('briefing') },
      { label: 'Alerts', icon: Megaphone, action: action('alerts') },
    ],
    responder: [
      { label: 'Toggle duty', icon: CheckCircle, action: action('duty') },
      { label: 'Join', icon: Radio, action: action('joinable_missions') },
      { label: 'AI', icon: Bot, action: action('responder_ai') },
      { label: 'Events', icon: FileText, action: action('volunteer_events') },
      { label: 'Form case', icon: Target, action: action('form_case') },
      { label: 'Logs', icon: ScrollText, action: action('activity_log') },
    ],
    ops: [
      { label: 'Declare', icon: Shield, action: action('declare') },
      { label: 'Zones', icon: Target, action: action('zones') },
      { label: 'Dispatch', icon: Navigation, action: action('dispatch') },
      { label: 'AI', icon: Bot, action: action('ops_ai') },
      { label: 'Broadcast', icon: Megaphone, action: action('broadcast') },
      { label: 'Logs', icon: ScrollText, action: action('activity_log') },
    ],
  };

  const actions = set[role];

  return (
    <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 bg-surface-0 px-2 py-2 flex items-center gap-2 z-10 border border-border-strong shadow-[6px_6px_0px_rgba(26,26,26,1)] max-w-[calc(100vw-16px)] overflow-x-auto">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.action}
          className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all border border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] shadow-[3px_3px_0px_rgba(26,26,26,1)] cursor-pointer ${
            a.primary
              ? 'bg-accent-critical text-text-inverse'
              : 'bg-surface-0 text-text-primary hover:bg-surface-2'
          }`}
        >
          <a.icon className="w-3.5 h-3.5" />
          <span>{a.label}</span>
        </button>
      ))}
      <div className="w-px h-6 bg-border-strong shrink-0" />
      <button
        onClick={handleGpsToggle}
        title={liveTracking ? 'Stop live tracking' : 'Start live tracking'}
        className={`shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all border border-border-strong shadow-[3px_3px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none cursor-pointer ${
          liveTracking
            ? 'bg-[#3B82F6] text-white border-[#2563EB]'
            : 'bg-surface-0 text-text-primary hover:bg-surface-2'
        }`}
      >
        {liveTracking ? (
          <LocateFixed className="w-3.5 h-3.5 animate-pulse" />
        ) : (
          <LocateOff className="w-3.5 h-3.5" />
        )}
        <span className="hidden sm:inline">{liveTracking ? (selfLocation ? 'Live' : 'Locating…') : 'GPS'}</span>
      </button>
    </div>
  );
}
