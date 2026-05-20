// CSOT provider. Domain types, seed data, and selectors live under ./state/*.
// See ./state/relations.ts for the cluster relation tree (intake → incidents →
// operations, with network/intel/presentation orbiting).
//
// This file holds only the React provider, action reducers, and side effects
// (NEA polling, WS bridge, responder movement, reverse geocode).

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
import { fetchLiveSnapshot, type LiveSnapshot } from './services/live';
import { askHostAi } from './services/hostAi';
import { api, connectWs } from './services/backendClient';
import { getDistanceKm, etaMinutes } from './utils/geo';
import { reverseGeocode } from './services/revgeocode';
import {
  seedActionLogs,
  seedCases,
  seedChat,
  seedEvents,
  seedGroups,
  seedNotifications,
  seedReports,
  seedResponders,
  seedSos,
  seedSources,
  seedUsers,
  seedVolunteerEvents,
  seedZones,
  SELF_ID,
} from './state/seed';
import { etaFromDistanceKm, selectBriefingCounts } from './state/selectors';
import type {
  ActionLog,
  AppUser,
  CanonicalEvent,
  CaseRoom,
  ChatEntry,
  CitizenReport,
  DistressSession,
  EmergencyZone,
  Group,
  LngLat,
  NotificationNotice,
  Responder,
  Role,
  SelectedMapItem,
  SeverityLevel,
  ShellState,
  SourceHealth,
  TrackingState,
  VolunteerEvent,
} from './state/types';

export type {
  ActionLog,
  AppUser,
  CanonicalEvent,
  CaseRoom,
  ChatEntry,
  CitizenReport,
  DistressSession,
  EmergencyZone,
  Group,
  LngLat,
  NotificationNotice,
  NotificationTier,
  Responder,
  Role,
  SelectedMapItem,
  SeverityLevel,
  ShellState,
  SourceHealth,
  TrackingState,
  VolunteerEvent,
} from './state/types';

interface AppState {
  isAuthenticated: boolean;
  role: Role;
  setRole: (r: Role) => void;
  demoLogin: (r: Role) => void;
  demoLogout: () => void;
  drawerContent: string | null;
  setDrawerContent: (id: string | null) => void;
  shellState: ShellState;
  setShellState: (s: ShellState) => void;

  events: CanonicalEvent[];
  reports: CitizenReport[];
  sosSessions: DistressSession[];
  responders: Responder[];
  users: AppUser[];
  zones: EmergencyZone[];
  volunteerEvents: VolunteerEvent[];
  cases: CaseRoom[];
  chat: ChatEntry[];
  sources: SourceHealth[];
  groups: Group[];
  liveSnapshot: LiveSnapshot | null;
  notifications: NotificationNotice[];
  actionLogs: ActionLog[];

  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  activeCaseId: string | null;
  setActiveCaseId: (id: string | null) => void;
  tracking: TrackingState | null;
  setTracking: (t: TrackingState | null) => void;
  selectedMapItem: SelectedMapItem | null;
  setSelectedMapItem: (item: SelectedMapItem | null) => void;

  briefingInView: number;
  selfResponderId: string;

  pushNotification: (entry: Omit<NotificationNotice, 'id' | 'createdAt' | 'ackBy'>) => void;
  fileReport: (r: Omit<CitizenReport, 'id' | 'status' | 'createdAt' | 'reporterTrust'>) => string;
  claimReport: (id: string, by: string) => void;
  verifyReport: (id: string) => void;
  dismissReport: (id: string) => void;

  startSos: (s: Omit<DistressSession, 'id' | 'status' | 'startedAt'>) => string;
  assignSos: (sosId: string, responderId: string) => void;
  advanceSos: (sosId: string, to: DistressSession['status']) => void;
  confirmSosSafe: (sosId: string, by: 'citizen' | 'responder') => void;
  cancelSos: (sosId: string) => void;
  messageCitizen: (targetId: string, responderId: string, text: string) => void;

  declareIncident: (e: Omit<CanonicalEvent, 'id' | 'createdAt' | 'status'>) => string;
  resolveEvent: (eventId: string) => void;
  declareZone: (z: Omit<EmergencyZone, 'id' | 'createdAt' | 'status'>) => string;
  updateZoneStatus: (zoneId: string, status: EmergencyZone['status']) => void;
  assignIncident: (eventId: string, responderId: string) => void;
  toggleDuty: (responderId: string, on: boolean) => void;
  updateResponderStatus: (responderId: string, status: Responder['status']) => void;
  updateSelfProfile: (patch: Partial<AppUser>) => void;
  updateUserProfile: (userId: string, patch: Partial<AppUser>) => void;
  createVolunteerEvent: (e: Omit<VolunteerEvent, 'id' | 'createdAt' | 'registeredResponderIds' | 'status'>) => string;
  joinVolunteerEvent: (eventId: string, responderId: string) => void;
  unregisterVolunteerEvent: (eventId: string, responderId: string) => void;

  sendChat: (caseId: string, authorId: string, text: string) => void;
  askHost: (caseId: string, query: string) => void;

  joinGroup: (groupId: string, responderId: string) => void;
  leaveGroup: (groupId: string, responderId: string) => void;
  joinCase: (caseId: string, responderId: string) => void;
  leaveCase: (caseId: string, responderId: string) => void;
  requestCaseFormation: (eventId: string, responderId: string) => void;
  closeCase: (caseId: string, finalReport: string) => void;
  ackNotification: (notificationId: string, actorId: string) => void;

  selfLocation: LngLat | null;
  setSelfLocation: (loc: LngLat | null) => void;
  selfPlaceName: string | null;
  liveTracking: boolean;
  setLiveTracking: (on: boolean) => void;
  updateResponderLocation: (responderId: string, loc: LngLat) => void;
  draftPolygon: LngLat[];
  setDraftPolygon: (pts: LngLat[]) => void;

  // God Mode hooks — demo-only mutators. Real flows must go through the
  // role-appropriate actions above; these exist to drive demos without
  // re-creating the full user journey each time.
  godSetSourceState: (sourceId: string, state: SourceHealth['state']) => void;
  godSeedScenario: (kind: 'minor' | 'major') => void;
  godResetCsot: () => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>('citizen');
  const [drawerContent, setDrawerContentRaw] = useState<string | null>(null);
  const [shellState, setShellState] = useState<ShellState>('S0');

