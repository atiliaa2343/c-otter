import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';

export interface CommunityListing {
  id: string;
  item_id: string;
  title: string;
  description: string | null;
  contact: string | null;
  date_time: string | null;
  link: string | null;
  sort_order: number;
}

export interface CommunityItem {
  id: string;
  category_id: string;
  title: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
  listings: CommunityListing[];
}

export interface CommunityCategory {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  color: string;
  sort_order: number;
  items: CommunityItem[];
}

export interface UseCommunityContentResult {
  categories: CommunityCategory[];
  loading: boolean;
  error: Error | null;
  reload: () => void;
}

/**
 * Loads the whole community tree in one pass: categories, their items, and
 * each item's listings. Three sequential queries rather than a relational
 * select, because the generated types don't model the joins and the nesting
 * is shallow and fixed.
 */
export function useCommunityContent(): UseCommunityContentResult {
  const [categories, setCategories] = useState<CommunityCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const { data: categoryRows, error: categoryError } = await supabase
          .from('community_categories')
          .select('*')
          .order('sort_order', { ascending: true });
        if (categoryError) throw categoryError;

        const { data: itemRows, error: itemError } = await supabase
          .from('community_items')
          .select('*')
          .order('sort_order', { ascending: true });
        if (itemError) throw itemError;

        const { data: listingRows, error: listingError } = await supabase
          .from('community_listings')
          .select('*')
          .order('sort_order', { ascending: true });
        if (listingError) throw listingError;

        if (!mounted) return;

        const items = (itemRows ?? []).map((item) => ({
          ...item,
          listings: (listingRows ?? []).filter((l) => l.item_id === item.id),
        }));

        setCategories(
          (categoryRows ?? []).map((category) => ({
            ...category,
            items: items.filter((i) => i.category_id === category.id),
          }))
        );
        setError(null);
      } catch (err) {
        if (mounted) setError(err as Error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [nonce]);

  return { categories, loading, error, reload };
}
