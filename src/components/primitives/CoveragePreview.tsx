// Coverage preview panel that docks below the map while drawing.
// Per DESIGN.md § 16.3.

import type { LucideIcon } from 'lucide-react';
import { Hash, Users, Smartphone } from 'lucide-react';

interface Props {
  cells: number;
  precision: 'gh4' | 'gh5' | 'gh6' | 'gh7';
  estimatedDevices: number;
  estimatedResidents: number;
  partialCells?: number;
  highReachWarning?: boolean;
  className?: string;
}

export default function CoveragePreview({
  cells,
  precision,
  estimatedDevices,
  estimatedResidents,
  partialCells = 0,
  highReachWarning = false,
  className = '',
}: Props) {
  return (
    <div
      className={`bg-surface-0 border border-border-strong shadow-[4px_4px_0px_rgba(26,26,26,1)] ${className}`}
    >
      <div className="px-4 py-2 border-b border-border-strong bg-surface-3 text-text-inverse flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest">
          Coverage Preview
        </span>
        <span className="text-[9px] font-mono opacity-70">{precision}</span>
      </div>
      <div className="px-4 py-3 grid grid-cols-3 gap-4">
        <Stat icon={Hash} label="Cells" value={cells.toString().padStart(2, '0')} />
        <Stat
          icon={Smartphone}
          label="Devices"
          value={fmt(estimatedDevices)}
        />
        <Stat
          icon={Users}
          label="Residents"
          value={'~' + fmt(estimatedResidents)}
        />
      </div>
      {partialCells > 0 && (
        <div className="px-4 py-2 border-t border-border-strong flex items-center justify-between text-[10px] uppercase font-bold tracking-widest bg-accent-warning text-text-primary">
          <span>{partialCells} partial cell{partialCells === 1 ? '' : 's'}</span>
          <div className="flex gap-1">
            <button className="px-2 py-0.5 bg-surface-0 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              Snap
            </button>
            <button className="px-2 py-0.5 bg-surface-0 border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all">
              Keep
            </button>
          </div>
        </div>
      )}
      {highReachWarning && (
        <div className="px-4 py-2 border-t border-border-strong bg-accent-critical text-text-inverse text-[10px] font-bold uppercase tracking-widest">
          {'> 100k devices · double-check the message'}
        </div>
      )}
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-text-secondary">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-lg font-mono font-bold text-text-primary">{value}</div>
    </div>
  );
}

function fmt(n: number) {
  return n.toLocaleString('en-SG');
}
