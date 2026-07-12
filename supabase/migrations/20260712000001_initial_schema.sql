-- PULI OS — Initial schema
-- Tenancy model: one company per tenant, users belong to a company via profiles.
-- Applied to the remote project as migration `initial_schema`.

-- ============================================================
-- Enums
-- ============================================================
create type public.user_role as enum ('owner', 'admin', 'member');
create type public.inquiry_source as enum ('email', 'manual', 'web', 'api');
create type public.inquiry_status as enum ('new', 'processing', 'extracted', 'quoted', 'replied', 'closed');

-- ============================================================
-- Utility: updated_at maintenance
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- Tables
-- ============================================================
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  email text,
  phone text,
  address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete set null,
  full_name text not null default '',
  avatar_url text,
  role public.user_role not null default 'member',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  organization text,
  address text,
  notes text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  contact_id uuid references public.contacts (id) on delete set null,
  assigned_to uuid references public.profiles (id) on delete set null,
  source public.inquiry_source not null default 'manual',
  status public.inquiry_status not null default 'new',
  subject text not null,
  raw_content text,
  extracted_data jsonb,
  ai_summary text,
  received_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================
-- Indexes
-- ============================================================
create index profiles_company_id_idx on public.profiles (company_id);
create index contacts_company_id_idx on public.contacts (company_id);
create index contacts_email_idx on public.contacts (email);
create index inquiries_company_id_idx on public.inquiries (company_id);
create index inquiries_status_idx on public.inquiries (status);
create index inquiries_received_at_idx on public.inquiries (received_at desc);

-- ============================================================
-- Triggers: updated_at
-- ============================================================
create trigger companies_set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger contacts_set_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();
create trigger inquiries_set_updated_at before update on public.inquiries
  for each row execute function public.set_updated_at();

-- ============================================================
-- New-user bootstrap
-- Creates the company (when company_name is present in signup
-- metadata) and the profile for every new auth user.
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_company_name text := nullif(trim(new.raw_user_meta_data ->> 'company_name'), '');
begin
  if v_company_name is not null then
    insert into public.companies (name, slug)
    values (
      v_company_name,
      lower(regexp_replace(v_company_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(gen_random_uuid()::text, 1, 8)
    )
    returning id into v_company_id;
  end if;

  insert into public.profiles (id, company_id, full_name, role)
  values (
    new.id,
    v_company_id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    case when v_company_id is not null then 'owner'::public.user_role else 'member'::public.user_role end
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================
create or replace function public.current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from public.profiles where id = auth.uid();
$$;

revoke execute on function public.current_company_id() from anon, public;
grant execute on function public.current_company_id() to authenticated;

alter table public.companies enable row level security;
alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.inquiries enable row level security;

-- companies
create policy "Members can view their company"
  on public.companies for select
  to authenticated
  using (id = public.current_company_id());

create policy "Owners and admins can update their company"
  on public.companies for update
  to authenticated
  using (
    id = public.current_company_id()
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- profiles
create policy "Users can view profiles in their company"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or company_id = public.current_company_id());

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- contacts
create policy "Members can view company contacts"
  on public.contacts for select
  to authenticated
  using (company_id = public.current_company_id());

create policy "Members can create company contacts"
  on public.contacts for insert
  to authenticated
  with check (company_id = public.current_company_id());

create policy "Members can update company contacts"
  on public.contacts for update
  to authenticated
  using (company_id = public.current_company_id());

create policy "Members can delete company contacts"
  on public.contacts for delete
  to authenticated
  using (company_id = public.current_company_id());

-- inquiries
create policy "Members can view company inquiries"
  on public.inquiries for select
  to authenticated
  using (company_id = public.current_company_id());

create policy "Members can create company inquiries"
  on public.inquiries for insert
  to authenticated
  with check (company_id = public.current_company_id());

create policy "Members can update company inquiries"
  on public.inquiries for update
  to authenticated
  using (company_id = public.current_company_id());

create policy "Members can delete company inquiries"
  on public.inquiries for delete
  to authenticated
  using (company_id = public.current_company_id());
