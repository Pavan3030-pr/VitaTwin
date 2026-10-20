# VitaTwin — Current State (Memory)

**Last updated:** 2026-10-19

## What is done

### Foundation
- Next.js 15 (App Router) + TypeScript strict + Tailwind CSS with light-theme
  tokens only (`src/app/globals.css`, `tailwind.config.ts`, PostCSS v3 config).
- All agent docs live in `/docs`; README rewritten for the real app.

### Data layer (`src/lib`, synthetic only)
- Deterministic synthetic patient: 52-year-old Indian adult with hypertension,
  type 2 diabetes and hyperlipidaemia.
- EHR snapshot (diagnoses, medications, labs with reference ranges + flags) and a
  30-day hourly wearable stream (HR, HRV, SpO₂, steps, sleep stages).
- The generator is UTC-consistent so ISO date parts never drift across days —
  earlier “sleep 0.8 h” and “0 steps” bugs came from local-time slicing.

### Twin engine (`src/services/twin-engine.ts`, pure TypeScript, server-side)
- `fuseData` — wearable window + EHR → vitals summary with graceful fallbacks.
- `computeCvD10YearRisk`, `computeDiabetesProgressionRisk`,
  `computeAcuteStressRisk` — every score ships factor contributions, direction,
  weight and a note (explainability is mandatory).
- `generateAlerts`, `generateRecommendations`, `buildTwinState`/`buildInsights`.
- Vitals are derived from the most recent **complete** day so a partial (early
  morning) window never renders as a zero.

### UI
- Landing page, login page, and the `(app)` route group behind a session:
  dashboard, vitals, insights, timeline, clinician, profile.
- Charts via Recharts; loading / error / not-found states on every route.
- Verified in the browser at 375 / 768 / 1440 px; no horizontal overflow, no
  `dark:` classes, light palette intact.

### Auth
- Demo mode: httpOnly `vitatwin_demo` cookie, always available offline.
- Supabase mode (auto-activates when env vars exist): `@supabase/ssr` browser +
  server clients, session refresh in `src/middleware.ts`, email/password
  sign-in & sign-up via server actions, error surfaced as `?error=` on `/login`.
- Schema + RLS committed at `supabase/migrations/0001_init.sql`
  (`profiles`, `twin_snapshots`, all policies scoped to `auth.uid()`).

### Verification
- 31 Vitest unit tests (synthetic data, twin engine, demo-bundle contract).
- 14 Playwright specs (journey, authorization, config honesty, theme,
  responsive).
- Quality gate green: lint, typecheck, unit, e2e, production build.

## 2026-10-19 jury upgrade

Full light-theme redesign (Bricolage Grotesque + Figtree, teal on off-white), twin figure, risk rings and a
what-if simulator (`src/services/scenario.ts`, `src/lib/scenario-actions.ts`, `src/components/twin/*`).
Hardened auth and headers, added a scrubbed error-reporting seam, fixed lint, the timeline sleep bug and a
misleading "stress detected" title on a low score. Gate: lint, typecheck, 42 unit tests, build green.
Run `npm run test:e2e` locally (browser not available where this was built).

## Current task

**Blocked on Supabase credentials.** The connected Supabase account has two
projects (`telgekdercnenyoiehlg`, `dfaycgkamjildcwmnhpg`) and both report
`INACTIVE`; API-key listing returns empty and SQL connections time out. To go
live we need a **resumed or newly created** project, then:

1. Apply `supabase/migrations/0001_init.sql`.
2. Write `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` +
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Re-run e2e with the email path enabled (sign-up → confirm → sign-in →
   sign-out → two-account isolation).

## Known issues / risks

- `npm run test:e2e` against the dev server can flake on the very first journey
  spec while Next compiles `/dashboard` cold; a re-run passes consistently.
- Error tracking / monitoring is still a placeholder (Phase 6 remainder).
- No deployment yet; Vercel + env vars still to do.

## Next step

1. Resume or create the Supabase project, apply the migration, write `.env.local`.
2. Verify the real sign-in journey in the browser.
3. Deploy to Vercel, set env vars, smoke-test the live URL logged-out.

## Notes for the agent

- Always re-read PRD + RULES + current TASKS before starting a new feature.
- After every meaningful change, update this MEMORY.md and tick the corresponding
  box in TASKS.md.
- Light theme only, synthetic data only, explainable scores only.

## 2026-10-20 — v2.0 upgrade
- Recovered from corrupted commits (data.ts merge garbage, truncated engine) by restoring the last green tree (b63d764).
- Added: Framingham-2008 SA CVD model, IDRS diabetes model, live Open-Meteo environment layer, personal-baseline early warning, 6-patient cohort, live stream, FHIR import/export, real-data validation (UCI Cleveland), CI, MIT licence, model card.
- Known: Open-Meteo is fetched server-side; offline => environment layer omitted.
