-- Migration 007: exchange_rates

create table public.exchange_rates (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  currency text not null,
  rate numeric not null,
  updated_at timestamptz not null default now()
);

alter table public.exchange_rates enable row level security;

create policy "Users manage own exchange rates" on public.exchange_rates
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
