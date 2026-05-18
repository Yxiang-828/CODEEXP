import React from 'react';
import { useAppContext } from '../../AppContext';
import { 
  LocalAlertDetail, 
  IncidentGuidance, 
  ReportCompose, 
  NeedHelpSOS, 
  BriefingSpace, 
  AlertsState 
} from './CitizenWorkspaces';
import {
  DutyStatus,
  VerifyCandidate,
  FormCase,
  ActiveAssignments,
  MissionBoard,
  CaseLobby,
  OperationChatRoom
} from './ResponderWorkspaces';
import {
  DeclareIncident,
  DispatchResponder,
  BroadcastComposer,
  OpsGenericList
} from './OpsWorkspaces';

export default function WorkspaceContent({ id }: { id: string }) {
  // Citizen
  if (id === 'local_alert') return <LocalAlertDetail />;
  if (id === 'incident_guidance') return <IncidentGuidance />;
  if (id === 'report_compose') return <ReportCompose />;
  if (id === 'sos_draft') return <NeedHelpSOS />;
  if (id === 'briefing') return <BriefingSpace />;
  if (id === 'alerts') return <AlertsState />;
  
  // Responder
  if (id === 'duty') return <DutyStatus />;
  if (id === 'verify') return <VerifyCandidate />;
  if (id === 'form_case') return <FormCase />;
  if (id === 'assignment_detail') return <ActiveAssignments />;
  if (id === 'mission_board') return <MissionBoard />;
  if (id === 'case_lobby') return <CaseLobby />; // Direct case lobby component
  if (id === 'operation_chat') return <OperationChatRoom />;

  // Ops
  if (id === 'declare' || id === 'incident_ops') return <DeclareIncident />;
  if (id === 'dispatch') return <DispatchResponder />;
  if (id === 'broadcast') return <BroadcastComposer />;
  if (id === 'report_queue') return <OpsGenericList title="Incoming Reports" items={[{ title: 'REP-4921 / Fire', time: '1m ago', desc: 'Smoke spotted from residential block.', targetId: 'declare' }, { title: 'REP-4920 / Medical', time: '5m ago', desc: 'Citizen collapsed on walkway.', targetId: 'declare' }]} />;
  if (id === 'distress_oversight') return <OpsGenericList title="Active Distress Signals" items={[{ title: 'SOS-029 (Citizen)', time: 'Under 1m ago', desc: 'Signal from Jurong East MRT. No corroboration yet.', targetId: 'verify' }]} />;
  if (id === 'case_oversight') return <OpsGenericList title="Case Overview" items={[{ title: 'ALPHA-09', time: 'Active (1h 2m)', desc: 'AYE Multi-vehicle pileup. 4 Responders on scene.', targetId: 'dispatch' }]} />;
  if (id === 'responder_oversight') return <OpsGenericList title="Responder Roster" items={[{ title: 'Unit Bravo-9 (SCDF)', time: 'En Route', desc: 'Assigned to ALPHA-09', targetId: 'dispatch' }, {title: 'Unit Charlie-3 (Vol)', time: 'Standby', desc: 'Available in Sector W21Z', targetId: 'dispatch'}]} />;
  if (id === 'source_health') return <OpsGenericList title="Sensor & Source Health" items={[{ title: 'CCTV Feeds', time: '98% Up', desc: '2 cameras offline in Sector N3.' }, { title: 'Social Listening', time: 'Normal', desc: 'Processing 450 posts/min.'}]} />;

  // Default generic rendering for omitted views
  return (
    <div className="p-6 animate-in fade-in flex flex-col h-full bg-surface-0">
       <div className="border-b border-border-strong pb-4 mb-4">
         <h3 className="text-[10px] font-black tracking-widest text-text-secondary uppercase mb-2 opacity-60">Contextual Flow</h3>
         <p className="text-xl font-serif italic text-text-primary">Order #{id}</p>
       </div>
       <div className="relative pl-8 flex-1 mt-4">
         <div className="absolute left-[7px] top-0 bottom-0 w-[1px] bg-border-strong opacity-20"></div>
         <div className="space-y-8">
           <div className="relative">
             <div className="absolute -left-8 w-4 h-4 rounded-none border border-border-strong bg-accent-success shadow-[2px_2px_0px_rgba(26,26,26,1)]"></div>
             <p className="text-[10px] uppercase font-bold tracking-widest">Request Initiated</p>
             <p className="text-xs text-text-secondary opacity-60 mt-1">12:44:02 PM · User Role</p>
           </div>
           <div className="relative opacity-30">
             <div className="absolute -left-8 w-4 h-4 rounded-none border border-border-strong bg-surface-1"></div>
             <p className="text-[10px] uppercase font-bold tracking-widest">Awaiting Input</p>
             <p className="text-xs text-text-secondary mt-1">System Flow</p>
           </div>
         </div>
       </div>
       <div className="mt-8 pt-6 border-t border-border-strong">
          <div className="bg-accent-warning p-4 border border-border-strong text-[10px] leading-relaxed shadow-[4px_4px_0px_rgba(26,26,26,1)] text-text-primary">
            <strong className="block mb-1 font-bold">WIREFRAME NOTE:</strong> 
            This workspace matches {id}.
          </div>
       </div>
    </div>
  )
}

