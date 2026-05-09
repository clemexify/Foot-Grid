-- Foot Grid initial product schema.
-- Apply in Supabase SQL editor or through the Supabase CLI once the project is linked.

create extension if not exists pgcrypto;

create type public.puzzle_mode as enum (
  'club_club',
  'club_year',
  'club_nationality'
);

create type public.puzzle_status as enum (
  'draft',
  'scheduled',
  'published',
  'archived'
);

create type public.attempt_status as enum (
  'in_progress',
  'completed',
  'failed',
  'abandoned'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint username_length check (username is null or char_length(username) between 3 and 32),
  constraint username_format check (username is null or username ~ '^[a-zA-Z0-9_]+$')
);

create table public.countries (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  iso2 text,
  fifa_code text,
  created_at timestamptz not null default now()
);

create table public.clubs (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  country_id bigint references public.countries(id),
  transfermarkt_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.players (
  id bigint generated always as identity primary key,
  display_name text not null,
  slug text not null unique,
  transfermarkt_id text unique,
  birth_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.player_nationalities (
  player_id bigint not null references public.players(id) on delete cascade,
  country_id bigint not null references public.countries(id) on delete restrict,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (player_id, country_id)
);

create table public.career_spells (
  id bigint generated always as identity primary key,
  player_id bigint not null references public.players(id) on delete cascade,
  club_id bigint not null references public.clubs(id) on delete restrict,
  season_start integer not null,
  season_end integer,
  is_loan boolean not null default false,
  source text,
  source_ref text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_season_range check (season_start >= 1880 and (season_end is null or season_end >= season_start))
);

create table public.puzzles (
  id uuid primary key default gen_random_uuid(),
  mode public.puzzle_mode not null,
  status public.puzzle_status not null default 'draft',
  puzzle_date date,
  seed text,
  title text,
  difficulty numeric(5, 2),
  generated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint daily_puzzle_requires_date check (status <> 'published' or puzzle_date is not null)
);

create unique index puzzles_one_published_per_day_mode
  on public.puzzles (puzzle_date, mode)
  where status = 'published';

create table public.puzzle_axes (
  id bigint generated always as identity primary key,
  puzzle_id uuid not null references public.puzzles(id) on delete cascade,
  axis text not null check (axis in ('row', 'col')),
  position integer not null check (position between 0 and 2),
  kind text not null check (kind in ('club', 'year', 'country')),
  club_id bigint references public.clubs(id) on delete restrict,
  country_id bigint references public.countries(id) on delete restrict,
  season_start integer,
  season_end integer,
  label text not null,
  unique (puzzle_id, axis, position),
  constraint axis_has_one_value check (
    (kind = 'club' and club_id is not null and country_id is null and season_start is null and season_end is null)
    or (kind = 'country' and country_id is not null and club_id is null and season_start is null and season_end is null)
    or (kind = 'year' and season_start is not null and club_id is null and country_id is null)
  )
);

create table public.puzzle_cells (
  id bigint generated always as identity primary key,
  puzzle_id uuid not null references public.puzzles(id) on delete cascade,
  row_position integer not null check (row_position between 0 and 2),
  col_position integer not null check (col_position between 0 and 2),
  answer_count integer not null default 0,
  rarity_score numeric(6, 2),
  created_at timestamptz not null default now(),
  unique (puzzle_id, row_position, col_position)
);

create table public.accepted_answers (
  puzzle_cell_id bigint not null references public.puzzle_cells(id) on delete cascade,
  player_id bigint not null references public.players(id) on delete restrict,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (puzzle_cell_id, player_id)
);

create table public.daily_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  puzzle_id uuid not null references public.puzzles(id) on delete restrict,
  status public.attempt_status not null default 'in_progress',
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer not null default 0,
  found_count integer not null default 0,
  error_count integer not null default 0,
  duration_ms integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, puzzle_id),
  constraint attempt_counts_valid check (found_count between 0 and 9 and error_count between 0 and 4),
  constraint attempt_duration_valid check (duration_ms is null or duration_ms >= 0)
);

create table public.daily_attempt_answers (
  id bigint generated always as identity primary key,
  attempt_id uuid not null references public.daily_attempts(id) on delete cascade,
  puzzle_cell_id bigint not null references public.puzzle_cells(id) on delete restrict,
  player_id bigint references public.players(id) on delete restrict,
  submitted_name text not null,
  is_correct boolean not null,
  answered_at timestamptz not null default now(),
  unique (attempt_id, puzzle_cell_id)
);

create table public.random_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  puzzle_id uuid not null references public.puzzles(id) on delete restrict,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  score integer not null default 0,
  found_count integer not null default 0,
  error_count integer not null default 0,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create table public.user_streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_completed_date date,
  updated_at timestamptz not null default now(),
  constraint streaks_non_negative check (current_streak >= 0 and best_streak >= 0)
);

