#!/usr/bin/env bash
# VitaTwin — post-deploy smoke test.
# Usage: npm run smoke -- https://vita-twin-ten.vercel.app     (default: http://localhost:3000)
set -uo pipefail
BASE="${1:-http://localhost:3000}"
fail=0

check() { # path expected_status
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$BASE$1")
  if [ "$code" = "$2" ]; then echo "✓ $1 -> $code"; else echo "✗ $1 -> $code (expected $2)"; fail=1; fi
}
header() { # header-name
  if curl -sI --max-time 20 "$BASE/" | grep -qi "^$1:"; then echo "✓ header $1"; else echo "✗ missing header $1"; fail=1; fi
}

for p in / /login /privacy /terms /forgot-password /robots.txt /sitemap.xml /manifest.webmanifest /.well-known/security.txt /api/health; do check "$p" 200; done
for p in /dashboard /vitals /insights /timeline /profile /clinician /import /validation /account; do check "$p" 307; done
check /definitely-not-a-page 404
for h in content-security-policy x-frame-options x-content-type-options referrer-policy permissions-policy; do header "$h"; done
if curl -s --max-time 20 "$BASE/api/health" | grep -q '"status":"ok"'; then echo "✓ health payload"; else echo "✗ health payload"; fail=1; fi

[ $fail -eq 0 ] && echo "ALL CHECKS PASSED" || echo "SOME CHECKS FAILED"
exit $fail
