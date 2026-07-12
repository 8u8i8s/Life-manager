-- PULI OS — Orders module
create type public.order_status as enum ('confirmed', 'in_production', 'ready', 'delivered', 'cancelled');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  quote_id uuid references public.quotes (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  created_by uuid references public.profiles (id) on delete set null,
  order_number text not null,
  status public.order_status not null default 'confirmed',
  currency text not null default 'EUR',
  total numeric(12,2) not null default 0,
  delivery_date date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, order_number)
);

create index orders_company_id_idx on public.orders (company_id);
create index orders_quote_id_idx on public.orders (quote_id);
create index orders_status_idx on public.orders (status);

create trigger orders_set_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

create or replace function public.next_order_number(p_company_id uuid)
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
  from public.orders
  where company_id = p_company_id
    and order_number like 'OBJ-' || v_year || '-%';
  return 'OBJ-' || v_year || '-' || lpad(v_count::text, 4, '0');
end;
$$;

revoke execute on function public.next_order_number(uuid) from anon, public;
grant execute on function public.next_order_number(uuid) to authenticated;

alter table public.orders enable row level security;

create policy "Members can view company orders"
  on public.orders for select to authenticated
  using (company_id = public.current_company_id());
create policy "Members can create company orders"
  on public.orders for insert to authenticated
  with check (company_id = public.current_company_id());
create policy "Members can update company orders"
  on public.orders for update to authenticated
  using (company_id = public.current_company_id());
create policy "Members can delete company orders"
  on public.orders for delete to authenticated
  using (company_id = public.current_company_id());
