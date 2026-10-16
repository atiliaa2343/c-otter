import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';

export interface FacultyMember {
  id: string;
  name: string;
  title: string;
  email: string | null;
  phone: string | null;
  image_url: string | null;
  is_director: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export function useFacultyMembers() {
  const [members, setMembers] = useState<FacultyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchMembers = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('faculty_members')
          .select('*')
          .order('sort_order', { ascending: true });

        if (fetchError) {
          throw fetchError;
        }

        if (mounted) {
          setMembers(data ?? []);
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

    fetchMembers();

    return () => {
      mounted = false;
    };
  }, []);

  return { members, loading, error };
}