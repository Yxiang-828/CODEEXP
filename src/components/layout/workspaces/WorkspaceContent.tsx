import type React from 'react';

import {
  LocalAlertDetail,
  IncidentGuidance,
  ReportCompose,
  NeedHelpSOS,
  SosLive,
  BriefingSpace,
  AlertsState,
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
} from './ResponderWorkspaces';
import {
  DeclareIncident,
  DispatchResponder,
  BroadcastComposer,
  ReportQueue,
  DistressOversight,
  CaseOversight,
  ResponderOversight,
  SourceHealth,
  IncidentOps,
  ZoneManager,
  ReadinessReport,
} from './OpsWorkspaces';

const REGISTRY: Record<string, () => React.JSX.Element> = {
  local_alert: LocalAlertDetail,
  incident_guidance: IncidentGuidance,
  report_compose: ReportCompose,
  sos_draft: NeedHelpSOS,
  sos_live: SosLive,
  briefing: BriefingSpace,
  alerts: AlertsState,
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
  declare: DeclareIncident,
  incident_ops: IncidentOps,
  dispatch: DispatchResponder,
  broadcast: BroadcastComposer,
  report_queue: ReportQueue,
  distress_oversight: DistressOversight,
  case_oversight: CaseOversight,
  responder_oversight: ResponderOversight,
  source_health: SourceHealth,
  zones: ZoneManager,
  readiness: ReadinessReport,
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
