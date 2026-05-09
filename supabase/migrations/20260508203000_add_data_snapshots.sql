-- Version football reference data so future provider changes do not break old puzzles/results.

create type public.data_snapshot_status as enum (
  'importing',
  'active',
  'archived',
  'failed'
);

create table public.data_sources (
  id bigint generated always as identity primary key,
  name text not null unique,
  slug text not null unique,
  provider_url text,
  license_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.data_snapshots (
  id uuid primary key default gen_random_uuid(),
  source_id bigint not null references public.data_sources(id) on delete restrict,
  label text not null,
  version text not null,
  status public.data_snapshot_status not null default 'importing',
  imported_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, version)
);

alter table public.countries
  add column data_snapshot_id uuid references public.data_snapshots(id) on delete restrict,
  add column external_id text;

alter table public.clubs
  add column data_snapshot_id uuid references public.data_snapshots(id) on delete restrict,
  add column external_id text;

alter table public.players
  add column data_snapshot_id uuid references public.data_snapshots(id) on delete restrict,
  add column external_id text;

alter table public.career_spells
  add column data_snapshot_id uuid references public.data_snapshots(id) on delete restrict,
  add column external_id text;

alter table public.puzzles
  add column data_snapshot_id uuid references public.data_snapshots(id) on delete restrict;

create unique index countries_snapshot_external_id_idx
  on public.countries (data_snapshot_id, external_id)
  where data_snapshot_id is not null and external_id is not null;

create unique index clubs_snapshot_external_id_idx
  on public.clubs (data_snapshot_id, external_id)
  where data_snapshot_id is not null and external_id is not null;

create unique index players_snapshot_external_id_idx
  on public.players (data_snapshot_id, external_id)
  where data_snapshot_id is not null and external_id is not null;

create unique index career_spells_snapshot_external_id_idx
  on public.career_spells (data_snapshot_id, external_id)
  where data_snapshot_id is not null and external_id is not null;

create index countries_snapshot_idx on public.countries (data_snapshot_id);
create index clubs_snapshot_idx on public.clubs (data_snapshot_id);
create index players_snapshot_idx on public.players (data_snapshot_id);
create index career_spells_snapshot_idx on public.career_spells (data_snapshot_id);
create index puzzles_snapshot_idx on public.puzzles (data_snapshot_id);
create index data_snapshots_status_idx on public.data_snapshots (status, imported_at desc);

create trigger data_sources_set_updated_at before update on public.data_sources
  for each row execute function public.set_updated_at();

create trigger data_snapshots_set_updated_at before update on public.data_snapshots
  for each row execute function public.set_updated_at();

alter table public.data_sources enable row level security;
alter table public.data_snapshots enable row level security;

create policy "Data sources are publicly readable"
  on public.data_sources for select
  using (true);

create policy "Active data snapshots are publicly readable"
  on public.data_snapshots for select
  using (status = 'active');

create view public.active_data_snapshots as
select
  data_snapshots.id,
  data_sources.name as source_name,
  data_sources.slug as source_slug,
  data_snapshots.label,
  data_snapshots.version,
  data_snapshots.imported_at,
  data_snapshots.notes
from public.data_snapshots
join public.data_sources on data_sources.id = data_snapshots.source_id
where data_snapshots.status = 'active';
