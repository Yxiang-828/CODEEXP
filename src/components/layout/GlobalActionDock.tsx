import { useAppContext } from '../../AppContext';
import { Shield, Megaphone, CheckCircle, Navigation, Radio, Target, FileText, Search } from 'lucide-react';

export default function GlobalActionDock() {
  const { role, setDrawerContent, shellState } = useAppContext();
  if (shellState === 'S4' || shellState === 'S6') return null;

  const action = (id: string) => () => setDrawerContent(id);

  const set: Record<string, { label: string; icon: typeof Shield; primary?: boolean; action: () => void }[]> = {
    citizen: [
      { label: 'Need help', icon: Radio, primary: true, action: action('sos_draft') },
      { label: 'Report', icon: Shield, action: action('report_compose') },
      { label: 'Brief', icon: FileText, action: action('briefing') },
      { label: 'Alerts', icon: Megaphone, action: action('alerts') },
    ],
    responder: [
      { label: 'Toggle duty', icon: CheckCircle, action: action('duty') },
      { label: 'Verify', icon: Search, action: action('verify') },
      { label: 'Form case', icon: Target, action: action('form_case') },
    ],
    ops: [
      { label: 'Declare', icon: Shield, action: action('declare') },
      { label: 'Dispatch', icon: Navigation, action: action('dispatch') },
      { label: 'Broadcast', icon: Megaphone, action: action('broadcast') },
    ],
  };

  const actions = set[role];

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-surface-0 px-2 py-2 flex items-center gap-2 z-10 border border-border-strong shadow-[6px_6px_0px_rgba(26,26,26,1)]">
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.action}
          className={`flex items-center gap-2 px-4 py-2.5 text-[10px] uppercase tracking-widest font-bold transition-all border border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] shadow-[3px_3px_0px_rgba(26,26,26,1)] cursor-pointer ${
            a.primary
              ? 'bg-accent-critical text-text-inverse'
              : 'bg-surface-0 text-text-primary hover:bg-surface-2'
          }`}
        >
          <a.icon className="w-3.5 h-3.5" />
          <span>{a.label}</span>
        </button>
      ))}
    </div>
  );
}
