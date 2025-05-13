import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: string;
  category: string;
  capacity: number;
  registrations_count: number;
  image_url?: string;
  creator?: {
    name: string;
    role: string;
  };
}

interface UseEventsOptions {
  limit?: number;
  includeRegistrations?: boolean;
}

export function useEvents(options: UseEventsOptions = {}) {
  const { supabase } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const now = new Date().toISOString();
      
      let query = supabase
        .from('events')
        .select(`
          *,
          creator:profiles!events_created_by_fkey (
            name,
            role
          ),
          registrations:registrations (count)
        `)
        .gte('date', now.split('T')[0])
        .order('date', { ascending: true })
        .order('time', { ascending: true });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data: eventsData, error: eventsError } = await query;

      if (eventsError) throw eventsError;

      const processedEvents = eventsData.map(event => ({
        ...event,
        registrations_count: event.registrations?.[0]?.count || 0
      }));

      setEvents(processedEvents);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return { events, loading, error, refetch: fetchEvents };
}