create index career_spells_player_idx on public.career_spells (player_id);
create index career_spells_club_seasons_idx on public.career_spells (club_id, season_start, season_end);
create index player_nationalities_country_idx on public.player_nationalities (country_id);
create index puzzle_cells_puzzle_idx on public.puzzle_cells (puzzle_id);
create index accepted_answers_player_idx on public.accepted_answers (player_id);
create index daily_attempts_leaderboard_idx on public.daily_attempts (puzzle_id, score desc, duration_ms asc, completed_at asc);
create index random_attempts_user_idx on public.random_attempts (user_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger clubs_set_updated_at before update on public.clubs
  for each row execute function public.set_updated_at();
create trigger players_set_updated_at before update on public.players
  for each row execute function public.set_updated_at();
create trigger career_spells_set_updated_at before update on public.career_spells
  for each row execute function public.set_updated_at();
create trigger puzzles_set_updated_at before update on public.puzzles
  for each row execute function public.set_updated_at();
create trigger daily_attempts_set_updated_at before update on public.daily_attempts
  for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email))
  on conflict (id) do nothing;

  insert into public.user_streaks (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.countries enable row level security;
alter table public.clubs enable row level security;
alter table public.players enable row level security;
alter table public.player_nationalities enable row level security;
alter table public.career_spells enable row level security;
alter table public.puzzles enable row level security;
alter table public.puzzle_axes enable row level security;
alter table public.puzzle_cells enable row level security;
alter table public.accepted_answers enable row level security;
alter table public.daily_attempts enable row level security;
alter table public.daily_attempt_answers enable row level security;
alter table public.random_attempts enable row level security;
alter table public.user_streaks enable row level security;

create policy "Profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Football reference data is publicly readable"
  on public.countries for select
  using (true);

create policy "Clubs are publicly readable"
  on public.clubs for select
  using (true);

create policy "Players are publicly readable"
  on public.players for select
  using (true);

create policy "Player nationalities are publicly readable"
  on public.player_nationalities for select
  using (true);

create policy "Career spells are publicly readable"
  on public.career_spells for select
  using (true);

create policy "Published puzzles are publicly readable"
  on public.puzzles for select
  using (status = 'published');

create policy "Published puzzle axes are publicly readable"
  on public.puzzle_axes for select
  using (
    exists (
      select 1 from public.puzzles
      where puzzles.id = puzzle_axes.puzzle_id
      and puzzles.status = 'published'
    )
  );

create policy "Published puzzle cells are publicly readable"
  on public.puzzle_cells for select
  using (
    exists (
      select 1 from public.puzzles
      where puzzles.id = puzzle_cells.puzzle_id
      and puzzles.status = 'published'
    )
  );

create policy "Accepted answers for published puzzles are publicly readable"
  on public.accepted_answers for select
  using (
    exists (
      select 1
      from public.puzzle_cells
      join public.puzzles on puzzles.id = puzzle_cells.puzzle_id
      where puzzle_cells.id = accepted_answers.puzzle_cell_id
      and puzzles.status = 'published'
    )
  );

create policy "Users can read their own daily attempts"
  on public.daily_attempts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own daily attempt answers"
  on public.daily_attempt_answers for select
  to authenticated
  using (
    exists (
      select 1 from public.daily_attempts
      where daily_attempts.id = daily_attempt_answers.attempt_id
      and daily_attempts.user_id = auth.uid()
    )
  );

create policy "Users can read their own random attempts"
  on public.random_attempts for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can read their own streak"
  on public.user_streaks for select
  to authenticated
  using (auth.uid() = user_id);

create view public.daily_leaderboard as
select
  daily_attempts.puzzle_id,
  daily_attempts.user_id,
  profiles.display_name,
  profiles.username,
  daily_attempts.score,
  daily_attempts.found_count,
  daily_attempts.error_count,
  daily_attempts.duration_ms,
  daily_attempts.completed_at,
  rank() over (
    partition by daily_attempts.puzzle_id
    order by daily_attempts.score desc, daily_attempts.duration_ms asc nulls last, daily_attempts.completed_at asc
  ) as rank
from public.daily_attempts
left join public.profiles on profiles.id = daily_attempts.user_id
where daily_attempts.status = 'completed';

create view public.streak_leaderboard as
select
  user_streaks.user_id,
  profiles.display_name,
  profiles.username,
  user_streaks.current_streak,
  user_streaks.best_streak,
  user_streaks.last_completed_date,
  rank() over (order by user_streaks.current_streak desc, user_streaks.best_streak desc, user_streaks.updated_at asc) as current_rank,
  rank() over (order by user_streaks.best_streak desc, user_streaks.current_streak desc, user_streaks.updated_at asc) as best_rank
from public.user_streaks
left join public.profiles on profiles.id = user_streaks.user_id;
