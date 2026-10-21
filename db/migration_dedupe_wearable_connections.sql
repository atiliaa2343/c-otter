-- One-time cleanup: duplicate wearable_connections rows
-- Older builds created a new connection row on most app opens (two callers
-- racing on launch, then .maybeSingle() erroring on the duplicates and being
-- read as "no row yet"). Each new row had no last_synced_at, so the sync
-- treated it as a first-ever sync and saved only yesterday — skipping every
-- day since the person last opened the app.
--
-- This keeps one row per person + platform, moves health_metrics onto it, and
-- sets its last_synced_at to the latest sync *before today*, so the next app
-- open backfills the skipped days (re-syncing a day updates its row in place,
-- never duplicates it). Then a unique index stops it from happening again.

begin;

create temp table connection_keep on commit drop as
select
  id,
  first_value(id) over (partition by user_id, platform order by connected_at desc) as keep_id,
  user_id,
  platform
from public.wearable_connections;

update public.health_metrics m
set wearable_connection_id = k.keep_id
from connection_keep k
where m.wearable_connection_id = k.id
  and k.id <> k.keep_id;

update public.wearable_connections w
set last_synced_at = latest.synced
from (
  select k.keep_id, max(w2.last_synced_at) filter (where w2.last_synced_at < current_date) as synced
  from connection_keep k
  join public.wearable_connections w2 on w2.id = k.id
  group by k.keep_id
) latest
where w.id = latest.keep_id
  and latest.synced is not null;

delete from public.wearable_connections w
using connection_keep k
where w.id = k.id
  and k.id <> k.keep_id;

create unique index if not exists wearable_connections_user_platform_key
  on public.wearable_connections (user_id, platform);

commit;

-- Check afterward: should return no rows. If it does, the same day was saved
-- twice for someone; the app copes (it updates the first match), but say so.
select user_id, recorded_at, count(*)
from public.health_metrics
where metric_type = 'JSON'
group by user_id, recorded_at
having count(*) > 1;
