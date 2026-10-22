# VitaTwin — Deployment Runbook

Target: a public HTTPS URL the jury can open, with the same behaviour as the
local build.

Stack decision (DECISIONS.md): **Vercel**. VitaTwin uses Next.js server
components, server actions, middleware and a cookie-bound Supabase session, so a
static-only host will not work — the app needs a Node/Edge SSR runtime.

---

## 0. Pre-flight (must be green locally)

```bash
npm run lint
npm run typecheck
npm test            # 31 unit tests
npm run test:e2e    # 14 Playwright specs
npm run build
```

---

## 1. Environment variables

Set these in the host's dashboard (Production **and** Preview):

| Variable | Required | Notes |
|----------|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | optional | Public project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | optional | Public anon key only |
| `NEXT_PUBLIC_APP_URL` | recommended | Public origin (e.g. `https://vita-twin-ten.vercel.app`), used for metadata, sitemap and auth e-mail links |
| `NEXT_PUBLIC_CONTACT_EMAIL` | optional | Contact address shown on the privacy page |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | optional | Shared rate limiting across serverless instances; without them an in-memory limiter is used |
| `ERROR_WEBHOOK_URL` | optional | Server-only Slack/Discord/JSON webhook that receives scrubbed error reports |
| `SUPABASE_DB_URL` | local only | Session-pooler connection string used by `npm run backup`; never set it on Vercel |

- Omit both Supabase variables and the deployment still runs in offline demo
  mode; only the email form is disabled.
- **Never** set `SUPABASE_SERVICE_ROLE_KEY` for this app. It is not read
  anywhere, and adding it would put full-database credentials one bug away from
  a leak.
- All `NEXT_PUBLIC_*` values are shipped to the browser. Never put a secret in
  one.

---

## 2. Supabase preparation

1. Project must be **active** (paused free-tier projects time out on connect).
2. Apply the schema:

   ```bash
   # via the Supabase SQL editor, or the CLI:
   supabase db push
   ```

   Contents: `supabase/migrations/0001_init.sql`
   (`profiles`, `twin_snapshots`, RLS on `auth.uid()`, sign-up trigger).

3. Auth → URL configuration: add the deployed origin **and**
   `https://<origin>/auth/callback`-style patterns if they are ever added.
   For email/password sign-in only the site URL and redirect allow-list entries
   for the deployed origin are needed.
4. Auth → Providers: Email enabled. If "Confirm email" is on, the first
   sign-up needs an inbox click before sign-in succeeds — worth knowing during
   a live demo, which is why the demo twin stays available.

---

### Supabase Auth URL settings (required for e-mail links)

In **Authentication → URL Configuration**:

- **Site URL:** `https://vita-twin-ten.vercel.app`
- **Redirect URLs:** `https://vita-twin-ten.vercel.app/auth/callback` and
  `http://localhost:3000/auth/callback`

If the Site URL is left at its default (`http://localhost:3000`), confirmation and
password-reset e-mails link to localhost and fail.

Apply every file in `supabase/migrations/` in order (`0001` to `0003`), then run
`supabase/tests/verify-rls.sql` and check the results it describes.

---

## 3. Deploy

### Option A — Vercel CLI

```bash
npx vercel login          # interactive, opens the browser once
npx vercel                # first run links/creates the project (preview)
npx vercel --prod         # production
```

### Option B — GitHub + Vercel dashboard

1. `gh repo create vita-twin --public --source=. --push` (or push to an
   existing repo).
2. Vercel → *Add New Project* → import the repo → framework auto-detected as
   Next.js → add the env vars → Deploy.

---

## 4. Post-deploy verification (do not skip)

Run against the **live URL**, not localhost:

1. Landing page renders, synthetic-data notice visible.
2. Logged out: `/dashboard` redirects to `/login?next=%2Fdashboard`.
3. Demo sign-in reaches a populated twin dashboard with plausible numbers.
4. With Supabase configured: create account → confirm → sign in → sign out.
5. Two-account isolation: sign in as A, save/observe rows, sign in as B and
   confirm A's rows are invisible (RLS proof).
6. Check the browser console and network tab for errors, and confirm
   HTML/JS/CSS content types.
7. Mobile Safari/Chrome at 375 px: no horizontal overflow.

Record the URL and the date/time of the checks in `docs/MEMORY.md`.

---

### Automated checks

```bash
npm run smoke -- https://vita-twin-ten.vercel.app       # routes, auth gates, security headers
npm run lighthouse -- https://vita-twin-ten.vercel.app  # performance, accessibility, SEO
npm run check:secrets                                   # after `npm run build`
```

Also enable **Vercel → Analytics** once, and confirm
`/api/health` reports `"rateLimiter":"shared-redis"` after adding the Upstash variables.

---

## 5. Rollback / offline

- Vercel keeps every deployment; **Promote to Production** on the previous one
  rolls back instantly.
- To take the app offline during submission review, pause the Supabase project —
  the app falls back to demo mode gracefully (the email form disables itself).
