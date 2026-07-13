# PULI OS

AI Operating System for companies, built by PULI Labs. The first vertical
targets manufacturers of windows, doors and aluminium systems: incoming
customer emails are processed by n8n + AI, extracted into Supabase and
managed from this dashboard.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- Tailwind CSS + [shadcn/ui](https://ui.shadcn.com)
- [Supabase](https://supabase.com) — PostgreSQL, Auth, Storage, Edge Functions
- [n8n](https://n8n.io) — automation
- Anthropic / OpenAI APIs — extraction and reply generation
- Vercel — hosting

## Getting started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Configure the environment — copy `.env.example` to `.env.local` and fill
   in your Supabase project URL and publishable key (Supabase dashboard →
   Project settings → API).

3. Apply the database schema in `supabase/migrations/` to your Supabase
   project (already applied to the linked project; for a new project use
   `supabase db push` or run the SQL in the SQL editor).

4. Run the dev server:

   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000), create an account at
`/register` (this provisions your company automatically) and you land on
the dashboard.

## Modules

- **Inquiries** — incoming customer requests with AI extraction, status
  pipeline and assignment; fed automatically by the n8n email workflow via
  the `ingest-inquiry` edge function (per-company ingest token, see
  Settings)
- **AI replies** — one-click reply drafts on the inquiry detail
  (`generate-reply` edge function)
- **Quotes** — line items, VAT totals, per-company `PO-2026-0001`
  numbering, created from inquiries
- **Orders** — one-click conversion from an accepted quote, production
  status pipeline, delivery dates
- **Contacts** — customers and partners, auto-created from incoming emails
- **AI Chat** — ask questions over your own inquiries/quotes/orders/
  contacts (`ai-chat` edge function; every lookup runs under your RLS
  session)

AI features need the `ANTHROPIC_API_KEY` secret set on the Supabase
project (Dashboard → Edge Functions → Secrets).

## Project structure

```
src/app/(auth)/        Public auth pages + server actions
src/app/(dashboard)/   Authenticated app shell and modules
src/app/auth/confirm/  Supabase email confirmation handler
src/components/        Feature components + shadcn/ui primitives
src/lib/supabase/      Supabase browser/server clients + session proxy
src/lib/data/          Server-side data access layer
src/lib/validations/   Zod schemas
src/types/database.ts  Generated Supabase types
src/proxy.ts           Auth session refresh + route protection
supabase/migrations/   SQL migrations (schema, RLS policies, triggers)
```

## Database model

Multi-tenant by company:

- `companies` — one row per tenant
- `profiles` — extends `auth.users`, links a user to a company with a role
  (`owner` / `admin` / `member`); created automatically by a trigger on signup
- `contacts` — customers/partners of a company
- `inquiries` — incoming requests (email/manual/web/api) with AI extraction
  fields (`extracted_data`, `ai_summary`) and a status pipeline
  (`new → processing → extracted → quoted → replied → closed`)

All tables have Row Level Security enabled; access is scoped to the user's
company via `public.current_company_id()`.

See `CLAUDE.md` for the engineering conventions and the product roadmap.
