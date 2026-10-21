#!/usr/bin/env bash
# VitaTwin — Lighthouse audit (performance, accessibility, best practices, SEO).
# Usage: npm run lighthouse -- https://vita-twin-ten.vercel.app    (needs Google Chrome installed)
set -euo pipefail
cd "$(dirname "$0")/.."
URL="${1:-https://vita-twin-ten.vercel.app}"
mkdir -p reports
for path in "/" "/login"; do
  name="$(echo "${path#/}" | tr '/' '-')"; name="${name:-home}"
  npx --yes lighthouse@12 "$URL$path" --quiet --chrome-flags="--headless=new" \
    --only-categories=performance,accessibility,best-practices,seo \
    --output=html --output=json --output-path="reports/lighthouse-$name"
  node -e "const r=require('./reports/lighthouse-$name.report.json');const c=r.categories;console.log('$path',Object.entries(c).map(([k,v])=>k+': '+Math.round(v.score*100)).join('  '))"
done
echo "HTML reports are in ./reports"
