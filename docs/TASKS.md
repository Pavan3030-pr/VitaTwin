# VitaTwin — Living Task List

Work through phases in order. Check boxes only when the quality gate in RULES.md is satisfied.

Current gate: `npm run lint` ✅ · `npm run typecheck` ✅ · `npm test` ✅ (31 unit) ·
`npm run test:e2e` ✅ (14 specs) · `npm run build` ✅ — all green as of 2026-10-18.

## Phase 0 — Foundation (Day 1)

- [x] Create repo, `git init`, push to GitHub
- [x] Set up Next.js 15 + TypeScript + Tailwind (light theme tokens)
- [x] Add `.env.example` and `.gitignore`
- [x] Create all docs files (PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS, MEMORY, TEST_PLAN, SECURITY)
- [x] Basic README with run instructions
- [x] Verify `node`, `npm`, `git` versions

## Phase 1 — Core Shell & Auth

- [x] Supabase project + Auth setup (client/server clients, session refresh in middleware)
- [x] Light-theme login / signup screens with synthetic-data notice
- [x] Protected routes / middleware
- [x] Basic layout shell (sidebar or top nav + content area)
- [x] Postgres schema + RLS policies committed (`supabase/migrations/0001_init.sql`)
- [ ] Apply the migration to a live Supabase project and record the project ref
- [ ] Write `.env.local` from the connected project (blocked: both connected projects are paused/INACTIVE)

## Phase 2 — Synthetic Data Layer

- [x] Patient profile generator (demographics, risk factors relevant to India)
- [x] EHR snapshot generator (labs, diagnoses, meds, history)
- [x] Wearable stream generator (realistic HR, HRV, steps, sleep, SpO2 over days)
- [x] Clear “Synthetic Data” labelling in UI and code comments

## Phase 3 — Twin Engine (Core Differentiator)

- [x] Data fusion service (combine wearable window + EHR)
- [x] Risk models (explainable):
  - [x] CVD risk approximation
  - [x] Diabetes progression / metabolic risk
  - [x] Acute event / stress risk (short-term)
- [x] Twin state object with last-updated timestamp and contributing factors
- [x] Unit tests for risk calculations

## Phase 4 — Dashboard & Visualization

- [x] Twin Dashboard (hero summary + risk cards)
- [x] Vitals / stream charts (light theme)
- [x] Alerts & Insights list with explanations
- [x] Personalized recommendations panel
- [x] Timeline / memory view of twin evolution
- [x] Loading, error and not-found states for every route

## Phase 5 — Clinician-oriented View (lightweight)

- [x] Alternative framing of the same twin data for a clinician lens
- [x] Clear separation of patient vs clinician emphasis

## Phase 6 — Quality, Privacy & Polish

- [x] Playwright e2e test for main user journey
- [x] Security review against SECURITY.md
- [x] Responsive check (375 / 768 / 1440)
- [x] Final README + DEMO script ([DEMO_SCRIPT.md](DEMO_SCRIPT.md))
- [x] Update all docs to match final state
- [x] Error tracking placeholder (`src/lib/monitoring.ts`, scrubbed)

## Phase 7 — Submission Ready

- [ ] Clean GitHub repo with clear structure
- [ ] Working deployment (Vercel preview or production)
- [ ] Pitch / demo materials (optional but recommended)
- [ ] Submission checklist completed for Happiest Health portal

## Phase 8 — Jury upgrade (2026-10-19)

- [x] Light-theme redesign: landing, login, shell, dashboard, all twin screens
- [x] Twin figure (silhouette, dashed twin, data nodes, ECG) and risk rings
- [x] What-if simulator with server-side validation, unit and e2e tests
- [x] WCAG AA colour fixes; mobile tab bar with all six sections
- [x] Auth rate limit, input validation, security headers
- [x] Fixed lint error and timeline sleep-hours bug
- [ ] Deploy to Vercel and run the live smoke test

---

**Current focus:** Supabase credentials + migration application, then deploy.
(see MEMORY.md → Current task)
