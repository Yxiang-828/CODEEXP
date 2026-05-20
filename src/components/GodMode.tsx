// God Mode — demo-only dock. Off by default. Persists open/closed in
// localStorage so a presenter can refresh and stay in the same view.
//
// Shows the live CSOT (clustered by relations.ts), seeds demo scenarios,
// flips source health, and instantly swaps roles. All actions also land in
// the regular action log so the demo never looks dishonest.

import { useEffect, useState } from 'react';
import { Zap, X, RefreshCw, Sparkles, ShieldQuestion, ChevronsUpDown } from 'lucide-react';
import { useAppContext, type Role, type SourceHealth } from '../AppContext';
import { CLUSTERS, HOST_DISPATCH } from '../state/relations';

const STORAGE_KEY = 'kk:godmode:open';

const SOURCE_STATES: SourceHealth['state'][] = [
  'fresh',
  'stale',
  'down',
  'shell_only',
  'not_configured',
  'unavailable',
];

export default function GodMode() {
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [tab, setTab] = useState<'csot' | 'seed' | 'sources' | 'dispatch'>('csot');

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, open ? '1' : '0');
    } catch {
      /* ignore */
    }
  }, [open]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="God Mode (demo)"
        aria-label="Open God Mode"
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-accent-warning text-text-primary border-2 border-border-strong px-3 py-2 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[0_0_0_rgba(26,26,26,1)] transition-all"
      >
        <Zap className="w-3.5 h-3.5" />
        God Mode
      </button>
    );
  }

  return (
    <aside className="fixed bottom-4 right-4 z-50 w-[min(440px,calc(100vw-32px))] max-h-[calc(100vh-32px)] flex flex-col bg-surface-0 border-2 border-border-strong shadow-[6px_6px_0_rgba(26,26,26,1)]">
      <header className="flex items-center justify-between px-3 py-2 bg-accent-warning text-text-primary border-b-2 border-border-strong">
        <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
          <Zap className="w-3.5 h-3.5" />
          God Mode · demo dock
        </span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1 border border-border-strong bg-surface-0"
          aria-label="Close God Mode"
        >
          <X className="w-3 h-3" />
        </button>
      </header>

      <nav className="flex border-b border-border-strong">
        {(
          [
            ['csot', 'CSOT'],
            ['seed', 'Seed'],
            ['sources', 'Sources'],
            ['dispatch', 'AI matrix'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 py-2 text-[9px] font-black uppercase tracking-widest border-r border-border-strong last:border-r-0 ${
              tab === id ? 'bg-surface-3 text-text-inverse' : 'bg-surface-0 text-text-primary hover:bg-surface-2'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {tab === 'csot' && <CsotTab />}
        {tab === 'seed' && <SeedTab />}
        {tab === 'sources' && <SourcesTab />}
        {tab === 'dispatch' && <DispatchTab />}
      </div>

      <footer className="border-t border-border-strong p-2 flex items-center gap-2">
        <RoleSwap />
      </footer>
    </aside>
  );
}

// ──────────────────────────────────────────────────────────────────────
// Tabs
// ──────────────────────────────────────────────────────────────────────

function CsotTab() {
  const { events, reports, sosSessions, cases, responders, groups, volunteerEvents, sources, notifications, actionLogs } =
    useAppContext();
  const clusters: Record<string, Array<{ label: string; count: number }>> = {
    intake: [
      { label: 'Citizen reports', count: reports.length },
      { label: 'SOS sessions', count: sosSessions.length },
    ],
    incidents: [
      { label: 'Events', count: events.length },
      { label: 'Verified', count: events.filter((e) => e.status === 'verified').length },
    ],
    operations: [
      { label: 'Cases', count: cases.length },
      { label: 'Active', count: cases.filter((c) => c.state !== 'resolved').length },
      { label: 'Responders', count: responders.length },
    ],
    network: [
      { label: 'Groups', count: groups.length },
      { label: 'Volunteer events', count: volunteerEvents.length },
    ],
    intel: [
      { label: 'Sources', count: sources.length },
      { label: 'Fresh', count: sources.filter((s) => s.state === 'fresh').length },
      { label: 'Notifications', count: notifications.length },
      { label: 'Logs', count: actionLogs.length },
    ],
  };
  return (
    <div className="flex flex-col gap-2">
      {CLUSTERS.map((cluster) => (
        <section
          key={cluster.id}
          className="border border-border-strong bg-surface-0 shadow-[2px_2px_0_rgba(26,26,26,1)]"
        >
          <header className="px-2 py-1 bg-surface-2 border-b border-border-strong flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest">{cluster.label}</span>
            <span className="text-[8px] uppercase tracking-widest text-text-secondary">{cluster.types.join(' · ')}</span>
          </header>
          <p className="px-2 py-1 text-[10px] leading-snug text-text-secondary">{cluster.blurb}</p>
          {clusters[cluster.id] && (
            <div className="px-2 pb-2 flex flex-wrap gap-1">
              {clusters[cluster.id].map((c) => (
                <span
                  key={c.label}
                  className="px-1.5 py-0.5 border border-border-strong text-[9px] font-mono font-bold bg-surface-2"
                >
                  {c.label} · {c.count.toString().padStart(2, '0')}
                </span>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function SeedTab() {
  const { godSeedScenario, godResetCsot, startSos, selfLocation } = useAppContext();
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => godSeedScenario('minor')}
        className="border border-border-strong bg-surface-0 p-3 text-left shadow-[2px_2px_0_rgba(26,26,26,1)] hover:bg-surface-2"
      >
        <div className="text-[10px] font-black uppercase tracking-widest">Seed · minor scenario</div>
        <div className="text-[10px] text-text-secondary mt-1">
          1 pending citizen report + 1 verified L2 traffic event. Good for the citizen / responder views.
        </div>
      </button>
      <button
        type="button"
        onClick={() => godSeedScenario('major')}
        className="border border-border-strong bg-accent-critical text-text-inverse p-3 text-left shadow-[2px_2px_0_rgba(26,26,26,1)]"
      >
        <div className="text-[10px] font-black uppercase tracking-widest">Seed · major scenario</div>
        <div className="text-[10px] mt-1 opacity-90">
          Adds an open medical SOS + an L4 fire event to the minor seed. Triggers ops/responder pushes.
        </div>
      </button>
      <button
        type="button"
        onClick={() =>
          startSos({
            citizenName: 'Demo · self',
            category: 'medical',
            location: selfLocation ?? { lng: 103.8198, lat: 1.3521 },
          })
        }
        className="border border-border-strong bg-surface-0 p-3 text-left shadow-[2px_2px_0_rgba(26,26,26,1)]"
      >
        <div className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
          <Sparkles className="w-3 h-3" /> Send SOS as me (uses GPS)
        </div>
        <div className="text-[10px] text-text-secondary mt-1">
          Fires an SOS from the current device GPS, or Singapore centroid if GPS is off.
        </div>
      </button>
      <button
        type="button"
        onClick={() => {
          if (window.confirm('Reset all CSOT clusters? Demo data, reports, SOS, cases, chat, notifications, logs will be cleared.')) {
            godResetCsot();
          }
        }}
        className="border border-border-strong bg-surface-2 text-text-primary p-3 text-left shadow-[2px_2px_0_rgba(26,26,26,1)] flex items-center gap-2"
      >
        <RefreshCw className="w-3 h-3" />
        <span className="text-[10px] font-black uppercase tracking-widest">Reset CSOT</span>
      </button>
    </div>
  );
}

function SourcesTab() {
  const { sources, godSetSourceState } = useAppContext();
  const cycle = (id: string, current: SourceHealth['state']) => {
    const i = SOURCE_STATES.indexOf(current);
    const next = SOURCE_STATES[(i + 1) % SOURCE_STATES.length];
    godSetSourceState(id, next);
  };
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] text-text-secondary mb-1">
        Cycle a source state to show how the UI degrades honestly when a provider goes down.
      </p>
      {sources.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => cycle(s.id, s.state)}
          className="flex items-center justify-between gap-2 border border-border-strong bg-surface-0 px-2 py-1.5 text-left shadow-[2px_2px_0_rgba(26,26,26,1)]"
        >
          <span className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest">{s.name}</span>
            {s.note && <span className="text-[9px] text-text-secondary">{s.note}</span>}
          </span>
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold uppercase tracking-widest">
            <ChevronsUpDown className="w-3 h-3" />
            {s.state}
          </span>
        </button>
      ))}
    </div>
  );
}

function DispatchTab() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] text-text-secondary">
        Host AI dispatch matrix (role × workspace → system prompt). See <code>state/relations.ts</code>.
      </p>
      {HOST_DISPATCH.map((entry) => (
        <div
          key={`${entry.role}-${entry.workspace}`}
          className="border border-border-strong bg-surface-0 p-2 shadow-[2px_2px_0_rgba(26,26,26,1)] flex items-center gap-2"
        >
          <ShieldQuestion className="w-3 h-3 flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-black uppercase tracking-widest">{entry.label}</div>
            <div className="text-[9px] uppercase tracking-widest text-text-secondary font-mono">
              {entry.role} · {entry.workspace}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function RoleSwap() {
  const { role, setRole } = useAppContext();
  const ROLES: Role[] = ['citizen', 'responder', 'ops'];
  return (
    <div className="flex items-center gap-1 w-full">
      <span className="text-[9px] font-black uppercase tracking-widest mr-1">Role</span>
      {ROLES.map((r) => (
        <button
          key={r}
          type="button"
          onClick={() => setRole(r)}
          className={`flex-1 py-1 text-[9px] font-black uppercase tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)] ${
            role === r ? 'bg-surface-3 text-text-inverse' : 'bg-surface-0 text-text-primary'
          }`}
        >
          {r}
        </button>
      ))}
    </div>
  );
}
