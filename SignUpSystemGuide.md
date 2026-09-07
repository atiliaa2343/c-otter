# Building Regular User Sign-Up & Login

This is your task for the week: build sign-up and login for regular visitors (not admins — that part is already done and is your reference example). Follow these steps in order.

## 1. Get connected

- Pull the latest code from the repo.
- Ask [teammate/project owner] for two values: the Supabase project URL and the Supabase anon key. Do **not** create your own Supabase project — everyone uses the same one.
- Add them to a `.env` file in the project root (this file is git-ignored, so you're not committing secrets):
  ```
  EXPO_PUBLIC_SUPABASE_URL=...
  EXPO_PUBLIC_SUPABASE_ANON_KEY=...
  ```
- Restart the dev server (`npx expo start`) — it only reads `.env` on startup, not while running.
- Run `npm install` in case dependencies changed.

## 2. Look at the working example first

Admin sign-in already works this exact way — read `app/admin/context/AdminAuthContext.tsx` before writing anything. Your job is the same pattern, minus the admin-only check. Specifically:

- It imports the shared Supabase client from `db/supabase.ts`.
- `supabase.auth.signInWithPassword({ email, password })` logs someone in.
- `supabase.auth.signUp({ email, password, options: { data: { username } } })` creates an account.
- `supabase.auth.getSession()` on app start, plus `supabase.auth.onAuthStateChange(...)`, keeps someone logged in across app restarts.
- `supabase.auth.signOut()` logs out.

You don't need to touch the database or write any SQL — the `profiles` table already exists, and a new row gets created there automatically the moment someone signs up (defaults to `role = 'user'`, which is exactly what a regular visitor should be).

## 3. Build the context

Create something like `context/AuthContext.tsx` (outside the `admin/` folder — this is for everyone, not just admins). It should hold:
- `user` (or `null` if logged out)
- `isLoading`
- `signUp(email, password, username)`
- `login(email, password)`
- `logout()`

**The one real difference from the admin version:** don't check `profiles.role` here. Any successfully authenticated person is allowed in — there's no role gate for regular users. (The admin context checks `role === 'admin'` and signs people back out if it isn't; skip that whole step.)

## 4. Build the screens

Two screens, plain and simple:
- **Sign up**: email, password, confirm password fields, a submit button. On success, the person should be logged in immediately (unlike admin registration, there's no "wait to be approved" step — being a regular user doesn't require anyone's permission).
- **Login**: email, password, submit button.

Use `app/admin/login.tsx` and `app/admin/register.tsx` as layout/style references if it's helpful — same kind of form, same input styling — just don't copy the admin-specific logic.

## 5. Decide where these screens live

These shouldn't be under `app/admin/` — that folder is admin-only. Put them somewhere reachable from the main app (for example, wherever the health tab's "connect a device" flow will point people who aren't logged in yet). Coordinate with whoever's building the questionnaire/health screens, since their work will need someone to be logged in before it can save anything.

## 6. Test it

1. Sign up with a test email.
2. In the Supabase dashboard → Table Editor → `profiles`, confirm a new row appeared with `role = user`.
3. Close and reopen the app — confirm you're still logged in (this checks that step 3's session-restoring code actually works).
4. Log out, then log back in with the same account.

That's the whole task. You will **not** need to: write SQL, create Supabase tables, or build anything admin-related — all of that already exists.
