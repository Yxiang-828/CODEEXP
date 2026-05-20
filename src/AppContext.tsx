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
import { askHostAi } from './services/hostAi';

export type Role = 'citizen' | 'responder' | 'ops';
export type ShellState = 'S0' | 'S2' | 'S4' | 'S6' | 'S9';
export type DemoScenario = 'medical_sos' | 'flood_zone' | 'traffic_case' | 'volunteer_drive';

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
  notifiedReporter?: boolean;
  auditTrail?: string[];
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
  citizenConfirmedSafe?: boolean;
  responderConfirmedSafe?: boolean;
  finalReport?: string;
}

export interface Responder {
  id: string;
  name: string;
  org: 'SCDF' | 'Volunteer' | 'SPF' | 'SAF' | 'Medic' | 'NEA' | 'LTA';
  role: 'medic' | 'fire' | 'search' | 'aux';
  status: 'ready' | 'en_route' | 'on_scene' | 'out' | 'offline';
  location: LngLat;
  assignedSosId?: string;
  groups: string[]; // group ids
  unitType?: 'volunteer' | 'professional';
  demo?: boolean;
  covert?: boolean;
  note?: string;
}

export interface AppUser {
  id: string;
  username: string;
  displayName: string;
  phone: string;
  primaryRole: Role;
  secondaryRole?: Role;
  address: string;
  skills: string[];
  available: boolean;
}

export interface EmergencyZone {
  id: string;
  title: string;
  kind: 'health' | 'fire' | 'flood' | 'accident' | 'hazard';
  severity: SeverityLevel;
  status: 'draft' | 'pending_review' | 'declared' | 'archived';
  description: string;
  center: LngLat;
  area: LngLat[];
  declaredBy: string;
  createdAt: number;
}

export interface VolunteerEvent {
  id: string;
  title: string;
  category:
    | 'community_cleanup'
    | 'first_aid_training'
    | 'disaster_drill'
    | 'food_distribution'
    | 'elderly_care'
    | 'youth_mentoring'
    | 'environmental'
    | 'other';
  description: string;
  location: LngLat;
  venue: string;
  organizer: string;
  organizerRole?: Role | 'ops' | 'community';
  date: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  skillsNeeded: string[];
  registeredResponderIds: string[];
  createdAt: number;
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
  source?: 'ops' | 'sos' | 'professional';
  restricted?: boolean;
  closure?: {
    responderAck?: boolean;
    citizenAck?: boolean;
    opsClosed?: boolean;
    finalReport?: string;
  };
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
  state: 'fresh' | 'stale' | 'down' | 'shell_only' | 'not_configured' | 'unavailable';
  lastAgeS: number;
  note?: string;
}

export type NotificationTier = 'info' | 'watch' | 'urgent' | 'critical';

export interface NotificationNotice {
  id: string;
  tier: NotificationTier;
  roles: Role[];
  title: string;
  body: string;
  targetId?: string;
  createdAt: number;
  ackBy: string[];
}

export interface ActionLog {
  id: string;
  actorId: string;
  actorRole: Role | 'system';
  action: string;
  targetId: string;
  message: string;
  severity?: SeverityLevel;
  createdAt: number;
  visibleTo: Role[];
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

export interface SelectedMapItem {
  id: string;
  category: string;
  title: string;
  detail: string;
  source: string;
  lng: number;
  lat: number;
  tone?: string;
}

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

  fileReport: (r: Omit<CitizenReport, 'id' | 'status' | 'createdAt' | 'reporterTrust'>) => string;
  claimReport: (id: string, by: string) => void;
  verifyReport: (id: string) => void;
  dismissReport: (id: string) => void;

  startSos: (s: Omit<DistressSession, 'id' | 'status' | 'startedAt'>) => string;
  assignSos: (sosId: string, responderId: string) => void;
  advanceSos: (sosId: string, to: DistressSession['status']) => void;
  confirmSosSafe: (sosId: string, by: 'citizen' | 'responder') => void;
  cancelSos: (sosId: string) => void;

