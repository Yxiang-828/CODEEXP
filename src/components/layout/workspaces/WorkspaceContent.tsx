import type React from 'react';

import {
  LocalAlertDetail,
  IncidentGuidance,
  ReportCompose,
  NeedHelpSOS,
  SosLive,
  BriefingSpace,
  AlertsState,
  CitizenAssistant,
} from './CitizenWorkspaces';
import {
  DutyStatus,
  VerifyQueue,
  FormCase,
  AssignmentDetail,
  MissionBoard,
  CaseLobby,
  GroupsWorkspace,
  ProfileWorkspace,
  VolunteerEvents,
  JoinableMissions,
  ResponderAssistant,
} from './ResponderWorkspaces';
import {
  DeclareIncident,
  DispatchResponder,
  BroadcastComposer,
  ReportQueue,
  CaseRequests,
  DistressOversight,
  CaseOversight,
  ResponderOversight,
  SourceHealth,
  IncidentOps,
  ZoneManager,
  ReadinessReport,
  ActivityLogWorkspace,
  NotificationCenter,
  OpsAssistant,
} from './OpsWorkspaces';
import { MapLayersWorkspace } from './DemoWorkspaces';

const REGISTRY: Record<string, () => React.JSX.Element> = {
  local_alert: LocalAlertDetail,
  incident_guidance: IncidentGuidance,
  report_compose: ReportCompose,
  sos_draft: NeedHelpSOS,
  sos_live: SosLive,
  briefing: BriefingSpace,
  alerts: AlertsState,
  citizen_ai: CitizenAssistant,
  duty: DutyStatus,
  verify: VerifyQueue,
  form_case: FormCase,
  assignment_detail: AssignmentDetail,
  mission_board: MissionBoard,
  case_lobby: CaseLobby,
  groups: GroupsWorkspace,
  profile: ProfileWorkspace,
  volunteer_events: VolunteerEvents,
  joinable_missions: JoinableMissions,
  responder_ai: ResponderAssistant,
  declare: DeclareIncident,
  incident_ops: IncidentOps,
  dispatch: DispatchResponder,
  broadcast: BroadcastComposer,
  report_queue: ReportQueue,
  case_requests: CaseRequests,
  distress_oversight: DistressOversight,
  case_oversight: CaseOversight,
  responder_oversight: ResponderOversight,
  source_health: SourceHealth,
  zones: ZoneManager,
  readiness: ReadinessReport,
  activity_log: ActivityLogWorkspace,
  notifications: NotificationCenter,
  ops_ai: OpsAssistant,
  map_layers: MapLayersWorkspace,
  map_item: MapLayersWorkspace,
};

export default function WorkspaceContent({ id }: { id: string }) {
  const C = REGISTRY[id];
  if (C) return <C />;
  return (
    <div className="p-6 text-[11px] font-mono text-text-secondary">
      No workspace registered for <span className="font-bold">{id}</span>.
    </div>
  );
}
