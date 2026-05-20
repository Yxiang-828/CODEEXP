import { useAppContext } from '../../AppContext';
import type React from 'react';
import {
  ClipboardList,
  Users,
  ShieldAlert,
  Radio,
  Map,
  Hash,
  Plus,
  Activity,
  Crown,
  UsersRound,
  ClipboardCheck,
} from 'lucide-react';

export default function LeftRail() {
  const {
    role,
    setDrawerContent,
    setActiveCaseId,
    cases,
    reports,
    sosSessions,
    groups,
    responders,
    selfResponderId,
  } = useAppContext();
  if (role === 'citizen') return null;

  const self = responders.find((r) => r.id === selfResponderId);

  const responderQueues = [
    { icon: Map, label: 'Bulletin', count: 5, action: () => setDrawerContent('mission_board') },
    { icon: ClipboardList, label: 'Assignments', count: 1, action: () => setDrawerContent('assignment_detail') },
    { icon: Radio, label: 'Joinable', action: () => setDrawerContent('joinable_missions') },
    {
      icon: ShieldAlert,
      label: 'Verify',
      count: reports.filter((r) => r.status === 'pending').length,
      action: () => setDrawerContent('verify'),
    },
    { icon: UsersRound, label: 'Groups', count: self?.groups.length ?? 0, action: () => setDrawerContent('groups') },
    { icon: Plus, label: 'Events', action: () => setDrawerContent('volunteer_events') },
  ];

  const opsQueues = [
    {
      icon: ShieldAlert,
      label: 'Reports',
      count: reports.filter((r) => r.status === 'pending' || r.status === 'claimed').length,
      action: () => setDrawerContent('report_queue'),
    },
    { icon: Map, label: 'Zones', action: () => setDrawerContent('zones') },
    {
      icon: Radio,
      label: 'Distress',
      count: sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status)).length,
      action: () => setDrawerContent('distress_oversight'),
    },
    { icon: ClipboardList, label: 'Cases', count: cases.length, action: () => setDrawerContent('case_oversight') },
    { icon: Users, label: 'Roster', action: () => setDrawerContent('responder_oversight') },
    { icon: ClipboardCheck, label: 'Truth', action: () => setDrawerContent('readiness') },
  ];

  const queues = role === 'responder' ? responderQueues : opsQueues;
  const joinedCases = role === 'responder' ? cases.filter((c) => c.members.includes(selfResponderId)) : cases;

  return (
    <aside className="w-[72px] xl:w-[260px] bg-surface-0 z-10 flex flex-col border-r-2 border-border-strong overflow-y-auto">
      <div className="p-3 border-b border-border-strong">
        <div className="hidden xl:flex items-center gap-2">
          <span className="w-2 h-2 bg-accent-critical border border-border-strong"></span>
          <h2 className="text-[10px] font-black uppercase tracking-widest">
            {role === 'responder' ? 'Responder' : 'Ops'}
          </h2>
        </div>
        <div className="xl:hidden flex justify-center">
          <Activity className="w-4 h-4" />
        </div>
      </div>

      <nav className="flex flex-col gap-1.5 p-2">
        {queues.map((q) => (
          <button
            key={q.label}
            onClick={q.action}
            className="flex items-center gap-2 p-2 border border-border-strong hover:bg-surface-3 hover:text-text-inverse text-text-primary bg-surface-0 shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer group"
            title={q.label}
          >
            <q.icon className="w-4 h-4 flex-shrink-0" />
            <span className="hidden xl:block font-bold uppercase tracking-widest text-[9px] flex-1 text-left">
              {q.label}
            </span>
            {'count' in q && q.count !== undefined && q.count > 0 && (
              <span className="hidden xl:flex items-center justify-center bg-surface-3 group-hover:bg-surface-0 text-text-inverse group-hover:text-text-primary text-[9px] font-mono font-bold px-1.5 min-w-[20px] h-[18px] border border-border-strong">
                {q.count.toString().padStart(2, '0')}
              </span>
            )}
          </button>
        ))}
      </nav>

      {role === 'responder' && (
        <>
          <div className="px-3 py-1.5 border-t border-b border-border-strong bg-surface-2">
            <div className="hidden xl:flex items-center justify-between">
              <h3 className="text-[9px] font-black uppercase tracking-widest text-text-secondary">
                Rooms ({joinedCases.length})
              </h3>
              <Hash className="w-3 h-3 opacity-60" />
            </div>
            <div className="xl:hidden flex justify-center">
              <Hash className="w-3 h-3" />
            </div>
          </div>
          <div className="flex flex-col gap-1 p-2">
            <RoomRow label="General" count={0} onClick={() => setDrawerContent('mission_board')} />
            {self?.groups.map((gid) => {
              const g = groups.find((x) => x.id === gid);
              if (!g) return null;
              return <RoomRow key={g.id} label={g.name} count={0} onClick={() => setDrawerContent('groups')} />;
            })}
            {joinedCases.map((c) => (
              <RoomRow
                key={c.id}
                label={'#' + c.name}
                count={3}
                active
                isCase
                onClick={() => {
                  setActiveCaseId(c.id);
                  setDrawerContent('case_lobby');
                }}
              />
            ))}
            <button
              onClick={() => setDrawerContent('form_case')}
              className="flex items-center gap-2 p-1.5 border border-dashed border-border-strong text-text-secondary hover:text-text-primary hover:bg-surface-2 mt-1 text-[9px] font-bold uppercase tracking-widest"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden xl:inline">Form case</span>
            </button>
            <button
              onClick={() => setDrawerContent('groups')}
              className="flex items-center gap-2 p-1.5 border border-dashed border-border-strong text-text-secondary hover:text-text-primary hover:bg-surface-2 text-[9px] font-bold uppercase tracking-widest"
            >
              <UsersRound className="w-3 h-3" />
              <span className="hidden xl:inline">Join group</span>
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

function RoomRow({
  label,
  count,
  active = false,
  isCase = false,
  onClick,
}: {
  key?: React.Key;
  label: string;
  count: number;
  active?: boolean;
  isCase?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 p-1.5 text-[9px] font-bold uppercase tracking-widest border border-border-strong cursor-pointer transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none shadow-[2px_2px_0px_rgba(26,26,26,1)] ${
        active ? 'bg-surface-3 text-text-inverse' : 'bg-surface-0 text-text-primary hover:bg-surface-2'
      }`}
      title={label}
    >
      {isCase ? <Crown className="w-3 h-3 flex-shrink-0" /> : <Hash className="w-3 h-3 flex-shrink-0 opacity-60" />}
      <span className="hidden xl:inline flex-1 text-left truncate">{label}</span>
      {count > 0 && (
        <span className="hidden xl:inline-flex w-4 h-4 items-center justify-center bg-accent-critical text-text-inverse text-[8px] font-mono font-bold border border-border-strong">
          {count}
        </span>
      )}
    </button>
  );
}
