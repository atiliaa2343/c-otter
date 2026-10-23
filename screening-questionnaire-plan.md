# Screening Questionnaire — Admin Side & Database Plan

Goal: admins write the questions for a screening questionnaire from the admin panel, users answer it on the health tab, and admins filter users by their answers and save the people they pick as a group.

This plan covers the **admin side and the database**. The user-facing health tab screen is only described as far as the database needs it to work.

## How this relates to what already exists

- **`components/HealthQuestionnaire.tsx`** is a separate *intake* questionnaire. Its questions are hardcoded in a `QUESTIONS` array, and it saves every answer as one jsonb blob in `questionnaire_responses`. That's fine for reading one person's answers, but it doesn't work for "find everyone who answered X," and admins can't edit it. **Leave it alone.** The screening questionnaire gets its own tables (below).
- **Admin auth** already works through `profiles.role = 'admin'` (`db/schema_accounts.sql`) and `useAdminAuth()`.
- **`app/admin/dashboard.tsx`** has a `stats | content` tab bar. Screening goes in as a third tab.

## Database design

All of it is in **`db/schema_screening.sql`**.

```
screening_questionnaires   1 ─┬─< screening_questions 1 ─< screening_question_options
                              │
                              ├─< screening_submissions 1 ─< screening_answers
                              │        (one per user per submit)   (one per answer)
                              │
                              └─< screening_cohorts 1 ─< screening_cohort_members >─ profiles
```

| Table | One row is… | Written by |
|---|---|---|
| `screening_questionnaires` | one version of the questionnaire; only one has `is_active = true` at a time | admin |
| `screening_questions` | one question: `prompt`, `type` (`single_choice` / `multi_choice` / `text` / `number`), `is_required`, `sort_order`, `is_active` | admin |
| `screening_question_options` | one answer choice for a choice question (yes/no is just a `single_choice` question with options "Yes" and "No") | admin |
| `screening_submissions` | one time a user submitted the questionnaire | user |
| `screening_answers` | one answer: exactly one of `option_id` / `text_value` / `number_value` is set. A multi-choice answer with 3 boxes ticked is 3 rows | user |
| `screening_cohorts` | a named group an admin picked, plus the filter criteria used to find them (kept for reference) | admin |
| `screening_cohort_members` | one user in one cohort, with a `status` (`selected` → `contacted` → `enrolled` / `declined`) | admin |

### Key decisions

- **One row per answer, not a jsonb blob.** "Users who picked option X on question Y" becomes an indexed join instead of JSON parsing, and an answer can't point at a question or option that doesn't exist.
- **Archive, don't delete.** Once anyone has answered a question, deleting it (or one of its options) is blocked (`on delete restrict` on `screening_answers`). The admin UI should offer **Archive** instead, which sets `is_active = false`: the question disappears from the health tab, but old answers still make sense. Fixing typos in a prompt is fine. Changing what a question *means* should be done as archive + new question.
- **Resubmissions are allowed.** Filters only look at each user's **most recent** submission.
- **Users can insert and read their own answers, but not edit or delete them.** This keeps a cohort's basis from changing underneath it.
- **`public.is_admin()`** is a security definer helper that every new policy uses. Note that the existing `profiles_select_admin` policy queries `profiles` from inside a policy on `profiles`, and Postgres can reject that with "infinite recursion detected in policy". If that error shows up, switch that policy to `using (public.is_admin())` as well.
- **Filtering runs in the database**, via the `screening_match_users(questionnaire_id, criteria)` function. It's `security invoker`, so RLS still applies, and only admins get anyone besides themselves back.

### Filter criteria format

`screening_match_users` takes a jsonb array. A user has to match **every** entry (AND):

```json
[
  { "question_id": "…", "op": "any_of",   "option_ids": ["…", "…"] },
  { "question_id": "…", "op": "gte",      "value": 18 },
  { "question_id": "…", "op": "lte",      "value": 65 },
  { "question_id": "…", "op": "contains", "value": "asthma" }
]
```

| Question type | Ops the filter UI should offer |
|---|---|
| `single_choice` / `multi_choice` | `any_of`: pick one or more options |
| `number` | `gte` and/or `lte` (two entries for a range) |
| `text` | `contains` (case-insensitive) |

OR across different questions isn't supported in v1. Run two filters and add both results to the same cohort if it's needed.

## Admin panel build

All of this lives in a new **Screening** tab on `app/admin/dashboard.tsx` (tab state becomes `'stats' | 'content' | 'screening'`), split into three sub-views.

### 1. Questions (editor)

