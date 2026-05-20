import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Target, ClipboardList, Users } from 'lucide-react';
import CurrentMissionPanel from './CurrentMissionPanel';
import AssignmentsPanel from './AssignmentsPanel';
import JoinableMissionsPanel from './JoinableMissionsPanel';

function AccordionSection({ title, icon: Icon, iconColor, count, children, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <Icon className={`w-4 h-4 ${iconColor} shrink-0`} />
        <span className="font-bold text-sm text-gray-800 flex-1 text-left">{title}</span>
        {count > 0 && (
          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-1">{count}</span>
        )}
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400 shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400 shrink-0" />}
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
}

export default function OperationalSidePanel({ currentMission, assignments, emergencies, events, userLocation, onMissionUpdate }) {
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Panel header */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-200 bg-white shrink-0">
        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
        <h2 className="font-bold text-sm text-gray-800">Operational Panel</h2>
        <span className="ml-auto text-[10px] text-gray-400 font-medium uppercase tracking-wider">Live</span>
      </div>

      {/* Scrollable sections */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        <AccordionSection
          title="Current Mission"
          icon={Target}
          iconColor="text-red-500"
          count={currentMission ? 1 : 0}
          defaultOpen={!!currentMission}
        >
          <CurrentMissionPanel mission={currentMission} onMessageSent={onMissionUpdate} />
        </AccordionSection>

        <AccordionSection
          title="Assignments"
          icon={ClipboardList}
          iconColor="text-amber-500"
          count={assignments.length}
          defaultOpen={assignments.length > 0}
        >
          <AssignmentsPanel assignments={assignments} />
        </AccordionSection>

        <AccordionSection
          title="Joinable Missions"
          icon={Users}
          iconColor="text-blue-500"
          count={0}
          defaultOpen={true}
        >
          <JoinableMissionsPanel
            emergencies={emergencies}
            events={events}
            userLocation={userLocation}
          />
        </AccordionSection>
      </div>
    </div>
  );
}