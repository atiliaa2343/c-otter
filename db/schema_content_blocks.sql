-- Admin content editor (CMS)
-- Run schema_accounts.sql first — this references public.profiles.
--
-- One row = one editable piece of content (a block of text, or one image)
-- on one tab of the app. The admin dashboard reads and writes this table
-- instead of content being hardcoded in the app's source files.

create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  tab text not null,              -- e.g. 'coloring_book', 'health', 'faculty', 'contact'
  section_key text not null,      -- e.g. 'hero_title', 'cover_image' — which spot within that tab
  type text not null check (type in ('text', 'image')),
  value text,                     -- text content, when type = 'text'
  image_url text,                 -- Supabase Storage URL, when type = 'image'
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now(),
  unique (tab, section_key)
);

alter table public.content_blocks enable row level security;

-- Anyone — including a signed-out visitor — can read content, since it's
-- what renders in the app for everyone
create policy "content_blocks_select_all" on public.content_blocks
  for select using (true);

-- Only admins can add, change, or remove content
create policy "content_blocks_write_admin" on public.content_blocks
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
  );

-- Image uploads need a Storage bucket named `content-images`, created by
-- hand in the Supabase dashboard first: Storage → New bucket → mark it
-- Public. Then run these two policies:
--
-- create policy "content_images_public_read" on storage.objects
--   for select using (bucket_id = 'content-images');
--
-- create policy "content_images_admin_write" on storage.objects
--   for all using (
--     bucket_id = 'content-images'
--     and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin')
--   );
