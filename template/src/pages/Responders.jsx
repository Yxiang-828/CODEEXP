import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Phone, MapPin, CheckCircle2, XCircle } from 'lucide-react';

export default function Responders() {
  const { data: responders = [], isLoading } = useQuery({
    queryKey: ['responders'],
    queryFn: () => base44.entities.AppUser.filter({ primary_role: 'responder' }),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-bold flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-blue-500" />
        Responders ({responders.length})
      </h1>

      <div className="space-y-2.5">
        {responders.map((r) => (
          <Card key={r.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="font-semibold text-primary text-sm">
                      {r.display_name?.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{r.display_name}</div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                      <Phone className="w-3 h-3" />
                      {r.phone}
                    </div>
                    {r.address && (
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate max-w-[200px]">{r.address}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {r.is_available ? (
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Available
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground text-[10px]">
                      <XCircle className="w-3 h-3 mr-1" /> Unavailable
                    </Badge>
                  )}
                </div>
              </div>
              {r.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {r.skills.map((skill, i) => (
                    <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{skill}</span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}