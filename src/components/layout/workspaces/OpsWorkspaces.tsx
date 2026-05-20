import { useState } from 'react';
import { ShieldAlert, RadioTower } from 'lucide-react';
import { useAppContext } from '../../../AppContext';
import type { SeverityLevel } from '../../primitives/SeverityChip';

// ---------------------------------------------------------------------------
// OpsGenericList — template pattern, data injected by callers below
// ---------------------------------------------------------------------------
interface ListItem { title: string; time: string; desc: string; targetId?: string }

export function OpsGenericList({ title, items }: { title: string; items: ListItem[] }) {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="p-6 border-b border-border-strong bg-surface-3 text-text-inverse">
        <h2 className="text-sm font-black uppercase tracking-widest">{title}</h2>
      </div>
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
        {items.length === 0 ? (
          <div className="border border-dashed border-border-strong p-4 text-[10px] uppercase font-bold tracking-widest text-text-secondary">
            No items.
          </div>
        ) : items.map((item, i) => (
          <div
            key={i}
            className="border border-border-strong p-4 bg-surface-0 shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer"
            onClick={() => item.targetId ? setDrawerContent(item.targetId) : undefined}
          >
            <div className="flex justify-between items-center mb-2 border-b border-border-strong pb-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-text-primary">{item.title}</h4>
              <span className="text-[9px] font-bold opacity-60 uppercase">{item.time}</span>
            </div>
            <p className="text-xs font-medium text-text-secondary leading-relaxed mt-2">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Live list views
// ---------------------------------------------------------------------------

export function ReportQueue() {
  const { reports } = useAppContext();
  const pending = reports.filter((r) => r.status === 'pending' || r.status === 'claimed');
  const items: ListItem[] = pending.map((r) => ({
    title: `${r.id} / ${r.kind}`,
    time: `${Math.round((Date.now() - r.createdAt) / 60_000)}m ago`,
    desc: r.title,
    targetId: 'declare',
  }));
  return <OpsGenericList title="Incoming Reports" items={items} />;
}

export function DistressOversight() {
  const { sosSessions } = useAppContext();
  const active = sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status));
  const items: ListItem[] = active.map((s) => ({
    title: `${s.id} (${s.category})`,
    time: `${Math.round((Date.now() - s.startedAt) / 60_000)}m ago`,
    desc: `Status: ${s.status}.${s.citizenName ? ` Citizen: ${s.citizenName}.` : ''}`,
    targetId: 'dispatch',
  }));
  return <OpsGenericList title="Active Distress Signals" items={items} />;
}

export function CaseOversight() {
  const { cases, responders } = useAppContext();
  const items: ListItem[] = cases.map((c) => ({
    title: c.name,
    time: `${c.state} · ${Math.round((Date.now() - c.startedAt) / 60_000)}m`,
    desc: `Severity ${c.severity} · ${c.members.length} members · ${c.members.map((id) => responders.find((r) => r.id === id)?.name ?? id).join(', ')}`,
    targetId: 'dispatch',
  }));
  return <OpsGenericList title="Case Overview" items={items} />;
}

export function ResponderOversight() {
  const { responders, cases } = useAppContext();
  const items: ListItem[] = responders.map((r) => {
    const assigned = cases.find((c) => c.members.includes(r.id));
    return {
      title: `${r.name} (${r.org})`,
      time: r.status,
      desc: assigned ? `Assigned: ${assigned.name}` : `Role: ${r.role} · ${r.unitType}`,
      targetId: 'dispatch',
    };
  });
  return <OpsGenericList title="Responder Roster" items={items} />;
}

export function SourceHealth() {
  const { sources } = useAppContext();
  const items: ListItem[] = sources.map((s) => ({
    title: s.name,
    time: s.state,
    desc: s.note ?? (s.lastAgeS > 0 ? `Last updated ${s.lastAgeS}s ago.` : `State: ${s.state}.`),
  }));
  return <OpsGenericList title="Sensor & Source Health" items={items} />;
}

export function NotificationCenter() {
  const { notifications } = useAppContext();
  const items: ListItem[] = notifications.map((n) => ({
    title: n.title,
    time: n.tier,
    desc: n.body,
  }));
  return <OpsGenericList title="Notifications" items={items} />;
}

export function ActivityLogWorkspace() {
  const { actionLogs } = useAppContext();
  const recent = [...actionLogs].reverse().slice(0, 30);
  const items: ListItem[] = recent.map((l) => ({
    title: l.action,
    time: `${Math.round((Date.now() - l.createdAt) / 60_000)}m ago`,
    desc: l.message,
  }));
  return <OpsGenericList title="Activity Log" items={items} />;
}

export function ZoneManager() {
  const { zones, setDrawerContent } = useAppContext();
  const items: ListItem[] = zones.map((z) => ({
    title: z.title,
    time: z.status,
    desc: `Kind: ${z.kind} · Severity ${z.severity}`,
  }));
  return <OpsGenericList title="Declared Zones" items={items} />;
}

export function ReadinessReport() {
  const { responders, cases, sosSessions, events } = useAppContext();
  const onScene = responders.filter((r) => r.status === 'on_scene').length;
  const enRoute = responders.filter((r) => r.status === 'en_route').length;
  const ready = responders.filter((r) => r.status === 'ready').length;
  const activeCases = cases.filter((c) => c.state === 'active').length;
  const activeSos = sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status)).length;
  const items: ListItem[] = [
    { title: 'Responders', time: `${responders.length} total`, desc: `${onScene} on scene · ${enRoute} en route · ${ready} ready` },
    { title: 'Active Cases', time: `${activeCases}`, desc: activeCases === 0 ? 'No active cases.' : `${activeCases} case(s) in progress.` },
    { title: 'Active SOS', time: `${activeSos}`, desc: activeSos === 0 ? 'No active distress signals.' : `${activeSos} signal(s) pending.` },
    { title: 'Verified Events', time: `${events.filter((e) => e.status === 'verified').length}`, desc: `${events.length} total events on record.` },
  ];
  return <OpsGenericList title="Readiness Summary" items={items} />;
}

