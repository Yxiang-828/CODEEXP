import { lazy, Suspense, useState } from 'react';
import { AppProvider } from './AppContext';
import Shell from './components/Shell';
import LiveDemoLauncher from './components/demo/LiveDemoLauncher';
import QuickDemoLauncher from './components/demo/quick/QuickDemoLauncher';

const LiveDirector = lazy(() => import('./components/demo/LiveDirector'));
const QuickShowcaseDirector = lazy(() => import('./components/demo/quick/QuickShowcaseDirector'));

const demoFallback = (
  <main className="flex h-screen w-screen items-center justify-center bg-[#12110e] text-[#f4f0e6]">
    <p className="text-[11px] font-black uppercase tracking-[0.24em]">Loading demo…</p>
  </main>
);

export default function App() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  const demoParam = new URLSearchParams(window.location.search).get('demo');
  // One canonical live demo. The launcher, /demo, /demo/director, and the old
  // /demo/proper alias all run the corrected LiveDirector.
  const routeDirector =
    path === '/demo' ||
    path === '/demo/director' ||
    path === '/demo/proper' ||
    demoParam === 'director' ||
    demoParam === 'proper';
  const routeQuick = path === '/demo/quick' || demoParam === 'quick';
  const [directorActive, setDirectorActive] = useState(routeDirector);
  const [quickActive, setQuickActive] = useState(routeQuick);
  const [directorAutostart, setDirectorAutostart] = useState(
    new URLSearchParams(window.location.search).get('autostart') === '1',
  );
  const [quickAutostart, setQuickAutostart] = useState(
    new URLSearchParams(window.location.search).get('autostart') === '1',
  );

  if (quickActive) {
    return (
      <Suspense fallback={demoFallback}>
        <QuickShowcaseDirector
          autostart={quickAutostart}
          onExit={() => {
            setQuickActive(false);
            setQuickAutostart(false);
            if (routeQuick) window.history.replaceState(null, '', '/');
          }}
        />
      </Suspense>
    );
  }

  if (directorActive) {
    return (
      <Suspense fallback={demoFallback}>
        <LiveDirector
          autostart={directorAutostart}
          onExit={() => {
            setDirectorActive(false);
            setDirectorAutostart(false);
            if (routeDirector) window.history.replaceState(null, '', '/');
          }}
        />
      </Suspense>
    );
  }
  return (
    <AppProvider>
      <Shell />
      <LiveDemoLauncher
        onPlay={() => {
          setDirectorAutostart(true);
          setDirectorActive(true);
        }}
      />
      <QuickDemoLauncher
        onPlay={() => {
          setQuickAutostart(true);
          setQuickActive(true);
        }}
      />
    </AppProvider>
  );
}
