-- AI search data, moved off MongoDB Atlas Vector Search onto Supabase's
-- pgvector. One row = one resource (the same shape as backend/real_data.json).
-- Populated by db/migrate_resources_to_supabase.js, not by hand.

create extension if not exists vector;

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  type text,
  name text not null,
  description text,
  address text,
  phone text,
  website text,
  tags text[],
  embedding vector(1536),
  created_at timestamptz not null default now()
);

alter table public.resources enable row level security;

-- Read access is public — this is what powers AI search results for everyone
create policy "resources_select_all" on public.resources
  for select using (true);

-- Cosine-similarity search: given a query's embedding, return the closest
-- matches. Called from backend/index.js's /api/ai/search after it embeds
-- the person's search text with OpenAI.
create or replace function public.match_resources(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  type text,
  name text,
  description text,
  address text,
  phone text,
  website text,
  tags text[],
  similarity float
)
language sql stable
as $$
  select
    resources.id,
    resources.type,
    resources.name,
    resources.description,
    resources.address,
    resources.phone,
    resources.website,
    resources.tags,
    1 - (resources.embedding <=> query_embedding) as similarity
  from public.resources
  where resources.embedding is not null
  order by resources.embedding <=> query_embedding
  limit match_count;
$$;