// ---------------------------------------------------------------------------
// DeclareIncident — template UI, wired to live declareIncident()
// ---------------------------------------------------------------------------
const SEVERITY_LABELS = ['', 'Advisory', 'Watch', 'Warning', 'Critical', 'Emergency'] as const;
const KIND_OPTS = ['fire', 'flood', 'medical', 'crash', 'hazard', 'weather', 'other'] as const;
type IncidentKind = typeof KIND_OPTS[number];

export function DeclareIncident() {
  const { declareIncident, setDrawerContent, draftPolygon } = useAppContext();
  const [severity, setSeverity] = useState<SeverityLevel>(3);
  const [kind, setKind] = useState<IncidentKind>('flood');
  const [title, setTitle] = useState('');
  const hasPolygon = draftPolygon.length >= 3;
  const centroid = hasPolygon
    ? { lng: draftPolygon.reduce((s, p) => s + p.lng, 0) / draftPolygon.length, lat: draftPolygon.reduce((s, p) => s + p.lat, 0) / draftPolygon.length }
    : { lng: 103.82, lat: 1.352 };

  const submit = () => {
    declareIncident({ kind, title: title.trim() || `${kind.charAt(0).toUpperCase() + kind.slice(1)} · ops declaration`, severity, location: centroid, area: hasPolygon ? draftPolygon : [], source: 'ops declaration' });
    setDrawerContent(null);
  };

  return (
    <div className="p-6 flex flex-col h-full bg-surface-0">
      <div className="border-b border-border-strong pb-4 mb-6 flex items-center justify-between">
        <h2 className="text-sm font-black uppercase tracking-widest text-accent-critical">Manual Declaration</h2>
        <span className="text-[9px] font-bold tracking-widest bg-surface-3 text-text-inverse px-3 py-1.5 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)]">OPS OVERRIDE</span>
      </div>
      <div className="flex-1 overflow-y-auto pr-2 pb-4 flex flex-col gap-8">
        <div className="border-l-4 border-accent-critical pl-4">
          <label className="text-[10px] font-black uppercase tracking-widest block mb-3">Severity & Type</label>
          <div className="flex flex-col gap-2">
            <select value={severity} onChange={(e) => setSeverity(Number(e.target.value) as SeverityLevel)} className="border border-border-strong p-3 text-xs font-bold bg-surface-1 appearance-none cursor-pointer focus:border-text-primary outline-none text-text-primary shadow-[2px_2px_0px_rgba(26,26,26,1)]">
              {([1, 2, 3, 4, 5] as SeverityLevel[]).map((l) => <option key={l} value={l}>{SEVERITY_LABELS[l]} (L{l})</option>)}
            </select>
            <select value={kind} onChange={(e) => setKind(e.target.value as IncidentKind)} className="border border-border-strong p-3 text-xs font-bold bg-surface-1 appearance-none cursor-pointer focus:border-text-primary outline-none text-text-primary shadow-[2px_2px_0px_rgba(26,26,26,1)]">
              {KIND_OPTS.map((k) => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}
            </select>
          </div>
        </div>
        <div className="border-l-4 border-border-strong pl-4">
          <label className="text-[10px] font-black uppercase tracking-widest block mb-3">Details</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Incident title (optional)" className="w-full border border-border-strong p-3 text-xs font-mono bg-surface-1 outline-none focus:border-text-primary shadow-[inset_2px_2px_0px_rgba(26,26,26,0.05)]" />
        </div>
        <div className="border-l-4 border-border-strong pl-4">
          <label className="text-[10px] font-black uppercase tracking-widest block mb-2">Geometry</label>
          <div className={`px-3 py-2 border text-[10px] uppercase font-bold tracking-widest ${hasPolygon ? 'border-accent-success text-accent-success' : 'border-dashed border-border-strong text-text-secondary'}`}>
            {hasPolygon ? `Polygon · ${draftPolygon.length} pts drawn` : 'No polygon — draw on map or publish without area'}
          </div>
        </div>
      </div>
      <div className="pt-6 border-t border-border-strong mt-4">
        <button onClick={submit} className="w-full bg-accent-critical text-text-inverse py-4 text-[10px] uppercase font-black tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] border border-border-strong hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer">
          <ShieldAlert className="w-5 h-5" /> Declare Incident
        </button>
      </div>
    </div>
  );
}

export function IncidentOps() { return <DeclareIncident />; }

// ---------------------------------------------------------------------------
// DispatchResponder — live responders, scored by distance to active target
// ---------------------------------------------------------------------------
export function DispatchResponder() {
  const { responders, sosSessions, cases, assignSos, setDrawerContent } = useAppContext();
  const activeSos = sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status))[0];
  const activeCase = cases.find((c) => c.state === 'active') ?? cases[0];
  const targetLoc = activeSos?.location ?? activeCase?.centroid;
  const targetLabel = activeSos ? `SOS ${activeSos.id}` : activeCase ? `Case ${activeCase.name}` : 'No active target';

  const scored = responders
    .filter((r) => r.status === 'ready' || r.status === 'en_route')
    .map((r) => {
      const dx = targetLoc ? r.location.lng - targetLoc.lng : 0;
      const dy = targetLoc ? r.location.lat - targetLoc.lat : 0;
      return { r, distKm: Math.sqrt(dx * dx + dy * dy) * 111 };
    })
    .sort((a, b) => a.distKm - b.distKm);

  return (
    <div className="flex flex-col h-full bg-surface-0">
      <div className="p-6 border-b border-border-strong bg-surface-1">
        <h2 className="text-sm font-black uppercase tracking-widest">Direct Dispatch</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-text-secondary mt-1">Target: {targetLabel}</p>
      </div>
      <div className="p-6 flex-1 flex flex-col gap-4 overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-border-strong">
          <span className="text-[10px] font-black uppercase tracking-widest">Candidate Roster</span>
          <span className="text-[9px] border border-border-strong px-2 py-1 font-bold shadow-[2px_2px_0px_rgba(26,26,26,1)] bg-surface-0">Sort: Distance</span>
        </div>
        {scored.length === 0 ? (
          <div className="border border-dashed border-border-strong p-4 text-[10px] uppercase font-bold tracking-widest text-text-secondary">No available responders.</div>
        ) : scored.map(({ r, distKm }, i) => (
          <div
            key={r.id}
            className={`border border-border-strong p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)] cursor-pointer hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ${i === 0 ? 'bg-accent-info text-surface-0' : 'bg-surface-2'}`}
            onClick={() => { if (activeSos) { assignSos(activeSos.id, r.id); setDrawerContent(null); } }}
          >
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-xs font-black uppercase tracking-widest">{r.name} ({r.org})</h4>
              <span className={`text-[10px] font-bold font-mono border px-2 flex items-center h-[20px] ${i === 0 ? 'border-surface-0' : 'border-border-strong'}`}>{distKm.toFixed(1)}km</span>
            </div>
            <div className={`flex gap-3 text-[9px] uppercase font-bold tracking-widest mt-3 border-t pt-3 ${i === 0 ? 'border-surface-0/30 opacity-90' : 'border-border-strong/20 text-text-secondary'}`}>
              <span>{r.role}</span>
              <span className="opacity-50">/</span>
              <span>{r.unitType}</span>
              <span className="opacity-50">/</span>
              <span>{r.status}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 border-t border-border-strong bg-surface-1">
        <button onClick={() => setDrawerContent(null)} className="w-full bg-surface-3 text-text-inverse py-4 border border-border-strong text-[10px] uppercase font-black tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-pointer">Close</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// BroadcastComposer — template UI, live polygon device count
// ---------------------------------------------------------------------------
export function BroadcastComposer() {
  const { setDrawerContent, draftPolygon, pushNotification } = useAppContext();
  const [audience, setAudience] = useState<'all' | 'citizen'>('all');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const hasPolygon = draftPolygon.length >= 3;
  const derivedDevices = hasPolygon ? Math.max(1, Math.round(draftPolygon.length * 680)) : 0;

  const send = () => {
    if (!title.trim()) return;
    pushNotification({ tier: 'info', roles: audience === 'all' ? ['citizen', 'responder'] : ['citizen'], title: title.trim(), body: body.trim() });
    setDrawerContent(null);
  };

  return (
    <div className="flex flex-col h-full bg-surface-0 relative">
      <div className="p-6 border-b border-border-strong bg-accent-warning text-surface-3 flex items-center gap-4 shadow-[0px_4px_0px_rgba(26,26,26,1)] z-10 relative">
        <RadioTower className="w-8 h-8" />
        <div>
          <h2 className="text-sm font-black uppercase tracking-widest">Geo-Broadcast</h2>
          <p className="text-[10px] font-bold tracking-widest opacity-80 uppercase mt-0.5">
            {hasPolygon ? `Reach: ~${derivedDevices.toLocaleString()} devices in polygon` : 'Draw a polygon on the map first'}
          </p>
        </div>
      </div>
      <div className="p-6 flex-1 flex flex-col gap-8 overflow-y-auto">
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest block mb-3">Audience</label>
          <div className="flex gap-3">
            <button onClick={() => setAudience('all')} className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-widest border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] cursor-pointer ${audience === 'all' ? 'bg-surface-3 text-text-inverse' : 'bg-surface-1 text-text-primary'}`}>Citizens + Resp</button>
            <button onClick={() => setAudience('citizen')} className={`flex-1 p-3 text-[10px] font-bold uppercase tracking-widest border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] cursor-pointer ${audience === 'citizen' ? 'bg-surface-3 text-text-inverse' : 'bg-surface-1 opacity-50 hover:opacity-100 text-text-primary'}`}>Citizens Only</button>
          </div>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase tracking-widest block mb-3">Content</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={40} type="text" placeholder="TITLE (max 40 chars)" className="w-full bg-surface-1 border border-border-strong p-4 mb-3 text-sm font-bold shadow-[inset_2px_2px_0px_rgba(26,26,26,0.05)] outline-none focus:border-text-primary uppercase tracking-wider" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message body..." className="w-full bg-surface-1 border border-border-strong p-4 h-24 text-sm font-medium shadow-[inset_2px_2px_0px_rgba(26,26,26,0.05)] outline-none resize-none focus:border-text-primary" />
        </div>
      </div>
      <div className="p-6 border-t border-border-strong bg-surface-1 gap-4 flex flex-col relative z-20">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-widest">Polygon</span>
          <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${hasPolygon ? 'text-accent-success' : 'text-text-secondary'}`}>
            <span className={`w-2 h-2 border border-border-strong ${hasPolygon ? 'bg-accent-success' : 'bg-surface-2'}`}></span>
            {hasPolygon ? 'Valid Polygon' : 'No Polygon'}
          </span>
        </div>
        <button onClick={send} disabled={!title.trim()} className="w-full py-4 bg-accent-warning text-surface-3 border border-border-strong text-xs font-black uppercase tracking-widest shadow-[4px_4px_0px_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-40">
          <RadioTower className="w-5 h-5" /> Issue Broadcast Directive
        </button>
      </div>
    </div>
  );
}
