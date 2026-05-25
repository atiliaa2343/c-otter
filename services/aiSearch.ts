/**
 * AI Search API client for healthcare organizations
 */
import { BACKEND_URL } from '@/constants/BackendConfig';

export interface HealthcareResult {
  id: string;
  title: string;
  description: string;
  color?: string;
  imageKey?: string;
  address?: string;
  phone?: string;
  specialties?: string[];
  hours?: string;
  score?: number;
}

export interface AiSearchResponse {
  query: string;
  response: string;
  results: HealthcareResult[];
}

export async function aiSearch(query: string, options?: { signal?: AbortSignal }): Promise<AiSearchResponse> {
  if (!query || query.trim().length === 0) {
    throw new Error('Query is required');
  }

  const response = await fetch(`${BACKEND_URL}/api/ai/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query: query.trim() }),
    signal: options?.signal,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Search failed');
  }

  return response.json();
}

/**
 * Client-side semantic search fallback (used when backend AI search is unavailable)
 */
export function clientSideSearch(query: string, items: any[]): HealthcareResult[] {
  const term = query.toLowerCase().trim();
  
  return items
    .map(item => {
      let score = 0;
      const searchableText = [
        item.title || '',
        item.summary || '',
        item.description || '',
        item.domain || '',
        item.type || ''
      ].join(' ').toLowerCase();

      // Exact phrase match
      if (searchableText.includes(term)) score += 100;

      // Word matches
      const words = term.split(/\s+/);
      words.forEach(word => {
        if (searchableText.includes(word)) score += 20;
        if (item.title?.toLowerCase().includes(word)) score += 30;
      });

      // Domain boost
      if (item.domain === 'health' || item.domain === 'psychology') score += 10;

      return { ...item, score };
    })
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(item => ({
      id: item._id || item.id || String(Math.random()),
      title: item.title || 'Untitled',
      description: item.summary || item.description || '',
      color: item.color || item.domain === 'health' ? '#8B7FE8' : item.domain === 'mental_health' ? '#2563eb' : '#10b981',
      imageKey: item.imageKey || '',
      address: item.address || item.location || '',
      phone: item.phone || '',
      specialties: item.specialties || [item.domain, item.type].filter(Boolean),
      hours: item.hours || '',
      score: item.score
    }));
}
