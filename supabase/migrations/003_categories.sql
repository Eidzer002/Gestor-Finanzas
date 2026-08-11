-- Migration 003: categories

create table public.categories (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  icon text not null default '📦',
  type text not null, -- 'income' | 'expense'
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

create policy "Users manage own categories" on public.categories
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
