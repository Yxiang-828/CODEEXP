import { useAppContext } from '../../AppContext';
import { X } from 'lucide-react';
import WorkspaceContent from './workspaces/WorkspaceContent';

export default function WorkspaceDrawer() {
  const { drawerContent, setDrawerContent } = useAppContext();
  if (!drawerContent) return null;

  return (
    <aside className="w-full sm:w-[400px] xl:w-[520px] bg-surface-0 z-20 flex flex-col border-l-2 border-border-strong absolute right-0 top-0 bottom-0 sm:relative">
      <div className="px-5 py-4 border-b-2 border-border-strong bg-surface-3 text-text-inverse flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] uppercase tracking-widest font-black opacity-60">
            Workspace
          </span>
          <span className="text-[11px] font-mono font-bold">{drawerContent}</span>
        </div>
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
