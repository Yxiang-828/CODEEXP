import { useState } from 'react';
import { MapPin, Clock, FileText, Radio, ChevronRight, Camera } from 'lucide-react';
import { useAppContext } from '../../../AppContext';
import SeverityChip from '../../primitives/SeverityChip';
import StatusPipeline from '../../primitives/StatusPipeline';

export function LocalAlertDetail() {
  const { events, selectedId, setDrawerContent } = useAppContext();
  const event = events.find((e) => e.id === selectedId) ?? events[0];
  if (!event) return <Empty />;

  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-start gap-3 flex-wrap">
        <SeverityChip level={event.severity} audience="citizen" showCode={false} />
        <h2 className="flex-1 text-xl font-serif italic font-black text-text-primary leading-tight min-w-0">
          {event.title}
        </h2>
      </div>
      <Meta
        items={[
          { icon: FileText, label: event.source },
          { icon: MapPin, label: `${event.location.lat.toFixed(3)}°N ${event.location.lng.toFixed(3)}°E` },
          { icon: Clock, label: fmtAgo(event.createdAt) },
        ]}
      />
      {event.liveValue && (
        <div className="px-3 py-2 bg-accent-info text-text-inverse font-mono text-[11px] border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]">
          LIVE · {event.liveValue}
        </div>
      )}
      <p className="text-sm leading-relaxed bg-surface-2 border border-border-strong p-3 shadow-[3px_3px_0_rgba(26,26,26,1)]">
        {event.kind === 'flood'
          ? 'Rising water reported. Vehicles turning around. Avoid the area.'
          : event.kind === 'crash'
          ? 'Multi-vehicle pileup. Casualties reported. Emergency services on site.'
          : event.kind === 'fire'
          ? 'Active fire response in progress. Stay clear.'
          : event.kind === 'weather'
          ? 'Live NEA data shows degraded conditions. Take precautions.'
          : 'Hazard reported. Take care.'}
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setDrawerContent('incident_guidance')}
          className="w-full bg-accent-info text-text-inverse py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
        >
          What should I do?
        </button>
        <button className="w-full bg-surface-0 text-text-primary py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]">
          Share with a friend
        </button>
      </div>
      <RefBar createdAt={event.createdAt} refStr={event.id} />
    </div>
  );
}

export function IncidentGuidance() {
  const { setDrawerContent } = useAppContext();
  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border-strong">
        {['Assess', 'Act', 'After'].map((t, i) => (
          <div
            key={t}
            className={`flex-1 text-center py-3 text-[10px] font-black uppercase tracking-widest border-r border-border-strong last:border-r-0 ${
              i === 0 ? 'bg-surface-3 text-text-inverse' : 'opacity-50'
            }`}
          >
            {t}
          </div>
        ))}
      </div>
      <div className="p-5 flex-1 flex flex-col gap-3">
        <h2 className="text-xl font-serif italic font-black">1. Move to safety</h2>
        <Card>Do not walk through moving water. Six inches can knock you over.</Card>
        <Card>Avoid driving into flooded roads. Abandon vehicle if water rises.</Card>
        <Card>Stay with someone if possible.</Card>
      </div>
      <div className="p-4 border-t border-border-strong flex flex-col gap-2">
        <button
          onClick={() => setDrawerContent('local_alert')}
          className="w-full bg-surface-0 border border-border-strong py-3 text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0_rgba(26,26,26,1)]"
        >
          I am safe
        </button>
        <button
          onClick={() => setDrawerContent('sos_draft')}
          className="w-full bg-accent-critical text-text-inverse py-3 text-[10px] font-bold uppercase tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
        >
          I need help here
        </button>
      </div>
    </div>
  );
}

