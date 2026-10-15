import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';

export interface ResearchPublication {
  id: string;
  citation: string;
  journal: string | null;
  year: number | null;
  is_featured: boolean;
  sort_order: number;
}

export interface UseResearchPublicationsResult {
  publications: ResearchPublication[];
  loading: boolean;
  error: Error | null;
}

export function useResearchPublications(): UseResearchPublicationsResult {
  const [publications, setPublications] = useState<ResearchPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchPublications = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('research_publications')
          .select('id, citation, journal, year, is_featured, sort_order')
          .order('sort_order', { ascending: true });

        if (fetchError) throw fetchError;

        if (mounted) setPublications(data ?? []);
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPublications();
    return () => {
      mounted = false;
    };
  }, []);

  return { publications, loading, error };
}