  const [backendOnline, setBackendOnline] = useState(false);
  const [events, setEvents] = useState<CanonicalEvent[]>(seedEvents);
  const [reports, setReports] = useState<CitizenReport[]>(seedReports);
  const [sosSessions, setSosSessions] = useState<DistressSession[]>(seedSos);
  const [responders, setResponders] = useState<Responder[]>(seedResponders);
  const [users, setUsers] = useState<AppUser[]>(seedUsers);
  const [zones, setZones] = useState<EmergencyZone[]>(seedZones);
  const [volunteerEvents, setVolunteerEvents] = useState<VolunteerEvent[]>(seedVolunteerEvents);
  const [cases, setCases] = useState<CaseRoom[]>(seedCases);
  const [chat, setChat] = useState<ChatEntry[]>(seedChat);
  const [sources, setSources] = useState<SourceHealth[]>(seedSources);
  const [groups, setGroups] = useState<Group[]>(seedGroups);
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot | null>(null);
  const [notifications, setNotifications] = useState<NotificationNotice[]>(seedNotifications);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>(seedActionLogs);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [tracking, setTracking] = useState<TrackingState | null>(null);
  const [selfLocation, setSelfLocation] = useState<LngLat | null>(null);
  const [selfPlaceName, setSelfPlaceName] = useState<string | null>(null);
  const lastGeocodeKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (!selfLocation) {
      setSelfPlaceName(null);
      lastGeocodeKeyRef.current = null;
      return;
    }
    // Round to 3 decimals (~110m grid) so we don't spam revgeocode on tiny GPS jitter
    const key = `${selfLocation.lat.toFixed(3)},${selfLocation.lng.toFixed(3)}`;
    if (key === lastGeocodeKeyRef.current) return;
    lastGeocodeKeyRef.current = key;
    let cancelled = false;
    const handle = setTimeout(() => {
      reverseGeocode(selfLocation).then((res) => {
        if (cancelled) return;
        if (res.state === 'live' && res.placeName) setSelfPlaceName(res.placeName);
        else setSelfPlaceName(null);
      });
    }, 600);
    return () => { cancelled = true; clearTimeout(handle); };
  }, [selfLocation]);
  const [liveTracking, setLiveTracking] = useState(false);
  const [draftPolygon, setDraftPolygon] = useState<LngLat[]>([]);
  const [selectedMapItem, setSelectedMapItem] = useState<SelectedMapItem | null>(null);
  const autoTrackingKey = useRef<string | null>(null);

  useEffect(() => {
    const disconnect = connectWs((type, payload) => {
      if (type === 'state:full') {
        const s = payload as { responders: Responder[]; events: CanonicalEvent[]; sosSessions: DistressSession[]; reports: CitizenReport[]; cases: CaseRoom[]; chat: ChatEntry[] };
        if (s.responders?.length) setResponders(s.responders as Responder[]);
        if (s.events?.length) setEvents(s.events as CanonicalEvent[]);
        if (s.sosSessions?.length) setSosSessions(s.sosSessions as DistressSession[]);
        if (s.reports?.length) setReports(s.reports as CitizenReport[]);
        if (s.cases?.length) setCases(s.cases as CaseRoom[]);
        if (s.chat?.length) setChat(s.chat as ChatEntry[]);
        setBackendOnline(true);
      } else if (type === 'responder:updated') {
        setResponders((prev) => prev.map((r) => (r.id === (payload as Responder).id ? (payload as Responder) : r)));
      } else if (type === 'event:created') {
        setEvents((prev) => [payload as CanonicalEvent, ...prev.filter((e) => e.id !== (payload as CanonicalEvent).id)]);
      } else if (type === 'event:updated') {
        setEvents((prev) => prev.map((e) => (e.id === (payload as CanonicalEvent).id ? (payload as CanonicalEvent) : e)));
      } else if (type === 'sos:created') {
        setSosSessions((prev) => [payload as DistressSession, ...prev.filter((s) => s.id !== (payload as DistressSession).id)]);
      } else if (type === 'sos:updated') {
        setSosSessions((prev) => prev.map((s) => (s.id === (payload as DistressSession).id ? (payload as DistressSession) : s)));
      } else if (type === 'report:created') {
        setReports((prev) => [payload as CitizenReport, ...prev.filter((r) => r.id !== (payload as CitizenReport).id)]);
      } else if (type === 'report:updated') {
        setReports((prev) => prev.map((r) => (r.id === (payload as CitizenReport).id ? (payload as CitizenReport) : r)));
      } else if (type === 'case:created') {
        setCases((prev) => [payload as CaseRoom, ...prev.filter((c) => c.id !== (payload as CaseRoom).id)]);
      } else if (type === 'case:updated') {
        setCases((prev) => prev.map((c) => (c.id === (payload as CaseRoom).id ? (payload as CaseRoom) : c)));
      } else if (type === 'chat:message') {
        setChat((prev) => [...prev, payload as ChatEntry]);
      }
    });
    return disconnect;
  }, []);

  const setDrawerContent = useCallback((id: string | null) => {
    setDrawerContentRaw(id);
    setShellState(id ? 'S2' : 'S0');
  }, []);

  const demoLogin: AppState['demoLogin'] = (nextRole) => {
    setRole(nextRole);
    setIsAuthenticated(true);
    setDrawerContentRaw(null);
    setShellState('S0');
  };

  const demoLogout: AppState['demoLogout'] = () => {
    setIsAuthenticated(false);
    setDrawerContentRaw(null);
    setShellState('S0');
    setTracking(null);
  };

  useEffect(() => {
    const activeCitizenSos = role === 'citizen'
      ? sosSessions.find((s) => !['resolved', 'cancelled'].includes(s.status))
      : null;
    const activeResponderSos = role === 'responder'
      ? sosSessions.find((s) => s.assignedResponderId === SELF_ID && !['resolved', 'cancelled'].includes(s.status))
      : null;
    const activeResponderCase = role === 'responder'
      ? cases.find((c) => c.members.includes(SELF_ID) && c.state !== 'resolved')
      : null;
    const nextKey =
      activeCitizenSos ? `citizen:${activeCitizenSos.id}` :
      activeResponderSos ? `responder:sos:${activeResponderSos.id}` :
      activeResponderCase ? `responder:case:${activeResponderCase.id}` :
      null;

    if (nextKey && autoTrackingKey.current !== nextKey) {
      autoTrackingKey.current = nextKey;
      setLiveTracking(true);
    }
    if (!nextKey) {
      autoTrackingKey.current = null;
    }
  }, [role, sosSessions, cases]);

  useEffect(() => {
    let alive = true;
    const pull = async () => {
      const snap = await fetchLiveSnapshot();
      if (!alive) return;
      setLiveSnapshot(snap);
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

  const pushLog = useCallback(
    (entry: Omit<ActionLog, 'id' | 'createdAt'>) => {
      setActionLogs((prev) => [
        {
          ...entry,
          id: newId('LOG'),
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    },
    []
  );

  const pushNotification = useCallback(
    (entry: Omit<NotificationNotice, 'id' | 'createdAt' | 'ackBy'>) => {
      setNotifications((prev) => [
        {
          ...entry,
          id: newId('NT'),
          createdAt: Date.now(),
          ackBy: [],
        },
        ...prev,
      ]);
    },
    []
  );

  const ackNotification: AppState['ackNotification'] = (notificationId, actorId) =>
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId && !n.ackBy.includes(actorId)
          ? { ...n, ackBy: [...n.ackBy, actorId] }
          : n
      )
    );

  const fileReport: AppState['fileReport'] = (r) => {
    const id = newId('REP');
    api.createReport({ kind: r.kind, title: r.title, body: r.body, location: r.location }).catch(() => {});
    const rec: CitizenReport = {
      ...r,
      id,
      status: 'pending',
      reporterTrust: 0.6,
      createdAt: Date.now(),
      auditTrail: ['Citizen filed report. Routed to ops queue only.'],
    };
    setReports((prev) => [rec, ...prev]);
    pushLog({
      actorId: 'U-CIV-1',
      actorRole: 'citizen',
      action: 'report.filed',
      targetId: id,
      message: `${rec.title} filed by citizen. Awaiting ops claim/verify/dismiss.`,
      severity: rec.kind === 'fire' ? 4 : 2,
      visibleTo: ['ops'],
    });
    pushNotification({
      tier: rec.kind === 'fire' ? 'urgent' : 'watch',
      roles: ['ops'],
      title: `New citizen report: ${rec.kind}`,
      body: `${rec.title}. Responders will only see it after ops verification unless it is SOS.`,
      targetId: id,
    });
    return id;
  };
  const claimReport: AppState['claimReport'] = (id, by) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'claimed',
              claimedBy: by,
              auditTrail: [...(r.auditTrail ?? []), `Claimed by ${by}.`],
            }
          : r
      )
    );
    pushLog({
      actorId: by,
      actorRole: 'ops',
      action: 'report.claimed',
      targetId: id,
      message: `${id} claimed for ops review.`,
      visibleTo: ['ops'],
    });
  };
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
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'verified',
              promotedToEventId: eventId,
              notifiedReporter: true,
              auditTrail: [
                ...(r.auditTrail ?? []),
                'Ops verified report.',
                `Canonical event ${eventId} published to responders and citizens.`,
                'Reporter acknowledgement notification queued.',
              ],
            }
          : r
      )
    );
    pushLog({
      actorId: 'ops',
      actorRole: 'ops',
      action: 'report.verified',
      targetId: id,
      message: `${report.title} verified. Event ${eventId} is now visible to responders/citizens.`,
      severity: 3,
      visibleTo: ['ops', 'responder'],
    });
    pushNotification({
      tier: 'info',
      roles: ['citizen'],
      title: 'Report verified',
      body: `${report.title} has been verified by ops. Nearby users and responders can now see it.`,
      targetId: eventId,
    });
    pushNotification({
      tier: report.kind === 'fire' ? 'urgent' : 'watch',
      roles: ['responder'],
      title: `Verified incident: ${report.kind}`,
      body: `${report.title}. Join only if fit and not interfering with official units.`,
      targetId: eventId,
    });
  };
  const dismissReport: AppState['dismissReport'] = (id) => {
    const report = reports.find((r) => r.id === id);
    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'dismissed',
              notifiedReporter: true,
              auditTrail: [...(r.auditTrail ?? []), 'Ops dismissed report and notified reporter.'],
            }
          : r
      )
    );
    pushLog({
      actorId: 'ops',
      actorRole: 'ops',
      action: 'report.dismissed',
      targetId: id,
      message: `${report?.title ?? id} dismissed by ops. Reporter notification queued.`,
      visibleTo: ['ops'],
    });
    pushNotification({
      tier: 'info',
      roles: ['citizen'],
      title: 'Report reviewed',
      body: `${report?.title ?? 'Your report'} was reviewed by ops and not published as an incident.`,
      targetId: id,
    });
  };

  const startSos: AppState['startSos'] = (s) => {
    const id = newId('SOS');
    api.createSos({ citizenName: s.citizenName, category: s.category, location: s.location }).catch(() => {});
    setSosSessions((prev) => [
      { ...s, id, status: 'requesting', startedAt: Date.now() },
      ...prev,
    ]);
    pushLog({
      actorId: 'U-CIV-1',
      actorRole: 'citizen',
      action: 'sos.created',
      targetId: id,
      message: `${s.category} SOS created. Routed to ops and responder pool because SOS is highest priority.`,
      severity: 4,
      visibleTo: ['ops', 'responder', 'citizen'],
    });
    pushNotification({
      tier: 'critical',
      roles: ['ops', 'responder'],
      title: `SOS ${s.category}`,
      body: 'Citizen SOS is open. Responders should check fit score before accepting.',
      targetId: id,
    });
    pushNotification({
      tier: 'critical',
      roles: ['citizen'],
      title: 'SOS sent',
      body: 'Ops and suitable responders have been notified. Keep this screen open for status updates.',
      targetId: id,
    });
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
    api.patchSos(sosId, { status: 'acknowledged', assignedResponderId: responderId }).catch(() => {});
    api.patchResponder(responderId, { status: 'en_route', assignedSosId: sosId }).catch(() => {});
    const responder = responders.find((r) => r.id === responderId);
    const sos = sosSessions.find((s) => s.id === sosId);
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
    pushLog({
      actorId: responderId,
      actorRole: responder?.unitType === 'professional' ? 'ops' : 'responder',
      action: 'sos.accepted',
      targetId: sosId,
      message: `${responder?.name ?? responderId} accepted/responding to ${sos?.category ?? 'SOS'}.`,
      severity: 4,
      visibleTo: ['ops', 'responder', 'citizen'],
    });
    pushNotification({
      tier: 'critical',
      roles: ['citizen', 'ops'],
      title: 'Responder assigned',
      body: `${responder?.name ?? responderId} is en route. Arrival and resolution require acknowledgements.`,
      targetId: sosId,
    });
    const distKm = responder && sos ? getDistanceKm(responder.location, sos.location) : null;
    setTracking({
      kind: 'SOS LIVE',
      title: distKm !== null
        ? `Responder en route · ETA ${etaFromDistanceKm(distKm)}`
        : 'Responder en route',
      eta: distKm !== null ? etaFromDistanceKm(distKm) : 'computing',
      progress: 0.35,
      tone: 'critical',
      drawerId: 'sos_live',
    });
    setLiveTracking(true);
  };
  const advanceSos: AppState['advanceSos'] = (sosId, to) => {
    const sos = sosSessions.find((s) => s.id === sosId);
    api.patchSos(sosId, { status: to }).catch(() => {});
    setSosSessions((prev) => prev.map((s) => (s.id === sosId ? { ...s, status: to } : s)));
    if (sos?.assignedResponderId) {
      setResponders((prev) =>
        prev.map((r) => {
          if (r.id !== sos.assignedResponderId) return r;
          if (to === 'arrived' || to === 'resolving') return { ...r, status: 'on_scene' };
          if (to === 'resolved' || to === 'cancelled') return { ...r, status: 'ready', assignedSosId: undefined };
          if (to === 'en_route' || to === 'ack') return { ...r, status: 'en_route' };
          return r;
        })
      );
    }
    const responder = sos?.assignedResponderId
      ? responders.find((r) => r.id === sos.assignedResponderId)
      : null;
    const distKm = responder && sos ? getDistanceKm(responder.location, sos.location) : null;
    const liveEta = distKm !== null ? etaFromDistanceKm(distKm) : 'computing';
    const map: Record<string, TrackingState> = {
      en_route: {
        kind: 'SOS LIVE',
        title: `Responder en route · ETA ${liveEta}`,
        eta: liveEta,
        progress: 0.55,
        tone: 'critical',
        drawerId: 'sos_live',
      },
      arrived: { kind: 'SOS LIVE', title: 'Responder arrived', eta: 'now', progress: 0.85, tone: 'critical', drawerId: 'sos_live' },
      resolving: { kind: 'SOS LIVE', title: 'Confirming resolution', eta: 'ack needed', progress: 0.92, tone: 'warning', drawerId: 'sos_live' },
      resolved: { kind: 'SOS LIVE', title: 'Resolved', eta: '—', progress: 1, tone: 'neutral', drawerId: 'sos_live' },
    };
    if (map[to]) setTracking(map[to]);
    if (to === 'resolved') setTimeout(() => setTracking(null), 2500);
    pushLog({
      actorId: sos?.assignedResponderId ?? 'system',
      actorRole: sos?.assignedResponderId ? 'responder' : 'system',
      action: `sos.${to}`,
      targetId: sosId,
      message: `${sosId} moved to ${to}.`,
      severity: to === 'resolved' ? 2 : 4,
      visibleTo: ['ops', 'responder', 'citizen'],
    });
  };
  const confirmSosSafe: AppState['confirmSosSafe'] = (sosId, by) => {
    const sos = sosSessions.find((s) => s.id === sosId);
    if (!sos) return;
    const nextCitizen = by === 'citizen' ? true : !!sos.citizenConfirmedSafe;
    const nextResponder = by === 'responder' ? true : !!sos.responderConfirmedSafe;
    const resolved = nextCitizen && nextResponder;
    setSosSessions((prev) =>
      prev.map((s) =>
        s.id === sosId
          ? {
              ...s,
              status: resolved ? 'resolved' : 'resolving',
              citizenConfirmedSafe: nextCitizen,
              responderConfirmedSafe: nextResponder,
              finalReport: resolved
                ? 'Citizen and responder both acknowledged completion. Ops can audit in logs.'
                : s.finalReport,
            }
          : s
      )
    );
    if (resolved && sos.assignedResponderId) {
      setResponders((prev) =>
        prev.map((r) =>
          r.id === sos.assignedResponderId ? { ...r, status: 'ready', assignedSosId: undefined } : r
        )
      );
      setTracking({ kind: 'SOS LIVE', title: 'Resolved', eta: '2 ack', progress: 1, tone: 'neutral', drawerId: 'sos_live' });
      setTimeout(() => setTracking(null), 2500);
    } else {
      setTracking({
        kind: 'SOS LIVE',
        title: by === 'citizen' ? 'Citizen safe ack received' : 'Responder completion ack received',
        eta: 'second ack needed',
        progress: 0.94,
        tone: 'warning',
        drawerId: 'sos_live',
      });
    }
    pushLog({
      actorId: by === 'citizen' ? 'U-CIV-1' : sos.assignedResponderId ?? SELF_ID,
      actorRole: by,
      action: 'sos.completion_ack',
      targetId: sosId,
      message: `${by} acknowledged SOS completion. ${resolved ? 'SOS resolved.' : 'Waiting for second acknowledgement.'}`,
      severity: resolved ? 2 : 4,
      visibleTo: ['ops', 'responder', 'citizen'],
    });
    pushNotification({
      tier: resolved ? 'info' : 'urgent',
      roles: ['ops', by === 'citizen' ? 'responder' : 'citizen'],
      title: resolved ? 'SOS resolved' : 'SOS completion needs second ack',
      body: `${sosId}: ${by} acknowledged completion.`,
      targetId: sosId,
    });
  };

  const messageCitizen: AppState['messageCitizen'] = (targetId, responderId, text) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const responder = responders.find((r) => r.id === responderId);
    const sos = sosSessions.find((s) => s.id === targetId);
    const caseRoom = cases.find((c) => c.id === targetId);
    const targetLabel = sos
      ? `${sos.id} (${sos.category})`
      : caseRoom
      ? `case ${caseRoom.name}`
      : targetId;
    pushLog({
      actorId: responderId,
      actorRole: 'responder',
      action: 'citizen.message_sent',
      targetId,
      message: `${responder?.name ?? responderId} messaged the citizen/reporter for ${targetLabel}: ${trimmed}`,
      severity: sos ? 4 : caseRoom?.severity,
      visibleTo: ['ops', 'responder', 'citizen'],
    });
    pushNotification({
      tier: sos || (caseRoom?.severity ?? 0) >= 4 ? 'urgent' : 'info',
      roles: ['citizen'],
      title: sos ? 'Responder message for your SOS' : 'Responder update for your report',
      body: trimmed,
      targetId,
    });
  };
  const cancelSos: AppState['cancelSos'] = (sosId) => {
    setSosSessions((prev) => prev.map((s) => (s.id === sosId ? { ...s, status: 'cancelled' } : s)));
    pushLog({
      actorId: 'U-CIV-1',
      actorRole: 'citizen',
      action: 'sos.cancelled',
      targetId: sosId,
      message: `${sosId} cancelled by citizen before completion.`,
      visibleTo: ['ops', 'responder', 'citizen'],
    });
    setTracking(null);
  };

  const declareIncident: AppState['declareIncident'] = (e) => {
    const id = newId('EV');
    api.createEvent({ kind: e.kind, title: e.title, severity: e.severity, location: e.location, area: e.area, source: e.source }).catch(() => {});
    setEvents((prev) => [{ ...e, id, status: 'verified', createdAt: Date.now() }, ...prev]);
    pushLog({
      actorId: 'ops',
      actorRole: 'ops',
      action: 'incident.declared',
      targetId: id,
      message: `${e.title} declared by ops and published to role feeds.`,
      severity: e.severity,
      visibleTo: ['ops', 'responder'],
    });
    pushNotification({
      tier: e.severity >= 4 ? 'urgent' : 'watch',
      roles: ['citizen', 'responder', 'ops'],
      title: `Incident declared: ${e.kind}`,
      body: e.title,
      targetId: id,
    });
    return id;
  };

  const declareZone: AppState['declareZone'] = (z) => {
    const id = newId('ZONE');
    const zone: EmergencyZone = { ...z, id, status: 'declared', createdAt: Date.now() };
    setZones((prev) => [zone, ...prev]);
    setEvents((prev) => [
      {
        id: newId('EV'),
        kind: z.kind === 'accident' ? 'crash' : z.kind === 'health' ? 'medical' : z.kind,
        title: z.title,
        severity: z.severity,
        status: 'verified',
        location: z.center,
        area: z.area,
        source: 'ops zone declaration',
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    pushLog({
      actorId: z.declaredBy,
      actorRole: 'ops',
      action: 'zone.declared',
      targetId: id,
      message: `${z.title} declared with ${z.area.length} polygon points.`,
      severity: z.severity,
      visibleTo: ['ops', 'responder'],
    });
    return id;
  };

  const updateZoneStatus: AppState['updateZoneStatus'] = (zoneId, status) => {
    setZones((prev) => prev.map((z) => (z.id === zoneId ? { ...z, status } : z)));
    pushLog({
      actorId: 'ops',
      actorRole: 'ops',
      action: `zone.${status}`,
      targetId: zoneId,
      message: `${zoneId} set to ${status}.`,
      visibleTo: ['ops', 'responder'],
    });
  };

  const assignIncident: AppState['assignIncident'] = (eventId, responderId) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;
    const responder = responders.find((r) => r.id === responderId);
    const caseId = event.caseId ?? newId('CASE');
    if (!event.caseId) {
      setCases((prev) => [
        {
          id: caseId,
          name: caseId.replace('CASE-', ''),
          severity: event.severity,
          centroid: event.location,
          members: [responderId],
          captain: responderId,
          state: 'forming',
          startedAt: Date.now(),
          source: 'ops',
        },
        ...prev,
      ]);
      setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, caseId } : e)));
    } else {
      setCases((prev) =>
        prev.map((c) =>
          c.id === caseId && !c.members.includes(responderId)
            ? { ...c, members: [...c.members, responderId] }
            : c
        )
      );
    }
    setResponders((prev) =>
      prev.map((r) => (r.id === responderId ? { ...r, status: 'en_route' } : r))
    );
    setChat((prev) => [
      ...prev,
      {
        id: newId('CH'),
        caseId,
        authorId: 'ops',
        kind: 'system',
        text: `${responder?.name ?? responderId} assigned to ${event.title}.`,
        ts: Date.now(),
      },
    ]);
    pushLog({
      actorId: 'ops',
      actorRole: 'ops',
      action: 'incident.assigned',
      targetId: eventId,
      message: `${responder?.name ?? responderId} assigned to ${event.title}. Case ${caseId}.`,
      severity: event.severity,
      visibleTo: ['ops', 'responder'],
    });
    pushNotification({
      tier: event.severity >= 4 ? 'urgent' : 'watch',
      roles: ['responder'],
      title: 'Mission assigned',
      body: `${event.title}. Open assignment detail or case room.`,
      targetId: caseId,
    });
  };

  const toggleDuty: AppState['toggleDuty'] = (responderId, on) => {
    setResponders((prev) =>
      prev.map((r) => (r.id === responderId ? { ...r, status: on ? 'ready' : 'out' } : r))
    );
    pushLog({
      actorId: responderId,
      actorRole: 'responder',
      action: 'responder.duty',
      targetId: responderId,
      message: `${responderId} went ${on ? 'on' : 'off'} duty.`,
      visibleTo: ['ops', 'responder'],
    });
  };

  const updateResponderStatus: AppState['updateResponderStatus'] = (responderId, status) => {
    api.patchResponder(responderId, { status }).catch(() => {});
    setResponders((prev) => prev.map((r) => (r.id === responderId ? { ...r, status } : r)));
    pushLog({
      actorId: 'ops',
      actorRole: 'ops',
      action: 'responder.status',
      targetId: responderId,
      message: `${responderId} status set to ${status}.`,
      visibleTo: ['ops', 'responder'],
    });
  };

  const updateSelfProfile: AppState['updateSelfProfile'] = (patch) =>
    setUsers((prev) => prev.map((u) => (u.id === SELF_ID ? { ...u, ...patch } : u)));

  const updateUserProfile: AppState['updateUserProfile'] = (userId, patch) =>
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, ...patch } : u)));

  const createVolunteerEvent: AppState['createVolunteerEvent'] = (e) => {
    const id = newId('VOL');
    setVolunteerEvents((prev) => [
      { ...e, id, registeredResponderIds: [], status: 'upcoming', createdAt: Date.now() },
      ...prev,
    ]);
    pushLog({
      actorId: e.organizer,
      actorRole: e.organizerRole === 'ops' ? 'ops' : 'citizen',
      action: 'volunteer_event.created',
      targetId: id,
      message: `${e.title} created by ${e.organizer}.`,
      visibleTo: ['ops', 'responder'],
    });
    return id;
  };

  const joinVolunteerEvent: AppState['joinVolunteerEvent'] = (eventId, responderId) => {
    setVolunteerEvents((prev) =>
      prev.map((e) =>
        e.id === eventId && !e.registeredResponderIds.includes(responderId)
          ? { ...e, registeredResponderIds: [...e.registeredResponderIds, responderId] }
          : e
      )
    );
    pushLog({
      actorId: responderId,
      actorRole: 'responder',
      action: 'volunteer_event.registered',
      targetId: eventId,
      message: `${responderId} registered for volunteer event ${eventId}.`,
      visibleTo: ['ops', 'responder'],
    });
  };

  const unregisterVolunteerEvent: AppState['unregisterVolunteerEvent'] = (eventId, responderId) => {
    setVolunteerEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, registeredResponderIds: e.registeredResponderIds.filter((id) => id !== responderId) }
          : e
      )
    );
    pushLog({
      actorId: responderId,
      actorRole: 'responder',
      action: 'volunteer_event.unregistered',
      targetId: eventId,
      message: `${responderId} unregistered from volunteer event ${eventId}.`,
      visibleTo: ['ops', 'responder'],
    });
  };

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

  const fallbackHost = (query: string, caseId: string): Pick<ChatEntry, 'text' | 'chips'> => {
    const q = query.toLowerCase();
    const caseRoom = cases.find((c) => c.id === caseId);
    const caseMembers = caseRoom ? responders.filter((r) => caseRoom.members.includes(r.id)) : [];
    const caseEvent = events.find((e) => e.caseId === caseId);

    // /host status
    if (q.includes('status') && !q.includes('formation')) {
      if (!caseRoom) return { text: 'Case state unavailable.', chips: [{ label: 'tool: case_state', ref: 'unavailable' }] };
      const onScene = caseMembers.filter((r) => r.status === 'on_scene').length;
      const enRoute = caseMembers.filter((r) => r.status === 'en_route').length;
      return {
        text: `${caseRoom.name} · ${caseRoom.state} · sev ${caseRoom.severity} · ${caseMembers.length} members · ${onScene} on scene · ${enRoute} en route.`,
        chips: [{ label: 'tool: case_state', ref: caseRoom.state }, { label: 'tool: roster', ref: `${caseMembers.length}` }],
      };
    }

    // /host route <m> to <p>
    if (q.includes('route')) {
      if (!caseRoom) return { text: 'Route unavailable: no active case.', chips: [{ label: 'tool: route', ref: 'unavailable' }] };
      const target = caseRoom.centroid;
      const lines = caseMembers.map((r) => {
        const km = getDistanceKm(r.location, target);
        return `${r.name}: ${km.toFixed(2)} km · ETA ${etaMinutes(km)} min to case centroid.`;
      });
      return {
        text: lines.length ? `Routes to ${caseRoom.name}:\n${lines.join('\n')}` : 'No members assigned to route.',
        chips: [{ label: 'tool: route', ref: 'haversine' }],
      };
    }

    // /host nearest aed — honest stub
    if (q.includes('aed') || (q.includes('nearest') && !q.includes('hospital'))) {
      return { text: 'Nearest AED: unavailable. OneMap AED theme not yet wired.', chips: [{ label: 'tool: onemap_theme', ref: 'unavailable' }] };
    }

    // /host hospital load — honest stub
    if (q.includes('hospital')) {
      return { text: 'Hospital A&E load: unavailable. No live MOH/hospital source wired.', chips: [{ label: 'tool: hospital_load', ref: 'unavailable' }] };
    }

    // /host weather
    if (q.includes('weather') || q.includes('psi')) {
      const psi = liveSnapshot?.psi[0];
      return {
        text: psi ? `PSI national ${psi.psi24h}. Air quality ${(psi.psi24h ?? 0) < 55 ? 'good' : 'moderate'}. Source: NEA live.` : 'NEA PSI: unavailable. Live fetch not configured.',
        chips: [{ label: 'tool: nea_psi', ref: psi ? 'live' : 'unavailable' }],
      };
    }

    // /host check <m>
    if (q.includes('check')) {
      const tokens = q.replace('/host', '').replace('check', '').trim().split(/\s+/).filter(Boolean);
      const found = caseMembers.find((r) => tokens.some((t) => r.name.toLowerCase().includes(t) || r.id.toLowerCase().includes(t)));
      if (!found) return { text: 'Check: member not found in this case roster.', chips: [{ label: 'tool: roster', ref: 'no_match' }] };
      return {
        text: `${found.name} (${found.org}) · ${found.status} · loc ${found.location.lat.toFixed(4)},${found.location.lng.toFixed(4)} · last beat: unavailable (no heartbeat source).`,
        chips: [{ label: 'tool: roster', ref: found.status }],
      };
    }

    // /host suggest formation
    if (q.includes('formation') || q.includes('suggest')) {
      if (!caseRoom) return { text: 'Formation suggestion unavailable: no active case.', chips: [{ label: 'tool: formation', ref: 'unavailable' }] };
      const roleCounts: Record<string, number> = {};
      caseMembers.forEach((r) => { roleCounts[r.role] = (roleCounts[r.role] ?? 0) + 1; });
      const roster = Object.entries(roleCounts).map(([k, v]) => `${k}:${v}`).join(' · ') || 'empty';
      const need: string[] = [];
      if (caseEvent?.kind === 'fire' && !roleCounts.fire) need.push('fire');
      if (caseEvent?.kind === 'medical' && !roleCounts.medic) need.push('medic');
      if (!roleCounts.medic && (caseRoom.severity >= 3)) need.push('medic');
      return {
        text: `Roster: ${roster}. ${need.length ? `Suggest add: ${need.join(', ')}.` : 'Composition acceptable for current case kind.'}`,
        chips: [{ label: 'tool: formation', ref: need.length ? 'gap' : 'ok' }],
      };
    }

    // /host new pings?
    if (q.includes('ping') || q.includes('new')) {
      const open = sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status) && !s.assignedResponderId);
      if (!caseRoom || open.length === 0) {
        return { text: open.length === 0 ? 'No unassigned SOS pings.' : 'No active case to compare against.', chips: [{ label: 'tool: sos_queue', ref: `${open.length}` }] };
      }
      const sorted = open
        .map((s) => ({ s, km: getDistanceKm(s.location, caseRoom.centroid) }))
        .sort((a, b) => a.km - b.km)
        .slice(0, 3);
      const lines = sorted.map(({ s, km }) => `${s.id} · ${s.category} · ${km.toFixed(1)} km from case`);
      return { text: `Open pings near ${caseRoom.name}:\n${lines.join('\n')}`, chips: [{ label: 'tool: sos_queue', ref: `${open.length}` }] };
    }

    // /host playback 5m
    if (q.includes('playback')) {
      const cutoff = Date.now() - 5 * 60_000;
      const recent = chat.filter((c) => c.caseId === caseId && c.ts >= cutoff);
      if (recent.length === 0) return { text: 'No chat activity in last 5 min.', chips: [{ label: 'tool: chat_log', ref: '0' }] };
      const lines = recent.slice(-6).map((c) => {
        const author = c.authorId === 'host' ? 'Host' : c.authorId === 'ops' ? 'Ops' : (responders.find((r) => r.id === c.authorId)?.name ?? c.authorId);
        return `${author}: ${c.text.slice(0, 80)}`;
      });
      return { text: `Last 5 min (${recent.length} entries):\n${lines.join('\n')}`, chips: [{ label: 'tool: chat_log', ref: `${recent.length}` }] };
    }

    // /host escalate?
    if (q.includes('escalate')) {
      if (!caseRoom) return { text: 'Escalation assessment unavailable: no active case found.', chips: [{ label: 'tool: case_state', ref: 'unavailable' }] };
      const openSos = sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status)).length;
      const decision = caseRoom.severity >= 4 || openSos >= 3 ? 'YES' : 'NO';
      const why = caseRoom.severity >= 4 ? `severity ${caseRoom.severity} ≥ 4` : openSos >= 3 ? `${openSos} open SOS pings` : `severity ${caseRoom.severity} below threshold; ${openSos} open pings`;
      return { text: `${decision}. Rationale: ${why}.`, chips: [{ label: 'tool: case_state', ref: caseRoom.state }] };
    }

    // /host pause watchdog 10m — captain-only acknowledgement; no real watchdog wired
    if (q.includes('pause') || q.includes('watchdog')) {
      const isCaptain = caseRoom?.captain === SELF_ID;
      if (!isCaptain) return { text: 'Pause watchdog: captain-only command.', chips: [{ label: 'tool: watchdog', ref: 'denied' }] };
      const until = new Date(Date.now() + 10 * 60_000).toLocaleTimeString();
      return { text: `Watchdog mute acknowledged until ${until}. (Local-only; no proactive watchdog yet wired.)`, chips: [{ label: 'tool: watchdog', ref: 'muted_local' }] };
    }

    // /host draft aar
    if (q.includes('aar')) {
      if (!caseRoom) return { text: 'AAR draft unavailable: no case selected.', chips: [{ label: 'tool: aar', ref: 'unavailable' }] };
      const durationMin = Math.round((Date.now() - caseRoom.startedAt) / 60_000);
      const chatCount = chat.filter((c) => c.caseId === caseId).length;
      return {
        text: [
          `AAR draft · ${caseRoom.name}`,
          `Event: ${caseEvent?.title ?? 'unspecified'} (${caseEvent?.kind ?? 'n/a'})`,
          `Severity: ${caseRoom.severity} · State: ${caseRoom.state} · Duration: ${durationMin} min`,
          `Members (${caseMembers.length}): ${caseMembers.map((r) => r.name).join(', ') || 'none'}`,
          `Chat entries: ${chatCount}. Captain: ${responders.find((r) => r.id === caseRoom.captain)?.name ?? 'unassigned'}.`,
          `Outcomes / lessons: pending captain input.`,
        ].join('\n'),
        chips: [{ label: 'tool: aar', ref: 'draft' }],
      };
    }

    // /host help
    if (q.includes('help')) {
      return {
        text: 'Commands: /host status · /host route · /host nearest aed · /host hospital load · /host weather · /host check <member> · /host suggest formation · /host new pings? · /host playback 5m · /host escalate? · /host pause watchdog 10m · /host draft aar · /host help',
        chips: [],
      };
    }

    return { text: 'Host AI unavailable. Try /host help for commands.', chips: [{ label: 'tool: host_ai', ref: 'unavailable' }] };
  };

  const askHost: AppState['askHost'] = (caseId, query) => {
    const id = newId('CH');
    const caseRoom = cases.find((c) => c.id === caseId);
    const caseEvent = events.find((e) => e.caseId === caseId);
    const caseMembers = responders.filter((r) => caseRoom?.members.includes(r.id));
    const recentCutoff = Date.now() - 5 * 60_000;
    const recentChat = chat
      .filter((c) => c.caseId === caseId && c.ts >= recentCutoff)
      .slice(-8)
      .map((c) => ({ author: c.authorId, kind: c.kind, text: c.text.slice(0, 140), ts: c.ts }));
    const openSos = sosSessions
      .filter((s) => !['resolved', 'cancelled'].includes(s.status) && !s.assignedResponderId)
      .map((s) => ({ id: s.id, category: s.category, status: s.status, location: s.location }));
    askHostAi({
      role,
      workspace: 'case_lobby',
      prompt: query,
      context: {
        case: caseRoom,
        event: caseEvent,
        responders: caseMembers.map((r) => ({ id: r.id, name: r.name, status: r.status, role: r.role, location: r.location, org: r.org })),
        sos: openSos,
        chatRecent: recentChat,
        liveSnapshot: liveSnapshot ? { psi: liveSnapshot.psi?.[0] ?? null } : null,
        selfResponderId: SELF_ID,
      },
    })
      .then((reply) => {
        const entry = reply.state === 'live'
          ? { text: reply.text, chips: reply.chips }
          : fallbackHost(query, caseId);
        setChat((prev) => [
          ...prev,
          { id, caseId, authorId: 'host', kind: 'host', ...entry, ts: Date.now() },
        ]);
      })
      .catch(() => {
        const fallback = fallbackHost(query, caseId);
        setChat((prev) => [
          ...prev,
          { id, caseId, authorId: 'host', kind: 'host', text: fallback.text, chips: fallback.chips, ts: Date.now() },
        ]);
      });
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
    const caseRoom = cases.find((c) => c.id === caseId);
    if (caseRoom?.restricted) {
      pushLog({
        actorId: responderId,
        actorRole: 'responder',
        action: 'case.join_blocked',
        targetId: caseId,
        message: `${caseRoom.name} is official-only. Volunteer join was blocked to avoid interference.`,
        severity: caseRoom.severity,
        visibleTo: ['ops', 'responder'],
      });
      pushNotification({
        tier: 'watch',
        roles: ['responder'],
        title: 'Official case is restricted',
        body: `${caseRoom.name} can be monitored for deconfliction, but volunteers cannot join it.`,
        targetId: caseId,
      });
      return;
    }
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId && !c.members.includes(responderId)
          ? { ...c, members: [...c.members, responderId] }
          : c
      )
    );
    if (caseRoom && !caseRoom.members.includes(responderId)) {
      api.patchCase(caseId, { members: [...caseRoom.members, responderId] }).catch(() => {});
    }
    setLiveTracking(true);
    pushLog({
      actorId: responderId,
      actorRole: 'responder',
      action: 'case.joined',
      targetId: caseId,
      message: `${responderId} joined case ${caseRoom?.name ?? caseId}.`,
      severity: caseRoom?.severity,
      visibleTo: ['ops', 'responder'],
    });
  };
  const leaveCase: AppState['leaveCase'] = (caseId, responderId) => {
    const caseRoom = cases.find((c) => c.id === caseId);
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, members: c.members.filter((m) => m !== responderId) } : c
      )
    );
    if (caseRoom) {
      api.patchCase(caseId, { members: caseRoom.members.filter((m) => m !== responderId) }).catch(() => {});
    }
    pushLog({
      actorId: responderId,
      actorRole: 'responder',
      action: 'case.left',
      targetId: caseId,
      message: `${responderId} left case ${caseId}.`,
      visibleTo: ['ops', 'responder'],
    });
  };

  const requestCaseFormation: AppState['requestCaseFormation'] = (eventId, responderId) => {
    const event = events.find((e) => e.id === eventId);
    pushLog({
      actorId: responderId,
      actorRole: 'responder',
      action: 'case.requested',
      targetId: eventId,
      message: `${responderId} requested ops to form a case around ${event?.title ?? eventId}.`,
      severity: event?.severity,
      visibleTo: ['ops', 'responder'],
    });
    pushNotification({
      tier: event && event.severity >= 4 ? 'urgent' : 'watch',
      roles: ['ops'],
      title: 'Responder requested case formation',
      body: `${event?.title ?? eventId}. Ops must create/assign the case; responders cannot draw their own polygons.`,
      targetId: eventId,
    });
  };

  const updateResponderLocation: AppState['updateResponderLocation'] = (responderId, loc) => {
    setResponders((prev) =>
      prev.map((r) => (r.id === responderId ? { ...r, location: loc } : r))
    );
  };

  const closeCase: AppState['closeCase'] = (caseId, finalReport) => {
    const target = cases.find((c) => c.id === caseId);
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId
          ? {
              ...c,
              state: 'resolved',
              closure: {
                ...(c.closure ?? {}),
                opsClosed: true,
                finalReport,
              },
            }
          : c
      )
    );
    pushLog({
      actorId: 'ops',
      actorRole: 'ops',
      action: 'case.closed',
      targetId: caseId,
      message: `Ops closed ${caseId}. Final report: ${finalReport || 'No note provided.'}`,
      visibleTo: ['ops', 'responder'],
    });
    pushNotification({
      tier: 'info',
      roles: ['responder'],
      title: `Case ${target?.name ?? caseId} closed`,
      body: `Ops has closed this case. ${finalReport ? 'Final report: ' + finalReport : 'No additional notes.'}`,
      targetId: caseId,
    });
    pushNotification({
      tier: 'info',
      roles: ['citizen'],
      title: 'Incident resolved',
      body: `The case linked to your area (${target?.name ?? caseId}) has been closed by ops. Thank you for your report.`,
      targetId: caseId,
    });
  };

  // Simulated responder movement
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
      selectBriefingCounts({ events, sosSessions, reports, cases, notifications, role }).total,
    [events, reports, sosSessions, cases, notifications, role],
  );

  // ──────────────────────────────────────────────────────────────────
  // God Mode — demo helpers. Each call still goes through the same
  // pushLog/pushNotification pipeline so the action log stays honest.
  // ──────────────────────────────────────────────────────────────────
  const godSetSourceState: AppState['godSetSourceState'] = (sourceId, state) => {
    setSources((prev) => prev.map((s) => (s.id === sourceId ? { ...s, state } : s)));
    pushLog({
      actorId: 'godmode',
      actorRole: 'system',
      action: 'godmode.source_state',
      targetId: sourceId,
      message: `Source ${sourceId} state set to ${state} via God Mode.`,
      visibleTo: ['ops'],
    });
  };

  const seedSamplePoints = [
    { name: 'Bedok Central', lng: 103.9298, lat: 1.324 },
    { name: 'Jurong East MRT', lng: 103.7423, lat: 1.3331 },
    { name: 'Tampines hub', lng: 103.9447, lat: 1.3528 },
    { name: 'AYE merge', lng: 103.79, lat: 1.28 },
  ];

  const godSeedScenario: AppState['godSeedScenario'] = (kind) => {
    const pick = (i: number) => seedSamplePoints[i % seedSamplePoints.length];
    const minor = () => {
      const a = pick(0);
      const b = pick(1);
      const repId = newId('REP');
      setReports((prev) => [
        {
          id: repId,
          kind: 'hazard',
          title: 'Loose debris on covered walkway',
          body: `Demo seed · ${a.name}. Citizen reports tile fragments at pedestrian level.`,
          location: { lng: a.lng, lat: a.lat },
          reporterTrust: 0.6,
          status: 'pending',
          createdAt: Date.now(),
          auditTrail: ['Seeded by God Mode for demo. Awaiting ops triage.'],
        },
        ...prev,
      ]);
      const evId = newId('EV');
      setEvents((prev) => [
        {
          id: evId,
          kind: 'crash',
          title: 'Two-vehicle bump · slow lane',
          severity: 2,
          status: 'verified',
          location: { lng: b.lng, lat: b.lat },
          source: 'God Mode demo seed',
          createdAt: Date.now(),
        },
        ...prev,
      ]);
    };
    const major = () => {
      minor();
      const c = pick(2);
      const d = pick(3);
      const sosId = newId('SOS');
      setSosSessions((prev) => [
        {
          id: sosId,
          citizenName: 'Demo Citizen',
          category: 'medical',
          location: { lng: c.lng, lat: c.lat },
          status: 'requesting',
          startedAt: Date.now(),
        },
        ...prev,
      ]);
      const evId = newId('EV');
      setEvents((prev) => [
        {
          id: evId,
          kind: 'fire',
          title: 'Demo · Industrial fire (4-storey shophouse)',
          severity: 4,
          status: 'verified',
          location: { lng: d.lng, lat: d.lat },
          source: 'God Mode demo seed',
          createdAt: Date.now(),
        },
        ...prev,
      ]);
      pushNotification({
        tier: 'critical',
        roles: ['ops', 'responder'],
        title: 'Demo · Major scenario seeded',
        body: 'God Mode seeded a fire + medical SOS for presentation.',
      });
    };
    if (kind === 'major') major();
    else minor();
    pushLog({
      actorId: 'godmode',
      actorRole: 'system',
      action: `godmode.seed.${kind}`,
      targetId: 'csot',
      message: `Demo scenario "${kind}" seeded via God Mode.`,
      visibleTo: ['ops', 'responder', 'citizen'],
    });
  };

  const godResetCsot: AppState['godResetCsot'] = () => {
    setReports([]);
    setSosSessions([]);
    setEvents([]);
    setCases([]);
    setChat([]);
    setZones([]);
    setVolunteerEvents([]);
    setNotifications([]);
    setActionLogs([]);
    setSources(seedSources);
    setResponders(seedResponders);
    setTracking(null);
    setDraftPolygon([]);
    setSelectedId(null);
    setSelectedMapItem(null);
    setActiveCaseId(null);
  };

  const value: AppState = {
    isAuthenticated,
    role,
    setRole,
    demoLogin,
    demoLogout,
    pushNotification,
    drawerContent,
    setDrawerContent,
    shellState,
    setShellState,
    events,
    reports,
    sosSessions,
    responders,
    users,
    zones,
    volunteerEvents,
    cases,
    chat,
    sources,
    groups,
    liveSnapshot,
    notifications,
    actionLogs,
    selectedId,
    setSelectedId,
    activeCaseId,
    setActiveCaseId,
    tracking,
    setTracking,
    selectedMapItem,
    setSelectedMapItem,
    briefingInView,
    selfResponderId: SELF_ID,
    fileReport,
    claimReport,
    verifyReport,
    dismissReport,
    startSos,
    assignSos,
    advanceSos,
    confirmSosSafe,
    cancelSos,
    messageCitizen,
    declareIncident,
    resolveEvent: (eventId: string) => {
      api.patchEvent(eventId, { status: 'resolved' }).catch(() => {});
      setEvents((prev) => prev.filter((e) => e.id !== eventId));
    },
    declareZone,
    updateZoneStatus,
    assignIncident,
    toggleDuty,
    updateResponderStatus,
    updateSelfProfile,
    updateUserProfile,
    createVolunteerEvent,
    joinVolunteerEvent,
    unregisterVolunteerEvent,
    sendChat,
    askHost,
    joinGroup,
    leaveGroup,
    joinCase,
    leaveCase,
    requestCaseFormation,
    closeCase,
    ackNotification,
    selfLocation,
    setSelfLocation,
    selfPlaceName,
    liveTracking,
    setLiveTracking,
    updateResponderLocation,
    draftPolygon,
    setDraftPolygon,
    godSetSourceState,
    godSeedScenario,
    godResetCsot,
  };

  // Debug hook for Playwright / demo scripting. Available in dev + preview;
  // not a security surface — only safe demo mutators are exposed.
  if (typeof window !== 'undefined') {
    (window as unknown as { __kk?: unknown }).__kk = {
      role,
      setRole,
      demoLogin,
      demoLogout,
      setDrawerContent,
      setSelectedId,
      setActiveCaseId,
      godSeedScenario,
      godResetCsot,
      godSetSourceState,
      updateResponderLocation,
      SELF_ID,
    };
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
