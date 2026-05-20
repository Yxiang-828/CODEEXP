// Horizontal step pipeline for SOS / assignment lifecycle.
// Per DESIGN.md § 3.4 - Grab-style filled progression.

import { Check } from 'lucide-react';

interface Props {
  steps: string[];
  currentIndex: number; // 0-based; -1 means none reached
  failed?: boolean;
  className?: string;
}

export default function StatusPipeline({
  steps,
  currentIndex,
  failed = false,
  className = '',
}: Props) {
  return (
    <div className={`overflow-x-auto border border-border-strong bg-surface-0 shadow-[2px_2px_0px_rgba(26,26,26,1)] ${className}`}>
      <div className="flex items-stretch min-w-max">
      {steps.map((label, i) => {
        const reached = i <= currentIndex;
        const isCurrent = i === currentIndex;
        const tone = failed && isCurrent
          ? 'bg-accent-critical text-text-inverse'
          : reached
          ? 'bg-surface-3 text-text-inverse'
          : 'bg-surface-0 text-text-muted';
        return (
          <div
            key={label}
            className={`min-w-[112px] flex-1 flex items-center justify-center gap-2 px-2 py-2 text-[9px] uppercase font-bold tracking-widest border-r border-border-strong last:border-r-0 ${tone}`}
          >
            <span className={`inline-flex w-4 h-4 items-center justify-center border border-border-strong ${
              reached ? 'bg-accent-success text-text-primary' : 'bg-surface-1'
            }`}>
              {reached && <Check className="w-3 h-3" />}
            </span>
            <span className="truncate">{label}</span>
          </div>
        );
      })}
      </div>
    </div>
  );
}
