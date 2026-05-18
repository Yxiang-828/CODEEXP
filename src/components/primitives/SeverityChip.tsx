// L1-L5 severity chip per DESIGN.md § 15.1.
// Same five levels for ops, responders, and citizens; only label changes.

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;
export type Audience = 'operator' | 'citizen';

interface Spec {
  code: string;
  operatorLabel: string;
  citizenLabel: string;
  bg: string;
  fg: string;
}

const SPEC: Record<SeverityLevel, Spec> = {
  1: {
    code: 'L1',
    operatorLabel: 'advisory',
    citizenLabel: 'Advisory',
    bg: 'bg-surface-2',
    fg: 'text-text-primary',
  },
  2: {
    code: 'L2',
    operatorLabel: 'notice',
    citizenLabel: 'Notice',
    bg: 'bg-accent-info',
    fg: 'text-text-inverse',
  },
  3: {
    code: 'L3',
    operatorLabel: 'warning',
    citizenLabel: 'Warning',
    bg: 'bg-accent-warning',
    fg: 'text-text-primary',
  },
  4: {
    code: 'L4',
    operatorLabel: 'severe',
    citizenLabel: 'Severe',
    bg: 'bg-accent-critical',
    fg: 'text-text-inverse',
  },
  5: {
    code: 'L5',
    operatorLabel: 'emergency',
    citizenLabel: 'Emergency',
    bg: 'bg-accent-critical',
    fg: 'text-text-inverse',
  },
};

interface Props {
  level: SeverityLevel;
  audience?: Audience;
  showCode?: boolean;
  className?: string;
}

export default function SeverityChip({
  level,
  audience = 'operator',
  showCode = true,
  className = '',
}: Props) {
  const spec = SPEC[level];
  const label = audience === 'operator' ? spec.operatorLabel : spec.citizenLabel;
  return (
    <div
      className={`inline-flex items-stretch border border-border-strong shadow-[2px_2px_0px_rgba(26,26,26,1)] ${className}`}
    >
      {showCode && audience === 'operator' && (
        <div className="bg-surface-3 text-text-inverse px-2 py-1 text-[9px] font-black tracking-widest font-mono leading-none flex items-center">
          {spec.code}
        </div>
      )}
      <div
        className={`${spec.bg} ${spec.fg} px-2 py-1 text-[9px] font-black uppercase tracking-widest leading-none flex items-center`}
      >
        {label}
      </div>
    </div>
  );
}

export function severityRingColor(level: SeverityLevel): string {
  // CSS variable names matching tokens in index.css
  if (level === 1) return 'var(--color-text-primary)';
  if (level === 2) return 'var(--color-accent-info)';
  if (level === 3) return 'var(--color-accent-warning)';
  return 'var(--color-accent-critical)';
}

export function severityPinSize(level: SeverityLevel): number {
  // Pixels per DESIGN.md § 15.2
  return [8, 12, 16, 20, 24][level - 1];
}
