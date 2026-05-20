import {
  ClipboardList,
  CheckCircle,
  Navigation,
  AlertTriangle,
  Crown,
  Bot,
  UsersRound,
  LogIn,
  LogOut,
  Calendar,
  User,
  ShieldCheck,
} from 'lucide-react';
import type React from 'react';
import { useAppContext } from '../../../AppContext';
import type { CanonicalEvent, DistressSession, VolunteerEvent, Responder } from '../../../AppContext';
import SeverityChip from '../../primitives/SeverityChip';
import StatusPipeline from '../../primitives/StatusPipeline';
import SlashComposer from '../../primitives/SlashComposer';
import { etaMinutes, filterWithinKm, getDistanceKm } from '../../../utils/geo';

export function DutyStatus() {
  const { responders, toggleDuty, selfResponderId } = useAppContext();
  const self = responders.find((r) => r.id === selfResponderId);
  const onDuty = self?.status !== 'out';
  return (
    <div className="p-5 flex flex-col gap-4">
      <h2 className="text-xl font-serif italic font-black">Duty</h2>
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-2">
          You are {onDuty ? 'on' : 'off'} duty
        </strong>
        Capabilities: medical · search · aux. Shift end 22:00.
      </Card>
      <button
        onClick={() => toggleDuty(selfResponderId, !onDuty)}
        className={`w-full py-3 text-[11px] uppercase font-black tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] ${
          onDuty ? 'bg-surface-0 text-text-primary' : 'bg-accent-success text-surface-3'
        }`}
      >
        {onDuty ? 'Go off duty' : 'Go on duty'}
      </button>
    </div>
  );
}

