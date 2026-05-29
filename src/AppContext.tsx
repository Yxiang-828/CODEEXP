// Shared truth store. All coords are real Singapore lng/lat.
// Live data is merged in from data.gov.sg public APIs (no keys).

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { SeverityLevel } from './components/primitives/SeverityChip';
import { fetchLiveSnapshot, type LiveSnapshot } from './services/live';

export type Role = 'citizen' | 'responder' | 'ops';
export type ShellState = 'S0' | 'S2' | 'S4' | 'S6' | 'S9';

export interface LngLat {
  lng: number;
  lat: number;
}

export interface CanonicalEvent {
  id: string;
  kind: 'fire' | 'flood' | 'medical' | 'crash' | 'hazard' | 'weather' | 'other';
  title: string;
  severity: SeverityLevel;
  status: 'provisional' | 'verified' | 'resolved';
  location: LngLat;
  area?: LngLat[];
  source: string;
  createdAt: number;
  caseId?: string;
  liveValue?: string;
}

export interface CitizenReport {
  id: string;
  kind: CanonicalEvent['kind'];
  title: string;
  body: string;
  location: LngLat;
  reporterTrust: number;
  status: 'pending' | 'claimed' | 'verified' | 'dismissed';
  claimedBy?: string;
  createdAt: number;
  promotedToEventId?: string;
}

export interface DistressSession {
  id: string;
  citizenName: string;
  category: 'medical' | 'fire' | 'trapped' | 'threat' | 'hazard' | 'other';
  location: LngLat;
  status:
    | 'requesting'
    | 'ack'
    | 'en_route'
    | 'arrived'
    | 'resolving'
    | 'resolved'
    | 'cancelled';
  assignedResponderId?: string;
  startedAt: number;
}

export interface Responder {
  id: string;
  name: string;
  org: 'SCDF' | 'Volunteer' | 'SPF' | 'Medic';
  role: 'medic' | 'fire' | 'search' | 'aux';
  status: 'ready' | 'en_route' | 'on_scene' | 'out' | 'offline';
  location: LngLat;
  assignedSosId?: string;
  groups: string[]; // group ids
}

export interface CaseRoom {
  id: string;
  name: string;
  severity: SeverityLevel;
  centroid: LngLat;
  members: string[];
  captain: string;
  state: 'forming' | 'staging' | 'active' | 'consolidating' | 'resolved';
  startedAt: number;
}

export interface ChatEntry {
  id: string;
  caseId: string;
  authorId: string;
  kind: 'message' | 'system' | 'host' | 'voice';
  text: string;
  chips?: { label: string; ref: string }[];
  ts: number;
}

export interface SourceHealth {
  id: string;
  name: string;
  state: 'fresh' | 'stale' | 'down';
  lastAgeS: number;
}

export interface Group {
  id: string;
  name: string;
  org: string;
  kind: 'org' | 'capability' | 'geo' | 'community';
  members: string[];
  description: string;
}

export interface TrackingState {
  kind: string;
  title: string;
  eta: string;
  progress?: number;
  tone?: 'critical' | 'warning' | 'neutral';
  drawerId?: string;
}

interface AppState {
  role: Role;
  setRole: (r: Role) => void;
  drawerContent: string | null;
  setDrawerContent: (id: string | null) => void;
  shellState: ShellState;
  setShellState: (s: ShellState) => void;

  events: CanonicalEvent[];
  reports: CitizenReport[];
  sosSessions: DistressSession[];
  responders: Responder[];
  cases: CaseRoom[];
  chat: ChatEntry[];
  sources: SourceHealth[];
  groups: Group[];
  liveSnapshot: LiveSnapshot | null;

  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  activeCaseId: string | null;
  setActiveCaseId: (id: string | null) => void;
  tracking: TrackingState | null;
  setTracking: (t: TrackingState | null) => void;

  briefingInView: number;
  selfResponderId: string | null;

  createResponder: (r: Omit<Responder, 'id' | 'status' | 'location' | 'groups'>) => string;
  fileReport: (r: Omit<CitizenReport, 'id' | 'status' | 'createdAt' | 'reporterTrust'>) => string;
  claimReport: (id: string, by: string) => void;
  verifyReport: (id: string) => void;
  dismissReport: (id: string) => void;

