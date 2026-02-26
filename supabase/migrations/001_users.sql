-- Create profiles table linked to Supabase Auth
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  avatar_id text not null default 'default',
  theme_id text not null default 'classic',
  coins integer not null default 0,
  is_premium boolean not null default false,
  premium_until timestamptz,
  elo_acquire integer not null default 1200,
  elo_puerto_rico integer not null default 1200,
  elo_ticket_to_ride integer not null default 1200,
  games_played integer not null default 0,
  games_won integer not null default 0,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Everyone can read public profile data
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

-- Users can only update their own profile
create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'full_name',
      'Player_' || substr(new.id::text, 1, 8)
    )
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
