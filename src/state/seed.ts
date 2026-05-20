// Demo seed — small, honest, and clearly labelled.
// Real responder/event/SOS data must come from actions, not seed.

import type {
  AppUser,
  CanonicalEvent,
  CaseRoom,
  ChatEntry,
  CitizenReport,
  DistressSession,
  EmergencyZone,
  Group,
  NotificationNotice,
  ActionLog,
  Responder,
  SourceHealth,
  VolunteerEvent,
} from './types';

export const SELF_ID = 'R-ECHO-1';

export const seedGroups: Group[] = [
  {
    id: 'G-SCDF-EAST',
    name: 'SCDF · East District',
    org: 'SCDF',
    kind: 'org',
    members: [],
    description: 'Singapore Civil Defence Force, Eastern operational district.',
  },
  {
    id: 'G-MEDIC-VOL',
    name: 'Medic Volunteers',
    org: 'Volunteer',
    kind: 'capability',
    members: [],
    description: 'Trained first-aid volunteer cadre, island-wide.',
  },
  {
    id: 'G-AED-RESP',
    name: 'AED Responders',
    org: 'Volunteer',
    kind: 'capability',
    members: [],
    description: 'Citizens trained on AEDs. SCDF myResponder programme.',
  },
  {
    id: 'G-FIRE-VOL',
    name: 'Fire Auxiliary',
    org: 'Volunteer',
    kind: 'capability',
    members: [],
    description: 'Auxiliary fire-trained responders for SCDF augmentation.',
  },
];

export const seedResponders: Responder[] = [
  {
    id: SELF_ID,
    name: 'Echo-1',
    org: 'Volunteer',
    role: 'medic',
    status: 'ready',
    location: { lng: 103.85, lat: 1.3 },
    groups: [],
    unitType: 'volunteer',
  },
];

export const seedUsers: AppUser[] = [
  {
    id: 'U-CIV-1',
    username: 'citizen',
    displayName: 'Citizen',
    phone: '',
    primaryRole: 'citizen',
    address: '',
    skills: [],
    available: true,
  },
  {
    id: SELF_ID,
    username: 'echo1',
    displayName: 'Echo-1',
    phone: '',
    primaryRole: 'responder',
    secondaryRole: 'citizen',
    address: '',
    skills: ['First Aid', 'CPR', 'AED'],
    available: true,
  },
  {
    id: 'U-OPS-1',
    username: 'ops',
    displayName: 'Ops',
    phone: '',
    primaryRole: 'ops',
    secondaryRole: 'citizen',
    address: '',
    skills: ['Dispatch', 'Incident command'],
    available: true,
  },
];

export const seedSources: SourceHealth[] = [
  { id: 'src-1', name: 'NEA PSI', state: 'not_configured', lastAgeS: 0 },
  { id: 'src-2', name: 'NEA rainfall', state: 'not_configured', lastAgeS: 0 },
  { id: 'src-3', name: 'NEA 2hr forecast', state: 'not_configured', lastAgeS: 0 },
  { id: 'src-4', name: 'SCDF dispatch', state: 'not_configured', lastAgeS: 0 },
  { id: 'src-5', name: 'MOH alerts', state: 'not_configured', lastAgeS: 0 },
  { id: 'src-6', name: 'OneMap traffic', state: 'not_configured', lastAgeS: 0 },
  { id: 'src-7', name: 'Reports intake', state: 'not_configured', lastAgeS: 0 },
  {
    id: 'src-8',
    name: 'Kampung Kaki backend',
    state: 'not_configured',
    lastAgeS: 0,
    note: 'FastAPI backend not yet connected.',
  },
  {
    id: 'src-9',
    name: 'MQTT bridge',
    state: 'not_configured',
    lastAgeS: 0,
    note: 'Mosquitto bridge not connected.',
  },
  {
    id: 'src-10',
    name: 'OpenRouter Host AI',
    state: 'not_configured',
    lastAgeS: 0,
    note: '/api/host/ask wired. Set OPENROUTER_API_KEY to activate.',
  },
  {
    id: 'src-11',
    name: 'LTA DataMall',
    state: 'not_configured',
    lastAgeS: 0,
    note: 'Requires DATAMALL_ACCOUNT_KEY.',
  },
  {
    id: 'src-12',
    name: 'OneMap API services',
    state: 'not_configured',
    lastAgeS: 0,
    note: 'Tiles live. Geocode/routes need ONEMAP_API_KEY.',
  },
  {
    id: 'src-13',
    name: 'Hospital load',
    state: 'unavailable',
    lastAgeS: 0,
    note: 'No live hospital-load source configured.',
  },
];

export const seedEvents: CanonicalEvent[] = [];
export const seedReports: CitizenReport[] = [];
export const seedSos: DistressSession[] = [];
export const seedZones: EmergencyZone[] = [];
export const seedVolunteerEvents: VolunteerEvent[] = [];
export const seedCases: CaseRoom[] = [];
export const seedChat: ChatEntry[] = [];
export const seedNotifications: NotificationNotice[] = [];
export const seedActionLogs: ActionLog[] = [];
