import { useAppContext } from '../../AppContext';
import { X } from 'lucide-react';
import WorkspaceContent from './workspaces/WorkspaceContent';

export default function WorkspaceDrawer() {
  const { drawerContent, setDrawerContent } = useAppContext();

  if (!drawerContent) return null;

  return (
    <aside className="absolute bottom-0 w-full md:relative md:w-[360px] xl:w-[520px] bg-surface-0 z-50 md:z-20 flex flex-col border-t md:border-t-0 md:border-l border-border-strong transition-transform duration-150 animate-in slide-in-from-bottom-8 md:slide-in-from-right-8 h-[65vh] md:h-full shadow-[0_-8px_0_rgba(26,26,26,1)] md:shadow-none">
      {/* Mobile Detent Handle */}
      <div className="md:hidden flex justify-center items-center h-6 bg-surface-3 border-b border-border-strong active:bg-surface-2 cursor-grab">
         <div className="w-12 h-1 bg-surface-0 opacity-50 rounded-none"></div>
      </div>
      <div className="p-6 border-b border-border-strong bg-surface-3 text-text-inverse flex items-center justify-between">
        <div>
           <h3 className="text-[10px] uppercase tracking-widest font-black opacity-60 mb-2">Contextual Flow</h3>
           <p className="text-xl font-serif italic text-text-inverse">Action Details</p>
        </div>
        <button
          onClick={() => setDrawerContent(null)}
          className="p-1 hover:text-accent-critical transition-colors"
          title="Close Workspace"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto bg-surface-0">
        <WorkspaceContent id={drawerContent} />
      </div>
    </aside>
  );
}