- On first load, if no `screening_questionnaires` row exists, show a "Create screening questionnaire" button that inserts one with `is_active = true`.
- List the active questionnaire's questions ordered by `sort_order`. Each row shows the prompt, a type badge, a required badge, and Edit / Archive / ↑ / ↓ controls.
- **Add/Edit question modal** with these fields:
  - prompt
  - help text
  - type picker
  - required toggle
  - for choice types, an options list editor (add option, rename, reorder, archive)

  Save writes the question first, then upserts its options.
- **Archive vs delete:** if the question has zero answers (`select count from screening_answers where question_id = …`), offer Delete. Otherwise only offer Archive. Apply the same rule to options.
- Show archived questions in a collapsed "Archived" section with an Unarchive action.
- Bump the active-question counter on the stats tab (`screening_questions` where `is_active`).

### 2. Responses & filter

- **Filter builder:** an "Add condition" button → pick a question → the op input changes with the question's type (checkbox list of options / min–max number fields / text field). Conditions show as removable chips. This state maps 1:1 to the criteria JSON above.
- **Results list:** call `supabase.rpc('screening_match_users', { p_questionnaire_id, p_criteria })`. Show the match count plus email, username, and submitted date per row, each with a checkbox. Include a "Select all" option.
- Tapping a row opens that user's answers. Load them with `screening_answers` + `screening_question_options` for their `submission_id`, and show them in question order, including archived questions labeled as such.
- **"Add selected to cohort"** opens a picker (existing cohort or "New cohort…" with name + notes). On confirm, insert `screening_cohorts` (saving the current criteria) if it's new, then insert `screening_cohort_members` rows. Use `upsert` with `ignoreDuplicates` so re-adding someone doesn't fail.

### 3. Cohorts

- List cohorts with name, member count, and created date.
- Cohort detail shows the member list with a status dropdown (`selected` / `contacted` / `enrolled` / `declined`), a Remove action, the saved criteria as read-only chips, and a "Re-run this filter" button that loads the criteria into the filter view.
- **Export:** a "Copy emails" button (copies to clipboard) is the cheapest useful export. CSV can come later.

### New files (suggested)

| File | Purpose |
|---|---|
| `services/screening.ts` | all Supabase calls: questions CRUD, `matchUsers(criteria)`, cohorts CRUD, `getSubmissionAnswers(id)` |
| `components/admin/ScreeningQuestionList.tsx` | sub-view 1 |
| `components/admin/ScreeningQuestionModal.tsx` | add/edit question + options |
| `components/admin/ScreeningFilter.tsx` | sub-view 2 (filter builder + results) |
| `components/admin/ScreeningUserAnswers.tsx` | one user's answers |
| `components/admin/ScreeningCohorts.tsx` | sub-view 3 |

Every view needs a loading spinner, an empty state ("No questions yet — add one", "No one has submitted yet", "No users match these conditions"), and an `Alert.alert` on save errors, matching the rest of the dashboard.

## User side (only what the database needs)

The health tab loads the active questionnaire's active questions and options, renders them by `type`, and on submit inserts one `screening_submissions` row, then the `screening_answers` rows. Those are two inserts, so if the second one fails, the user is left with an empty submission. If that becomes a problem, wrap both in a `submit_screening(questionnaire_id, answers jsonb)` RPC so they happen in one transaction.

## Build order

1. Run `db/schema_screening.sql` in Supabase (see the README section below), then regenerate `db/database.types.ts`.
2. Seed 2–3 test questions by hand in the Table Editor and submit a test response as a normal user. This proves the RLS and the filter function before any UI exists.
3. `services/screening.ts`
4. Questions editor
5. Filter + results + per-user answers
6. Cohorts
7. User-side health tab screen

## Testing checklist

- [ ] Non-admin can read questions but gets an RLS error inserting one
- [ ] Non-admin calling `screening_match_users` only gets themselves back
- [ ] Non-admin can't read anyone else's answers, or any cohort
- [ ] Deleting a question that has answers fails; archiving it hides it from the health tab but keeps it in the per-user answers view
- [ ] Filter with two conditions only returns users matching both
- [ ] User who resubmits is filtered on their latest answers only
- [ ] Adding the same user to a cohort twice doesn't error or duplicate

## Open questions

- Should users ever see that they were selected (e.g. a message on the health tab), or is selection purely internal? The current RLS keeps cohorts admin-only.
- Should the screening questionnaire need a consent line before submission, since these are health answers that admins can read?
- Should the existing intake questionnaire eventually move onto these tables so admins can edit it too?

## Out of scope for this pass

- The user-facing screen design on the health tab
- Branching / conditional questions ("only show Q5 if Q4 = Yes")
- OR logic across questions in the filter
- Notifying or messaging selected users from the app
