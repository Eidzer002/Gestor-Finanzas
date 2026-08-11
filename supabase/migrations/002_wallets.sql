-- Migration 002: wallets

create table public.wallets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type text not null default 'cash',
  icon text not null default '💵',
  color text not null default '#3b82f6',
  currency text not null default 'CUP',
  balance numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.wallets enable row level security;

create policy "Users manage own wallets" on public.wallets
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger set_wallets_updated_at
  before update on public.wallets
  for each row execute function public.set_updated_at();