  startSos: (s: Omit<DistressSession, 'id' | 'status' | 'startedAt'>) => string;
  assignSos: (sosId: string, responderId: string) => void;
  advanceSos: (sosId: string, to: DistressSession['status']) => void;
  cancelSos: (sosId: string) => void;

  declareIncident: (e: Omit<CanonicalEvent, 'id' | 'createdAt' | 'status'>) => string;
  toggleDuty: (responderId: string, on: boolean) => void;

  sendChat: (caseId: string, authorId: string, text: string) => void;
  askHost: (caseId: string, query: string) => void;

  joinGroup: (groupId: string, responderId: string) => void;
  leaveGroup: (groupId: string, responderId: string) => void;
  joinCase: (caseId: string, responderId: string) => void;
  leaveCase: (caseId: string, responderId: string) => void;

  setSelfResponderId: (id: string) => void;
  markSafe: () => void;
  simulateEvent: (e: Partial<CanonicalEvent>) => void;
  resetDemo: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const NOW = Date.now();
const T = (mins: number) => NOW - mins * 60_000;

// Minimal seed — just enough so the app doesn't look broken on first load.
// Everything else must come from user actions (reports, SOS, declares).
const seed = {
  groups: [
    {
      id: 'G-SCDF-EAST',
      name: 'SCDF · East District',
      org: 'SCDF',
      kind: 'org',
      members: ['R-BRAVO-9'],
      description: 'Singapore Civil Defence Force, Eastern operational district.',
    },
    {
      id: 'G-MEDIC-VOL',
      name: 'Medic Volunteers',
      org: 'Volunteer',
      kind: 'capability',
      members: ['R-ECHO-1'],
      description: 'Trained first-aid volunteer cadre, island-wide.',
    },
    {
      id: 'G-AED-RESP',
      name: 'AED Responders',
      org: 'Volunteer',
      kind: 'capability',
      members: [],
      description: 'Citizens trained on automated external defibrillators. SCDF myResponder programme.',
    },
    {
      id: 'G-BEDOK',
      name: 'Bedok Cell · gh5 w21z2',
      org: 'Geo',
      kind: 'geo',
      members: [],
      description: 'All responders active in the Bedok geohash cell.',
    },
    {
      id: 'G-FIRE-VOL',
      name: 'Fire Auxiliary',
      org: 'Volunteer',
      kind: 'capability',
      members: ['R-CHARLIE-3'],
      description: 'Auxiliary fire-trained responders for SCDF augmentation.',
    },
    {
      id: 'G-LANG-TA',
      name: 'Tamil-speaking Aux',
      org: 'Community',
      kind: 'community',
      members: [],
      description: 'Translation help during multi-language incidents.',
    },
  ] as Group[],

  events: [
    {
      id: 'EV-1001',
      kind: 'flood',
      title: 'Heavy flooding at Bedok South Rd',
      severity: 3 as SeverityLevel,
      status: 'verified',
      location: { lng: 103.93, lat: 1.32 },
      area: [
        { lng: 103.918, lat: 1.318 },
        { lng: 103.942, lat: 1.318 },
        { lng: 103.942, lat: 1.328 },
        { lng: 103.918, lat: 1.328 },
      ],
      source: 'SCDF + 4 corroborating reports',
      createdAt: T(22),
    },
  ] as CanonicalEvent[],

  reports: [
    {
      id: 'REP-4921',
      kind: 'fire',
      title: 'Smoke from residential block · Toa Payoh',
      body: 'Heavy white smoke from upper floor, Blk 215.',
      location: { lng: 103.85, lat: 1.335 },
      reporterTrust: 0.72,
      status: 'pending',
      createdAt: T(1),
    },
  ] as CitizenReport[],

  sosSessions: [] as DistressSession[],

  // Only SCDF/government responders are hardcoded system assets.
  // Volunteer responders are created by users (ops approves or self-registers).
  responders: [
    {
      id: 'R-BRAVO-9',
      name: 'Bravo-9',
      org: 'SCDF',
      role: 'medic',
      status: 'on_scene',
      location: { lng: 103.792, lat: 1.282 },
      groups: ['G-SCDF-EAST'],
    },
    {
      id: 'R-DELTA-1',
      name: 'Delta-1',
      org: 'SCDF',
      role: 'medic',
      status: 'ready',
      location: { lng: 103.83, lat: 1.305 },
      groups: ['G-SCDF-EAST'],
    },
  ] as Responder[],

  cases: [
    {
      id: 'CASE-ALPHA-09',
      name: 'ALPHA-09',
      severity: 4 as SeverityLevel,
      centroid: { lng: 103.79, lat: 1.28 },
      members: ['R-BRAVO-9'],
      captain: 'R-BRAVO-9',
      state: 'active',
      startedAt: T(60),
    },
  ] as CaseRoom[],

  chat: [
    {
      id: 'CH-1',
      caseId: 'CASE-ALPHA-09',
      authorId: 'system',
      kind: 'system',
      text: 'Case ALPHA-09 formed. Bravo-9 captain.',
      ts: T(60),
    },
    {
      id: 'CH-2',
      caseId: 'CASE-ALPHA-09',
      authorId: 'R-BRAVO-9',
      kind: 'message',
      text: 'On scene. 3 casualties safely extracted. Requesting additional trauma supplies.',
      ts: T(12),
    },
  ] as ChatEntry[],

  sources: [
    { id: 'src-1', name: 'NEA PSI', state: 'fresh', lastAgeS: 35 },
    { id: 'src-2', name: 'NEA rainfall', state: 'fresh', lastAgeS: 22 },
    { id: 'src-3', name: 'NEA 2hr forecast', state: 'fresh', lastAgeS: 90 },
  ] as SourceHealth[],
};

const STORAGE_KEY = 'quickaid-role';
const STORAGE_RESPONDER_KEY = 'quickaid-responder';

function readRole(): Role {
  try { const r = localStorage.getItem(STORAGE_KEY) as Role; if (r === 'citizen' || r === 'responder' || r === 'ops') return r; } catch {}
  return 'citizen';
}
function saveRole(r: Role) { try { localStorage.setItem(STORAGE_KEY, r); } catch {} }

function readSelfResponder(): string | null {
  try { return localStorage.getItem(STORAGE_RESPONDER_KEY); } catch { return null; }
}
function saveSelfResponder(id: string | null) {
  try {
    if (id) localStorage.setItem(STORAGE_RESPONDER_KEY, id);
    else localStorage.removeItem(STORAGE_RESPONDER_KEY);
  } catch {}
}

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRoleRaw] = useState<Role>(readRole());
  const setRole = useCallback((r: Role) => { saveRole(r); setRoleRaw(r); }, []);

  const [drawerContent, setDrawerContentRaw] = useState<string | null>(null);
  const [shellState, setShellState] = useState<ShellState>('S0');

  const [events, setEvents] = useState<CanonicalEvent[]>(seed.events);
  const [reports, setReports] = useState<CitizenReport[]>(seed.reports);
  const [sosSessions, setSosSessions] = useState<DistressSession[]>(seed.sosSessions);
  const [responders, setResponders] = useState<Responder[]>(seed.responders);
  const [cases, setCases] = useState<CaseRoom[]>(seed.cases);
  const [chat, setChat] = useState<ChatEntry[]>(seed.chat);
  const [sources, setSources] = useState<SourceHealth[]>(seed.sources);
  const [groups, setGroups] = useState<Group[]>(seed.groups);
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [tracking, setTracking] = useState<TrackingState | null>(null);
  const [selfResponderId, setSelfResponderId] = useState<string | null>(readSelfResponder());

  const setDrawerContent = useCallback((id: string | null) => {
    setDrawerContentRaw(id);
    setShellState(id ? 'S2' : 'S0');
  }, []);

  // Pull live data on mount + refresh every 60s
  useEffect(() => {
    let alive = true;
    const pull = async () => {
      const snap = await fetchLiveSnapshot();
      if (!alive) return;
      setLiveSnapshot(snap);
      // Update source health timestamps so they look alive
      setSources((prev) =>
        prev.map((s) =>
          s.id === 'src-1' || s.id === 'src-2' || s.id === 'src-3'
            ? { ...s, state: 'fresh', lastAgeS: Math.floor((Date.now() - snap.fetchedAt) / 1000) }
            : s
        )
      );
      // Promote dangerous PSI readings into the event stream
      setEvents((prev) => {
        const next = prev.filter((e) => !e.id.startsWith('LIVE-'));
        for (const p of snap.psi) {
          if (p.psi24h !== null && p.psi24h >= 100) {
            next.push({
              id: 'LIVE-PSI-' + p.region,
              kind: 'weather',
              title: 'Unhealthy PSI · ' + p.region,
              severity: (p.psi24h >= 200 ? 4 : p.psi24h >= 150 ? 3 : 2) as SeverityLevel,
              status: 'verified',
              location: { lng: p.lng, lat: p.lat },
              source: 'NEA PSI live',
              createdAt: snap.fetchedAt,
              liveValue: p.psi24h + ' PSI',
            });
          }
        }
        for (const r of snap.rainfall.filter((r) => r.mm > 1)) {
          next.push({
            id: 'LIVE-RAIN-' + r.stationId,
            kind: 'weather',
            title: 'Active rainfall · ' + r.name,
            severity: (r.mm > 10 ? 3 : r.mm > 4 ? 2 : 1) as SeverityLevel,
            status: 'verified',
            location: { lng: r.lng, lat: r.lat },
            source: 'NEA rainfall live',
            createdAt: snap.fetchedAt,
            liveValue: r.mm.toFixed(1) + ' mm',
          });
        }
        return next;
      });
    };
    pull();
    const t = setInterval(pull, 60_000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const counter = useRef(5000);
  const newId = (p: string) => `${p}-${++counter.current}`;

  const fileReport: AppState['fileReport'] = (r) => {
    const id = newId('REP');
    const rec: CitizenReport = {
      ...r,
      id,
      status: 'pending',
      reporterTrust: 0.6,
      createdAt: Date.now(),
    };
    setReports((prev) => [rec, ...prev]);
    return id;
  };
  const claimReport: AppState['claimReport'] = (id, by) =>
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'claimed', claimedBy: by } : r))
    );
  const verifyReport: AppState['verifyReport'] = (id) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;
    const eventId = newId('EV');
    setEvents((prev) => [
      {
        id: eventId,
        kind: report.kind,
        title: report.title,
        severity: 3 as SeverityLevel,
        status: 'verified',
        location: report.location,
        source: 'ops verification',
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setReports((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'verified', promotedToEventId: eventId } : r))
    );
  };
  const dismissReport: AppState['dismissReport'] = (id) =>
    setReports((prev) => prev.map((r) => (r.id === id ? { ...r, status: 'dismissed' } : r)));

  const startSos: AppState['startSos'] = (s) => {
    const id = newId('SOS');
    setSosSessions((prev) => [
      { ...s, id, status: 'requesting', startedAt: Date.now() },
      ...prev,
    ]);
    setTracking({
      kind: 'SOS LIVE',
      title: 'Help is on the way',
      eta: 'searching',
      progress: 0.1,
      tone: 'critical',
      drawerId: 'sos_live',
    });
    return id;
  };
  const assignSos: AppState['assignSos'] = (sosId, responderId) => {
    setSosSessions((prev) =>
      prev.map((s) =>
        s.id === sosId ? { ...s, status: 'ack', assignedResponderId: responderId } : s
      )
    );
    setResponders((prev) =>
      prev.map((r) =>
        r.id === responderId ? { ...r, status: 'en_route', assignedSosId: sosId } : r
      )
    );
    setTracking({
      kind: 'SOS LIVE',
      title: 'Responder en route · ETA 4 min',
      eta: '4:00',
      progress: 0.35,
      tone: 'critical',
      drawerId: 'sos_live',
    });
  };
  const advanceSos: AppState['advanceSos'] = (sosId, to) => {
    setSosSessions((prev) => prev.map((s) => (s.id === sosId ? { ...s, status: to } : s)));
    const map: Record<string, TrackingState> = {
      en_route: { kind: 'SOS LIVE', title: 'Responder en route', eta: '2:30', progress: 0.55, tone: 'critical', drawerId: 'sos_live' },
      arrived: { kind: 'SOS LIVE', title: 'Responder arrived', eta: 'now', progress: 0.85, tone: 'critical', drawerId: 'sos_live' },
      resolved: { kind: 'SOS LIVE', title: 'Resolved', eta: '—', progress: 1, tone: 'neutral', drawerId: 'sos_live' },
    };
    if (map[to]) setTracking(map[to]);
    if (to === 'resolved') setTimeout(() => setTracking(null), 2500);
  };
  const cancelSos: AppState['cancelSos'] = (sosId) => {
    setSosSessions((prev) => prev.map((s) => (s.id === sosId ? { ...s, status: 'cancelled' } : s)));
    setTracking(null);
  };

  const declareIncident: AppState['declareIncident'] = (e) => {
    const id = newId('EV');
    setEvents((prev) => [{ ...e, id, status: 'verified', createdAt: Date.now() }, ...prev]);
    return id;
  };

  const toggleDuty: AppState['toggleDuty'] = (responderId, on) =>
    setResponders((prev) =>
      prev.map((r) => (r.id === responderId ? { ...r, status: on ? 'ready' : 'out' } : r))
    );

  const sendChat: AppState['sendChat'] = (caseId, authorId, text) => {
    const id = newId('CH');
    setChat((prev) => [
      ...prev,
      { id, caseId, authorId, kind: 'message', text, ts: Date.now() },
    ]);
    if (text.toLowerCase().startsWith('/host')) {
      setTimeout(() => askHost(caseId, text), 400);
    }
  };

  const askHost: AppState['askHost'] = (caseId, query) => {
    const q = query.toLowerCase();
    let text = 'Try /host help for commands.';
    let chips: ChatEntry['chips'] = [];
    if (q.includes('status')) {
      text = 'Case ALPHA-09 · active 1h · 2 responders on scene · no new SOS pings within 200 m.';
      chips = [{ label: 'tool: case_state', ref: 'active' }, { label: 'tool: roster', ref: '2/4' }];
    } else if (q.includes('aed') || q.includes('nearest')) {
      text = 'Nearest AED: Blk 219 Bedok North St 1 · 220 m · load OK.';
      chips = [{ label: 'tool: resource_lookup', ref: 'AED 220m' }, { label: 'tool: route', ref: '4min' }];
    } else if (q.includes('hospital')) {
      text = 'CGH 71% · SGH 84% · KTPH 62%. Recommend KTPH for handoff.';
      chips = [{ label: 'tool: hospital_load', ref: 'live' }];
    } else if (q.includes('weather') || q.includes('psi')) {
      const psi = liveSnapshot?.psi[0];
      text = psi
        ? `PSI national ${psi.psi24h}. Air quality ${(psi.psi24h ?? 0) < 55 ? 'good' : 'unhealthy'}. Source NEA live.`
        : 'NEA live not yet fetched.';
      chips = [{ label: 'tool: nea_psi', ref: psi ? 'live' : 'pending' }];
    } else if (q.includes('escalate')) {
      text = 'Escalation NOT recommended. Casualties stable.';
      chips = [{ label: 'tool: case_state', ref: 'active' }];
    } else if (q.includes('help')) {
      text = 'Available: /host status · /host nearest aed · /host hospital load · /host weather · /host escalate?';
    }
    const id = newId('CH');
    setChat((prev) => [...prev, { id, caseId, authorId: 'host', kind: 'host', text, chips, ts: Date.now() }]);
  };

  const joinGroup: AppState['joinGroup'] = (groupId, responderId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId && !g.members.includes(responderId)
          ? { ...g, members: [...g.members, responderId] }
          : g
      )
    );
    setResponders((prev) =>
      prev.map((r) =>
        r.id === responderId && !r.groups.includes(groupId)
          ? { ...r, groups: [...r.groups, groupId] }
          : r
      )
    );
  };
  const leaveGroup: AppState['leaveGroup'] = (groupId, responderId) => {
    setGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, members: g.members.filter((m) => m !== responderId) } : g
      )
    );
    setResponders((prev) =>
      prev.map((r) =>
        r.id === responderId ? { ...r, groups: r.groups.filter((g) => g !== groupId) } : r
      )
    );
  };

  const joinCase: AppState['joinCase'] = (caseId, responderId) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId && !c.members.includes(responderId)
          ? { ...c, members: [...c.members, responderId] }
          : c
      )
    );
  };
  const leaveCase: AppState['leaveCase'] = (caseId, responderId) => {
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, members: c.members.filter((m) => m !== responderId) } : c
      )
    );
  };

  const setSelfResponderIdAction: AppState['setSelfResponderId'] = (id) => {
    saveSelfResponder(id);
    setSelfResponderId(id);
  };

  const createResponder: AppState['createResponder'] = (r) => {
    const id = newId('R');
    const rec: Responder = {
      ...r,
      id,
      status: 'out',
      location: { lng: 103.85, lat: 1.3 },
      groups: [],
    };
    setResponders((prev) => [...prev, rec]);
    saveSelfResponder(id);
    setSelfResponderId(id);
    return id;
  };

  const markSafe: AppState['markSafe'] = () => {
    setTracking(null);
  };

  const simulateEvent: AppState['simulateEvent'] = (e) => {
    const id = newId('EV');
    setEvents((prev) => [
      {
        id,
        kind: e.kind ?? 'other',
        title: e.title ?? 'Simulated incident',
        severity: (e.severity ?? 2) as SeverityLevel,
        status: 'verified',
        location: e.location ?? { lng: 103.85, lat: 1.35 },
        source: e.source ?? 'demo injection',
        createdAt: Date.now(),
        liveValue: e.liveValue,
      },
      ...prev,
    ]);
  };

  const resetDemo: AppState['resetDemo'] = () => {
    setEvents(seed.events);
    setReports(seed.reports);
    setSosSessions(seed.sosSessions);
    setResponders(seed.responders);
    setCases(seed.cases);
    setChat(seed.chat);
    setSources(seed.sources);
    setGroups(seed.groups);
    setTracking(null);
    setDrawerContent(null);
    setSelectedId(null);
    setActiveCaseId(null);
  };

  // Simulated responder movement + auto-advance SOS on arrival
  useEffect(() => {
    const t = setInterval(() => {
      setResponders((prev) =>
        prev.map((r) => {
          if (r.status !== 'en_route' || !r.assignedSosId) return r;
          const sos = sosSessions.find((s) => s.id === r.assignedSosId);
          if (!sos) return r;
          const dx = sos.location.lng - r.location.lng;
          const dy = sos.location.lat - r.location.lat;
          const dist = Math.hypot(dx, dy);
          if (dist < 0.0008) {
            // Auto-advance SOS to arrived
            setSosSessions((sprev) =>
              sprev.map((s) => (s.id === r.assignedSosId ? { ...s, status: 'arrived' } : s))
            );
            setTracking({
              kind: 'SOS LIVE',
              title: 'Responder arrived',
              eta: 'now',
              progress: 0.85,
              tone: 'critical',
              drawerId: 'sos_live',
            });
            return { ...r, status: 'on_scene', location: sos.location };
          }
          const step = Math.min(0.0015, dist);
          return {
            ...r,
            location: {
              lng: r.location.lng + (dx / dist) * step,
              lat: r.location.lat + (dy / dist) * step,
            },
          };
        })
      );
    }, 600);
    return () => clearInterval(t);
  }, [sosSessions]);

  const briefingInView = useMemo(
    () =>
      events.filter((e) => e.status === 'verified').length +
      reports.filter((r) => r.status === 'pending').length,
    [events, reports]
  );

  const value: AppState = {
    role,
    setRole,
    drawerContent,
    setDrawerContent,
    shellState,
    setShellState,
    events,
    reports,
    sosSessions,
    responders,
    cases,
    chat,
    sources,
    groups,
    liveSnapshot,
    selectedId,
    setSelectedId,
    activeCaseId,
    setActiveCaseId,
    tracking,
    setTracking,
    briefingInView,
    selfResponderId,
    fileReport,
    claimReport,
    verifyReport,
    dismissReport,
    startSos,
    assignSos,
    advanceSos,
    cancelSos,
    declareIncident,
    toggleDuty,
    sendChat,
    askHost,
    joinGroup,
    leaveGroup,
    joinCase,
    leaveCase,
    setSelfResponderId: setSelfResponderIdAction,
    createResponder,
    markSafe,
    simulateEvent,
    resetDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
