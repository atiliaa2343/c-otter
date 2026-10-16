import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';

export interface HomeEvent {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useHomeEvents() {
  const [events, setEvents] = useState<HomeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchEvents = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('home_events')
          .select('*')
          .order('sort_order', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        if (mounted) {
          setEvents(data ?? []);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      mounted = false;
    };
  }, []);

  return { events, loading, error };
}