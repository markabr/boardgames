-- Transaction type enum
create type public.transaction_type as enum ('coin_purchase', 'cosmetic_purchase', 'premium_subscription');

-- Transactions table
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  type public.transaction_type not null,
  amount_cents integer not null default 0,
  stripe_payment_id text,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create index idx_transactions_user_id on public.transactions (user_id);

-- Enable RLS
alter table public.transactions enable row level security;

-- Users can only read their own transactions
create policy "Users can read own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

-- Inserts handled by service role (webhook)
