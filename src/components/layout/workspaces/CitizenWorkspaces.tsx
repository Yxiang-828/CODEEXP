import { useState } from 'react';
import type React from 'react';
import { MapPin, Clock, FileText, Radio, ChevronRight, Camera, Mic, X, CheckCircle2, Bot, Sparkles } from 'lucide-react';
import { useAppContext } from '../../../AppContext';
import type { CanonicalEvent, VolunteerEvent } from '../../../AppContext';
import SeverityChip from '../../primitives/SeverityChip';
import StatusPipeline from '../../primitives/StatusPipeline';
import { etaMinutes, filterWithinKm, getDistanceKm } from '../../../utils/geo';
import { askHostAi, type HostAiResponse } from '../../../services/hostAi';

export function LocalAlertDetail() {
  const { events, selectedId, setDrawerContent } = useAppContext();
  const [shared, setShared] = useState(false);
  const event = events.find((e) => e.id === selectedId) ?? events[0];
  if (!event) return <Empty />;
  const shareAlert = async () => {
    const text = `${event.title} · ${event.source} · ${event.location.lat.toFixed(4)}N ${event.location.lng.toFixed(4)}E`;
    if (navigator.share) {
      await navigator.share({ title: 'Kampung Kaki alert', text }).catch(() => undefined);
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text).catch(() => undefined);
    }
    setShared(true);
  };

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
        <button
          onClick={shareAlert}
          className="w-full bg-surface-0 text-text-primary py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]"
        >
          {shared ? 'Alert copied/shared' : 'Share with a friend'}
        </button>
      </div>
      <RefBar createdAt={event.createdAt} refStr={event.id} />
    </div>
  );
}

