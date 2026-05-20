// Domain types for Kampung Kaki, grouped by cluster.
// Clusters reflect the CSOT relation tree — see ./relations.ts.

import type { SeverityLevel } from '../components/primitives/SeverityChip';

export type Role = 'citizen' | 'responder' | 'ops';
export type ShellState = 'S0' | 'S2' | 'S4' | 'S6' | 'S9';
export type HostWorkspace =
  | 'citizen_alert'
  | 'citizen_assistant'
  | 'responder_case'
  | 'responder_mission'
  | 'ops_command';

export interface LngLat {
  lng: number;
  lat: number;
}

// ──────────────────────────────────────────────────────────────────────
// CLUSTER · intake  (citizen-originated signals)
// reports → (ops verify) → incidents
// sos → (responder accept) → assignment
// ──────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────
// CLUSTER · incidents  (ops-published canonical truth)
// events ↔ zones (zones extend events with polygon area)
// events.caseId → operations.cases
// ──────────────────────────────────────────────────────────────────────

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
  // Responder-initiated case-formation request. Set when a responder taps
  // "Request ops case" on the verified event; cleared when ops accepts
  // (case created via assignIncident) or declines.
  caseRequestedBy?: string;
  caseRequestedAt?: number;
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

// ──────────────────────────────────────────────────────────────────────
// CLUSTER · operations  (live response work)
// cases ↔ chat (chat[].caseId → cases.id)
// cases.members[] → responders[].id
// responders.assignedSosId → intake.sos.id
// ──────────────────────────────────────────────────────────────────────

export interface Responder {
  id: string;
  name: string;
  org: 'SCDF' | 'Volunteer' | 'SPF' | 'SAF' | 'Medic' | 'NEA' | 'LTA';
  role: 'medic' | 'fire' | 'search' | 'aux';
  status: 'ready' | 'en_route' | 'on_scene' | 'out' | 'offline';
  location: LngLat;
  assignedSosId?: string;
  groups: string[];
  unitType?: 'volunteer' | 'professional';
  demo?: boolean;
  covert?: boolean;
  note?: string;
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

// ──────────────────────────────────────────────────────────────────────
// CLUSTER · network  (community + identity)
// users (identity), groups (org/capability cadres), volunteerEvents (planned)
// ──────────────────────────────────────────────────────────────────────

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

export interface Group {
  id: string;
  name: string;
  org: string;
  kind: 'org' | 'capability' | 'geo' | 'community';
  members: string[];
  description: string;
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

// ──────────────────────────────────────────────────────────────────────
// CLUSTER · intel  (signals, logs, awareness)
// sources (provider health), liveSnapshot (NEA), actionLogs (audit), notifications (push)
// ──────────────────────────────────────────────────────────────────────

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

// ──────────────────────────────────────────────────────────────────────
// CLUSTER · presentation  (ephemeral shell + UI selection state)
// ──────────────────────────────────────────────────────────────────────

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

export type { SeverityLevel };
