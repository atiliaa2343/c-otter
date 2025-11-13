import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchLatestContent, ContentItem } from '@/services/contentApi';

const CACHE_PREFIX = 'content_cache:';
const MAX_AGE_DAYS = 180; // purge older than this when caching

function dedupe(items: ContentItem[]) {
  const seen = new Map<string, ContentItem>();
  for (const it of items) {
    const key = it.url ?? it.title;
    if (!seen.has(key)) seen.set(key, it);
  }
  return Array.from(seen.values());
}

export function useLatestContent(domain: string, opts?: { type?: string; limit?: number }) {
  const [data, setData] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cacheKey = `${CACHE_PREFIX}${domain}`;

  const loadFromCache = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(cacheKey);
      if (!raw) return;
      const parsed: ContentItem[] = JSON.parse(raw);
      // Filter out very old items
      const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      const filtered = parsed.filter((i) => {
        if (!i.published_at) return true;
        const t = Date.parse(i.published_at);
        return Number.isNaN(t) ? true : t >= cutoff;
      });
      setData(filtered);
    } catch (err) {
      // ignore cache errors
      console.warn('Failed to read cache', err);
    }
  }, [cacheKey]);

  const saveToCache = useCallback(async (items: ContentItem[]) => {
    try {
      const cutoff = Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
      const filtered = items.filter((i) => {
        if (!i.published_at) return true;
        const t = Date.parse(i.published_at);
        return Number.isNaN(t) ? true : t >= cutoff;
      });
      await AsyncStorage.setItem(cacheKey, JSON.stringify(filtered));
    } catch (err) {
      console.warn('Failed to write cache', err);
    }
  }, [cacheKey]);

  const refresh = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      // try network
      const items = await fetchLatestContent({ domain, type: opts?.type ?? '', limit: opts?.limit ?? 20 });
      const unified: ContentItem[] = dedupe(items as ContentItem[]);
      setData(unified);
      await saveToCache(unified);
    } catch (err: any) {
      // fallback: keep existing data and set error
      console.warn('Refresh failed', err);
      // if there's cached data already in state, keep it and show a gentle error
      setError('Network unavailable — showing cached content');
      if (force) {
        // nothing else
      }
    } finally {
      setLoading(false);
    }
  }, [domain, opts?.limit, opts?.type, saveToCache]);

  useEffect(() => {
    // load cache first
    loadFromCache();
    // then try network
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain]);

  return { data, loading, error, refresh };
}
