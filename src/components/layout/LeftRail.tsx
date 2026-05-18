import { useAppContext } from '../../AppContext';
import { ClipboardList, Users, ShieldAlert, Radio, Clock, Navigation, Map } from 'lucide-react';

export default function LeftRail() {
  const { role, setDrawerContent } = useAppContext();

  if (role === 'citizen') return null; // Citizen has no left rail

  const responderLinks = [
    { icon: Clock, label: 'My Status', action: 'duty' },
    { icon: Map, label: 'Mission Board', count: 3, action: 'mission_board' },
    { icon: ClipboardList, label: 'My Assignments', count: 1, action: 'assignment_detail' },
    { icon: Navigation, label: 'Signal Checks', count: 0, action: 'verify' },
  ];

  const opsLinks = [
    { icon: ShieldAlert, label: 'Reports', count: 12, action: 'report_queue' },
    { icon: Radio, label: 'Distress', count: 3, action: 'distress_oversight' },
    { icon: ClipboardList, label: 'Cases', count: 5, action: 'case_oversight' },
    { icon: Users, label: 'Responders', action: 'responder_oversight' },
    { icon: Map, label: 'Sources', action: 'source_health' },
  ];

  const links = role === 'responder' ? responderLinks : opsLinks;

  return (
    <aside className="w-[64px] xl:w-[280px] bg-surface-0 z-10 flex flex-col p-4 gap-6 border-r border-border-strong transition-all">
      <div className="hidden xl:flex items-center gap-2">
         <span className="w-2 h-2 bg-accent-critical rounded-none border border-border-strong"></span>
         <h2 className="text-[10px] font-black uppercase tracking-widest text-text-primary">Live Operations</h2>
      </div>
      <nav className="flex flex-col gap-2 relative">
        {links.map((link) => (
           <button
            key={link.label}
            onClick={() => link.action && setDrawerContent(link.action)}
            className="flex items-center gap-3 p-3 border border-border-strong hover:bg-surface-3 hover:text-text-inverse text-text-primary transition-colors group relative bg-surface-0 shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] cursor-pointer"
            title={link.label}
          >
            <link.icon className="w-5 h-5 flex-shrink-0" />
            <span className="hidden xl:block font-bold uppercase tracking-widest text-[10px] flex-1 text-left">{link.label}</span>
            {link.count !== undefined && link.count > 0 && (
              <span className="hidden xl:flex items-center justify-center bg-surface-3 group-hover:bg-surface-0 group-hover:text-text-primary text-text-inverse text-[10px] font-bold px-1.5 min-w-[24px] h-[24px] border border-border-strong">
                {link.count.toString().padStart(3, '0')}
              </span>
            )}
            {/* Mobile badge indicator */}
            {link.count !== undefined && link.count > 0 && (
               <span className="xl:hidden absolute right-1 top-1 w-2 h-2 bg-accent-info border border-border-strong"></span>
            )}
          </button>
        ))}
      </nav>
    </aside>
  );
}
