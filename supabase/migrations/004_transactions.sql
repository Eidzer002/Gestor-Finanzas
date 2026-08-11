-- Migration 004: transactions + indexes + RLS

create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null, -- 'income' | 'expense' | 'transfer'
  wallet_id uuid not null references public.wallets(id) on delete cascade,
  wallet_dest_id uuid references public.wallets(id) on delete set null, -- solo para transferencias
  amount numeric not null,
  currency text not null default 'CUP',
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  date date not null default current_date,
  recurring boolean not null default false,
  frequency text, -- 'daily' | 'weekly' | 'monthly' | ...
  next_date date,
  notes text,
  tags text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.transactions enable row level security;

create policy "Users manage own transactions" on public.transactions
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger set_transactions_updated_at
  before update on public.transactions
  for each row execute function public.set_updated_at();

create index transactions_wallet_idx on public.transactions(wallet_id);
create index transactions_wallet_dest_id_idx on public.transactions(wallet_dest_id);
create index transactions_category_idx on public.transactions(category_id);
create index transactions_date_idx on public.transactions(date);
create index transactions_type_idx on public.transactions(type);
