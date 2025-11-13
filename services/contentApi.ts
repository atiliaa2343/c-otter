/**
 * Lightweight content API client used by the app.
 * It calls a configured backend endpoint and returns the JSON payload.
 */
export async function fetchLatestContent({ domain, type = '', limit = 20 }: { domain: string; type?: string; limit?: number }) {
  const apiBase = process.env.EXPO_PUBLIC_CONTENT_API || '';
  const params = new URLSearchParams();
  params.set('domain', domain);
  if (type) params.set('type', type);
  params.set('limit', String(limit));

  const url = apiBase ? `${apiBase.replace(/\/$/, '')}/api/content/latest?${params.toString()}` : `/api/content/latest?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to fetch content: ${res.status} ${res.statusText} ${text}`);
  }
  const json = await res.json();
  // Expecting { data: ContentItem[] }
  return json.data ?? json;
}

export type ContentItem = {
  _id?: string;
  title: string;
  source?: string;
  url?: string;
  published_at?: string;
  summary?: string;
  domain?: string;
  type?: 'news' | 'app' | string;
  tags?: string[];
  ingested_at?: string;
};
