import TopChrome from './layout/TopChrome';
import LeftRail from './layout/LeftRail';
import MapCanvas from './map/MapCanvas';
import GlobalActionDock from './layout/GlobalActionDock';
import WorkspaceDrawer from './layout/WorkspaceDrawer';
import BottomStrip from './layout/BottomStrip';

export default function Shell() {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-0 border-[12px] border-border-strong font-sans">
      <TopChrome />
      <div className="flex flex-1 overflow-hidden relative">
        <LeftRail />
        <main className="flex-1 relative border-r border-border-strong flex flex-col">
          <div className="flex-1 relative">
            <MapCanvas />
            <GlobalActionDock />
          </div>
          <BottomStrip />
        </main>
        <WorkspaceDrawer />
      </div>
    </div>
  );
}
