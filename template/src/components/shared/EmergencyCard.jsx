import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Clock, AlertTriangle, Flame, Car, CloudRain, Shield, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import SeverityBadge from './SeverityBadge';
import StatusBadge from './StatusBadge';

const categoryIcons = {
  medical: AlertTriangle,
  fire: Flame,
  accident: Car,
  crime: Shield,
  natural_disaster: CloudRain,
  infrastructure: Wrench,
  other: AlertTriangle,
};

const categoryLabels = {
  medical: 'Medical',
  fire: 'Fire',
  accident: 'Accident',
  crime: 'Crime',
  natural_disaster: 'Natural Disaster',
  infrastructure: 'Infrastructure',
  other: 'Other',
};

export default function EmergencyCard({ emergency }) {
  const Icon = categoryIcons[emergency.category] || AlertTriangle;

  return (
    <Link to={`/emergency/${emergency.id}`}>
      <Card className="hover:shadow-md transition-all duration-200 hover:border-primary/20 cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              emergency.severity === 'critical' ? 'bg-red-100' :
              emergency.severity === 'high' ? 'bg-orange-100' :
              emergency.severity === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
            }`}>
              <Icon className={`w-5 h-5 ${
                emergency.severity === 'critical' ? 'text-red-600' :
                emergency.severity === 'high' ? 'text-orange-600' :
                emergency.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm leading-tight truncate">{emergency.title}</h3>
                <SeverityBadge severity={emergency.severity} />
              </div>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{emergency.description}</p>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span className="truncate max-w-[140px]">{emergency.address}</span>
                </span>
                <StatusBadge status={emergency.status} />
              </div>
              <div className="flex items-center gap-1 mt-1.5 text-[11px] text-muted-foreground">
                <Clock className="w-3 h-3" />
                {format(new Date(emergency.created_date), 'dd MMM, HH:mm')}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}