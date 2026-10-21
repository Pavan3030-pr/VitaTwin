#!/usr/bin/env bash
# VitaTwin — fails if a server secret could reach the browser.
# Run after `npm run build`:  npm run check:secrets
set -uo pipefail
cd "$(dirname "$0")/.."

status=0
PATTERN='service_role|sb_secret_|SUPABASE_DB_URL|ERROR_WEBHOOK_URL|sk-[A-Za-z0-9_-]{20,}|gsk_[A-Za-z0-9]{20,}'

if [ -d .next/static ]; then
  if grep -rEl "$PATTERN" .next/static >/dev/null 2>&1; then
    echo "✗ Possible secret in the browser bundle (.next/static):" >&2
    grep -rEl "$PATTERN" .next/static >&2
    status=1
  else
    echo "✓ Browser bundle (.next/static) is clean."
  fi
else
  echo "! .next/static not found — run 'npm run build' first." >&2
  status=1
fi

# No secret may use a NEXT_PUBLIC_ name (those are shipped to every visitor).
if grep -rEn 'NEXT_PUBLIC_[A-Z_]*(SECRET|SERVICE|PRIVATE|PASSWORD|API_KEY)' src .env.example >/dev/null 2>&1; then
  echo "✗ A secret-looking variable uses the NEXT_PUBLIC_ prefix:" >&2
  grep -rEn 'NEXT_PUBLIC_[A-Z_]*(SECRET|SERVICE|PRIVATE|PASSWORD|API_KEY)' src .env.example >&2
  status=1
else
  echo "✓ No secret-looking NEXT_PUBLIC_ variables."
fi

# Real env files must never be tracked by git.
if git ls-files --error-unmatch .env .env.local >/dev/null 2>&1; then
  echo "✗ An env file is tracked by git." >&2
  status=1
else
  echo "✓ No env files tracked by git."
fi
exit $status
