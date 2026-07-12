---
name: verify
description: Build, run and drive PULI OS (Next.js + Supabase) to verify changes end-to-end.
---

# Verifying PULI OS

## Build & launch

```bash
pnpm install
pnpm build          # must pass; uses .env.local (Supabase URL + publishable key)
pnpm start &        # production server on http://localhost:3000
```

`.env.local` needs `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
(publishable key). Values come from the linked Supabase project
(`sozcumhzaqfakowlbtla`) via the Supabase MCP tools `get_project_url` and
`get_publishable_keys`.

## Driving the app

- Unauthenticated: `/` and `/dashboard` must 307-redirect to `/login` (proxy guard).
- Use Playwright with the pre-installed browser:
  `chromium.launch({ executablePath: "/opt/pw-browsers/chromium" })`
  (install `playwright-core` in the scratchpad, not the repo).
- Register at `/register` — Supabase rejects `example.com` emails; use a
  `+tag` alias of a real domain. Email confirmation is ON, so `signUp`
  returns no session; confirm the test user via SQL:
  `update auth.users set email_confirmed_at = now() where email = ...`
- Supabase's built-in mailer allows ~3 emails/hour — repeated signups fail
  with "email rate limit exceeded". Workaround: seed the user directly via
  SQL (insert into `auth.users` with `crypt(password, gen_salt('bf'))` +
  matching `auth.identities` row with provider `email`); the
  `handle_new_user` trigger still creates the company + profile, and
  password login through the UI works.
- The `handle_new_user` trigger must create a `companies` row (when
  `company_name` metadata is present) and a `profiles` row with role `owner`.
- Then sign in at `/login` → lands on `/dashboard`.
- Seed test contacts/inquiries with SQL (Supabase MCP `execute_sql`) scoped to
  the test user's `company_id`; verify they render on `/inquiries`,
  `/contacts` and in the dashboard stats.

## Cleanup (always)

```sql
delete from auth.users where email = '<test email>';   -- cascades profile
delete from public.companies where slug = '<test slug>'; -- cascades contacts/inquiries
```

Kill the `next-server` process when done.

## Gotchas

- Error messages render in `[role="alert"]` inside the form, but sonner's
  toaster also exposes an (empty) alert region — wait for the message text,
  not the role selector.
- The register form has HTML `minlength`/`required`; remove them via
  `page.evaluate` to exercise the server-side Zod validation.
