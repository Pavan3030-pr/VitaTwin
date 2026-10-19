# VitaTwin - Deployment Runbook

Target: a public HTTPS URL the jury can open, with the same behaviour as the local build.

Stack decision (DECISIONS.md): **Vercel**. VitaTwin uses Next.js server components, server actions, middleware and a cookie-bound Supabase session, so a static-only host will not work — the app needs a Node/Edge SSR runtime.

---

## 0. Pre-flight (must be green locally)

```bash
npm run lint
npm run typecheck
npm test           # unit tests
npm run test:e2e   # Playwright specs
npm run build
```

---

## 1. Database Migrations (Supabase)

Execute migrations in order via the Supabase SQL Editor or CLI:

1. `supabase/migrations/0001_initial_schema.sql` - Core digital twin schema.
2. `supabase/migrations/0002_multi_patient_and_clinician.sql` - Multi-patient clinical panel, role-based access control, and clinician observation notes.

---

## 2. Environment Variables

Set these in the host's dashboard (Production and Preview):

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Public project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Public anon key |
| `NEXT_PUBLIC_SYNTHETIC_DATA_MODE` | Optional | Default `true` if Supabase missing |

---

## 3. Deployment Features & Architecture

- **Data Providers**: `src/services/data-providers/index.ts` abstraction supporting both Supabase persistence and synthetic default fallback.
- **Calibrated Risk Models**: South-Asian calibrated models for 10-year CVD, Type 2 Diabetes, and Acute Stress trajectory.
- **Health Verification Endpoint**: `GET /api/health` returning JSON `status: 'ok'`, `timestamp`, `mode: 'synthetic-default'`, `supabaseConfigured`, and `modelVersion`.
- **Internationalization (i18n)**: English (`en`) and Hindi (`hi`) translations in `src/lib/i18n.ts`.

---

## 4. Vercel Deployment Instructions

1. Push latest code to `main` branch on GitHub.
2. Connect GitHub repository `Pavan3030-pr/VitaTwin` to Vercel.
3. Configure environment variables if Supabase is linked.
4. Trigger deployment.
5. Verify `/api/health` endpoint on live deployment URL.
