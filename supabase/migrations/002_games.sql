-- Game type enum
create type public.game_type as enum ('acquire', 'puerto_rico', 'ticket_to_ride');

-- Game status enum
create type public.game_status as enum ('waiting', 'in_progress', 'completed', 'abandoned');

-- Games table
create table public.games (
  id uuid primary key default gen_random_uuid(),
  game_type public.game_type not null,
  status public.game_status not null default 'waiting',
  host_id uuid references public.profiles(id) not null,
  player_ids uuid[] not null default '{}',
  room_code text unique,
  is_public boolean not null default true,
  winner_id uuid references public.profiles(id),
  state jsonb,
  settings jsonb not null default '{}',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

-- Index for lobby browsing
create index idx_games_status on public.games (status);
create index idx_games_room_code on public.games (room_code) where room_code is not null;
-- GIN index for player lookup
create index idx_games_player_ids on public.games using gin (player_ids);

-- Game moves table (for replay and persistence)
create table public.game_moves (
  id bigserial primary key,
  game_id uuid references public.games(id) on delete cascade not null,
  player_id uuid references public.profiles(id) not null,
  move_number integer not null,
  action jsonb not null,
  state_after jsonb, -- checkpoint every N moves
  created_at timestamptz not null default now()
);

create index idx_game_moves_game_id on public.game_moves (game_id, move_number);

-- Enable RLS
alter table public.games enable row level security;
alter table public.game_moves enable row level security;

-- Games: players can read games they're in, public games are browsable
create policy "Players can read their own games"
  on public.games for select
  using (
    auth.uid() = any(player_ids)
    or status = 'waiting'
  );

-- Games: host can update (start, settings)
create policy "Host can update game"
  on public.games for update
  using (auth.uid() = host_id);

-- Games: authenticated users can create
create policy "Authenticated users can create games"
  on public.games for insert
  with check (auth.uid() = host_id);

-- Game moves: players in the game can read
create policy "Players can read game moves"
  on public.game_moves for select
  using (
    exists (
      select 1 from public.games
      where games.id = game_moves.game_id
      and auth.uid() = any(games.player_ids)
    )
  );
