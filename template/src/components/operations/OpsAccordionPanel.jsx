import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Crosshair, AlertTriangle, ShieldCheck, Activity } from 'lucide-react';
import MissionAssignmentPanel from './MissionAssignmentPanel';
import EmergencyEventsPanel from './EmergencyEventsPanel';
import CivilianReportVerificationPanel from './CivilianReportVerificationPanel';

function AccordionSection({ title, icon: Icon, iconColor, badge, badgeColor, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2.5 px-4 py-3.5 hover:bg-gray-50 transition-colors"
      >
        <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
        <span className="font-bold text-sm text-gray-800 flex-1 text-left">{title}</span>
        {badge > 0 && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeColor || 'bg-red-500 text-white'} mr-0.5`}>
            {badge}
          </span>
        )}
        {open
          ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />
        }
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

export default function OpsAccordionPanel({
  responders, emergencies, emergencyZones,
  userLocation, onMapRefresh,
}) {
  const pendingReports = emergencies.filter(e => e.status === 'reported');
  const activeZones = emergencyZones.filter(z => z.status !== 'archived');
  const availableResponders = responders.filter(r => r.is_available);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <h2 className="font-bold text-sm text-gray-800">Ops Panel</h2>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
            <Activity className="w-2.5 h-2.5 inline mr-1" />LIVE
          </span>
        </div>
      </div>

      {/* Live stats bar */}
      <div className="grid grid-cols-3 gap-2 px-3 py-2.5 border-b border-gray-100 bg-white shrink-0">
        <div className="text-center">
          <p className="text-lg font-bold text-red-600">{emergencies.filter(e => ['reported','responding'].includes(e.status)).length}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Active</p>
        </div>
        <div className="text-center border-x border-gray-100">
          <p className="text-lg font-bold text-green-600">{availableResponders.length}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Available</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-orange-500">{pendingReports.length}</p>
          <p className="text-[9px] text-gray-400 uppercase tracking-wider">Pending</p>
        </div>
      </div>

      {/* Scrollable accordions */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <AccordionSection
          title="Mission Assignment"
          icon={Crosshair}
          iconColor="text-green-700"
          badge={availableResponders.length}
          badgeColor="bg-green-600 text-white"
          defaultOpen={true}
        >
          <MissionAssignmentPanel
            responders={responders}
            emergencies={emergencies}
            userLocation={userLocation}
          />
        </AccordionSection>

        <AccordionSection
          title="Emergency Events"
          icon={AlertTriangle}
          iconColor="text-orange-500"
          badge={activeZones.length}
          badgeColor="bg-orange-500 text-white"
          defaultOpen={activeZones.length > 0}
        >
          <EmergencyEventsPanel zones={activeZones} />
        </AccordionSection>

        <AccordionSection
          title="Civilian Report Verification"
          icon={ShieldCheck}
          iconColor="text-blue-500"
          badge={pendingReports.length}
          badgeColor="bg-blue-500 text-white"
          defaultOpen={pendingReports.length > 0}
        >
          <CivilianReportVerificationPanel reports={pendingReports} />
        </AccordionSection>
      </div>
    </div>
  );
}