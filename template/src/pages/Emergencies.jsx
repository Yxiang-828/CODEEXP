import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAppAuth } from '@/lib/authContext.jsx';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import EmergencyCard from '@/components/shared/EmergencyCard';

export default function Emergencies() {
  const { currentUser } = useAppAuth();
  const [statusFilter, setStatusFilter] = useState('active');
  const [search, setSearch] = useState('');

  const { data: emergencies = [], isLoading } = useQuery({
    queryKey: ['emergencies'],
    queryFn: () => base44.entities.Emergency.list('-created_date', 50),
  });

  const filtered = emergencies.filter((e) => {
    const matchStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && ['reported', 'acknowledged', 'responding'].includes(e.status)) ||
      e.status === statusFilter;
    const matchSearch = !search || 
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.address?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const isCivilian = currentUser?.active_role === 'civilian';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-xl font-bold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          Emergencies
        </h1>
        {isCivilian && (
          <Link to="/report-emergency">
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Report</Button>
          </Link>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search emergencies..."
          className="pl-9 h-10"
        />
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">Active</TabsTrigger>
          <TabsTrigger value="resolved" className="flex-1">Resolved</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">No emergencies found.</CardContent></Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((e) => <EmergencyCard key={e.id} emergency={e} />)}
        </div>
      )}
    </div>
  );
}