import { Activity, Ambulance, CloudRain, HeartPulse, Route, UsersRound } from 'lucide-react';
import { useAppContext, type DemoScenario } from '../../../AppContext';

const scenarios: Array<{
  id: DemoScenario;
  title: string;
  purpose: string;
  opens: string;
  icon: typeof HeartPulse;
}> = [
  {
    id: 'medical_sos',
    title: 'Medical SOS surge',
    purpose: 'Injects an active SOS plus a matching citizen report for distress intake, verification, and dispatch demos.',
    opens: 'Ops distress oversight',
    icon: HeartPulse,
  },
  {
    id: 'flood_zone',
    title: 'Flash flood zone',
    purpose: 'Injects a verified flood event and declared polygon to demo map overlays, alerts, and zone management.',
    opens: 'Zone manager',
    icon: CloudRain,
  },
  {
    id: 'traffic_case',
    title: 'Traffic case room',
    purpose: 'Injects a crash incident, active case room, assigned responder, and system chat for case workflows.',
    opens: 'Case room',
    icon: Route,
  },
  {
    id: 'volunteer_drive',
    title: 'Volunteer mobilisation',
    purpose: 'Injects a community AED event for responder registration and skills-matching workflow demos.',
    opens: 'Volunteer events',
    icon: UsersRound,
  },
];

export function GodModeWorkspace() {
  const { runDemoScenario, reports, sosSessions, events, zones, cases, volunteerEvents } = useAppContext();

  return (
    <div className="p-4 space-y-4">
      <div className="border-2 border-border-strong bg-accent-warning p-3 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4" />
          <h2 className="text-sm font-black uppercase tracking-widest">God Mode · Demo Injector</h2>
        </div>
        <p className="text-xs font-semibold mt-2 leading-relaxed">
          Demo-only control surface. Buttons below inject labelled synthetic records so teammates can demonstrate specific features without waiting for live backend/API events.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Events" value={events.length} />
        <Metric label="Reports" value={reports.length} />
        <Metric label="SOS" value={sosSessions.length} />
        <Metric label="Zones" value={zones.length} />
        <Metric label="Cases" value={cases.length} />
        <Metric label="Events" value={volunteerEvents.length} />
      </div>

      <div className="space-y-3">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => runDemoScenario(scenario.id)}
            className="w-full text-left border-2 border-border-strong bg-surface-0 p-3 shadow-[3px_3px_0px_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
          >
            <div className="flex gap-3">
              <div className="w-10 h-10 border-2 border-border-strong bg-surface-2 flex items-center justify-center shrink-0">
                <scenario.icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-xs font-black uppercase tracking-widest">{scenario.title}</h3>
                  <span className="text-[8px] font-black uppercase tracking-widest bg-accent-warning border border-border-strong px-1.5 py-0.5">
                    Demo data
                  </span>
                </div>
                <p className="text-xs text-text-secondary font-medium leading-relaxed mt-1">
                  {scenario.purpose}
                </p>
                <div className="mt-2 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Ambulance className="w-3 h-3" />
                  Opens: {scenario.opens}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

export function MapLayersWorkspace() {
  const { selectedMapItem } = useAppContext();
  if (!selectedMapItem) {
    return (
      <div className="p-4 text-xs text-text-secondary font-medium">
        Select a map marker to inspect its details.
      </div>
    );
  }
  return (
    <div className="p-4 space-y-4">
      <div className="border-2 border-border-strong bg-surface-0 p-4 shadow-[4px_4px_0px_rgba(26,26,26,1)]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-accent-critical">
            {selectedMapItem.category}
          </p>
          <span className="text-[8px] font-black uppercase tracking-widest bg-accent-warning border border-border-strong px-1.5 py-0.5">
            {selectedMapItem.source}
          </span>
        </div>
        <h2 className="text-lg font-black uppercase mt-2">{selectedMapItem.title}</h2>
        <p className="text-sm font-medium text-text-secondary mt-3 leading-relaxed">
          {selectedMapItem.detail}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <Metric label="Lat" value={Number(selectedMapItem.lat.toFixed(4))} />
        <Metric label="Lng" value={Number(selectedMapItem.lng.toFixed(4))} />
      </div>

      <button
        onClick={() =>
          window.open(
            `https://www.google.com/maps/search/?api=1&query=${selectedMapItem.lat},${selectedMapItem.lng}`,
            '_blank',
            'noopener,noreferrer'
          )
        }
        className="w-full border-2 border-border-strong bg-surface-3 text-text-inverse px-3 py-2 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0px_rgba(26,26,26,1)]"
      >
        Open in maps
      </button>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-border-strong bg-surface-2 p-2">
      <div className="text-[8px] font-black uppercase tracking-widest text-text-secondary">{label}</div>
      <div className="text-lg font-mono font-black">{String(value).padStart(2, '0')}</div>
    </div>
  );
}
