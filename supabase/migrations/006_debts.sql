-- Migration 006: debts

create table public.debts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'owed_to_me' | 'i_owe'
  person text not null,
  total numeric not null,
  paid numeric not null default 0,
  currency text not null default 'CUP',
  due_date date,
  status text not null default 'pending', -- 'pending' | 'paid' | 'overdue'
  debt_type text not null default 'cash',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.debts enable row level security;

create policy "Users manage own debts" on public.debts
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger set_debts_updated_at
  before update on public.debts
  for each row execute function public.set_updated_at();

create index debts_status_idx on public.debts(status);
