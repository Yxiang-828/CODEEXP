import TopChrome from './layout/TopChrome';
import LeftRail from './layout/LeftRail';
import MapCanvas from './map/MapCanvas';
import GlobalActionDock from './layout/GlobalActionDock';
import WorkspaceDrawer from './layout/WorkspaceDrawer';
import BottomStrip from './layout/BottomStrip';
import TrackingPill from './primitives/TrackingPill';
import DemoLogin from './DemoLogin';
import PermissionPrompt from './PermissionPrompt';
import { useAppContext } from '../AppContext';
import useGpsTracking from '../hooks/useGpsTracking';

export default function Shell() {
  const { isAuthenticated } = useAppContext();
  if (!isAuthenticated) return <DemoLogin />;
  return <ShellInner />;
}

function ShellInner() {
  const { liveTracking, setSelfLocation, setLiveTracking, role, selfResponderId, updateResponderLocation } = useAppContext();

  useGpsTracking({
    enabled: liveTracking,
    onLocation: (loc) => {
      setSelfLocation(loc);
      if (role === 'responder') updateResponderLocation(selfResponderId, loc);
    },
    onError: () => setLiveTracking(false),
  });

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface-0 font-sans">
      <TopChrome />
      <div className="flex flex-1 overflow-hidden relative min-h-0">
        <LeftRail />
        <main className="flex-1 relative flex flex-col min-w-0 min-h-0">
          <div className="flex-1 relative min-h-0">
            <MapCanvas />
            <TrackingPill />
            <GlobalActionDock />
          </div>
          <BottomStrip />
        </main>
        <WorkspaceDrawer />
      </div>
      <PermissionPrompt />
    </div>
  );
}
