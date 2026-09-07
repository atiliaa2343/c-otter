# Health Data & Accounts — Week 1 Decisions

Covers the four things Week 1 of the semester plan called for: the sign-in system, the admin content model, the health data model, and what Apple Health / Health Connect can actually give us. Nothing here has been run against the live database yet — the three `.sql` files below are ready to hand to whoever has access to the Supabase project.

## Sign-in system: Supabase Auth

We're using Supabase's built-in authentication instead of the old hand-rolled login in `backend/index.js` (plaintext passwords sitting in an in-memory array — not something to build on). One sign-in system covers both regular users and admins: everyone signs up through Supabase Auth, and a `role` column on a `profiles` table decides who's an admin.

Run `db/schema_accounts.sql` first. It creates the `profiles` table, auto-fills it whenever someone signs up, and locks it down with row-level security so people can only see their own profile (admins can see everyone's, for the dashboard's user count).

There's no "make me an admin" button yet — for now, promote someone by hand:
```sql
update public.profiles set role = 'admin' where email = 'someone@example.com';
```

## Admin content editor: `content_blocks`

Every piece of admin-editable text or image becomes one row: which tab it's on, which spot within that tab, and its current value. The admin dashboard will read and write this table instead of content being hardcoded in the app's source files.

Run `db/schema_content_blocks.sql` next. Anyone can read this table — it's what renders in the app for everyone — but only admins can change it. Image uploads need a Storage bucket named `content-images`, created by hand in the Supabase dashboard (Storage → New bucket → mark it Public) — the two policies to run afterward are commented at the bottom of that file.

## Health data: three tables

- `questionnaire_responses` — raw answers from the intake questionnaire, one row per submission.
- `wearable_connections` — which platform (Apple Health, Health Connect, or manual entry) a person has connected, and when it last synced.
- `health_metrics` — the actual readings: heart rate and sleep, tagged with where they came from and whether they got flagged as unusual.

Run `db/schema_health_data.sql` last. Every table is locked down so a person can only ever see their own data.

## What Apple Health and Health Connect actually give us

**Apple Health (iPhone)**
- Already has heart rate and sleep data *if* the person's watch or band writes into it — most mainstream ones do.
- Reading it requires a system permission prompt; the person has to say yes, per data type, the first time.
- It's a native iOS feature, so it doesn't work in Expo Go. Whoever builds this needs a custom build of the app to test on (`npx expo prebuild` plus a development build — not the usual `npx expo start` + Expo Go).
- The app's config needs two lines explaining why we want the data (Apple requires this to be shown to the user). No approval wait to *test* this — only to publish to the App Store later.

**Health Connect (Android)**
- Same idea, for Android. Built into newer phones; older phones install it as a separate free app from the Play Store.
- Also needs a custom build to test — not Expo Go, and not the plain Android emulator unless Health Connect is set up on it.
- Google requires a public privacy policy link before this can go live on the Play Store. Worth having one ready before that point; not urgent yet.

**Either way**
- Our app only *reads* this data — it doesn't create it. If someone's smart band never sends its data into Apple Health or Health Connect in the first place, connecting our app to their phone won't produce anything.
- Likely libraries: `react-native-health` for Apple Health, `react-native-health-connect` for Health Connect. Both are native modules, not just an `npm install` — budget setup time for that in week 4 of the plan.

## What we're actually collecting this semester

Apple Health and Health Connect can report dozens of things — blood pressure, blood oxygen, blood glucose, menstrual cycles, nutrition, body composition, and more. The original goal was heart rate and sleep, so that's the scope: **heart rate, sleep, and steps** (steps because they're simple and give useful context). Everything else stays out of the schema and out of the consent screen for now. If that changes, it's a deliberate decision to make together, not something that creeps in because the platform happens to offer it.

## Modeling decisions worth knowing

- **Live vs. stored.** When someone opens the app, "today's steps so far" is read straight from the phone in the moment — it's never written to our database, because it's still changing. Only a finished daily summary (yesterday's total sleep, yesterday's resting heart rate) gets saved to `health_metrics`. That's one row per person, per day, per metric.
- **Sleep is dated by wake-up, not bedtime.** A night that starts Monday and ends Tuesday morning is stored as Tuesday's sleep — pick one convention and stay consistent, or "last night" gets ambiguous fast.
- **Missing days mean missing data, not zero.** If someone doesn't open the app or doesn't sync for a few days, there's simply no row for those days — don't backfill zeros, and don't assume a gap means something abnormal.
- **Every reading traces back to where it came from.** `health_metrics.wearable_connection_id` links a reading to the specific connection that produced it (null for anything typed in by hand), so if a source turns out to be unreliable, it's traceable.

