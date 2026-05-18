// Role-preview gate per DESIGN.md § 6.3.
// Operator cannot publish until they've seen each role's view.

import { useState, type ReactNode } from 'react';
import { CheckCircle2, Eye } from 'lucide-react';

interface Tab {
  role: 'citizen' | 'responder' | 'ops';
  label: string;
  content: ReactNode;
}

interface Props {
  tabs: Tab[];
  onAllSeen?: () => void;
  className?: string;
}

export default function RolePreviewTabs({ tabs, onAllSeen, className = '' }: Props) {
  const [active, setActive] = useState(tabs[0]?.role);
  const [seen, setSeen] = useState<Set<string>>(new Set([tabs[0]?.role ?? '']));

  const switchTo = (role: string) => {
    setActive(role as Tab['role']);
    const next = new Set(seen);
    next.add(role);
    setSeen(next);
    if (next.size === tabs.length && onAllSeen) onAllSeen();
  };

  const allSeen = seen.size === tabs.length;
  const activeTab = tabs.find((t) => t.role === active);

  return (
    <div className={`border border-border-strong bg-surface-0 ${className}`}>
      <div className="flex border-b border-border-strong">
        {tabs.map((tab) => {
          const isActive = active === tab.role;
          const isSeen = seen.has(tab.role);
          return (
            <button
              key={tab.role}
              onClick={() => switchTo(tab.role)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] uppercase font-black tracking-widest border-r border-border-strong last:border-r-0 cursor-pointer transition-colors ${
                isActive
                  ? 'bg-surface-3 text-text-inverse'
                  : 'bg-surface-0 text-text-primary hover:bg-surface-2'
              }`}
            >
              {isSeen ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <Eye className="w-3 h-3 opacity-50" />
              )}
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="p-4 bg-surface-2 min-h-[160px]">
        {activeTab?.content}
      </div>
      <div
        className={`px-4 py-2 border-t border-border-strong text-[10px] uppercase font-bold tracking-widest ${
          allSeen
            ? 'bg-accent-success text-surface-3'
            : 'bg-accent-warning text-text-primary'
        }`}
      >
        {allSeen
          ? 'All role previews acknowledged. Publish unlocked.'
          : `Preview ${seen.size} of ${tabs.length} roles. Tap each before publish.`}
      </div>
    </div>
  );
}
