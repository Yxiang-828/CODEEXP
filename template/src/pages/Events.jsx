import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import EventCard from '@/components/shared/EventCard';

export default function Events() {
  const [statusFilter, setStatusFilter] = useState('upcoming');
  const [search, setSearch] = useState('');

  const { data: events = [], isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => base44.entities.VolunteerEvent.list('date', 50),
  });

  const filtered = events.filter((e) => {
    const matchStatus = statusFilter === 'all' || e.status === statusFilter;
    const matchSearch = !search ||
      e.title?.toLowerCase().includes(search.toLowerCase()) ||
      e.location?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="font-heading text-xl font-bold flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-primary" />
        Volunteer Events
      </h1>

      <div className="relative mb-4">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search events..."
          className="pl-9 h-10"
        />
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming" className="flex-1">Upcoming</TabsTrigger>
          <TabsTrigger value="completed" className="flex-1">Completed</TabsTrigger>
          <TabsTrigger value="all" className="flex-1">All</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground text-sm">No events found.</CardContent></Card>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((e) => <EventCard key={e.id} event={e} />)}
        </div>
      )}
    </div>
  );
}