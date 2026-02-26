-- Cosmetic type enum
create type public.cosmetic_type as enum ('theme', 'avatar', 'card_back', 'board_skin');

-- Cosmetics owned table
create table public.cosmetics_owned (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  cosmetic_type public.cosmetic_type not null,
  cosmetic_id text not null,
  purchased_at timestamptz not null default now(),
  unique (user_id, cosmetic_type, cosmetic_id)
);

create index idx_cosmetics_user_id on public.cosmetics_owned (user_id);

-- Enable RLS
alter table public.cosmetics_owned enable row level security;

-- Users can only read their own cosmetics
create policy "Users can read own cosmetics"
  on public.cosmetics_owned for select
  using (auth.uid() = user_id);

-- Inserts handled by service role (after purchase verification)
