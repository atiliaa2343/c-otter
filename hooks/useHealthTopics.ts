import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';

export interface HealthTopic {
  id: string;
  title: string;
  description: string | null;
  color: string;
  image_url: string | null;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useHealthTopics() {
  const [topics, setTopics] = useState<HealthTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchTopics = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('health_topics')
          .select('*')
          .order('sort_order', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        if (mounted) {
          setTopics(data ?? []);
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

    fetchTopics();

    return () => {
      mounted = false;
    };
  }, []);

  return { topics, loading, error };
}