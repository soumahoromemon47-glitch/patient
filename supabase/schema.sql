create extension if not exists pgcrypto;

create table if not exists public.fiches (
  id uuid primary key default gen_random_uuid(),
  numero_fiche text not null unique,
  date_fiche date not null default current_date,
  statut text not null default 'brouillon' check (statut in ('brouillon', 'complete')),
  data jsonb not null default '{}'::jsonb,
  computed jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists fiches_data_gin_idx on public.fiches using gin (data);
create index if not exists fiches_date_fiche_idx on public.fiches (date_fiche);
create index if not exists fiches_statut_idx on public.fiches (statut);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists fiches_set_updated_at on public.fiches;
create trigger fiches_set_updated_at
before update on public.fiches
for each row execute function public.set_updated_at();

alter table public.fiches enable row level security;

drop policy if exists "Authenticated users can read fiches" on public.fiches;
create policy "Authenticated users can read fiches"
on public.fiches for select to authenticated
using (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can insert fiches" on public.fiches;
create policy "Authenticated users can insert fiches"
on public.fiches for insert to authenticated
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can update fiches" on public.fiches;
create policy "Authenticated users can update fiches"
on public.fiches for update to authenticated
using (auth.role() = 'authenticated')
with check (auth.role() = 'authenticated');

drop policy if exists "Authenticated users can delete fiches" on public.fiches;
create policy "Authenticated users can delete fiches"
on public.fiches for delete to authenticated
using (auth.role() = 'authenticated');