export function ReportCompose() {
  const { fileReport, setDrawerContent } = useAppContext();
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<'fire' | 'flood' | 'medical' | 'crash' | 'hazard' | 'other'>('hazard');
  const [body, setBody] = useState('');

  const submit = () => {
    fileReport({
      kind,
      title: kind[0].toUpperCase() + kind.slice(1) + ' nearby',
      body,
      location: { lng: 103.85, lat: 1.3 },
    });
    setStep(5);
  };

  return (
    <div className="flex flex-col h-full">
      <Steps current={step} total={4} />
      {step === 1 && (
        <div className="p-5 flex-1 flex flex-col gap-3">
          <h3 className="text-[10px] uppercase font-bold tracking-widest">Step 1 · Category</h3>
          <div className="grid grid-cols-2 gap-2">
            {(['fire', 'flood', 'medical', 'crash', 'hazard', 'other'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setKind(k)}
                className={`p-3 border border-border-strong text-[10px] uppercase font-bold tracking-widest shadow-[3px_3px_0_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ${
                  kind === k ? 'bg-surface-3 text-text-inverse' : 'bg-surface-0'
                }`}
              >
                {k}
              </button>
            ))}
          </div>
        </div>
      )}
      {step === 2 && (
        <div className="p-5 flex-1 flex flex-col gap-3">
          <h3 className="text-[10px] uppercase font-bold tracking-widest">Step 2 · Location</h3>
          <Card>Pin dropped at approx your location.</Card>
          <div className="font-mono text-[11px] bg-surface-2 border border-border-strong p-3">
            1.300° N · 103.850° E
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="p-5 flex-1 flex flex-col gap-3">
          <h3 className="text-[10px] uppercase font-bold tracking-widest">Step 3 · Describe</h3>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-32 p-3 border border-border-strong bg-surface-0 text-sm font-mono resize-none outline-none focus:border-text-primary"
            placeholder="What did you see?"
          />
          <button className="flex items-center gap-2 px-3 py-2 border border-border-strong text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0_rgba(26,26,26,1)] self-start">
            <Camera className="w-3 h-3" />
            Attach photo
          </button>
        </div>
      )}
      {step === 4 && (
        <div className="p-5 flex-1 flex flex-col gap-3">
          <h3 className="text-[10px] uppercase font-bold tracking-widest">Step 4 · Review</h3>
          <Card>
            <strong className="block uppercase tracking-widest text-[9px] mb-1">{kind}</strong>
            {body || '(no description)'}
          </Card>
          <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
            Will appear in ops report queue + responder verify queue immediately.
          </p>
        </div>
      )}
      {step === 5 && (
        <div className="p-5 flex-1 flex flex-col gap-3">
          <h3 className="text-xl font-serif italic font-black text-accent-success">Report filed.</h3>
          <Card>It is now in the ops queue and visible to nearby responders.</Card>
          <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
            Switch role to Responder or Ops to see it land.
          </p>
        </div>
      )}
      {step <= 4 && (
        <div className="p-4 border-t border-border-strong flex gap-2">
          <button
            onClick={() => (step === 1 ? setDrawerContent(null) : setStep(step - 1))}
            className="flex-1 py-3 border border-border-strong text-[10px] font-bold uppercase tracking-widest"
          >
            Back
          </button>
          <button
            onClick={() => (step < 4 ? setStep(step + 1) : submit())}
            className="flex-1 bg-surface-3 text-text-inverse py-3 border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] text-[10px] font-bold uppercase tracking-widest"
          >
            {step < 4 ? 'Next' : 'File report'}
          </button>
        </div>
      )}
    </div>
  );
}

