# VitaTwin — "Is it real?" checklist

| # | Item | Where it lives |
|---|------|----------------|
| 1 | Real login and logout | `src/lib/auth-actions.ts`, `src/app/login/page.tsx` |
| 2 | Password reset | `/forgot-password`, `/reset-password` |
| 3 | Email verification | `/auth/callback`, "Resend confirmation email" on login |
| 4 | Loading states | `src/app/(app)/loading.tsx`, `SubmitButton` |
| 5 | Empty states | `src/components/ui/empty-state.tsx` |
| 6 | Clear error messages | `src/lib/auth-errors.ts`, error boundaries |
| 7 | Form validation | `src/lib/validation.ts` (server) + HTML5 attributes |
| 8 | Rate limiting | `src/lib/rate-limit.ts`, `src/lib/request-guard.ts` |
| 9 | Database backups | `npm run backup`, `docs/BACKUPS.md` |
| 10 | Row level security | `supabase/migrations/`, `supabase/tests/verify-rls.sql` |
| 11 | API keys off the frontend | `npm run check:secrets` (also in CI) |
| 12 | Mobile layout | scrollable bottom nav, `viewport-fit=cover` |
| 13 | Custom 404 | `src/app/not-found.tsx` |
| 14 | Analytics | Vercel Web Analytics (`<Analytics />` in root layout) |
| 15 | Error tracking | `src/instrumentation.ts`, `/api/log-error`, optional `ERROR_WEBHOOK_URL` |
| 16 | Privacy policy | `/privacy` |
| 17 | Terms | `/terms` |
| 18 | Delete account | `/account`, migration `0002_account_lifecycle.sql` |
| 19 | Onboarding flow | `src/components/onboarding/onboarding-dialog.tsx` |

Known limits: rate limiting is in-memory per serverless instance (swap for Upstash/Redis
before real traffic); the legal pages are sensible templates, not legal advice.

## Round 2 hardening

| Area | Where |
|------|-------|
| Patched Next.js (security advisories) | `package.json` → `next@15.5.28` |
| Shared rate limiting (Redis) | `src/lib/rate-limit-shared.ts`, `UPSTASH_*` env vars |
| Lighter vitals page | `src/components/charts/vitals-chart-lazy.tsx` |
| Accessibility | skip link, reduced-motion CSS, landmarks |
| SEO / install | `robots.ts`, `sitemap.ts`, `manifest.ts`, Open Graph |
| Vulnerability reporting | `public/.well-known/security.txt` |
| Supply chain | `.github/dependabot.yml`, `.github/workflows/codeql.yml` |
| E2E in CI | `.github/workflows/e2e.yml` |
| Post-deploy checks | `npm run smoke -- <url>`, `npm run lighthouse -- <url>` |

## Round 3–6

| Area | Where |
|------|-------|
| Meta description rendered in `<head>` | `next.config.ts` → `htmlLimitedBots` |
| AA contrast for muted text | `tailwind.config.ts`, `globals.css` |
| Saved snapshots + CSV/print export | `src/lib/snapshot-actions.ts`, `src/app/api/clinician/export/route.ts` |
| Delete verified (no silent RLS no-op) | `src/lib/snapshot-actions.ts`, `supabase/migrations/0003_snapshot_delete_policy.sql` |
| Local-time timestamps | `src/components/ui/local-time.tsx` |
| Per-page browser titles | `title.template` in `src/app/layout.tsx` |
| Accurate auth copy (no false "passwords never touch our servers") | `src/app/login/page.tsx` |
| README screenshots | `npm run screenshots` → `docs/screenshots/` |

## Round 7–8

| Area | Where |
|------|-------|
| Biggest-levers ranking | `src/services/levers.ts`, `src/components/twin/levers-card.tsx` |
| Coverage gate in CI | `vitest.config.ts`, `.github/workflows/ci.yml` |
| Auth, account and callback tests | `tests/unit/auth-actions.test.ts`, `account-actions.test.ts`, `auth-callback.test.ts` |
| Health probe for Supabase Auth | `src/lib/health.ts`, `/api/health` |
| COOP header, production audit in CI | `next.config.ts`, `ci.yml` |
| API reference, troubleshooting, changelog, contributing | `docs/API.md`, `docs/TROUBLESHOOTING.md`, `CHANGELOG.md`, `CONTRIBUTING.md` |
