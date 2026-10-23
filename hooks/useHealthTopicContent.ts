import { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';

export interface HealthResource {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  description: string | null;
}

export interface HealthApp {
  id: string;
  title: string;
  description: string | null;
  features: string[];
  image_url: string | null;
}

export interface UseHealthTopicContentResult {
  /** The health_topics row whose title matches the URL slug, if any. */
  topic: { id: string; title: string } | null;
  resources: HealthResource[];
  apps: HealthApp[];
  loading: boolean;
  error: Error | null;
}

/**
 * The URL segment for a topic, e.g. "Health & Wellness" → "health-and-wellness".
 * The Health tab builds links with this, and the detail page matches on it.
 */
export function slugifyTopic(title: string): string {
  return title
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Loads the local resources and apps for the health topic at /health/<slug>.
 * Topics are matched by slug rather than id so the links keep working
 * without passing ids around — renaming a topic changes its URL, but its
 * resources follow it because they're stored against the topic id.
 */
export function useHealthTopicContent(slug: string): UseHealthTopicContentResult {
  const [topic, setTopic] = useState<UseHealthTopicContentResult['topic']>(null);
  const [resources, setResources] = useState<HealthResource[]>([]);
  const [apps, setApps] = useState<HealthApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      try {
        const { data: topics, error: topicsError } = await supabase
          .from('health_topics')
          .select('id, title');
        if (topicsError) throw topicsError;

        const match = (topics ?? []).find((t) => slugifyTopic(t.title) === slug) ?? null;
        if (!match) {
          if (mounted) {
            setTopic(null);
            setResources([]);
            setApps([]);
            setError(null);
          }
          return;
        }

        const [resourcesResult, appsResult] = await Promise.all([
          supabase
            .from('health_resources')
            .select('id, name, address, phone, description')
            .eq('topic_id', match.id)
            .order('sort_order', { ascending: true }),
          supabase
            .from('health_apps')
            .select('id, title, description, features, image_url')
            .eq('topic_id', match.id)
            .order('sort_order', { ascending: true }),
        ]);
        if (resourcesResult.error) throw resourcesResult.error;
        if (appsResult.error) throw appsResult.error;

        if (mounted) {
          setTopic(match);
          setResources(resourcesResult.data ?? []);
          setApps(appsResult.data ?? []);
          setError(null);
        }
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
  }, [slug]);

  return { topic, resources, apps, loading, error };
}
