# VitaTwin — Backups & restore

Supabase only includes automatic daily backups on paid plans. On the free plan
you must take your own, so the repo ships a one-command dump.

## Take a backup (macOS)

```bash
brew install libpq && brew link --force libpq     # once: installs pg_dump
# add SUPABASE_DB_URL="postgresql://postgres.<ref>:<password>@<host>:5432/postgres" to .env.local
npm run backup
```

Output: `backups/vitatwin-YYYYMMDD-HHMMSS.sql.gz` (git-ignored; the 14 newest are kept).
Store a copy somewhere other than your laptop (iCloud Drive, an encrypted USB, a private bucket).

## Restore

```bash
gunzip -c backups/vitatwin-<timestamp>.sql.gz | psql "$SUPABASE_DB_URL"
```

Restore into a **new, empty** Supabase project when possible, then run
`supabase/tests/verify-rls.sql` to confirm row level security is on.

## Schedule it

Run `npm run backup` weekly (macOS: a `launchd` job or a calendar reminder), and
before every migration. Supabase Pro adds daily backups and optional point-in-time recovery.
