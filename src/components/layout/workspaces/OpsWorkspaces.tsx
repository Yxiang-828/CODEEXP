import { useState } from 'react';
import type React from 'react';
import { Megaphone, Eye, AlertOctagon, CheckCircle2, MapPinned, Archive, ClipboardCheck, ScrollText, Bell } from 'lucide-react';
import { useAppContext } from '../../../AppContext';
import type { CanonicalEvent, DistressSession, Responder } from '../../../AppContext';
import SeverityChip from '../../primitives/SeverityChip';
import RolePreviewTabs from '../../primitives/RolePreviewTabs';
import CoveragePreview from '../../primitives/CoveragePreview';
import type { SeverityLevel } from '../../primitives/SeverityChip';
import { getDistanceKm } from '../../../utils/geo';

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
          <Card>Use the temporary map drawing toolbar now. Undo and clear only affect this declaration session.</Card>
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
  const { responders, sosSessions, events, assignSos, assignIncident, setDrawerContent } = useAppContext();
  const pending = sosSessions.find((s) => s.status === 'requesting');
  const assignableEvents = events.filter((e) => e.status === 'verified' && e.kind !== 'weather');
  const available = responders.filter((r) => ['ready', 'en_route', 'on_scene'].includes(r.status));
  const [target, setTarget] = useState(pending ? `sos:${pending.id}` : assignableEvents[0] ? `event:${assignableEvents[0].id}` : '');
  const selectedSos = target.startsWith('sos:') ? sosSessions.find((s) => s.id === target.slice(4)) : null;
  const selectedEvent = target.startsWith('event:') ? events.find((e) => e.id === target.slice(6)) : null;
  return (
    <div className="p-5 flex flex-col gap-3">
      <h2 className="text-xl font-serif italic font-black">Dispatch</h2>
      {pending || assignableEvents.length > 0 ? (
        <>
          <Card>
            <strong className="block uppercase text-[10px] tracking-widest mb-2">Assign to mission</strong>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full p-2 border border-border-strong bg-surface-0 text-[10px] uppercase font-bold tracking-widest outline-none"
            >
              {sosSessions
                .filter((s) => !['resolved', 'cancelled'].includes(s.status))
                .map((s) => (
                  <option key={s.id} value={`sos:${s.id}`}>
                    SOS · {s.id} · {s.category}
                  </option>
                ))}
              {assignableEvents.map((e) => (
                <option key={e.id} value={`event:${e.id}`}>
                  Incident · {e.title}
                </option>
              ))}
            </select>
          </Card>
          <h3 className="text-[10px] uppercase font-bold tracking-widest">Available roster · demo fit scoring</h3>
          {available.map((r) => {
            const fit = fitForDispatch(r, selectedSos, selectedEvent);
            return (
            <div
              key={r.id}
              className="p-2 border border-border-strong bg-surface-0 shadow-[2px_2px_0_rgba(26,26,26,1)]"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest">
                    {r.name} · {r.org}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                    {r.role} · {r.status} {r.demo ? '· demo' : ''} {r.unitType === 'professional' ? '· professional' : ''}
                  </div>
                </div>
                <button
                  onClick={() => {
                    if (selectedSos) assignSos(selectedSos.id, r.id);
                    if (selectedEvent) assignIncident(selectedEvent.id, r.id);
                    setDrawerContent(null);
                  }}
                  className="bg-surface-3 text-text-inverse px-3 py-1 text-[9px] font-bold uppercase tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]"
                >
                  Assign
                </button>
              </div>
              <FitMeter score={fit.score} reason={fit.reason} />
            </div>
            );
          })}
        </>
      ) : (
        <Card>No SOS or incident target is waiting for dispatch.</Card>
      )}
    </div>
  );
}

