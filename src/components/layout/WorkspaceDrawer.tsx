import { useAppContext } from '../../AppContext';
import { X } from 'lucide-react';
import WorkspaceContent from './workspaces/WorkspaceContent';

const DRAWER_TITLES: Record<string, string> = {
  mission_board: 'Operational panel',
  assignment_detail: 'My assignment',
  joinable_missions: 'Joinable missions',
  groups: 'Groups & cases',
  volunteer_events: 'Volunteer events',
  activity_log: 'Activity log',
  case_lobby: 'Case room',
  form_case: 'Form case',
  report_queue: 'Report queue',
  zones: 'Emergency zones',
  distress_oversight: 'Dispatch status',
  case_oversight: 'Ongoing missions',
  responder_oversight: 'Responder roster',
  declare: 'Declare incident',
  broadcast: 'Broadcast',
  incident_ops: 'Incident detail',
  local_alert: 'Incident detail',
  dispatch: 'Dispatch',
  source_health: 'Source health',
  notifications: 'Notifications',
  briefing: 'Briefing',
  profile: 'Profile',
  alerts: 'Alerts',
  citizen_ai: 'Citizen AI',
  responder_ai: 'Mission copilot',
  ops_ai: 'Command copilot',
  sos_detail: 'SOS detail',
};

export default function WorkspaceDrawer() {
  const { drawerContent, setDrawerContent } = useAppContext();
  if (!drawerContent) return null;
  const title = DRAWER_TITLES[drawerContent] ?? drawerContent;

  return (
    <aside className="w-full sm:w-[400px] xl:w-[520px] bg-surface-0 z-20 flex flex-col border-l-2 border-border-strong absolute right-0 top-0 bottom-0 sm:relative">
      <div className="px-5 py-4 border-b-2 border-border-strong bg-surface-3 text-text-inverse flex items-center justify-between">
        <span className="text-[11px] font-black uppercase tracking-widest">{title}</span>
        <button
          onClick={() => setDrawerContent(null)}
          className="p-1 hover:text-accent-critical transition-colors border border-text-inverse"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-surface-0">
        <WorkspaceContent id={drawerContent} />
      </div>
    </aside>
  );
}
