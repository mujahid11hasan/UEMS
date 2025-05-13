import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface Venue {
  id: string;
  name: string;
  capacity: number;
  created_by: string;
  creator: {
    role: string;
  };
}

export function useVenues() {
  const { supabase } = useAuth();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('venues')
        .select(`
          id,
          name,
          capacity,
          created_by,
          creator:profiles!venues_created_by_fkey (
            role
          )
        `)
        .eq('creator.role', 'admin')
        .order('name');

      if (error) throw error;
      setVenues(data || []);
    } catch (err: any) {
      console.error('Error fetching venues:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { venues, loading, error, refetch: fetchVenues };
}