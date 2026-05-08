# Supabase Setup

This project is prepared for Supabase, but local secrets are not committed.

## Local environment

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Then fill:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for trusted scripts and jobs only

## Database

The schema migrations live in:

```txt
supabase/migrations/20260508190000_initial_schema.sql
supabase/migrations/20260508203000_add_data_snapshots.sql
```

Apply them from the Supabase dashboard SQL editor in filename order, or install the Supabase CLI and run them as migrations once the project is linked.

## Data snapshots

Football reference data is versioned through:

- `data_sources`
- `data_snapshots`
- `data_snapshot_id` on countries, clubs, players, career spells, and puzzles

This lets us import prototype data now, then switch to a better provider later without breaking historical puzzles, accepted answers, or leaderboard results.

For development, hard-flushing football data is possible, but it should only be done before real user results matter. In production, prefer creating a new active snapshot and generating future puzzles from it while keeping older snapshots available for historical grids.

Development-only hard flush shape:

```sql
truncate table
  accepted_answers,
  puzzle_cells,
  puzzle_axes,
  puzzles,
  career_spells,
  player_nationalities,
  players,
  clubs,
  countries,
  data_snapshots,
  data_sources
restart identity cascade;
```

## Intended backend shape

- Public football reference data is readable through RLS policies.
- User-owned profile/result data is protected with `auth.uid()`.
- Daily ranked attempts should be written through trusted server code, not directly from arbitrary client payloads.
- Data ingestion and puzzle generation should run as scripts/GitHub Actions with the service role key.
