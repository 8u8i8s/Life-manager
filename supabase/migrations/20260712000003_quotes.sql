-- PULI OS — Quotes module
create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  inquiry_id uuid references public.inquiries (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  quote_number text not null,
  status public.quote_status not null default 'draft',
  currency text not null default 'EUR',
  vat_rate numeric(5,2) not null default 23.00,
  valid_until date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, quote_number)
);

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  company_id uuid not null references public.companies (id) on delete cascade,
  description text not null,
  quantity numeric(10,2) not null default 1,
  unit_price numeric(12,2) not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index quotes_company_id_idx on public.quotes (company_id);
create index quotes_inquiry_id_idx on public.quotes (inquiry_id);
create index quotes_status_idx on public.quotes (status);
create index quote_items_quote_id_idx on public.quote_items (quote_id);
create index quote_items_company_id_idx on public.quote_items (company_id);

create trigger quotes_set_updated_at before update on public.quotes
  for each row execute function public.set_updated_at();
create trigger quote_items_set_updated_at before update on public.quote_items
  for each row execute function public.set_updated_at();

-- Sequential quote numbers per company: PO-2026-0001
create or replace function public.next_quote_number(p_company_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_year text := to_char(now(), 'YYYY');
  v_count int;
begin
  select count(*) + 1 into v_count
  from public.quotes
  where company_id = p_company_id
    and quote_number like 'PO-' || v_year || '-%';
  return 'PO-' || v_year || '-' || lpad(v_count::text, 4, '0');
end;
$$;

revoke execute on function public.next_quote_number(uuid) from anon, public;
grant execute on function public.next_quote_number(uuid) to authenticated;

alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;

create policy "Members can view company quotes"
  on public.quotes for select to authenticated
  using (company_id = public.current_company_id());
create policy "Members can create company quotes"
  on public.quotes for insert to authenticated
  with check (company_id = public.current_company_id());
create policy "Members can update company quotes"
  on public.quotes for update to authenticated
  using (company_id = public.current_company_id());
create policy "Members can delete company quotes"
  on public.quotes for delete to authenticated
  using (company_id = public.current_company_id());

create policy "Members can view company quote items"
  on public.quote_items for select to authenticated
  using (company_id = public.current_company_id());
create policy "Members can create company quote items"
  on public.quote_items for insert to authenticated
  with check (company_id = public.current_company_id());
create policy "Members can update company quote items"
  on public.quote_items for update to authenticated
  using (company_id = public.current_company_id());
create policy "Members can delete company quote items"
  on public.quote_items for delete to authenticated
  using (company_id = public.current_company_id());
