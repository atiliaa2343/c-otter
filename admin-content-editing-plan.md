# Admin Content Editing — Where to Start

Goal: let an admin edit any page and anything on it, from inside the app, instead of a developer hand-editing hardcoded arrays in components.

## What already exists

The database side of this is already fully designed — it just isn't wired up to the app yet.

- **Accounts & roles** (`db/schema_accounts.sql`) — `profiles.role` is `'user'` or `'admin'`, enforced by row-level security (RLS). No UI work needed here; a role is promoted by hand today (`update profiles set role='admin' where email=...`).
- **`content_blocks` table** (`db/schema_content_blocks.sql`) — one row per `(tab, section_key)`, holding either `value` (text) or `image_url`. Public read, admin-only write, already enforced by RLS.
- **`db/seed_content_blocks.sql`** — already seeded with the *exact* copy currently hardcoded in the app (e.g. `('home', 'hero_title', 'text', 'Ce. OTTER')`, `('contact', 'emergency_notice', 'text', '...')`). This is the map of which strings on which page are supposed to become editable.
- **List tables** (`db/schema_lists.sql`) — `faculty_members`, `health_topics`, `home_events`. Same RLS pattern (public read, admin write), and `db/seed_lists.sql` seeds them to match `Faculty.tsx` / `Health.tsx` / `HomePage.tsx` exactly.
- **`db/database.types.ts`** already has generated types for all of the above, so typed Supabase queries are ready to write.
- **`components/AdminPanel.tsx`** and **`app/admin/dashboard.tsx`** — the shell exists (login/register, a tab bar for Health/Faculty/Research/Content, a stats screen). But the tab content is a placeholder: a static "Management Tools" card and hardcoded stat numbers (`12` / `8` / `4`) that don't come from any query. No actual create/edit/delete exists yet.

**Nothing in the app currently reads from `content_blocks` or the list tables.** Every page still renders its own hardcoded array or string. (`app/index.tsx` does fetch `hours_of_operation` from Supabase, but the result is never rendered anywhere — treat that as an unfinished example, not a working reference.)

## The two content shapes

1. **Single text/image fields** → `content_blocks`. Page titles, subtitles, hero copy, disclaimers, footer text. Already seeded for every tab.
2. **Repeating structured items** → a dedicated table. `faculty_members`, `health_topics`, `home_events` already exist. **Research publications and Community opportunities/events don't have tables yet** — they're still 100% hardcoded with no schema.

## Suggested build order

### 1. Confirm the schema is actually live
Run these against the Supabase project's SQL editor, in this order (each comment at the top of the file says what it depends on):
`schema_accounts.sql` → `schema_content_blocks.sql` → `schema_lists.sql` → `schema_locations.sql` → `schema_resources.sql` → `schema_health_data.sql`, then the three `seed_*.sql` files. Check the Table Editor to confirm rows exist before writing any app code against them.

### 2. Create the image storage bucket
`content_blocks.image_url` needs a Supabase Storage bucket named `content-images` (Storage → New bucket → **Public**), then the two policies commented out at the bottom of `schema_content_blocks.sql`. Also add an image picker — it's not in `package.json` yet: `npx expo install expo-image-picker`.

### 3. Build one shared fetch layer before touching any page
Add a hook (e.g. `hooks/useContentBlocks.ts`) that takes a `tab` string and returns `{ [section_key]: value | image_url }` plus a loading flag. Give it a fallback: the exact hardcoded copy already in each component, so a page never breaks if a row is missing or the fetch fails. Do the same for the list tables (one hook per table, or a small generic one, ordered by `sort_order`).

### 4. Wire pages to read from Supabase, one at a time
Order that matches what's already seeded and easiest first:

1. **`components/Contact.tsx`** — `page_title` / `page_subtitle` / `emergency_notice` / `footer_text` / `footer_subtext`. Pure `content_blocks`, no list table involved.
2. **`components/Faculty.tsx`** — `page_title` / `page_subtitle` / `lab_title` / `lab_description` / `lab_institution` from `content_blocks`, plus the `faculty_members` list.
3. **`components/Health.tsx`** — `page_title` / `page_subtitle` from `content_blocks`, plus the `health_topics` list.
4. **`components/HomePage.tsx`** — `hero_title` / `hero_tagline` / `mission_text` from `content_blocks`, plus the `home_events` list.
5. **`components/Research.tsx`** / **`components/Community.tsx`** — `page_title`/`page_subtitle` already have `content_blocks` rows, but publications and community listings are still hardcoded arrays with no table. That's new schema work — see step 6.

