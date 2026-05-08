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

The initial schema lives in:

```txt
supabase/migrations/20260508190000_initial_schema.sql
```

Apply it from the Supabase dashboard SQL editor, or install the Supabase CLI and run it as a migration once the project is linked.

## Intended backend shape

- Public football reference data is readable through RLS policies.
- User-owned profile/result data is protected with `auth.uid()`.
- Daily ranked attempts should be written through trusted server code, not directly from arbitrary client payloads.
- Data ingestion and puzzle generation should run as scripts/GitHub Actions with the service role key.
