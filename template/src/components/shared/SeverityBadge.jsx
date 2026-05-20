import React from 'react';
import { Badge } from '@/components/ui/badge';

const severityConfig = {
  low: { label: 'Low', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  medium: { label: 'Medium', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  high: { label: 'High', className: 'bg-orange-100 text-orange-700 border-orange-200' },
  critical: { label: 'Critical', className: 'bg-red-100 text-red-700 border-red-200' },
};

export default function SeverityBadge({ severity }) {
  const config = severityConfig[severity] || severityConfig.low;
  return (
    <Badge variant="outline" className={`${config.className} text-[10px] uppercase tracking-wider font-semibold`}>
      {config.label}
    </Badge>
  );
}