export function IncidentGuidance() {
  const { setDrawerContent, events, selectedId, selectedMapItem } = useAppContext();
  const [ai, setAi] = useState<HostAiResponse | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const event = events.find((e) => e.id === selectedId) ?? events[0];
  const kind =
    selectedMapItem?.category === 'Traffic'
      ? 'crash'
      : event?.kind ?? 'other';
  const guide = guidanceFor(kind);
  const loadAi = async () => {
    setLoadingAi(true);
    const reply = await askHostAi({
      role: 'citizen',
      workspace: 'incident_guidance',
      prompt: `Give citizen-safe guidance for ${event?.title ?? selectedMapItem?.title ?? kind}.`,
      context: {
        kind,
        title: event?.title ?? selectedMapItem?.title,
        source: event?.source ?? selectedMapItem?.source,
      },
    }).catch(() => ({
      state: 'unavailable' as const,
      text: 'Host AI unavailable. Use the safety checklist above.',
      chips: [{ label: 'tool: host_ai', ref: 'unavailable' }],
    }));
    setAi(reply);
    setLoadingAi(false);
  };
  const tabs = ['Assess', 'Act', 'After'] as const;
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Assess');
  const phaseSteps = guide.phases[activeTab];

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b border-border-strong">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest border-r border-border-strong last:border-r-0 transition-colors ${
              activeTab === t ? 'bg-surface-3 text-text-inverse' : 'bg-surface-0 text-text-primary hover:bg-surface-2'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-3">
        <h2 className="text-xl font-serif italic font-black">{guide.title}</h2>
        {phaseSteps.map((step) => (
          <div key={step}>
            <Card>{step}</Card>
          </div>
        ))}
        {activeTab === 'Act' && (
          <>
            <button
              onClick={loadAi}
              disabled={loadingAi}
              className="w-full bg-surface-3 text-text-inverse py-3 text-[10px] font-bold uppercase tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Sparkles className="w-3 h-3" />
              {loadingAi ? 'Loading AI suggestion' : 'Load AI suggestion'}
            </button>
            {ai && (
              <Card>
                <strong className="flex items-center gap-1 uppercase tracking-widest text-[9px] mb-1">
                  <Bot className="w-3 h-3" />
                  AI suggestion · {ai.state}
                </strong>
                {ai.text}
              </Card>
            )}
          </>
        )}
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
  const { fileReport, createVolunteerEvent, setDrawerContent } = useAppContext();
  const [mode, setMode] = useState<'form' | 'voice' | 'volunteer' | null>(null);
  const [step, setStep] = useState(1);
  const [kind, setKind] = useState<'fire' | 'flood' | 'medical' | 'crash' | 'hazard' | 'other'>('hazard');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photoAttached, setPhotoAttached] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [volunteerTitle, setVolunteerTitle] = useState('Community support request');

  const submit = () => {
    fileReport({
      kind,
      title: title || kind[0].toUpperCase() + kind.slice(1) + ' nearby',
      body,
      location: { lng: 103.85, lat: 1.3 },
    });
    setStep(5);
  };

  const submitVoice = () => {
    const parsedKind =
      voiceText.toLowerCase().includes('fire')
        ? 'fire'
        : voiceText.toLowerCase().includes('flood')
        ? 'flood'
        : voiceText.toLowerCase().includes('medical') || voiceText.toLowerCase().includes('collapsed')
        ? 'medical'
        : voiceText.toLowerCase().includes('crash') || voiceText.toLowerCase().includes('accident')
        ? 'crash'
        : 'hazard';
    fileReport({
      kind: parsedKind,
      title: 'Voice report · ' + parsedKind,
      body: voiceText || 'Voice report submitted without transcript.',
      location: { lng: 103.85, lat: 1.3 },
    });
    setStep(5);
  };

  const submitVolunteer = () => {
    createVolunteerEvent({
      title: volunteerTitle,
      category: 'other',
      description: body || 'Community support request submitted by citizen.',
      location: { lng: 103.85, lat: 1.3 },
      venue: 'Citizen reported location',
      organizer: 'U_self',
      date: new Date().toISOString().slice(0, 10),
      skillsNeeded: ['first aid', 'coordination'],
    });
    setStep(5);
  };

  if (!mode) {
    return (
      <div className="p-5 flex flex-col gap-4">
        <h2 className="text-xl font-serif italic font-black">SOS / report</h2>
        <button
          onClick={() => setMode('voice')}
          className="p-4 border border-border-strong bg-surface-0 shadow-[3px_3px_0_rgba(26,26,26,1)] text-left flex items-center gap-3"
        >
          <Mic className="w-5 h-5 text-accent-critical" />
          <div>
            <div className="text-[11px] uppercase font-black tracking-widest">Voice-prepared report</div>
            <div className="text-[10px] uppercase tracking-widest text-text-secondary mt-1">
              Type or paste a transcript. No fake AI; shell prepares a structured report.
            </div>
          </div>
        </button>
        <button
          onClick={() => setMode('form')}
          className="p-4 border border-border-strong bg-surface-0 shadow-[3px_3px_0_rgba(26,26,26,1)] text-left flex items-center gap-3"
        >
          <FileText className="w-5 h-5 text-accent-info" />
          <div>
            <div className="text-[11px] uppercase font-black tracking-widest">Emergency report form</div>
            <div className="text-[10px] uppercase tracking-widest text-text-secondary mt-1">
              Category, location, description, optional photo marker.
            </div>
          </div>
        </button>
        <button
          onClick={() => setMode('volunteer')}
          className="p-4 border border-border-strong bg-surface-0 shadow-[3px_3px_0_rgba(26,26,26,1)] text-left flex items-center gap-3"
        >
          <CheckCircle2 className="w-5 h-5 text-accent-success" />
          <div>
            <div className="text-[11px] uppercase font-black tracking-widest">Volunteer / community event</div>
            <div className="text-[10px] uppercase tracking-widest text-text-secondary mt-1">
              Non-emergency support request visible to responders.
            </div>
          </div>
        </button>
      </div>
    );
  }

  if (mode === 'voice') {
    return (
      <div className="flex flex-col h-full">
        <div className="p-4 border-b border-border-strong flex items-center gap-2">
          <button onClick={() => setMode(null)} className="p-1 border border-border-strong">
            <X className="w-3 h-3" />
          </button>
          <h2 className="text-xl font-serif italic font-black">Voice-prepared report</h2>
        </div>
        <div className="p-5 flex-1 flex flex-col gap-3">
          <Card>Audio upload/transcription will connect to backend later. For shell readiness, paste the transcript and submit a structured report.</Card>
          <textarea
            value={voiceText}
            onChange={(e) => setVoiceText(e.target.value)}
            className="w-full h-40 p-3 border border-border-strong bg-surface-0 text-sm font-mono resize-none outline-none focus:border-text-primary"
            placeholder="Example: elderly man collapsed near City Hall exit B, needs medical help"
          />
        </div>
        <div className="p-4 border-t border-border-strong">
          <button
            onClick={submitVoice}
            className="w-full bg-accent-critical text-text-inverse py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
          >
            Submit voice report
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <Steps current={step} total={4} />
      {step === 1 && (
        <div className="p-5 flex-1 flex flex-col gap-3">
          <h3 className="text-[10px] uppercase font-bold tracking-widest">
            Step 1 · {mode === 'volunteer' ? 'Community request' : 'Category'}
          </h3>
          {mode === 'volunteer' ? (
            <input
              value={volunteerTitle}
              onChange={(e) => setVolunteerTitle(e.target.value)}
              className="w-full p-3 border border-border-strong bg-surface-0 text-sm font-mono outline-none focus:border-text-primary"
            />
          ) : (
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
          )}
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
          {mode === 'form' && (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-border-strong bg-surface-0 text-sm font-mono outline-none focus:border-text-primary"
              placeholder="Short title"
            />
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full h-32 p-3 border border-border-strong bg-surface-0 text-sm font-mono resize-none outline-none focus:border-text-primary"
            placeholder="What did you see?"
          />
          <button
            onClick={() => setPhotoAttached((v) => !v)}
            className={`flex items-center gap-2 px-3 py-2 border border-border-strong text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0_rgba(26,26,26,1)] self-start ${
              photoAttached ? 'bg-accent-success text-surface-3' : 'bg-surface-0'
            }`}
          >
            <Camera className="w-3 h-3" />
            {photoAttached ? 'Photo marked' : 'Attach photo'}
          </button>
        </div>
      )}
      {step === 4 && (
        <div className="p-5 flex-1 flex flex-col gap-3">
          <h3 className="text-[10px] uppercase font-bold tracking-widest">Step 4 · Review</h3>
          <Card>
            <strong className="block uppercase tracking-widest text-[9px] mb-1">
              {mode === 'volunteer' ? 'volunteer event' : kind}
            </strong>
            {mode === 'volunteer' ? volunteerTitle : title || kind[0].toUpperCase() + kind.slice(1) + ' nearby'}
            <br />
            {body || '(no description)'}
            {photoAttached && <span className="block mt-2 font-mono text-[10px]">evidence: photo marker attached</span>}
          </Card>
          <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
            Will appear in the ops report queue only. Responders see it only after ops verifies and publishes an incident.
          </p>
        </div>
      )}
      {step === 5 && (
        <div className="p-5 flex-1 flex flex-col gap-3">
          <h3 className="text-xl font-serif italic font-black text-accent-success">Report filed.</h3>
          <Card>It is now in the ops queue. You will get a notification after ops verifies or dismisses it.</Card>
          <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
            SOS is the only citizen flow broadcast directly to both ops and responders.
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
            onClick={() => (step < 4 ? setStep(step + 1) : mode === 'volunteer' ? submitVolunteer() : submit())}
            className="flex-1 bg-surface-3 text-text-inverse py-3 border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] text-[10px] font-bold uppercase tracking-widest"
          >
            {step < 4 ? 'Next' : mode === 'volunteer' ? 'Create event' : 'File report'}
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
          Pick a category. Ops and suitable responders are notified immediately.
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
  const { sosSessions, responders, advanceSos, confirmSosSafe, cancelSos } = useAppContext();
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
          <Card>Waiting for ops or a suitable responder to accept. This is visible to both ops and responders.</Card>
        )}
        <Card>
          <strong className="block uppercase tracking-widest text-[9px] mb-1">What they can see</strong>
          Your masked name, category, approximate location. No phone number unless you share it.
        </Card>
      </div>
      <div className="p-4 mt-auto border-t border-border-strong flex flex-col gap-2">
        {(active.status === 'ack' || active.status === 'en_route') && (
          <button
            onClick={() => advanceSos(active.id, 'arrived')}
            className="w-full bg-accent-success text-surface-3 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
          >
            Mark responder arrived
          </button>
        )}
        {(active.status === 'arrived' || active.status === 'resolving') && (
          <button
            onClick={() => confirmSosSafe(active.id, 'citizen')}
            disabled={active.citizenConfirmedSafe}
            className="w-full bg-accent-success text-surface-3 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
          >
            {active.citizenConfirmedSafe ? 'Citizen safe ack sent' : 'I am safe / request closure'}
          </button>
        )}
        {active.status === 'requesting' && (
          <button
            onClick={() => cancelSos(active.id)}
            className="w-full bg-surface-0 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong"
          >
            Cancel SOS
          </button>
        )}
      </div>
    </div>
  );
}

export function BriefingSpace() {
  const { events, reports, sosSessions, role, setSelectedId, setDrawerContent, liveSnapshot } = useAppContext();
  const items: { id: string; title: string; meta: string; severity: 1 | 2 | 3 | 4 | 5; target: string }[] = [
    ...events.filter((e) => e.status === 'verified').map((e) => ({
      id: e.id,
      title: e.title + (e.liveValue ? ' · ' + e.liveValue : ''),
      meta: e.source,
      severity: e.severity,
      target: 'local_alert',
    })),
    ...(role === 'ops' ? reports.filter((r) => r.status === 'pending' || r.status === 'claimed') : []).map((r) => ({
      id: r.id,
      title: 'Report · ' + r.title,
      meta: 'Ops-only · ' + r.status + ' · ' + fmtAgo(r.createdAt),
      severity: 2 as const,
      target: 'report_queue',
    })),
    ...(role !== 'citizen' ? sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status)) : []).map((s) => ({
      id: s.id,
      title: 'SOS · ' + s.category,
      meta: 'Visible to ops and responders · ' + s.status,
      severity: 4 as const,
      target: role === 'ops' ? 'distress_oversight' : 'assignment_detail',
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
              setDrawerContent(it.target);
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
  const { events, volunteerEvents, sosSessions, responders, setSelectedId, setDrawerContent } =
    useAppContext();
  const userLocation = { lng: 103.85, lat: 1.3 };
  const activeSos = sosSessions.find((s) => !['resolved', 'cancelled'].includes(s.status));
  const assignedResponder = activeSos?.assignedResponderId
    ? responders.find((r) => r.id === activeSos.assignedResponderId)
    : null;
  const nearbyEvents = filterWithinKm<CanonicalEvent>(
    events.filter((e) => e.status === 'verified'),
    userLocation,
    5
  );
  const nearbyVolunteer = filterWithinKm<VolunteerEvent>(volunteerEvents, userLocation, 5);
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">My alerts</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          Sorted by distance from demo location · {userLocation.lat.toFixed(3)}N {userLocation.lng.toFixed(3)}E
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {activeSos && assignedResponder && (
          <Section title="Dispatched responder">
            <Card>
              <strong className="block uppercase text-[10px] tracking-widest mb-1">
                {assignedResponder.name} · {assignedResponder.org}
              </strong>
              ETA {etaMinutes(getDistanceKm(assignedResponder.location, activeSos.location))} min · status{' '}
              {assignedResponder.status}
            </Card>
          </Section>
        )}
        <Section title={`Nearby emergencies (${nearbyEvents.length})`}>
          {nearbyEvents.length === 0 && <EmptyRow>No active emergencies within 5 km.</EmptyRow>}
          {nearbyEvents.map(({ item, distanceKm }) => (
            <button
              key={item.id}
              onClick={() => {
                setSelectedId(item.id);
                setDrawerContent('local_alert');
              }}
              className="w-full p-3 border-b border-border-strong text-left hover:bg-surface-2 flex items-center gap-3"
            >
              <SeverityChip level={item.severity} audience="citizen" showCode={false} />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] uppercase font-bold tracking-widest truncate">{item.title}</div>
                <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                  {distanceKm.toFixed(1)} km · {item.source}
                </div>
              </div>
              <ChevronRight className="w-3 h-3" />
            </button>
          ))}
        </Section>
        <Section title={`Volunteer events (${nearbyVolunteer.length})`}>
          {nearbyVolunteer.length === 0 && <EmptyRow>No community events within 5 km.</EmptyRow>}
          {nearbyVolunteer.map(({ item, distanceKm }) => (
            <div key={item.id} className="p-3 border-b border-border-strong">
              <div className="text-[11px] uppercase font-bold tracking-widest">{item.title}</div>
              <div className="text-[9px] uppercase tracking-widest text-text-secondary mt-1">
                {distanceKm.toFixed(1)} km · {item.date} · {item.status}
              </div>
              <p className="text-[10px] mt-2 leading-relaxed">{item.description}</p>
            </div>
          ))}
        </Section>
        <Section title="Alert levels">
          {['Advisory', 'Notice', 'Warning', 'Severe', 'Emergency'].map((lvl, i) => (
            <label
              key={lvl}
              className="flex items-center gap-2 p-3 border-b border-border-strong bg-surface-0"
            >
              <input type="checkbox" defaultChecked={i >= 1} />
              <span className="text-[10px] uppercase font-bold tracking-widest">{lvl}</span>
            </label>
          ))}
        </Section>
      </div>
    </div>
  );
}

export function CitizenAssistant() {
  const { events, sosSessions, notifications } = useAppContext();
  const [prompt, setPrompt] = useState('What should I do near my current alert?');
  const [reply, setReply] = useState<HostAiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const ask = async () => {
    setLoading(true);
    const result = await askHostAi({
      role: 'citizen',
      workspace: 'citizen_ai',
      prompt,
      context: {
        activeEvents: events.slice(0, 4),
        activeSos: sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status)),
        notifications: notifications.filter((n) => n.roles.includes('citizen')).slice(0, 4),
      },
    }).catch(() => ({
      state: 'unavailable' as const,
      text: 'Host AI unavailable. Use official instructions and call 995/999 if there is immediate danger.',
      chips: [{ label: 'tool: host_ai', ref: 'unavailable' }],
    }));
    setReply(result);
    setLoading(false);
  };
  return (
    <div className="p-5 flex flex-col gap-4">
      <h2 className="text-xl font-serif italic font-black flex items-center gap-2">
        <Bot className="w-4 h-4" />
        Citizen AI
      </h2>
      <Card>
        Ask for plain-language safety guidance. It loads only when you press ask and must say unavailable instead of inventing live data.
      </Card>
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="w-full h-28 p-3 border border-border-strong bg-surface-0 text-sm font-mono resize-none outline-none focus:border-text-primary"
      />
      <button
        onClick={ask}
        disabled={loading}
        className="w-full bg-surface-3 text-text-inverse py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] disabled:opacity-60"
      >
        {loading ? 'Asking Host AI' : 'Ask Host AI'}
      </button>
      {reply && (
        <Card>
          <strong className="block uppercase tracking-widest text-[9px] mb-1">Host AI · {reply.state}</strong>
          {reply.text}
        </Card>
      )}
    </div>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 text-[10px] uppercase font-bold tracking-widest text-text-secondary">
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b-2 border-border-strong">
      <div className="px-4 py-2 bg-surface-2 border-b border-border-strong">
        <h3 className="text-[9px] uppercase font-black tracking-widest">{title}</h3>
      </div>
      <div>{children}</div>
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

type GuidancePhases = { Assess: string[]; Act: string[]; After: string[] };
type Guidance = { title: string; phases: GuidancePhases };

function guidanceFor(kind: CanonicalEvent['kind']): Guidance {
  const guides: Record<CanonicalEvent['kind'], Guidance> = {
    fire: {
      title: 'Fire nearby',
      phases: {
        Assess: [
          'Check if smoke is inside your unit or corridor before opening doors.',
          'If heavy smoke is present outside, stay inside and seal door gaps with wet cloth.',
        ],
        Act: [
          'Leave via stairs if the escape route is clear. Do not use lifts.',
          'Close doors behind you to slow smoke spread.',
          'If trapped, call 995 and signal from a window. Stay low near the floor.',
        ],
        After: [
          'Do not re-enter the building until SCDF declares it safe.',
          'Report injuries to emergency services. Keep bystanders away from the perimeter.',
          'File a report through this app so ops can update the incident status.',
        ],
      },
    },
    flood: {
      title: 'Flood or flash flood',
      phases: {
        Assess: [
          'Check water level at the nearest road or drain before moving.',
          'Shallow fast-moving water (15 cm) can knock an adult off their feet.',
        ],
        Act: [
          'Do not drive or walk into flooded roads. Turn around early.',
          'Move to higher ground immediately if water is rising.',
          'Keep children and pets away from drains and canals.',
        ],
        After: [
          'Do not return until water has receded and the area is cleared.',
          'Document water damage with photos for insurance before cleaning up.',
          'Watch for contaminated water — do not drink tap water until PUB confirms it is safe.',
        ],
      },
    },
    medical: {
      title: 'Medical emergency',
      phases: {
        Assess: [
          'Check responsiveness — tap the person firmly and call out.',
          'Look for breathing. If absent or gasping, this is a cardiac arrest — act immediately.',
        ],
        Act: [
          'Call 995. Do not hang up. Follow dispatcher instructions.',
          'If trained: start CPR at 100–120 compressions per minute, 5 cm depth.',
          'Send someone to get the nearest AED. Apply as soon as it arrives.',
          'Do not move the person unless the location is immediately dangerous.',
        ],
        After: [
          'Stay with the person until paramedics take over.',
          'Brief SCDF on any medications, allergies, or circumstances you observed.',
          'You may experience shock — rest, hydrate, and seek support if needed.',
        ],
      },
    },
    crash: {
      title: 'Road accident',
      phases: {
        Assess: [
          'Stay off the road and behind barriers. Do not walk across live lanes.',
          'Check for fuel spills, smoke, or fire before approaching.',
        ],
        Act: [
          'Call 995 for injuries or 999 if there is a security threat.',
          'Warn oncoming drivers with hazard lights or by waving from a safe position.',
          'Do not move crash victims unless there is immediate fire or flood risk.',
        ],
        After: [
          'Provide your contact details to traffic police if you witnessed the crash.',
          'Do not post live video of victims to social media.',
          'File a report here with your location so ops can coordinate traffic management.',
        ],
      },
    },
    hazard: {
      title: 'Chemical or structural hazard',
      phases: {
        Assess: [
          'Stay upwind and uphill from any smoke, chemical smell, or spill.',
          'Do not touch fallen cables, unknown liquids, or unstable debris.',
        ],
        Act: [
          'Move at least 100 m away and keep others back.',
          'Cover nose and mouth if there is an odour — improvise with a damp cloth.',
          'Call 995. Report the exact street address and describe what you see.',
        ],
        After: [
          'Do not return until SCDF or ops clears the area.',
          'Wash exposed skin thoroughly with soap and water.',
          'Report exact location and any signage or container labels you saw.',
        ],
      },
    },
    weather: {
      title: 'Severe weather',
      phases: {
        Assess: [
          'Check NEA alerts for thunderstorm, haze, or flood advisory level.',
          'PSI above 100 is unhealthy. Above 200 is very unhealthy.',
        ],
        Act: [
          'Move indoors before lightning arrives — do not wait for rain.',
          'Avoid open fields, tall isolated trees, and metal structures during lightning.',
          'Reduce strenuous outdoor activity during haze. Use N95 masks above PSI 150.',
        ],
        After: [
          'Check on elderly and vulnerable neighbours after severe weather.',
          'Clear debris from drains near your home to prevent secondary flooding.',
          'Follow official recovery instructions before resuming outdoor activities.',
        ],
      },
    },
    other: {
      title: 'Unknown incident',
      phases: {
        Assess: [
          'Move away from the immediate area before assessing the situation.',
          'Observe from a safe distance. Note time, location, and what you see.',
        ],
        Act: [
          'Call 995 for fire/medical or 999 for immediate police threat.',
          'Do not enter restricted or unstable areas.',
          'Follow any ops alerts broadcast through this app.',
        ],
        After: [
          'File a report here so ops can verify and escalate if needed.',
          'Stay available in case emergency services need your account as a witness.',
          'Check the alerts feed for updates before returning to the area.',
        ],
      },
    },
  };
  return guides[kind] ?? guides.other;
}

function fmtAgo(ts: number) {
  const s = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return s + 's ago';
  const m = Math.floor(s / 60);
  if (m < 60) return m + 'm ago';
  return Math.floor(m / 60) + 'h ago';
}