export function VerifyQueue() {
  const { events, setSelectedId, setDrawerContent } = useAppContext();
  const queue = events.filter((e) => e.status === 'verified');
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Verified incidents</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          Citizen reports are verified by ops. Responders see only published incidents.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 && (
          <div className="p-6 text-[10px] uppercase font-bold tracking-widest text-text-secondary">
            No verified incidents.
          </div>
        )}
        {queue.map((e) => (
          <button
            key={e.id}
            onClick={() => {
              setSelectedId(e.id);
              setDrawerContent('local_alert');
            }}
            className="w-full p-4 border-b border-border-strong flex items-center gap-3 text-left hover:bg-surface-2"
          >
            <SeverityChip level={e.severity} />
            <div className="flex-1 min-w-0">
              <h3 className="text-[11px] font-bold uppercase tracking-widest truncate">{e.title}</h3>
              <p className="text-[9px] uppercase tracking-widest text-text-secondary mt-1">
                {e.kind} · {e.source}
              </p>
            </div>
            <ShieldCheck className="w-4 h-4" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function FormCase() {
  const { events, requestCaseFormation, selfResponderId } = useAppContext();
  const candidates = events.filter((e) => e.status === 'verified' && !e.caseId && e.kind !== 'weather');
  return (
    <div className="p-5 flex flex-col gap-3">
      <h2 className="text-xl font-serif italic font-black">Form case</h2>
      <Card>Responders cannot draw polygons or create operating areas. Request ops to form a case around an existing verified incident.</Card>
      {candidates.length === 0 && <Card>No verified incident is waiting for case formation.</Card>}
      {candidates.map((event) => (
        <div key={event.id} className="border border-border-strong bg-surface-0 p-3 shadow-[3px_3px_0_rgba(26,26,26,1)]">
          <div className="flex items-center gap-2">
            <SeverityChip level={event.severity} />
            <div className="min-w-0 flex-1">
              <div className="text-[11px] uppercase font-bold tracking-widest truncate">{event.title}</div>
              <div className="text-[9px] uppercase tracking-widest text-text-secondary">{event.kind} · {event.source}</div>
            </div>
          </div>
          <button
            onClick={() => requestCaseFormation(event.id, selfResponderId)}
            className="mt-3 w-full bg-surface-3 text-text-inverse py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]"
          >
            Request ops case
          </button>
        </div>
      ))}
    </div>
  );
}

export function AssignmentDetail() {
  const { sosSessions, responders, advanceSos, confirmSosSafe, selfResponderId, cases, events, setActiveCaseId, setDrawerContent, sendChat } = useAppContext();
  const sos = sosSessions.find((s) => s.assignedResponderId === selfResponderId);
  const activeCase = cases.find((c) => c.members.includes(selfResponderId) && c.state !== 'resolved');
  const caseEvent = activeCase ? events.find((e) => e.caseId === activeCase.id) : null;
  if (!sos && !activeCase) {
    return (
      <div className="p-5 flex flex-col gap-3">
        <h2 className="text-xl font-serif italic font-black">No active assignment</h2>
        <Card>You will receive a dispatch when ops or a citizen requests help nearby.</Card>
      </div>
    );
  }
  if (!sos && activeCase) {
    return (
      <div className="p-5 flex flex-col gap-4">
        <div className="flex items-start gap-2 flex-wrap">
          <SeverityChip level={activeCase.severity} />
          <h2 className="flex-1 text-xl font-serif italic font-black min-w-0">#{activeCase.name}</h2>
        </div>
        <StatusPipeline
          steps={['Forming', 'Staging', 'Active', 'Consolidating', 'Resolved']}
          currentIndex={['forming', 'staging', 'active', 'consolidating', 'resolved'].indexOf(activeCase.state)}
        />
        <Card>
          <strong className="block uppercase text-[10px] tracking-widest mb-1">Incident</strong>
          {caseEvent?.title ?? 'Case assignment'} · captain {activeCase.captain}
        </Card>
        <Card>
          <strong className="block uppercase text-[10px] tracking-widest mb-1">Location</strong>
          {activeCase.centroid.lat.toFixed(4)}°N {activeCase.centroid.lng.toFixed(4)}°E
        </Card>
        <button
          onClick={() => {
            setActiveCaseId(activeCase.id);
            setDrawerContent('case_lobby');
          }}
          className="w-full bg-surface-3 text-text-inverse py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
        >
          Open case room
        </button>
      </div>
    );
  }
  if (!sos) return null;
  const steps = ['Assigned', 'Ack', 'En route', 'On scene', 'Resolving', 'Resolved'];
  const idx = ['ack', 'ack', 'en_route', 'arrived', 'resolving', 'resolved'].indexOf(sos.status);
  const me = responders.find((r) => r.id === selfResponderId);
  return (
    <div className="p-5 flex flex-col gap-4">
      <div className="flex items-start gap-2 flex-wrap">
        <SeverityChip level={4} />
        <h2 className="flex-1 text-xl font-serif italic font-black min-w-0">{sos.id} · {sos.category}</h2>
      </div>
      <StatusPipeline steps={steps} currentIndex={Math.max(idx, 0)} />
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-1">Target</strong>
        Citizen {sos.citizenName} · {sos.location.lat.toFixed(4)}°N {sos.location.lng.toFixed(4)}°E
      </Card>
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-1">You</strong>
        {me?.name} · {me?.org} · <span className="font-mono">{me?.status}</span>
      </Card>
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-1">Completion rule</strong>
        Closure needs responder acknowledgement and citizen safe acknowledgement. Ops can audit both in logs.
      </Card>
      <div className="flex flex-col gap-2">
        {sos.status !== 'arrived' && sos.status !== 'resolving' && sos.status !== 'resolved' && (
          <button
            onClick={() => advanceSos(sos.id, 'arrived')}
            className="w-full bg-accent-success text-surface-3 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
          >
            <CheckCircle className="w-3 h-3 inline mr-1" />
            Arrived
          </button>
        )}
        {(sos.status === 'arrived' || sos.status === 'resolving') && (
          <button
            onClick={() => confirmSosSafe(sos.id, 'responder')}
            disabled={sos.responderConfirmedSafe}
            className="w-full bg-accent-success text-surface-3 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] disabled:opacity-60"
          >
            <CheckCircle className="w-3 h-3 inline mr-1" />
            {sos.responderConfirmedSafe ? 'Responder completion ack sent' : 'Mark completed / wait citizen ack'}
          </button>
        )}
        <button
          onClick={() =>
            window.open(
              `https://www.google.com/maps?q=${sos.location.lat},${sos.location.lng}`,
              '_blank',
              'noopener,noreferrer'
            )
          }
          className="w-full bg-surface-0 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong"
        >
          <Navigation className="w-3 h-3 inline mr-1" />
          Navigate
        </button>
        <button
          onClick={() => {
            advanceSos(sos.id, 'resolving');
            sendChat('CASE-ALPHA-09', selfResponderId, `Unable / handoff requested for ${sos.id}.`);
          }}
          className="w-full bg-accent-warning text-text-primary py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong"
        >
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          Unable / handoff
        </button>
      </div>
    </div>
  );
}

export function VolunteerEvents() {
  const { volunteerEvents, joinVolunteerEvent, unregisterVolunteerEvent, selfResponderId, responders } = useAppContext();
  const self = responders.find((r) => r.id === selfResponderId);
  const origin = self?.location ?? { lng: 103.85, lat: 1.3 };
  const nearby = filterWithinKm<VolunteerEvent>(volunteerEvents, origin, 8);
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Volunteer events
        </h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          Community and standby requests sorted by distance
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {nearby.length === 0 && (
          <div className="p-6 text-[10px] uppercase font-bold tracking-widest text-text-secondary">
            No volunteer events within 8 km.
          </div>
        )}
        {nearby.map(({ item: e, distanceKm }) => {
          const joined = e.registeredResponderIds.includes(selfResponderId);
          return (
            <div key={e.id} className="p-3 border-b border-border-strong">
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase font-bold tracking-widest">{e.title}</div>
              <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                    {distanceKm.toFixed(1)} km · {e.date} · {e.venue} · {e.status}
                  </div>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="px-1.5 py-0.5 border border-border-strong bg-accent-warning text-[8px] uppercase font-black tracking-widest">
                  Demo
                </span>
                <span className="px-1.5 py-0.5 border border-border-strong text-[8px] uppercase font-black tracking-widest">
                  Posted by {e.organizerRole ?? 'community'} · {e.organizer}
                </span>
              </div>
              <p className="text-[10px] mt-2 leading-relaxed">{e.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {e.skillsNeeded.map((s) => (
                  <span key={s} className="px-1.5 py-0.5 border border-border-strong text-[8px] uppercase font-bold tracking-widest">
                    {s}
                  </span>
                ))}
              </div>
              <button
                onClick={() =>
                  joined
                    ? unregisterVolunteerEvent(e.id, selfResponderId)
                    : joinVolunteerEvent(e.id, selfResponderId)
                }
                className={`mt-2 w-full py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)] ${
                  joined ? 'bg-accent-critical text-text-inverse' : 'bg-accent-success text-surface-3'
                }`}
              >
                {joined ? 'Unregister' : 'Register'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function JoinableMissions() {
  const {
    events,
    sosSessions,
    cases,
    responders,
    selfResponderId,
    assignSos,
    joinCase,
    setActiveCaseId,
    setDrawerContent,
  } = useAppContext();
  const self = responders.find((r) => r.id === selfResponderId);
  const origin = self?.location ?? { lng: 103.85, lat: 1.3 };
  const openSos = filterWithinKm<DistressSession>(
    sosSessions.filter((s) => s.status === 'requesting').map((s) => ({ ...s, location: s.location })),
    origin,
    8
  );
  const joinableCases = cases
    .filter((c) => !c.members.includes(selfResponderId) && c.state !== 'resolved')
    .map((c) => ({
      caseRoom: c,
      event: events.find((e) => e.caseId === c.id),
      distanceKm: getDistanceKm(origin, c.centroid),
    }))
    .filter((c) => c.distanceKm <= 8)
    .sort((a, b) => a.distanceKm - b.distanceKm);
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Joinable missions</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          Within 8 km · SOS requests and ops-formed case rooms
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Section title={`Open SOS (${openSos.length})`}>
          <Explainer title="Open SOS" text="A citizen distress request before ops has formed a full case. Suitable responders may accept directly; ops can still dispatch and audit." />
          {openSos.length === 0 && <EmptyLine>No open SOS within 8 km.</EmptyLine>}
          {openSos.map(({ item, distanceKm }) => {
            const fit = fitForSos(self, item.category, distanceKm);
            return (
            <div key={item.id} className="p-3 border-b border-border-strong">
              <div className="flex items-center gap-2">
                <SeverityChip level={4} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase font-bold tracking-widest">
                    {item.id} · {item.category}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                    {distanceKm.toFixed(1)} km · ETA {etaMinutes(distanceKm)} min · citizen {item.citizenName}
                  </div>
                </div>
              </div>
              <FitMeter score={fit.score} reason={fit.reason} />
              <button
                onClick={() => {
                  assignSos(item.id, selfResponderId);
                  setDrawerContent('assignment_detail');
                }}
                className="mt-2 w-full bg-accent-critical text-text-inverse py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]"
              >
                Accept SOS
              </button>
            </div>
            );
          })}
        </Section>
        <Section title={`Case rooms (${joinableCases.length})`}>
          <Explainer title="Case room" text="An ops-formed incident workspace with members, logs, Host AI, and final closure. Restricted official cases are movement-only for volunteers." />
          {joinableCases.length === 0 && <EmptyLine>No joinable case rooms within 8 km.</EmptyLine>}
          {joinableCases.map(({ caseRoom, event, distanceKm }) => {
            const fit = fitForCase(self, caseRoom.severity, event, distanceKm);
            return (
            <div key={caseRoom.id} className="p-3 border-b border-border-strong">
              <div className="flex items-center gap-2">
                <SeverityChip level={caseRoom.severity} />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] uppercase font-bold tracking-widest">
                    {caseRoom.restricted ? 'Official movement · ' : ''}#{caseRoom.name}
                  </div>
                  <div className="text-[9px] uppercase tracking-widest text-text-secondary">
                    {distanceKm.toFixed(1)} km · {caseRoom.state} · {caseRoom.members.length} members
                  </div>
                </div>
              </div>
              <p className="text-[10px] mt-2 leading-relaxed">{event?.title ?? 'Case assignment'}</p>
              <FitMeter score={caseRoom.restricted ? 0 : fit.score} reason={caseRoom.restricted ? 'Official-only case. Track movement to avoid interference.' : fit.reason} />
              <button
                disabled={caseRoom.restricted}
                onClick={() => {
                  joinCase(caseRoom.id, selfResponderId);
                  setActiveCaseId(caseRoom.id);
                  setDrawerContent('case_lobby');
                }}
                className={`mt-2 w-full py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)] ${
                  caseRoom.restricted ? 'bg-surface-2 text-text-muted cursor-not-allowed' : 'bg-accent-success text-surface-3'
                }`}
              >
                {caseRoom.restricted ? 'Monitor only' : 'Join case'}
              </button>
            </div>
            );
          })}
        </Section>
      </div>
    </div>
  );
}

export function ProfileWorkspace() {
  const { users, updateUserProfile, selfResponderId, responders, role } = useAppContext();
  const activeUserId = role === 'ops' ? 'U-OPS-1' : role === 'citizen' ? 'U-CIV-1' : selfResponderId;
  const user = users.find((u) => u.id === activeUserId) ?? users[0];
  const responder = responders.find((r) => r.id === selfResponderId);
  if (!user) return null;
  return (
    <div className="p-5 flex flex-col gap-4">
      <h2 className="text-xl font-serif italic font-black flex items-center gap-2">
        <User className="w-4 h-4" />
        Profile
      </h2>
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-1">{user.displayName}</strong>
        @{user.username} · {user.phone}
      </Card>
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-1">Role</strong>
        {user.primaryRole} {user.secondaryRole ? `· secondary ${user.secondaryRole}` : ''} · status {responder?.status ?? 'active'}
      </Card>
      <Field label="Display name">
        <input
          defaultValue={user.displayName}
          onBlur={(e) => updateUserProfile(user.id, { displayName: e.target.value })}
          className="w-full p-2 border border-border-strong bg-surface-0 text-sm font-mono outline-none"
        />
      </Field>
      <Field label="Skills">
        <input
          defaultValue={user.skills.join(', ')}
          onBlur={(e) =>
            updateUserProfile(user.id, {
              skills: e.target.value
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
          className="w-full p-2 border border-border-strong bg-surface-0 text-sm font-mono outline-none"
        />
      </Field>
    </div>
  );
}

export function MissionBoard() {
  const { events, sosSessions, setSelectedId, setDrawerContent } = useAppContext();
  const items: { id: string; title: string; meta: string; severity: 1 | 2 | 3 | 4 | 5; target: string }[] = [
    ...sosSessions
      .filter((s) => !['resolved', 'cancelled'].includes(s.status))
      .map((s) => ({
        id: s.id,
        title: 'SOS · ' + s.category,
        meta: 'live · ' + s.status,
        severity: 4 as const,
        target: 'distress_oversight',
      })),
    ...events.map((e) => ({
      id: e.id,
      title: e.title + (e.liveValue ? ' · ' + e.liveValue : ''),
      meta: e.source,
      severity: e.severity,
      target: 'incident_ops',
    })),
  ];
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Bulletin</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          {items.length} active across Singapore
        </p>
      </div>
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
            <SeverityChip level={it.severity} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-bold uppercase tracking-widest truncate">{it.title}</div>
              <div className="text-[9px] uppercase tracking-widest text-text-secondary mt-0.5">{it.meta}</div>
            </div>
            <ClipboardList className="w-3 h-3 flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
}

export function GroupsWorkspace() {
  const { groups, joinGroup, leaveGroup, selfResponderId, cases, joinCase, leaveCase } =
    useAppContext();
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black flex items-center gap-2">
          <UsersRound className="w-4 h-4" />
          Groups & cases
        </h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          Join orgs, capability cadres, geo cells, or active cases.
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        <Section title="Cases (live operations)">
          {cases.map((c) => {
            const joined = c.members.includes(selfResponderId);
            return (
              <Row
                key={c.id}
                title={'#' + c.name}
                tag={c.state}
                meta={`${c.restricted ? 'official-only · monitor movement' : 'captain ' + c.captain} · ${c.members.length} members`}
                severity={c.severity}
                joined={joined}
                disabled={!!c.restricted}
                onToggle={() => (joined ? leaveCase(c.id, selfResponderId) : joinCase(c.id, selfResponderId))}
              />
            );
          })}
        </Section>
        <Section title="Organisations & cadres">
          {groups.map((g) => {
            const joined = g.members.includes(selfResponderId);
            return (
              <Row
                key={g.id}
                title={g.name}
                tag={g.kind}
                meta={g.description}
                joined={joined}
                onToggle={() =>
                  joined ? leaveGroup(g.id, selfResponderId) : joinGroup(g.id, selfResponderId)
                }
              />
            );
          })}
        </Section>
      </div>
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

function EmptyLine({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-3 text-[10px] uppercase font-bold tracking-widest text-text-secondary">
      {children}
    </div>
  );
}

function Explainer({ title, text }: { title: string; text: string }) {
  return (
    <div className="p-3 border-b border-border-strong bg-surface-0">
      <div className="text-[9px] uppercase font-black tracking-widest">{title}</div>
      <p className="text-[10px] leading-relaxed mt-1 text-text-secondary">{text}</p>
    </div>
  );
}

function FitMeter({ score, reason }: { score: number; reason: string }) {
  return (
    <div className="mt-2 border border-border-strong bg-surface-2 p-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[9px] uppercase font-black tracking-widest">Suggested fit</span>
        <span className="font-mono text-[11px] font-black">{score}%</span>
      </div>
      <div className="mt-1 h-2 border border-border-strong bg-surface-0">
        <div className="h-full bg-accent-success" style={{ width: `${Math.max(0, Math.min(100, score))}%` }} />
      </div>
      <p className="text-[9px] uppercase tracking-widest text-text-secondary mt-1">{reason}</p>
    </div>
  );
}

function fitForSos(responder: Responder | undefined, category: DistressSession['category'], distanceKm: number) {
  const skills = responder?.role ?? 'aux';
  const match =
    (category === 'medical' && skills === 'medic') ||
    (category === 'fire' && skills === 'fire') ||
    (category === 'trapped' && skills === 'search') ||
    (category === 'hazard' && skills === 'aux');
  const distanceScore = Math.max(0, 34 - Math.round(distanceKm * 5));
  const score = Math.min(98, 45 + distanceScore + (match ? 20 : 0) + (responder?.status === 'ready' ? 8 : 0));
  return {
    score,
    reason: `${match ? 'Capability match' : 'Partial capability'} · ${distanceKm.toFixed(1)} km · ${responder?.status ?? 'unknown'}`,
  };
}

function fitForCase(
  responder: Responder | undefined,
  severity: 1 | 2 | 3 | 4 | 5,
  event: CanonicalEvent | undefined,
  distanceKm: number
) {
  const match =
    (event?.kind === 'medical' && responder?.role === 'medic') ||
    (event?.kind === 'fire' && responder?.role === 'fire') ||
    (event?.kind === 'crash' && responder?.role !== 'aux') ||
    (event?.kind === 'flood' && ['search', 'aux'].includes(responder?.role ?? ''));
  const score = Math.min(96, 38 + (match ? 24 : 8) + Math.max(0, 26 - Math.round(distanceKm * 3)) + severity * 3);
  return {
    score,
    reason: `${match ? 'Role matches incident' : 'Support role'} · severity L${severity} · ${distanceKm.toFixed(1)} km`,
  };
}

function Row({
  title,
  tag,
  meta,
  severity,
  joined,
  disabled = false,
  onToggle,
}: {
  key?: React.Key;
  title: string;
  tag: string;
  meta: string;
  severity?: 1 | 2 | 3 | 4 | 5;
  joined: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="p-3 border-b border-border-strong flex items-start gap-3">
      {severity && <SeverityChip level={severity} />}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-bold uppercase tracking-widest">{title}</span>
          <span className="text-[9px] uppercase font-mono font-bold bg-surface-2 border border-border-strong px-1.5">
            {tag}
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-widest text-text-secondary mt-1 line-clamp-2">
          {meta}
        </p>
      </div>
      <button
        disabled={disabled}
        onClick={onToggle}
        className={`flex items-center gap-1 px-3 py-1.5 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${
          disabled
            ? 'bg-surface-2 text-text-muted cursor-not-allowed'
            : joined
            ? 'bg-accent-critical text-text-inverse'
            : 'bg-accent-success text-surface-3'
        }`}
      >
        {disabled ? (
          <>Monitor</>
        ) : joined ? (
          <>
            <LogOut className="w-3 h-3" />
            Leave
          </>
        ) : (
          <>
            <LogIn className="w-3 h-3" />
            Join
          </>
        )}
      </button>
    </div>
  );
}

export function CaseLobby() {
  const { cases, chat, responders, sendChat, activeCaseId, selfResponderId } = useAppContext();
  const caseRoom = cases.find((c) => c.id === (activeCaseId ?? cases[0]?.id)) ?? cases[0];
  if (!caseRoom) return <div className="p-6 text-[10px]">No active case.</div>;
  const messages = chat.filter((c) => c.caseId === caseRoom.id);
  const members = caseRoom.members.map((id) => responders.find((r) => r.id === id)!).filter(Boolean);
  const cadence: Record<number, string> = { 1: '—', 2: '60s', 3: '30s', 4: '15s', 5: '5s' };
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b-2 border-border-strong bg-surface-3 text-text-inverse">
        <div className="flex items-center gap-2 flex-wrap">
          <SeverityChip level={caseRoom.severity} />
          <h2 className="text-lg font-serif italic font-black flex-1 min-w-0 truncate">#{caseRoom.name}</h2>
          <div className="text-[9px] font-mono font-bold">WD {cadence[caseRoom.severity]}</div>
        </div>
        <div className="mt-2 text-[10px] uppercase font-bold tracking-widest opacity-80">
          state · {caseRoom.state} · members {members.length}
        </div>
      </div>
      <div className="p-3 border-b border-border-strong bg-surface-2 flex gap-2 flex-wrap">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2 px-2 py-1 border border-border-strong bg-surface-0 shadow-[2px_2px_0_rgba(26,26,26,1)]"
          >
            <span
              className={`w-2 h-2 border border-border-strong ${
                m.status === 'on_scene'
                  ? 'bg-accent-critical'
                  : m.status === 'en_route'
                  ? 'bg-accent-warning'
                  : 'bg-accent-success'
              }`}
            />
            <span className="text-[9px] uppercase font-bold tracking-widest">{m.name}</span>
            {m.id === caseRoom.captain && <Crown className="w-3 h-3" />}
          </div>
        ))}
        <div className="flex items-center gap-2 px-2 py-1 border border-border-strong bg-surface-3 text-text-inverse shadow-[2px_2px_0_rgba(26,26,26,1)]">
          <Bot className="w-3 h-3" />
          <span className="text-[9px] uppercase font-bold tracking-widest">Host AI</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
        {messages.map((m) => (
          <ChatRow key={m.id} entry={m} self={selfResponderId} />
        ))}
      </div>
      <div className="p-3 border-t border-border-strong bg-surface-1">
        <SlashComposer onSend={(text) => sendChat(caseRoom.id, selfResponderId, text)} />
      </div>
    </div>
  );
}

function ChatRow({ entry, self }: { key?: React.Key; entry: import('../../../AppContext').ChatEntry; self: string }) {
  if (entry.kind === 'system') {
    return (
      <div className="text-center text-[9px] uppercase tracking-widest font-bold text-text-secondary py-1 border-y border-dashed border-border-strong">
        {entry.text}
      </div>
    );
  }
  if (entry.kind === 'host') {
    return (
      <div className="bg-surface-3 text-text-inverse p-3 border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] self-start max-w-[90%]">
        <div className="text-[9px] uppercase tracking-widest font-black mb-1 flex items-center gap-1 text-accent-warning">
          <Bot className="w-3 h-3" />
          Host
        </div>
        <p className="text-[11px] leading-relaxed">{entry.text}</p>
        {entry.chips && entry.chips.length > 0 && (
          <div className="flex gap-1 flex-wrap mt-2">
            {entry.chips.map((c) => (
              <span
                key={c.label}
                className="px-1.5 py-0.5 border border-text-inverse text-[8px] font-mono uppercase tracking-widest"
                title={c.ref}
              >
                {c.label} · {c.ref}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }
  const isMe = entry.authorId === self;
  return (
    <div
      className={`p-3 border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)] max-w-[80%] ${
        isMe ? 'self-end bg-accent-success text-surface-3' : 'self-start bg-surface-0'
      }`}
    >
      <div className="text-[9px] uppercase tracking-widest font-black mb-1 border-b border-border-strong pb-1">
        {isMe ? 'You' : entry.authorId}
      </div>
      <p className="text-[11px] leading-relaxed">{entry.text}</p>
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