export function NeedHelpSOS() {
  const { startSos, setDrawerContent } = useAppContext();
  const [category, setCategory] = useState<'medical' | 'fire' | 'trapped' | 'threat' | 'hazard' | 'other'>('medical');
  const send = () => {
    startSos({ citizenName: 'U_self', category, location: { lng: 103.85, lat: 1.3 } });
    setDrawerContent('sos_live');
  };
  return (
    <div className="flex flex-col h-full">
      <div className="p-5 bg-accent-critical text-text-inverse">
        <h2 className="text-2xl font-serif italic font-black">Need help</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest mt-1 opacity-90">
          Pick a category. Help is dispatched immediately.
        </p>
      </div>
      <div className="p-5 grid grid-cols-2 gap-2 flex-1">
        {(['medical', 'fire', 'trapped', 'threat', 'hazard', 'other'] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`p-4 border border-border-strong text-[11px] uppercase font-black tracking-widest shadow-[3px_3px_0_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all ${
              category === c ? 'bg-surface-3 text-text-inverse' : 'bg-surface-0'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-border-strong">
        <button
          onClick={send}
          className="w-full bg-accent-critical text-text-inverse py-4 text-[11px] uppercase font-black tracking-widest border border-border-strong shadow-[4px_4px_0_rgba(26,26,26,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center justify-center gap-2"
        >
          <Radio className="w-4 h-4" />
          Send for help
        </button>
      </div>
    </div>
  );
}

export function SosLive() {
  const { sosSessions, responders, assignSos, advanceSos, cancelSos } = useAppContext();
  const active = sosSessions.find((s) => !['resolved', 'cancelled'].includes(s.status));
  if (!active) return <Empty />;
  const steps = ['Requesting', 'Acknowledged', 'En route', 'Arrived', 'Resolving', 'Resolved'];
  const idx = ['requesting', 'ack', 'en_route', 'arrived', 'resolving', 'resolved'].indexOf(active.status);
  const assigned = responders.find((r) => r.id === active.assignedResponderId);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 bg-accent-critical text-text-inverse">
        <div className="text-[10px] uppercase font-bold tracking-widest opacity-90">SOS live</div>
        <div className="text-xl font-serif italic font-black">{active.id} · {active.category}</div>
      </div>
      <div className="p-4">
        <StatusPipeline steps={steps} currentIndex={idx} />
      </div>
      <div className="px-4 flex flex-col gap-3">
        {assigned ? (
          <Card>
            <div className="text-[10px] uppercase font-bold tracking-widest text-text-secondary mb-1">
              Responder dispatched
            </div>
            <div className="text-sm font-bold">{assigned.name} · {assigned.org} · {assigned.role}</div>
            <div className="text-[10px] mt-1 font-mono">Live GPS shared. Track on map.</div>
          </Card>
        ) : (
          <Card>Waiting for responder match…</Card>
        )}
        <Card>
          <strong className="block uppercase tracking-widest text-[9px] mb-1">What they can see</strong>
          Your masked name, category, approximate location. No phone number unless you share it.
        </Card>
      </div>
      <div className="p-4 mt-auto border-t border-border-strong flex flex-col gap-2">
        {active.status === 'requesting' && (
          <button
            onClick={() => assignSos(active.id, 'R-ECHO-1')}
            className="w-full bg-accent-info text-text-inverse py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
          >
            Demo · simulate responder accept
          </button>
        )}
        {(active.status === 'ack' || active.status === 'en_route') && (
          <button
            onClick={() => advanceSos(active.id, 'arrived')}
            className="w-full bg-accent-success text-surface-3 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
          >
            Demo · simulate arrival
          </button>
        )}
        {active.status === 'arrived' && (
          <button
            onClick={() => advanceSos(active.id, 'resolved')}
            className="w-full bg-accent-success text-surface-3 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
          >
            Mark resolved
          </button>
        )}
        <button
          onClick={() => cancelSos(active.id)}
          className="w-full bg-surface-0 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong"
        >
          Cancel SOS
        </button>
      </div>
    </div>
  );
}

export function BriefingSpace() {
  const { events, reports, setSelectedId, setDrawerContent, liveSnapshot } = useAppContext();
  const items: { id: string; title: string; meta: string; severity: 1 | 2 | 3 | 4 | 5; kind: 'event' | 'report' }[] = [
    ...events.filter((e) => e.status === 'verified').map((e) => ({
      id: e.id,
      title: e.title + (e.liveValue ? ' · ' + e.liveValue : ''),
      meta: e.source,
      severity: e.severity,
      kind: 'event' as const,
    })),
    ...reports.filter((r) => r.status === 'pending').map((r) => ({
      id: r.id,
      title: 'Report · ' + r.title,
      meta: 'Unverified · ' + fmtAgo(r.createdAt),
      severity: 2 as const,
      kind: 'report' as const,
    })),
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Briefing</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          {items.length} in view · NEA live · pan map to update
        </p>
      </div>
      {liveSnapshot && (
        <div className="px-4 py-2 border-b border-border-strong bg-surface-2 text-[9px] uppercase font-bold tracking-widest font-mono">
          PSI {liveSnapshot.psi[0]?.psi24h ?? '—'} · stations {liveSnapshot.rainfall.length} · forecast areas {liveSnapshot.forecast.length}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {items.map((it) => (
          <button
            key={it.id}
            onClick={() => {
              setSelectedId(it.id);
              setDrawerContent(it.kind === 'event' ? 'local_alert' : 'briefing');
            }}
            className="w-full flex items-center gap-3 p-3 border-b border-border-strong hover:bg-surface-2 text-left"
          >
            <SeverityChip level={it.severity} audience="citizen" showCode={false} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest truncate">{it.title}</div>
              <div className="text-[9px] uppercase tracking-widest text-text-secondary mt-0.5">{it.meta}</div>
            </div>
            <ChevronRight className="w-3 h-3 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function AlertsState() {
  return (
    <div className="p-5 flex flex-col gap-3">
      <h2 className="text-xl font-serif italic font-black">My alerts</h2>
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-2">Geo cell w21z2</strong>
        Subscribed: Notice and above. Tap below to tune.
      </Card>
      <div className="flex flex-col gap-2">
        {['Advisory', 'Notice', 'Warning', 'Severe', 'Emergency'].map((lvl, i) => (
          <label key={lvl} className="flex items-center gap-2 p-3 border border-border-strong bg-surface-0 shadow-[2px_2px_0_rgba(26,26,26,1)]">
            <input type="checkbox" defaultChecked={i >= 1} />
            <span className="text-[10px] uppercase font-bold tracking-widest">{lvl}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function Steps({ current, total }: { current: number; total: number }) {
  return (
    <div className="px-5 py-3 border-b border-border-strong flex gap-2">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`flex-1 h-2 border border-border-strong ${i < current ? 'bg-text-primary' : 'bg-surface-2'}`}
        />
      ))}
    </div>
  );
}

function Meta({ items }: { items: { icon: typeof MapPin; label: string }[] }) {
  return (
    <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest font-bold text-text-secondary flex-wrap">
      {items.map((m, i) => (
        <div key={i} className="flex items-center gap-1">
          <m.icon className="w-3 h-3" />
          {m.label}
          {i < items.length - 1 && <span className="opacity-40 ml-1">/</span>}
        </div>
      ))}
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

function RefBar({ createdAt, refStr }: { createdAt: number; refStr: string }) {
  return (
    <div className="mt-2 pt-3 border-t border-border-strong flex items-center justify-between text-[9px] uppercase tracking-widest font-mono font-bold text-text-muted">
      <span>Ref · {refStr}</span>
      <span>{fmtAgo(createdAt)}</span>
    </div>
  );
}

function Empty() {
  return (
    <div className="p-6 text-[10px] uppercase font-bold tracking-widest text-text-secondary">
      Nothing to show.
    </div>
  );
}

function fmtAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  return Math.floor(m / 60) + 'h ago';
}
