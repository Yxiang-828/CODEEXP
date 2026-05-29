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
} from 'lucide-react';
import { useAppContext } from '../../../AppContext';
import SeverityChip from '../../primitives/SeverityChip';
import StatusPipeline from '../../primitives/StatusPipeline';
import SlashComposer from '../../primitives/SlashComposer';

export function DutyStatus() {
  const { responders, toggleDuty, selfResponderId, setSelfResponderId } = useAppContext();
  const self = responders.find((r) => r.id === selfResponderId);
  const onDuty = self?.status !== 'out';
  return (
    <div className="p-5 flex flex-col gap-4">
      <h2 className="text-xl font-serif italic font-black">Duty</h2>
      <Card>
        <strong className="block uppercase text-[10px] tracking-widest mb-2">
          You are {self?.name} · {onDuty ? 'on' : 'off'} duty
        </strong>
        Capabilities: {self?.role} · {self?.org}. Shift end 22:00.
      </Card>
      <label className="text-[9px] uppercase font-bold tracking-widest text-text-secondary">
        Switch identity (demo)
      </label>
      <select
        value={selfResponderId}
        onChange={(e) => setSelfResponderId(e.target.value)}
        className="w-full p-2 border border-border-strong bg-surface-0 text-[11px] font-mono font-bold outline-none"
      >
        {responders.map((r) => (
          <option key={r.id} value={r.id}>
            {r.name} · {r.org} · {r.role}
          </option>
        ))}
      </select>
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
  const { reports, verifyReport, dismissReport, claimReport, selfResponderId } = useAppContext();
  const queue = reports.filter((r) => r.status === 'pending' || r.status === 'claimed');
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border-strong">
        <h2 className="text-xl font-serif italic font-black">Verify queue</h2>
        <p className="text-[10px] uppercase font-bold tracking-widest text-text-secondary">
          {queue.length} pending nearby
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {queue.length === 0 && (
          <div className="p-6 text-[10px] uppercase font-bold tracking-widest text-text-secondary">
            Nothing to verify.
          </div>
        )}
        {queue.map((r) => (
          <div key={r.id} className="p-4 border-b border-border-strong flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold">{r.id}</span>
              <span className="text-[9px] uppercase tracking-widest text-text-secondary">
                trust {Math.round(r.reporterTrust * 100)}%
              </span>
            </div>
            <h3 className="text-[11px] font-bold uppercase tracking-widest">{r.title}</h3>
            <p className="text-[10px] leading-relaxed">{r.body}</p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => {
                  claimReport(r.id, selfResponderId);
                  setTimeout(() => verifyReport(r.id), 200);
                }}
                className="flex-1 bg-accent-success text-surface-3 py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)]"
              >
                <CheckCircle className="w-3 h-3 inline mr-1" />
                Verify
              </button>
              <button
                onClick={() => dismissReport(r.id)}
                className="flex-1 bg-surface-0 py-2 text-[9px] uppercase font-bold tracking-widest border border-border-strong"
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

export function FormCase() {
  return (
    <div className="p-5 flex flex-col gap-3">
      <h2 className="text-xl font-serif italic font-black">Form case</h2>
      <Card>Use the polygon tool on the map (ops side), draw an area, then declare. Cases formed in ops show as joinable rooms here.</Card>
    </div>
  );
}

export function AssignmentDetail() {
  const { sosSessions, responders, advanceSos, selfResponderId } = useAppContext();
  const sos = sosSessions.find((s) => s.assignedResponderId === selfResponderId);
  if (!sos) {
    return (
      <div className="p-5 flex flex-col gap-3">
        <h2 className="text-xl font-serif italic font-black">No active assignment</h2>
        <Card>You will receive a dispatch when ops or a citizen requests help nearby.</Card>
      </div>
    );
  }
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
      <div className="flex flex-col gap-2">
        <button
          onClick={() => advanceSos(sos.id, 'arrived')}
          className="w-full bg-accent-success text-surface-3 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong shadow-[3px_3px_0_rgba(26,26,26,1)]"
        >
          <CheckCircle className="w-3 h-3 inline mr-1" />
          Arrived
        </button>
        <button className="w-full bg-surface-0 py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong">
          <Navigation className="w-3 h-3 inline mr-1" />
          Navigate
        </button>
        <button className="w-full bg-accent-warning text-text-primary py-3 text-[10px] uppercase font-bold tracking-widest border border-border-strong">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          Unable / handoff
        </button>
      </div>
    </div>
  );
}

export function MissionBoard() {
  const { events, reports, sosSessions, setSelectedId, setDrawerContent } = useAppContext();
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
    ...reports
      .filter((r) => r.status === 'pending')
      .map((r) => ({
        id: r.id,
        title: 'Report · ' + r.title,
        meta: 'pending verification',
        severity: 2 as const,
        target: 'verify',
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
                meta={`captain ${c.captain} · ${c.members.length} members`}
                severity={c.severity}
                joined={joined}
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

function Row({
  title,
  tag,
  meta,
  severity,
  joined,
  onToggle,
}: {
  title: string;
  tag: string;
  meta: string;
  severity?: 1 | 2 | 3 | 4 | 5;
  joined: boolean;
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
        onClick={onToggle}
        className={`flex items-center gap-1 px-3 py-1.5 text-[9px] uppercase font-bold tracking-widest border border-border-strong shadow-[2px_2px_0_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all ${
          joined ? 'bg-accent-critical text-text-inverse' : 'bg-accent-success text-surface-3'
        }`}
      >
        {joined ? (
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

function ChatRow({ entry, self }: { entry: import('../../../AppContext').ChatEntry; self: string }) {
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

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-surface-2 border border-border-strong p-3 text-sm leading-relaxed shadow-[3px_3px_0_rgba(26,26,26,1)]">
      {children}
    </div>
  );
}
