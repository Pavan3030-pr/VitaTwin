#!/usr/bin/env bash
# VitaTwin — database backup.
# Writes a compressed, timestamped SQL dump of the Supabase Postgres database.
#
# One-time setup (macOS):
#   brew install libpq && brew link --force libpq
#   Put the *Session pooler* connection string from Supabase
#   (Project Settings → Database → Connection string) in .env.local as:
#   SUPABASE_DB_URL="postgresql://postgres.<ref>:<password>@<host>:5432/postgres"
#
# Usage:  npm run backup        (restore: see docs/BACKUPS.md)
set -euo pipefail

cd "$(dirname "$0")/.."

if [ -z "${SUPABASE_DB_URL:-}" ] && [ -f .env.local ]; then
  SUPABASE_DB_URL="$(grep -E '^SUPABASE_DB_URL=' .env.local | head -n1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')"
fi

if [ -z "${SUPABASE_DB_URL:-}" ]; then
  echo "SUPABASE_DB_URL is not set (put it in .env.local or export it)." >&2
  exit 1
fi
command -v pg_dump >/dev/null || { echo "pg_dump not found. Run: brew install libpq && brew link --force libpq" >&2; exit 1; }

mkdir -p backups
out="backups/vitatwin-$(date +%Y%m%d-%H%M%S).sql.gz"

pg_dump "$SUPABASE_DB_URL" --no-owner --no-privileges --schema=public --schema=auth --exclude-table-data='auth.*_token*' \
  | gzip > "$out"

echo "Backup written to $out ($(du -h "$out" | cut -f1))"
# Keep the 14 most recent dumps.
ls -1t backups/vitatwin-*.sql.gz 2>/dev/null | tail -n +15 | xargs -I{} rm -- {} 2>/dev/null || true
