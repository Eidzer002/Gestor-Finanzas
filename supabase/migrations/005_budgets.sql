-- Migration 005: budgets

create table public.budgets (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  limit_amount numeric not null,
  currency text not null default 'CUP',
  recurring boolean not null default true,
  color text not null default '#3b82f6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.budgets enable row level security;

create policy "Users manage own budgets" on public.budgets
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create trigger set_budgets_updated_at
  before update on public.budgets
  for each row execute function public.set_updated_at();

create index budgets_category_id_idx on public.budgets(category_id);