For each page: swap the hardcoded value for the fetched one, but keep the hardcoded value as the hook's fallback default rather than deleting it — don't let a missing row blank out a page.

### 5. Replace the AdminPanel placeholders with real CRUD

Decision made: admins edit through the existing separate dashboard (`components/AdminPanel.tsx`), not by tapping directly on the live pages. That means the panel's tab bar and per-tab content area are the actual surface being built — right now both are placeholders (the tab bar only has Health/Faculty/Research/Content, and the content area is a static "Management Tools" card with hardcoded `12`/`8`/`4` stat numbers).

**Tab bar gap to fix first:** `content_blocks` covers seven tabs (`home`, `health`, `faculty`, `contact`, `community`, `research`, `coloring_book`), but only three of those (health, faculty, research) have a corresponding AdminPanel tab today — and there's no tab at all for editing `home_events` or a future `community_items` list. Either add Home and Community tabs, or restructure the tab bar into two groups: **Pages** (a sub-picker for which tab's `content_blocks` to edit — this replaces the single "Content" tab) and **Lists** (Faculty / Health topics / Home events / Research publications / Community items).

**New components to build:**
- `ContentBlockRow` — one `content_blocks` row. If `type === 'text'`, a multi-line text input with a Save button that's disabled until the value changes. If `type === 'image'`, the current image preview plus a "Change image" button.
- `ImagePickerField` — wraps `expo-image-picker`; shows a preview, uploads to the `content-images` bucket, shows upload progress, and returns the new public URL on success.
- `ListItemCard` — a generic row for one item from any list table (faculty member, health topic, home event, research publication, community item), showing its key fields with Edit and Delete actions.
- `ListItemFormModal` — add/edit form, fields driven by which table it's editing (e.g. `faculty_members` needs name/title/email/phone/image/is_director; `health_topics` needs title/description/color/image). Reuse for both "add new" and "edit existing."
- Reorder control — up/down arrows per row to adjust `sort_order` (simpler to ship than drag-and-drop; revisit later if it's not good enough).
- Delete confirmation — `Alert.alert`, matching the confirm pattern already used elsewhere in the app.

**States every tab needs:** a loading spinner while fetching, an empty state when a table has zero rows ("No health topics yet — add one"), and a save/delete success-or-error message (`Alert.alert` is fine, no new toast library needed).

Save `content_blocks` edits as an `upsert` on `(tab, section_key)`, since that's the table's unique constraint. RLS already blocks non-admin writes at the database level — the UI doesn't need to duplicate that check, but should surface a clear error if a write is ever rejected.

### 6. Add schema for anything still fully hardcoded
Research publications and Community opportunities/events have no table yet. Follow the exact pattern already in `schema_lists.sql` (public `select` policy + admin-only `all` policy checked against `profiles.role`) to add `research_publications` and `community_items` (naming up to you) tables, then seed them from the current hardcoded arrays the same way `seed_lists.sql` does.

### 7. After any schema change
Regenerate `db/database.types.ts` from the live database so queries stay typed.

## Testing checklist
- [ ] Promote a test account to `admin` by hand and confirm the admin panel actually shows their content
- [ ] Confirm a signed-in non-admin's write attempt is rejected by RLS, not just hidden by the UI
- [ ] Edit one `content_blocks` row and confirm the change shows up on the corresponding page after a refresh
- [ ] Add / edit / delete a list item (e.g. a faculty member) and confirm ordering and display update correctly
- [ ] Upload an image through the admin panel and confirm it renders from Supabase Storage on the live page

## Explicitly out of scope for this pass
- The health-tracking tables (`questionnaire_responses`, `wearable_connections`, `health_metrics`) — unrelated to page-content editing, no UI planned for them yet.
- Admin self-registration / invite codes for auto-granting the `admin` role — a separate piece of work from page-content editing.
