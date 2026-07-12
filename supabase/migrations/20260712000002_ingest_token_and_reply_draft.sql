-- Per-company token authenticating inbound automation (n8n → ingest-inquiry edge function)
alter table public.companies
  add column ingest_token uuid not null default gen_random_uuid();

create unique index companies_ingest_token_idx on public.companies (ingest_token);

-- AI-generated customer reply draft, editable in the UI before sending
alter table public.inquiries
  add column ai_reply_draft text;