  declareIncident: (e: Omit<CanonicalEvent, 'id' | 'createdAt' | 'status'>) => string;
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
  runDemoScenario: (scenario: DemoScenario) => void;
}

const AppContext = createContext<AppState | undefined>(undefined);

const NOW = Date.now();
const T = (mins: number) => NOW - mins * 60_000;
const SELF_ID = 'R-ECHO-1';

// Seed locations are real SG coords
const seed = {
  groups: [
    {
      id: 'G-SCDF-EAST',
      name: 'SCDF · East District',
      org: 'SCDF',
      kind: 'org',
      members: ['R-BRAVO-9', 'R-DELTA-1', 'R-SCDF-HAZMAT'],
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
    {
      id: 'EV-1002',
      kind: 'crash',
      title: 'Multi-vehicle collision on AYE',
      severity: 4 as SeverityLevel,
      status: 'verified',
      location: { lng: 103.79, lat: 1.28 },
      source: 'SCDF dispatch',
      createdAt: T(8),
      caseId: 'CASE-ALPHA-09',
    },
    {
      id: 'EV-1003',
      kind: 'hazard',
      title: 'Fallen tree blocking lane · Tampines Ave 4',
      severity: 1 as SeverityLevel,
      status: 'verified',
      location: { lng: 103.94, lat: 1.35 },
      source: 'OneMap traffic',
      createdAt: T(46),
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
    {
      id: 'REP-4920',
      kind: 'medical',
      title: 'Citizen collapsed · City Hall MRT',
      body: 'Elderly man collapsed near exit B.',
      location: { lng: 103.853, lat: 1.293 },
      reporterTrust: 0.65,
      status: 'pending',
      createdAt: T(5),
    },
  ] as CitizenReport[],

  sosSessions: [
    {
      id: 'SOS-029',
      citizenName: 'U_7821',
      category: 'medical',
      location: { lng: 103.742, lat: 1.333 }, // Jurong East MRT
      status: 'requesting',
      startedAt: T(0.5),
    },
  ] as DistressSession[],

  responders: [
    {
      id: 'R-BRAVO-9',
      name: 'Bravo-9',
      org: 'SCDF',
      role: 'medic',
      status: 'on_scene',
      location: { lng: 103.792, lat: 1.282 },
      groups: ['G-SCDF-EAST'],
      unitType: 'professional',
      demo: true,
      note: 'Demo SCDF professional unit. Volunteers can see movement but cannot join official-only case work.',
    },
    {
      id: 'R-CHARLIE-3',
      name: 'Charlie-3',
      org: 'Volunteer',
      role: 'fire',
      status: 'on_scene',
      location: { lng: 103.788, lat: 1.278 },
      groups: ['G-FIRE-VOL'],
      unitType: 'volunteer',
    },
    {
      id: 'R-ECHO-1',
      name: 'Echo-1',
      org: 'Volunteer',
      role: 'medic',
      status: 'ready',
      location: { lng: 103.85, lat: 1.3 },
      groups: ['G-MEDIC-VOL'],
      unitType: 'volunteer',
    },
    {
      id: 'R-DELTA-1',
      name: 'Delta-1',
      org: 'SCDF',
      role: 'medic',
      status: 'ready',
      location: { lng: 103.83, lat: 1.305 },
      groups: ['G-SCDF-EAST'],
      unitType: 'professional',
      demo: true,
      note: 'Demo SCDF ambulance responder.',
    },
    {
      id: 'R-SPF-12',
      name: 'SPF Patrol-12',
      org: 'SPF',
      role: 'aux',
      status: 'en_route',
      location: { lng: 103.847, lat: 1.305 },
      groups: [],
      unitType: 'professional',
      demo: true,
      covert: true,
      note: 'Demo SPF movement. Covert label is hidden from volunteer case labels.',
    },
    {
      id: 'R-SAF-ENG-6',
      name: 'SAF Eng-6',
      org: 'SAF',
      role: 'search',
      status: 'ready',
      location: { lng: 103.909, lat: 1.318 },
      groups: [],
      unitType: 'professional',
      demo: true,
      note: 'Demo SAF engineer support unit for flood/structural incidents.',
    },
    {
      id: 'R-SCDF-HAZMAT',
      name: 'SCDF HazMat-3',
      org: 'SCDF',
      role: 'fire',
      status: 'ready',
      location: { lng: 103.864, lat: 1.336 },
      groups: ['G-SCDF-EAST'],
      unitType: 'professional',
      demo: true,
      note: 'Demo SCDF hazmat/fire unit.',
    },
  ] as Responder[],

  users: [
    {
      id: 'U-CIV-1',
      username: 'maya',
      displayName: 'Maya Tan',
      phone: '+65 8123 4567',
      primaryRole: 'citizen',
      address: 'Bedok North, Singapore',
      skills: ['Community reporting'],
      available: true,
    },
    {
      id: SELF_ID,
      username: 'echo1',
      displayName: 'Echo-1 Responder',
      phone: '+65 8450 1101',
      primaryRole: 'responder',
      secondaryRole: 'citizen',
      address: 'Central Singapore',
      skills: ['First Aid', 'CPR', 'AED', 'Search'],
      available: true,
    },
    {
      id: 'U-OPS-1',
      username: 'opslead',
      displayName: 'Ops Lead',
      phone: '+65 9000 0001',
      primaryRole: 'ops',
      secondaryRole: 'citizen',
      address: 'HQ Operations',
      skills: ['Dispatch', 'Incident command'],
      available: true,
    },
  ] as AppUser[],

  zones: [
    {
      id: 'ZONE-BEDOK-01',
      title: 'Bedok South flood watch',
      kind: 'flood',
      severity: 3 as SeverityLevel,
      status: 'declared',
      description: 'Drawn operating area for road flooding and pedestrian diversion.',
      center: { lng: 103.93, lat: 1.322 },
      area: [
        { lng: 103.918, lat: 1.318 },
        { lng: 103.942, lat: 1.318 },
        { lng: 103.942, lat: 1.328 },
        { lng: 103.918, lat: 1.328 },
      ],
      declaredBy: 'U-OPS-1',
      createdAt: T(20),
    },
  ] as EmergencyZone[],

  volunteerEvents: [
    {
      id: 'VOL-AED-01',
      title: 'AED refresher standby',
      category: 'first_aid_training',
      description: 'Short refresher and standby roster for nearby AED responders.',
      location: { lng: 103.85, lat: 1.3 },
      venue: 'City Hall community room',
      organizer: 'Ops Lead',
      organizerRole: 'ops',
      date: new Date(NOW + 86_400_000).toISOString().slice(0, 10),
      status: 'upcoming',
      skillsNeeded: ['AED', 'CPR'],
      registeredResponderIds: ['R-ECHO-1'],
      createdAt: T(40),
    },
    {
      id: 'VOL-FLOOD-02',
      title: 'DEMO · Flood welfare runners',
      category: 'disaster_drill',
      description: 'Demo standby roster for water, blankets, and wayfinding outside the restricted flood zone.',
      location: { lng: 103.93, lat: 1.322 },
      venue: 'Bedok South RC staging point',
      organizer: 'Ops Lead',
      organizerRole: 'ops',
      date: new Date(NOW + 2 * 86_400_000).toISOString().slice(0, 10),
      status: 'upcoming',
      skillsNeeded: ['First Aid', 'Logistics', 'Tamil'],
      registeredResponderIds: [],
      createdAt: T(28),
    },
    {
      id: 'VOL-FOOD-03',
      title: 'DEMO · Elderly meal delivery cover',
      category: 'food_distribution',
      description: 'Community event posted by ops after lift outage reports. Non-emergency, no dispatch authority.',
      location: { lng: 103.84, lat: 1.312 },
      venue: 'Tiong Bahru community desk',
      organizer: 'Ops Lead',
      organizerRole: 'ops',
      date: new Date(NOW + 3 * 86_400_000).toISOString().slice(0, 10),
      status: 'upcoming',
      skillsNeeded: ['Elderly care', 'Logistics'],
      registeredResponderIds: ['R-CHARLIE-3'],
      createdAt: T(18),
    },
  ] as VolunteerEvent[],

  cases: [
    {
      id: 'CASE-ALPHA-09',
      name: 'ALPHA-09',
      severity: 4 as SeverityLevel,
      centroid: { lng: 103.79, lat: 1.28 },
      members: ['R-BRAVO-9', 'R-CHARLIE-3'],
      captain: 'R-BRAVO-9',
      state: 'active',
      startedAt: T(60),
      source: 'ops',
    },
    {
      id: 'CASE-SCDF-77',
      name: 'SCDF-77',
      severity: 4 as SeverityLevel,
      centroid: { lng: 103.864, lat: 1.336 },
      members: ['R-SCDF-HAZMAT', 'R-SPF-12'],
      captain: 'R-SCDF-HAZMAT',
      state: 'staging',
      startedAt: T(9),
      source: 'professional',
      restricted: true,
    },
  ] as CaseRoom[],

  chat: [
    {
      id: 'CH-1',
      caseId: 'CASE-ALPHA-09',
      authorId: 'system',
      kind: 'system',
      text: 'Case ALPHA-09 formed. Bravo-9 captain. Charlie-3 joined.',
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
    {
      id: 'CH-3',
      caseId: 'CASE-ALPHA-09',
      authorId: 'host',
      kind: 'host',
      text: 'Delta-1 is 1.0 km away with surplus supplies. Routed to your position.',
      chips: [
        { label: 'tool: responder_lookup', ref: 'R-DELTA-1' },
        { label: 'tool: route', ref: '1.0 km · 3 min' },
      ],
      ts: T(11),
    },
    {
      id: 'CH-4',
      caseId: 'CASE-ALPHA-09',
      authorId: 'R-CHARLIE-3',
      kind: 'message',
      text: 'Roger. Perimeter holding. Watching for hazmat from leaking tank.',
      ts: T(8),
    },
  ] as ChatEntry[],

  sources: [
    { id: 'src-1', name: 'NEA PSI', state: 'fresh', lastAgeS: 35 },
    { id: 'src-2', name: 'NEA rainfall', state: 'fresh', lastAgeS: 22 },
    { id: 'src-3', name: 'NEA 2hr forecast', state: 'fresh', lastAgeS: 90 },
    { id: 'src-4', name: 'SCDF dispatch', state: 'fresh', lastAgeS: 12 },
    { id: 'src-5', name: 'MOH alerts', state: 'fresh', lastAgeS: 90 },
    { id: 'src-6', name: 'OneMap traffic', state: 'stale', lastAgeS: 540 },
    { id: 'src-7', name: 'Reports intake', state: 'fresh', lastAgeS: 5 },
    {
      id: 'src-8',
      name: 'Kampung Kaki backend',
      state: 'shell_only',
      lastAgeS: 0,
      note: 'Express/WebSocket persistence not wired yet.',
    },
    {
      id: 'src-9',
      name: 'MQTT bridge',
      state: 'not_configured',
      lastAgeS: 0,
      note: 'Mosquitto bridge is planned but not connected in shell phase.',
    },
    {
      id: 'src-10',
      name: 'OpenRouter Host AI',
      state: 'shell_only',
      lastAgeS: 0,
      note: 'Server route /api/host/ask is wired. It returns not configured if OPENROUTER_API_KEY is missing.',
    },
    {
      id: 'src-11',
      name: 'LTA DataMall',
      state: 'not_configured',
      lastAgeS: 0,
      note: 'Requires DATAMALL_ACCOUNT_KEY before traffic incidents/speed bands are live.',
    },
    {
      id: 'src-12',
      name: 'OneMap API services',
      state: 'not_configured',
      lastAgeS: 0,
      note: 'Tiles are live. Reverse geocode/routes/themes need ONEMAP_API_KEY.',
    },
    {
      id: 'src-13',
      name: 'Hospital load',
      state: 'unavailable',
      lastAgeS: 0,
      note: 'No real live hospital-load source configured. No fake values shown.',
    },
  ] as SourceHealth[],

  notifications: [
    {
      id: 'NT-SEED-1',
      tier: 'critical',
      roles: ['ops', 'responder'],
      title: 'SOS-029 medical active',
      body: 'Medical SOS visible to ops and suitable responders. Fit scoring is shown before join/dispatch.',
      targetId: 'SOS-029',
      createdAt: T(0.5),
      ackBy: [],
    },
    {
      id: 'NT-SEED-2',
      tier: 'watch',
      roles: ['responder'],
      title: 'Official unit nearby',
      body: 'SCDF/SPF demo units are visible for deconfliction. Do not join restricted professional cases.',
      targetId: 'CASE-SCDF-77',
      createdAt: T(8),
      ackBy: [],
    },
  ] as NotificationNotice[],

  actionLogs: [
    {
      id: 'LOG-SEED-1',
      actorId: 'system',
      actorRole: 'system',
      action: 'case.created',
      targetId: 'CASE-ALPHA-09',
      message: 'Ops case ALPHA-09 active. Bravo-9 captain. Charlie-3 on scene.',
      severity: 4 as SeverityLevel,
      createdAt: T(60),
      visibleTo: ['ops', 'responder'],
    },
    {
      id: 'LOG-SEED-2',
      actorId: 'system',
      actorRole: 'system',
      action: 'sos.received',
      targetId: 'SOS-029',
      message: 'Citizen SOS created and broadcast to ops plus responder pool.',
      severity: 4 as SeverityLevel,
      createdAt: T(0.5),
      visibleTo: ['ops', 'responder', 'citizen'],
    },
  ] as ActionLog[],
};

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role>('citizen');
  const [drawerContent, setDrawerContentRaw] = useState<string | null>(null);
  const [shellState, setShellState] = useState<ShellState>('S0');

  const [events, setEvents] = useState<CanonicalEvent[]>(seed.events);
  const [reports, setReports] = useState<CitizenReport[]>(seed.reports);
  const [sosSessions, setSosSessions] = useState<DistressSession[]>(seed.sosSessions);
  const [responders, setResponders] = useState<Responder[]>(seed.responders);
  const [users, setUsers] = useState<AppUser[]>(seed.users);
  const [zones, setZones] = useState<EmergencyZone[]>(seed.zones);
  const [volunteerEvents, setVolunteerEvents] = useState<VolunteerEvent[]>(seed.volunteerEvents);
  const [cases, setCases] = useState<CaseRoom[]>(seed.cases);
  const [chat, setChat] = useState<ChatEntry[]>(seed.chat);
  const [sources] = useState<SourceHealth[]>(seed.sources);
  const [groups, setGroups] = useState<Group[]>(seed.groups);
  const [liveSnapshot, setLiveSnapshot] = useState<LiveSnapshot | null>(null);
  const [notifications, setNotifications] = useState<NotificationNotice[]>(seed.notifications);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>(seed.actionLogs);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const [tracking, setTracking] = useState<TrackingState | null>(null);
  const [selectedMapItem, setSelectedMapItem] = useState<SelectedMapItem | null>(null);

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

  // Live provider fetch is opt-in. This prevents the shell from burning real API quota on load.
  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_LIVE_PROVIDER_FETCH !== 'true') return;
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
    const sos = sosSessions.find((s) => s.id === sosId);
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
    const map: Record<string, TrackingState> = {
      en_route: { kind: 'SOS LIVE', title: 'Responder en route', eta: '2:30', progress: 0.55, tone: 'critical', drawerId: 'sos_live' },
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

  const fallbackHost = (query: string): Pick<ChatEntry, 'text' | 'chips'> => {
    const q = query.toLowerCase();
    let text = 'Try /host help for commands.';
    let chips: ChatEntry['chips'] = [];
    if (q.includes('status')) {
      text = 'Case ALPHA-09 · active 1h · 2 responders on scene · no new SOS pings within 200 m.';
      chips = [{ label: 'tool: case_state', ref: 'active' }, { label: 'tool: roster', ref: '2/4' }];
    } else if (q.includes('aed') || q.includes('nearest')) {
      text = 'Nearest AED unavailable: OneMap theme retrieval is configured for backend integration but is not wired into Host yet. No guessed AED is shown.';
      chips = [{ label: 'tool: onemap_theme', ref: 'unavailable' }];
    } else if (q.includes('hospital')) {
      text = 'Hospital load unavailable: no real live hospital-load source is configured. No fake wait time or load ranking is shown.';
      chips = [{ label: 'tool: hospital_load', ref: 'unavailable' }];
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
    return { text, chips };
  };

  const askHost: AppState['askHost'] = (caseId, query) => {
    const id = newId('CH');
    const caseRoom = cases.find((c) => c.id === caseId);
    const caseEvent = events.find((e) => e.caseId === caseId);
    askHostAi({
      role,
      workspace: 'case_lobby',
      prompt: query,
      context: {
        case: caseRoom,
        event: caseEvent,
        responders: responders.filter((r) => caseRoom?.members.includes(r.id)),
        liveSnapshotAvailable: !!liveSnapshot,
      },
    })
      .then((reply) => {
        const fallback = fallbackHost(query);
        setChat((prev) => [
          ...prev,
          {
            id,
            caseId,
            authorId: 'host',
            kind: 'host',
            text: reply.state === 'live' ? reply.text : `${reply.text} ${fallback.text}`,
            chips: reply.chips?.length ? reply.chips : fallback.chips,
            ts: Date.now(),
          },
        ]);
      })
      .catch(() => {
        const fallback = fallbackHost(query);
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
    setCases((prev) =>
      prev.map((c) =>
        c.id === caseId ? { ...c, members: c.members.filter((m) => m !== responderId) } : c
      )
    );
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

  const runDemoScenario: AppState['runDemoScenario'] = (scenario) => {
    const now = Date.now();
    if (scenario === 'medical_sos') {
      const sosId = newId('DEMO-SOS');
      setSosSessions((prev) => [
        {
          id: sosId,
          citizenName: 'DEMO_PATIENT',
          category: 'medical',
          location: { lng: 103.852, lat: 1.293 },
          status: 'requesting',
          startedAt: now,
        },
        ...prev,
      ]);
      setReports((prev) => [
        {
          id: newId('DEMO-REP'),
          kind: 'medical',
          title: 'DEMO · Collapse near City Hall MRT',
          body: 'Demo injection for SOS intake, AED lookup, dispatch, and responder tracking.',
          location: { lng: 103.852, lat: 1.293 },
          reporterTrust: 1,
          status: 'pending',
          createdAt: now,
        },
        ...prev,
      ]);
      setTracking({
        kind: 'DEMO SOS',
        title: 'Injected medical SOS · awaiting dispatch',
        eta: 'demo',
        progress: 0.15,
        tone: 'critical',
        drawerId: 'distress_oversight',
      });
      setSelectedId(sosId);
      setDrawerContent('distress_oversight');
      return;
    }

    if (scenario === 'flood_zone') {
      const zoneId = newId('DEMO-ZONE');
      const center = { lng: 103.93, lat: 1.322 };
      const area = [
        { lng: 103.919, lat: 1.316 },
        { lng: 103.944, lat: 1.317 },
        { lng: 103.946, lat: 1.329 },
        { lng: 103.922, lat: 1.331 },
      ];
      setZones((prev) => [
        {
          id: zoneId,
          title: 'DEMO · Flash flood operating zone',
          kind: 'flood',
          severity: 4 as SeverityLevel,
          status: 'declared',
          description: 'Demo zone for ops declaration, map polygon, alerts, and responder bulletin workflows.',
          center,
          area,
          declaredBy: 'demo-god-mode',
          createdAt: now,
        },
        ...prev,
      ]);
      setEvents((prev) => [
        {
          id: newId('DEMO-EV'),
          kind: 'flood',
          title: 'DEMO · Flash flood at Bedok South',
          severity: 4 as SeverityLevel,
          status: 'verified',
          location: center,
          area,
          source: 'DEMO injection · God Mode',
          createdAt: now,
          liveValue: 'demo rainfall surge',
        },
        ...prev,
      ]);
      setDrawerContent('zones');
      return;
    }

    if (scenario === 'traffic_case') {
      const eventId = newId('DEMO-EV');
      const caseId = newId('DEMO-CASE');
      const location = { lng: 103.79, lat: 1.28 };
      setEvents((prev) => [
        {
          id: eventId,
          kind: 'crash',
          title: 'DEMO · AYE multi-vehicle collision',
          severity: 4 as SeverityLevel,
          status: 'verified',
          location,
          source: 'DEMO injection · God Mode',
          createdAt: now,
          caseId,
        },
        ...prev,
      ]);
      setCases((prev) => [
        {
          id: caseId,
          name: caseId.replace('DEMO-CASE-', 'DEMO-'),
          severity: 4 as SeverityLevel,
          centroid: location,
          members: ['R-BRAVO-9', 'R-ECHO-1'],
          captain: 'R-BRAVO-9',
          state: 'active',
          startedAt: now,
          source: 'ops',
        },
        ...prev,
      ]);
      setResponders((prev) =>
        prev.map((r) =>
          r.id === 'R-ECHO-1' ? { ...r, status: 'en_route', location: { lng: 103.83, lat: 1.305 } } : r
        )
      );
      setChat((prev) => [
        ...prev,
        {
          id: newId('DEMO-CH'),
          caseId,
          authorId: 'system',
          kind: 'system',
          text: 'DEMO case injected: crash event, active room, Echo-1 assignment, and Host command surface ready.',
          ts: now,
        },
      ]);
      setActiveCaseId(caseId);
      setDrawerContent('case_lobby');
      return;
    }

    const eventId = newId('DEMO-VOL');
    setVolunteerEvents((prev) => [
      {
        id: eventId,
        title: 'DEMO · AED responder mobilisation drive',
        category: 'first_aid_training',
        description: 'Demo community workflow for event creation, responder signup, and skills matching.',
        location: { lng: 103.85, lat: 1.3 },
        venue: 'City Hall community room',
        organizer: 'God Mode demo',
        organizerRole: 'ops',
        date: new Date(now + 86_400_000).toISOString().slice(0, 10),
        status: 'upcoming',
        skillsNeeded: ['AED', 'CPR', 'First Aid'],
        registeredResponderIds: [],
        createdAt: now,
      },
      ...prev,
    ]);
    setDrawerContent('volunteer_events');
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
    () => {
      const verifiedEvents = events.filter((e) => e.status === 'verified').length;
      const activeSos = sosSessions.filter((s) => !['resolved', 'cancelled'].includes(s.status)).length;
      if (role === 'ops') {
        return verifiedEvents + activeSos + reports.filter((r) => r.status === 'pending' || r.status === 'claimed').length;
      }
      if (role === 'responder') return verifiedEvents + activeSos + cases.filter((c) => c.state !== 'resolved').length;
      return verifiedEvents + notifications.filter((n) => n.roles.includes('citizen')).length;
    },
    [events, reports, sosSessions, cases, notifications, role]
  );

  const value: AppState = {
    isAuthenticated,
    role,
    setRole,
    demoLogin,
    demoLogout,
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
    declareIncident,
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
    runDemoScenario,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
};
