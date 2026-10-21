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