export function BroadcastComposer() {
  const [sentAt, setSentAt] = useState<number | null>(null);
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
      {sentAt && (
        <Card>
          Broadcast queued locally at {new Date(sentAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}. Backend delivery will replace this local queue.
        </Card>
      )}
      <button
        onClick={() => setSentAt(Date.now())}
        className="bg-accent-critical text-text-inverse py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] flex items-center justify-center gap-2"
      >
        <Megaphone className="w-3 h-3" />
        {sentAt ? 'Broadcast queued' : 'Send broadcast'}
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
      <div className="p-3 border-b border-border-strong bg-surface-2">
        <div className="text-[9px] uppercase font-black tracking-widest">Feature chain</div>
        <p className="text-[10px] leading-relaxed mt-1">
          Citizen report to ops claim to ops verify/dismiss to reporter notification. Only verified incidents publish to responders.
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
            <div className="mt-2 bg-surface-2 border border-border-strong p-2">
              <div className="text-[9px] uppercase font-black tracking-widest text-text-secondary">
                Ops review
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest">
                Status {r.status} {r.claimedBy ? `· claimed by ${r.claimedBy}` : '· unclaimed'}
              </div>
            </div>
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
                Verify + notify
              </button>
              <button
                onClick={() => dismissReport(r.id)}
                className="flex-1 bg-surface-0 py-1.5 text-[9px] uppercase font-bold tracking-widest border border-border-strong"
              >
                Dismiss
              </button>
            </div>
            {r.auditTrail && (
              <div className="mt-2 border border-border-strong bg-surface-2 p-2">
                <div className="text-[9px] uppercase font-black tracking-widest">Audit trail</div>
                {r.auditTrail.map((line) => (
                  <div key={line} className="text-[9px] uppercase tracking-widest text-text-secondary mt-1">
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ZoneManager() {
  const { zones, updateZoneStatus } = useAppContext();
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black flex items-center gap-2">
          <MapPinned className="w-4 h-4" />
          Emergency zones
        </h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          {zones.length} zones · drawn-area shell ready
        </p>
      </div>
      <div className="p-3 border-b border-border-strong text-[10px] uppercase font-bold tracking-widest text-text-secondary">
        New zones are created through the ops Declare/Broadcast drawing session only.
      </div>
      <div className="flex-1 overflow-y-auto">
        {zones.map((z) => (
          <div key={z.id} className="p-3 border-b border-border-strong">
            <div className="flex items-center gap-2">
              <SeverityChip level={z.severity} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase font-bold tracking-widest truncate">{z.title}</div>
                <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                  {z.kind} · {z.status} · {z.area.length} points
                </div>
              </div>
            </div>
            <p className="text-[10px] mt-2 leading-relaxed">{z.description}</p>
            <div className="flex gap-1 mt-2">
              <button
                onClick={() => updateZoneStatus(z.id, 'declared')}
                className="flex-1 bg-accent-success text-surface-3 py-1.5 text-[9px] uppercase font-bold tracking-widest border border-border-strong"
              >
                Declare
              </button>
              <button
                onClick={() => updateZoneStatus(z.id, 'archived')}
                className="flex-1 bg-surface-0 py-1.5 text-[9px] uppercase font-bold tracking-widest border border-border-strong"
              >
                <Archive className="w-3 h-3 inline mr-1" />
                Archive
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
              <div className="mt-2 border border-border-strong bg-surface-2 p-2">
                <div className="text-[9px] uppercase font-black tracking-widest mb-1">
                  Suggested responder fit
                </div>
                {responders
                  .filter((candidate) => candidate.status === 'ready')
                  .map((candidate) => ({ candidate, fit: fitForDispatch(candidate, s, null) }))
                  .sort((a, b) => b.fit.score - a.fit.score)
                  .slice(0, 4)
                  .map(({ candidate, fit }) => (
                    <div key={candidate.id} className="flex items-center gap-2 py-1 border-t border-border-strong first:border-t-0">
                      <span className="font-mono text-[10px] font-black w-9">{fit.score}%</span>
                      <span className="text-[9px] uppercase font-bold tracking-widest flex-1">
                        {candidate.name} · {candidate.org}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function CaseOversight() {
  const { cases, setDrawerContent, setActiveCaseId, closeCase } = useAppContext();
  const [finalReports, setFinalReports] = useState<Record<string, string>>({});
  const [confirmClose, setConfirmClose] = useState<string | null>(null);
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Case oversight</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {cases.map((c) => (
          <div key={c.id} className="p-3 border-b border-border-strong">
            <button
              onClick={() => {
                setActiveCaseId(c.id);
                setDrawerContent('case_lobby');
              }}
              className="w-full text-left hover:bg-surface-2 flex items-center gap-3"
            >
              <SeverityChip level={c.severity} />
              <div className="flex-1">
                <div className="text-[11px] font-bold uppercase tracking-widest">
                  {c.name} {c.restricted ? '· official-only' : ''}
                </div>
                <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                  {c.state} · {c.members.length} members · {c.source ?? 'ops'}
                </div>
              </div>
              <Eye className="w-3 h-3" />
            </button>
            {c.state !== 'resolved' && (
              <div className="mt-2 flex flex-col gap-2">
                <textarea
                  value={finalReports[c.id] ?? ''}
                  onChange={(e) => setFinalReports((prev) => ({ ...prev, [c.id]: e.target.value }))}
                  className="w-full h-16 p-2 border border-border-strong bg-surface-0 text-[10px] font-mono resize-none outline-none"
                  placeholder="Final report before ops close"
                />
                {confirmClose === c.id ? (
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        closeCase(c.id, finalReports[c.id] ?? '');
                        setConfirmClose(null);
                      }}
                      className="flex-1 bg-accent-critical text-text-inverse py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]"
                    >
                      Confirm close
                    </button>
                    <button
                      onClick={() => setConfirmClose(null)}
                      className="flex-1 bg-surface-0 py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClose(c.id)}
                    className="w-full bg-accent-success text-surface-3 py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]"
                  >
                    Ops close case
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ResponderOversight() {
  const { responders, updateResponderStatus, users } = useAppContext();
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
                {r.role} · {r.status} {r.demo ? '· demo' : ''} {r.unitType === 'professional' ? '· special professional' : ''}
              </div>
              <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                {users.find((u) => u.id === r.id)?.skills.join(' · ') || 'profile pending'}
              </div>
              {r.note && <div className="text-[10px] leading-relaxed mt-1">{r.note}</div>}
            </div>
            <select
              value={r.status}
              onChange={(e) => updateResponderStatus(r.id, e.target.value as typeof r.status)}
              className="bg-surface-0 border border-border-strong text-[9px] uppercase font-bold tracking-widest p-1"
            >
              {['ready', 'en_route', 'on_scene', 'out', 'offline'].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
                  : s.state === 'shell_only'
                  ? 'bg-accent-info'
                  : 'bg-accent-critical'
              }`}
            />
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-widest">{s.name}</div>
              <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                {s.state} · last {s.lastAgeS}s ago
              </div>
              {s.note && <div className="text-[10px] leading-relaxed mt-1">{s.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NotificationCenter() {
  const { notifications, role, ackNotification, selfResponderId } = useAppContext();
  const actorId = role === 'responder' ? selfResponderId : role === 'citizen' ? 'U-CIV-1' : 'U-OPS-1';
  const visible = notifications.filter((n) => n.roles.includes(role));
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notifications
        </h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          Tiered by severity and role
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {visible.map((n) => {
          const acked = n.ackBy.includes(actorId);
          return (
            <div key={n.id} className="p-3 border-b border-border-strong">
              <div className="flex items-center gap-2">
                <span className={`px-1.5 py-0.5 border border-border-strong text-[8px] uppercase font-black tracking-widest ${tierClass(n.tier)}`}>
                  {n.tier}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest">{n.title}</span>
              </div>
              <p className="text-[10px] leading-relaxed mt-2">{n.body}</p>
              <button
                onClick={() => ackNotification(n.id, actorId)}
                disabled={acked}
                className={`mt-2 w-full py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong ${
                  acked ? 'bg-surface-2 text-text-muted' : 'bg-surface-3 text-text-inverse shadow-[2px_2px_0_rgba(26,26,26,1)]'
                }`}
              >
                {acked ? 'Acknowledged' : 'Acknowledge'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ActivityLogWorkspace() {
  const { actionLogs, role } = useAppContext();
  const visible = actionLogs.filter((log) => log.visibleTo.includes(role));
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black flex items-center gap-2">
          <ScrollText className="w-4 h-4" />
          Activity logs
        </h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          Ops sees ops + responder logs. Responders see responder-visible logs.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {visible.map((log) => (
          <div key={log.id} className="p-3 border-b border-border-strong">
            <div className="flex items-center gap-2 flex-wrap">
              {log.severity && <SeverityChip level={log.severity} />}
              <span className="text-[9px] uppercase font-mono font-bold border border-border-strong px-1.5 bg-surface-2">
                {log.action}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-text-secondary">
                {new Date(log.createdAt).toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed mt-2">{log.message}</p>
            <div className="text-[9px] uppercase tracking-widest text-text-secondary mt-1">
              actor {log.actorId} · target {log.targetId}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ReadinessReport() {
  const items = [
    {
      state: 'ready',
      title: 'Role shell and navigation',
      detail: 'Citizen, responder, and ops drawers are wired through the root shell.',
    },
    {
      state: 'ready',
      title: 'Citizen intake shell',
      detail: 'SOS, emergency form, voice-prepared report, photo marker, and volunteer/community request flows exist.',
    },
    {
      state: 'ready',
      title: 'Ops command shell',
      detail: 'Report queue, distress oversight, case oversight, zones, dispatch, broadcast, roster, and source health are reachable.',
    },
    {
      state: 'ready',
      title: 'Responder shell',
      detail: 'Duty, joinable missions, assignment detail, case room, groups, volunteer events, logs, and profile are reachable.',
    },
    {
      state: 'ready',
      title: 'Template algorithm ports',
      detail: 'Distance sorting, nearby filtering, ETA derivation, polygon center, and radial zone generation are now root-native helpers.',
    },
    {
      state: 'live',
      title: 'Map + NEA feeds',
      detail: 'MapLibre/OneMap tiles and NEA PSI/rainfall/forecast are the live client-side data currently wired.',
    },
    {
      state: 'shell_only',
      title: 'Persistence and realtime',
      detail: 'State is still in AppContext. Backend/WebSocket/MQTT are explicit next step, not secretly implemented.',
    },
    {
      state: 'shell_only',
      title: 'Voice and photo processing',
      detail: 'Voice transcripts and photo evidence markers are usable shell data. Backend media storage is the next integration layer.',
    },
    {
      state: 'ready',
      title: 'OpenRouter Host AI',
      detail: 'Backend route /api/host/ask is wired. It returns not configured instead of fake AI when the environment key is missing.',
    },
    {
      state: 'not_configured',
      title: 'LTA DataMall and OneMap APIs',
      detail: 'Traffic incidents/speed bands, reverse geocode, routes, and themes require configured keys.',
    },
    {
      state: 'unavailable',
      title: 'Hospital load',
      detail: 'No live source is configured. The shell must show unavailable instead of fake wait times.',
    },
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4" />
          Shell readiness
        </h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          Truth report · live vs shell-only vs blocked
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {items.map((item) => (
          <div key={item.title} className="p-3 border-b border-border-strong">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 border border-border-strong ${
                  item.state === 'ready' || item.state === 'live'
                    ? 'bg-accent-success'
                    : item.state === 'shell_only'
                    ? 'bg-accent-info'
                    : 'bg-accent-critical'
                }`}
              />
              <span className="text-[9px] uppercase font-mono font-bold border border-border-strong px-1.5 bg-surface-2">
                {item.state}
              </span>
              <h3 className="text-[11px] uppercase font-black tracking-widest">{item.title}</h3>
            </div>
            <p className="text-[10px] leading-relaxed mt-2">{item.detail}</p>
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

function FitMeter({ score, reason }: { score: number; reason: string }) {
  return (
    <div className="mt-2 border border-border-strong bg-surface-2 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] uppercase font-black tracking-widest">Fit</span>
        <span className="font-mono text-[11px] font-black">{score}%</span>
      </div>
      <div className="mt-1 h-2 border border-border-strong bg-surface-0">
        <div className="h-full bg-accent-success" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <p className="text-[9px] uppercase tracking-widest text-text-secondary mt-1">{reason}</p>
    </div>
  );
}

function fitForDispatch(
  responder: Responder,
  sos: DistressSession | null | undefined,
  event: CanonicalEvent | null | undefined
) {
  const target = sos?.location ?? event?.location ?? { lng: 103.85, lat: 1.3 };
  const distanceKm = getDistanceKm(responder.location, target);
  const incidentKind = sos?.category ?? event?.kind ?? 'other';
  const capability =
    (incidentKind === 'medical' && responder.role === 'medic') ||
    (incidentKind === 'fire' && responder.role === 'fire') ||
    (incidentKind === 'trapped' && responder.role === 'search') ||
    (incidentKind === 'crash' && responder.role !== 'aux') ||
    (incidentKind === 'flood' && ['search', 'aux'].includes(responder.role));
  const readiness = responder.status === 'ready' ? 18 : responder.status === 'en_route' ? 6 : 0;
  const professional = responder.unitType === 'professional' ? 8 : 0;
  const score = Math.min(99, 36 + (capability ? 24 : 8) + readiness + professional + Math.max(0, 22 - Math.round(distanceKm * 3)));
  return {
    score,
    reason: `${capability ? 'capability match' : 'support fit'} · ${distanceKm.toFixed(1)} km · ${responder.unitType ?? 'volunteer'}`,
  };
}

function tierClass(tier: string) {
  if (tier === 'critical') return 'bg-accent-critical text-text-inverse';
  if (tier === 'urgent') return 'bg-accent-warning text-text-primary';
  if (tier === 'watch') return 'bg-accent-info text-text-inverse';
  return 'bg-surface-2 text-text-primary';
}
