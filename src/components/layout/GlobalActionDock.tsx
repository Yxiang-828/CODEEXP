import { useAppContext } from '../../AppContext';
import { Shield, Megaphone, CheckCircle, Navigation, Radio, Target, FileText, Search } from 'lucide-react';

export default function GlobalActionDock() {
  const { role, setDrawerContent, shellState } = useAppContext();

  if (shellState === 'S4' || shellState === 'S6') {
     return null; // Simplified: dock might hide or change to "Cancel" in flow
  }

  const handleAction = (drawerId: string) => {
    setDrawerContent(drawerId);
  };

  const citizenActions = [
    { label: 'Need help', icon: Radio, primary: true, action: () => handleAction('sos_draft') },
    { label: 'Report', icon: Shield, action: () => handleAction('report_compose') },
    { label: 'Brief', icon: FileText, action: () => handleAction('briefing') },
    { label: 'Alerts', icon: Megaphone, action: () => handleAction('alerts') },
  ];

  const responderActions = [
    { label: 'Toggle duty', icon: CheckCircle, action: () => handleAction('duty') },
    { label: 'Verify nearby', icon: Search, action: () => handleAction('verify') },
    { label: 'Form case', icon: Target, action: () => handleAction('form_case') },
  ];

  const opsActions = [
    { label: 'Declare', icon: Shield, action: () => handleAction('declare') },
    { label: 'Dispatch', icon: Navigation, action: () => handleAction('dispatch') },
    { label: 'Broadcast', icon: Megaphone, action: () => handleAction('broadcast') },
  ];

  const actions = role === 'citizen' ? citizenActions : role === 'responder' ? responderActions : opsActions;

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-surface-0 px-2 py-2 flex items-center gap-2 z-10 border border-border-strong rounded-none shadow-[8px_8px_0px_rgba(26,26,26,1)]">
      {actions.map((action) => (
        <button
          key={action.label}
          onClick={action.action}
          className={`flex items-center gap-2 px-6 py-3 text-[10px] uppercase tracking-widest font-bold rounded-none transition-all border border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0px_0px_0px_rgba(26,26,26,1)] shadow-[4px_4px_0px_rgba(26,26,26,1)] ${
            action.primary
              ? 'bg-surface-3 text-text-inverse hover:brightness-110'
              : 'bg-surface-0 text-text-primary hover:bg-surface-2'
          }`}
        >
          <action.icon className="w-4 h-4" />
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
