# VitaTwin — Living Task List

Work through phases in order. Check boxes only when the quality gate in RULES.md is satisfied.

## Phase 0 — Foundation (Day 1)

- [ ] Create repo, `git init`, push to GitHub
- [ ] Set up Next.js 15 + TypeScript + Tailwind (light theme tokens)
- [ ] Add `.env.example` and `.gitignore`
- [ ] Create all docs files (PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS, MEMORY, TEST_PLAN, SECURITY)
- [ ] Basic README with run instructions
- [ ] Verify `node`, `npm`, `git` versions

## Phase 1 — Core Shell & Auth

- [ ] Supabase project (or local Postgres) + Auth setup
- [ ] Light-theme login / signup screens with synthetic-data notice
- [ ] Protected routes / middleware
- [ ] Basic layout shell (sidebar or top nav + content area)

## Phase 2 — Synthetic Data Layer

- [ ] Patient profile generator (demographics, risk factors relevant to India)
- [ ] EHR snapshot generator (labs, diagnoses, meds, history)
- [ ] Wearable stream generator (realistic HR, HRV, steps, sleep, SpO2 over days)
- [ ] Clear “Synthetic Data” labelling in UI and code comments

## Phase 3 — Twin Engine (Core Differentiator)

- [ ] Data fusion service (combine wearable window + EHR)
- [ ] Risk models (explainable):
  - CVD risk approximation
  - Diabetes progression / metabolic risk
  - Acute event / stress risk (short-term)
- [ ] Twin state object with last-updated timestamp and contributing factors
- [ ] Unit tests for risk calculations

## Phase 4 — Dashboard & Visualization

- [ ] Twin Dashboard (hero summary + risk cards)
- [ ] Vitals / stream charts (light theme)
- [ ] Alerts & Insights list with explanations
- [ ] Personalized recommendations panel
- [ ] Timeline / memory view of twin evolution

## Phase 5 — Clinician-oriented View (lightweight)

- [ ] Alternative framing of the same twin data for a clinician lens
- [ ] Clear separation of patient vs clinician emphasis

## Phase 6 — Quality, Privacy & Polish

- [ ] Playwright e2e test for main user journey
- [ ] Security review against SECURITY.md
- [ ] Responsive check (375 / 768 / 1440)
- [ ] Error tracking placeholder + basic monitoring notes
- [ ] Final README + DEMO script
- [ ] Update all docs to match final state

## Phase 7 — Submission Ready

- [ ] Clean GitHub repo with clear structure
- [ ] Working deployment (Vercel preview or production)
- [ ] Pitch / demo materials (optional but recommended)
- [ ] Submission checklist completed for Happiest Health portal

---

**Current focus:** (update this line in MEMORY.md as well)
