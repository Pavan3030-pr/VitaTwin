# VitaTwin — Troubleshooting

Problems met while building and deploying this project, with the fix for each.

## Sign-in e-mails

| Symptom | Cause | Fix |
|---|---|---|
| Confirmation or reset link opens `localhost` ("refused to connect") | Supabase **Site URL** still `http://localhost:3000`, or the redirect URL is not allow-listed | Authentication → URL Configuration: set Site URL to the live URL and add `…/auth/callback` (live and localhost) to Redirect URLs, then request a **new** e-mail |
| "That link has expired or was already used" | Links are single-use and short-lived | Request a new link from `/forgot-password` |
| Sign-in form is disabled | `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` missing for the environment | Add both in Vercel (Production), redeploy; `/api/health` should show `"supabaseConfigured":true` |

## Account and data

| Symptom | Cause | Fix |
|---|---|---|
| "We could not delete your account. Nothing was removed." | `delete_my_account()` not installed or not visible to the API | Run `supabase/migrations/0002_account_lifecycle.sql` in the SQL editor (it ends with `notify pgrst, 'reload schema'`) |
| "That snapshot was not deleted…" | The `twin_snapshots` delete policy or grant is missing | Run `supabase/migrations/0003_snapshot_delete_policy.sql`; `supabase/tests/verify-rls.sql` check 4 should return one row |
| `/api/health` shows `"auth":"unreachable"` | Supabase project paused, wrong URL/key, or network blip | Open the Supabase dashboard (free projects pause after inactivity), restore, retry |

## Local development and CI

| Symptom | Cause | Fix |
|---|---|---|
| `npm install` fails with `ERESOLVE` | Peer-dependency conflict between dev tooling and an optional peer | The repo ships `.npmrc` with `legacy-peer-deps=true`; use `npm ci` |
| `npm run build` fails fetching Google Fonts | No internet in the build environment | Build where the network is available (Vercel and normal laptops are fine) |
| Playwright: `Executable doesn't exist` | Browser not installed | `npx playwright install chromium` |
| `npm run smoke` shows 404 for a new route right after `git push` | Vercel is still deploying | Wait ~2 minutes and re-run |
| Lighthouse: "DevTools protocol response has exceeded the allotted time" | Chrome stalled | Close other Chrome windows and re-run the single page |
| Coverage gate fails in CI | Coverage fell below the thresholds in `vitest.config.ts` | Add tests for the new code; do not lower the thresholds |

## Operations

| Symptom | Cause | Fix |
|---|---|---|
| `"rateLimiter":"in-memory"` in production | `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` not set | Add both in Vercel, redeploy |
| `npm run backup` says `pg_dump not found` | PostgreSQL client tools missing | `brew install libpq && brew link --force libpq` |
| No error alerts arrive | `ERROR_WEBHOOK_URL` not set (errors still go to Vercel Logs, scrubbed) | Add a Slack/Discord webhook URL as a server-only variable |
