import React from 'react';
import { Badge } from '@/components/ui/badge';

const statusConfig = {
  reported: { label: 'Reported', className: 'bg-gray-100 text-gray-700 border-gray-200' },
  acknowledged: { label: 'Acknowledged', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  responding: { label: 'Responding', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700 border-green-200' },
  closed: { label: 'Closed', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  upcoming: { label: 'Upcoming', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  ongoing: { label: 'Ongoing', className: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', className: 'bg-green-100 text-green-700 border-green-200' },
  cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700 border-red-200' },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  return (
    <Badge variant="outline" className={`${config.className} text-[10px] uppercase tracking-wider font-semibold`}>
      {config.label}
    </Badge>
  );
}