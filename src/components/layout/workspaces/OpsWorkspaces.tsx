import { useState } from 'react';
import { Megaphone, Eye, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../../../AppContext';
import SeverityChip from '../../primitives/SeverityChip';
import RolePreviewTabs from '../../primitives/RolePreviewTabs';
import CoveragePreview from '../../primitives/CoveragePreview';
import type { SeverityLevel } from '../../primitives/SeverityChip';

export function DeclareIncident() {
  const { declareIncident, setDrawerContent } = useAppContext();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [severity, setSeverity] = useState<SeverityLevel>(3);
  const [title, setTitle] = useState('Drawn incident · Bedok flooding');
  const [allSeen, setAllSeen] = useState(false);
  const submit = () => {
    declareIncident({
      kind: 'flood',
      title,
      severity,
      location: { lng: 103.93, lat: 1.32 },
      area: [
        { lng: 103.918, lat: 1.318 },
        { lng: 103.942, lat: 1.318 },
        { lng: 103.942, lat: 1.328 },
        { lng: 103.918, lat: 1.328 },
      ],
      source: 'ops declaration',
    });
    setStep(5);
  };
  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-3 border-b border-border-strong flex gap-2">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex-1 h-2 border border-border-strong ${
              s <= step ? 'bg-text-primary' : 'bg-surface-2'
            }`}
          />
        ))}
      </div>
      {step === 1 && (
        <div className="p-5 flex flex-col gap-4 flex-1">
          <h2 className="text-xl font-serif italic font-black">Declare incident</h2>
          <Field label="Title">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-border-strong bg-surface-0 text-sm font-mono outline-none focus:border-text-primary"
            />
          </Field>
          <Field label="Severity">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setSeverity(lvl as SeverityLevel)}
                  className={`flex-1 py-2 border border-border-strong text-[10px] font-mono font-bold shadow-[2px_2px_0_rgba(26,26,26,1)] ${
                    severity === lvl ? 'bg-surface-3 text-text-inverse' : 'bg-surface-0'
                  }`}
                >
                  L{lvl}
                </button>
              ))}
            </div>
            <div className="mt-2">
              <SeverityChip level={severity} />
            </div>
          </Field>
        </div>
      )}
      {step === 2 && (
        <div className="p-5 flex flex-col gap-3 flex-1">
          <h3 className="text-[10px] uppercase font-bold tracking-widest">Step 2 · Geometry</h3>
          <Card>Polygon drawn on the map. Coverage preview below.</Card>
          <CoveragePreview
            cells={4}
            precision="gh5"
            estimatedDevices={2720}
            estimatedResidents={8400}
          />
        </div>
      )}
      {step === 3 && (
        <div className="p-5 flex flex-col gap-3 flex-1">
          <h3 className="text-[10px] uppercase font-bold tracking-widest">Step 3 · Sources</h3>
          <Card>Reports + sensor signals attached automatically.</Card>
          <ul className="text-[10px] uppercase font-bold tracking-widest space-y-1">
            {['REP-4920 medical', 'REP-4921 fire', 'NEA PSI live'].map((s) => (
              <li
                key={s}
                className="flex justify-between border border-border-strong p-2 bg-surface-0 shadow-[2px_2px_0_rgba(26,26,26,1)]"
              >
                <span>{s}</span>
                <CheckCircle2 className="w-3 h-3 text-accent-success" />
              </li>
            ))}
          </ul>
        </div>
      )}
      {step === 4 && (
        <div className="p-5 flex flex-col gap-3 flex-1">
          <h3 className="text-[10px] uppercase font-bold tracking-widest">Step 4 · Role-preview gate</h3>
          <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
            Tap each tab to unlock publish.
          </p>
          <RolePreviewTabs
            onAllSeen={() => setAllSeen(true)}
            tabs={[
              {
                role: 'citizen',
                label: 'Citizen view',
                content: (
                  <div className="space-y-2">
                    <SeverityChip level={severity} audience="citizen" showCode={false} />
                    <h4 className="text-base font-serif italic font-black">{title}</h4>
                    <p className="text-[11px]">Avoid the area. Help is being coordinated.</p>
                  </div>
                ),
              },
              {
                role: 'responder',
                label: 'Responder view',
                content: (
                  <div className="space-y-2">
                    <SeverityChip level={severity} />
                    <h4 className="text-base font-serif italic font-black">{title}</h4>
                    <p className="text-[11px]">Polygon, 4 gh5 cells. 3 sources attached.</p>
                  </div>
                ),
              },
              {
                role: 'ops',
                label: 'Ops view',
                content: (
                  <div className="space-y-2">
                    <SeverityChip level={severity} />
                    <h4 className="text-base font-serif italic font-black">{title}</h4>
                    <p className="text-[11px]">Lifecycle TTL 4h. Auto-escalate if &gt;6 reports / 30min.</p>
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}
      {step === 5 && (
        <div className="p-5 flex flex-col gap-3 flex-1">
          <h3 className="text-xl font-serif italic font-black text-accent-success">Published.</h3>
          <Card>Incident is now on the map for all roles.</Card>
          <button
            onClick={() => setDrawerContent(null)}
            className="w-full bg-surface-3 text-text-inverse py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
          >
            Done
          </button>
        </div>
      )}
      {step <= 4 && (
        <div className="p-4 border-t border-border-strong flex gap-2">
          <button
            onClick={() => (step === 1 ? setDrawerContent(null) : setStep((step - 1) as 1 | 2 | 3 | 4))}
            className="flex-1 py-3 border border-border-strong text-[10px] font-bold uppercase tracking-widest"
          >
            Back
          </button>
          <button
            onClick={() => (step < 4 ? setStep((step + 1) as 2 | 3 | 4) : allSeen ? submit() : null)}
            disabled={step === 4 && !allSeen}
            className={`flex-1 py-3 border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] text-[10px] font-bold uppercase tracking-widest ${
              step === 4 && !allSeen
                ? 'bg-surface-2 text-text-muted cursor-not-allowed'
                : 'bg-accent-success text-surface-3'
            }`}
          >
            {step < 4 ? 'Next' : 'Publish'}
          </button>
        </div>
      )}
    </div>
  );
}

export function IncidentOps() {
  const { events, selectedId } = useAppContext();
  const event = events.find((e) => e.id === selectedId) ?? events[0];
  if (!event) return null;
  return (
    <div className="p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <SeverityChip level={event.severity} />
        <h2 className="text-xl font-serif italic font-black flex-1 min-w-0">{event.title}</h2>
      </div>
      {event.liveValue && (
        <div className="px-3 py-2 bg-accent-info text-text-inverse font-mono text-[11px] border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]">
          LIVE · {event.liveValue}
        </div>
      )}
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-1">Source</strong>
        {event.source}
      </Card>
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-1">Status</strong>
        <span className="font-mono">{event.status}</span>
      </Card>
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-1">Coordinates</strong>
        <span className="font-mono text-[11px]">
          {event.location.lat.toFixed(4)}°N · {event.location.lng.toFixed(4)}°E
        </span>
      </Card>
      {event.caseId && (
        <Card>
          <strong className="block uppercase text-[10px] tracking-widest mb-1">Linked case</strong>
          {event.caseId}
        </Card>
      )}
    </div>
  );
}

export function DispatchResponder() {
  const { responders, sosSessions, assignSos, setDrawerContent } = useAppContext();
  const pending = sosSessions.find((s) => s.status === 'requesting');
  const available = responders.filter((r) => r.status === 'ready');
  return (
    <div className="p-5 flex flex-col gap-3">
      <h2 className="text-xl font-serif italic font-black">Dispatch</h2>
      {pending ? (
        <>
          <Card>
            <strong className="block uppercase text-[10px] tracking-widest mb-1">Target</strong>
            {pending.id} · {pending.category}
          </Card>
          <h3 className="text-[10px] uppercase font-bold tracking-widest">Available roster</h3>
          {available.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between p-2 border border-border-strong bg-surface-0 shadow-[2px_2px_0_rgba(26,26,26,1)]"
            >
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest">
                  {r.name} · {r.org}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                  {r.role} · {r.status}
                </div>
              </div>
              <button
                onClick={() => {
                  assignSos(pending.id, r.id);
                  setDrawerContent(null);
                }}
                className="bg-surface-3 text-text-inverse px-3 py-1 text-[9px] font-bold uppercase tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]"
              >
                Assign
              </button>
            </div>
          ))}
        </>
      ) : (
        <Card>No pending distress. Dispatch is idle.</Card>
      )}
    </div>
  );
}

export function BroadcastComposer() {
  return (
    <div className="p-5 flex flex-col gap-3">
      <h2 className="text-xl font-serif italic font-black">Geo broadcast</h2>
      <Card>Draw a polygon or select cells on the map. Coverage preview is mandatory.</Card>
      <CoveragePreview
        cells={18}
        precision="gh5"
        estimatedDevices={12400}
        estimatedResidents={38000}
        highReachWarning
      />
      <Field label="Message">
        <textarea
          className="w-full h-24 p-2 border border-border-strong bg-surface-0 text-sm font-mono resize-none outline-none focus:border-text-primary"
          defaultValue="Heavy flooding at Bedok South Rd. Avoid area. Stay clear of moving water."
        />
      </Field>
      <button className="bg-accent-critical text-text-inverse py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] flex items-center justify-center gap-2">
        <Megaphone className="w-3 h-3" />
        Send broadcast
      </button>
    </div>
  );
}

export function ReportQueue() {
  const { reports, verifyReport, dismissReport, claimReport } = useAppContext();
  const queue = reports.filter((r) => r.status === 'pending' || r.status === 'claimed');
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Report queue</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          {queue.length} pending · {reports.filter((r) => r.status === 'verified').length} verified
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {queue.map((r) => (
          <div key={r.id} className="p-3 border-b border-border-strong">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono font-bold">{r.id}</span>
              <span className="text-[9px] uppercase font-bold tracking-widest text-text-secondary">
                {r.kind} · trust {Math.round(r.reporterTrust * 100)}%
              </span>
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest mb-1">{r.title}</h3>
            <p className="text-[10px]">{r.body}</p>
            <div className="flex gap-1 mt-2">
              <button
                onClick={() => claimReport(r.id, 'ops')}
                className="flex-1 bg-surface-0 py-1.5 text-[9px] uppercase font-bold tracking-widest border border-border-strong"
              >
                Claim
              </button>
              <button
                onClick={() => verifyReport(r.id)}
                className="flex-1 bg-accent-success text-surface-3 py-1.5 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]"
              >
                <CheckCircle2 className="w-3 h-3 inline mr-1" />
                Verify
              </button>
              <button
                onClick={() => dismissReport(r.id)}
                className="flex-1 bg-surface-0 py-1.5 text-[9px] uppercase font-bold tracking-widest border border-border-strong"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DistressOversight() {
  const { sosSessions, responders, setDrawerContent } = useAppContext();
  const active = sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status));
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Distress oversight</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          {active.length} active
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {active.map((s) => {
          const r = responders.find((x) => x.id === s.assignedResponderId);
          return (
            <div key={s.id} className="p-3 border-b border-border-strong">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono font-bold">{s.id}</span>
                <span className="text-[9px] uppercase font-bold tracking-widest">{s.status}</span>
              </div>
              <h3 className="text-[11px] font-bold uppercase tracking-widest mb-1">{s.category}</h3>
              <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
                Citizen {s.citizenName}
              </p>
              {r ? (
                <p className="text-[10px] uppercase font-bold tracking-widest mt-1">
                  Assigned · {r.name}
                </p>
              ) : (
                <button
                  onClick={() => setDrawerContent('dispatch')}
                  className="mt-2 w-full bg-accent-critical text-text-inverse py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]"
                >
                  <AlertOctagon className="w-3 h-3 inline mr-1" />
                  Dispatch now
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CaseOversight() {
  const { cases, setDrawerContent, setActiveCaseId } = useAppContext();
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Case oversight</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {cases.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveCaseId(c.id);
              setDrawerContent('case_lobby');
            }}
            className="w-full p-3 border-b border-border-strong text-left hover:bg-surface-2 flex items-center gap-3"
          >
            <SeverityChip level={c.severity} />
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-widest">{c.name}</div>
              <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                {c.state} · {c.members.length} members
              </div>
            </div>
            <Eye className="w-3 h-3" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function ResponderOversight() {
  const { responders } = useAppContext();
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Responder roster</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          {responders.length} total
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {responders.map((r) => (
          <div key={r.id} className="p-3 border-b border-border-strong flex items-center gap-2">
            <span
              className={`w-2 h-2 border border-border-strong ${
                r.status === 'on_scene'
                  ? 'bg-accent-critical'
                  : r.status === 'en_route'
                  ? 'bg-accent-warning'
                  : r.status === 'ready'
                  ? 'bg-accent-success'
                  : 'bg-surface-3'
              }`}
            />
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-widest">
                {r.name} · {r.org}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                {r.role} · {r.status}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SourceHealth() {
  const { sources, liveSnapshot } = useAppContext();
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Source health</h2>
        {liveSnapshot && (
          <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary mt-1">
            Live NEA: PSI {liveSnapshot.psi[0]?.psi24h ?? '—'} · {liveSnapshot.rainfall.length} stations · {liveSnapshot.forecast.length} forecast areas
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {sources.map((s) => (
          <div key={s.id} className="p-3 border-b border-border-strong flex items-center gap-2">
            <span
              className={`w-2 h-2 border border-border-strong ${
                s.state === 'fresh'
                  ? 'bg-accent-success'
                  : s.state === 'stale'
                  ? 'bg-accent-warning'
                  : 'bg-accent-critical'
              }`}
            />
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-widest">{s.name}</div>
              <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                {s.state} · last {s.lastAgeS}s ago
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] uppercase font-bold tracking-widest text-text-secondary">
        {label}
      </label>
      {children}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-2 border border-border-strong p-3 text-sm leading-relaxed shadow-[3px_3px_0_rgba(26,26,26,1)]">
      {children}
    </div>
  );
}
