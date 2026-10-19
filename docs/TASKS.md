# VitaTwin — Living Task List

Work through phases in order. Check boxes only when the quality gate in RULES.md is satisfied.

Current gate: `npm run lint` ✅ · `npm run typecheck` ✅ · `npm test` ✅ · `npm run test:e2e` ✅ · `npm run build` ✅ — all green as of 2026-10-19.

## Phase 0 — Foundation
- [x] Create repo, `git init`, push to GitHub
- [x] Set up Next.js 15 + TypeScript + Tailwind
- [x] Add `.env.example` and `.gitignore`
- [x] Create all docs files (PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS, MEMORY, TEST_PLAN, SECURITY)

## Phase 1 — Core Shell & Auth & Multi-Patient Migration
- [x] Supabase project + Auth setup
- [x] Multi-patient schema migration (`0002_multi_patient_and_clinician.sql`)
- [x] Data providers abstraction (`src/services/data-providers/index.ts`)

## Phase 2 — Twin Engine & Risk Calibration
- [x] Pure TypeScript twin engine (`src/services/twin-engine.ts`)
- [x] South-Asian calibrated CVD & Type 2 Diabetes risk models
- [x] Counterfactual What-If simulator

## Phase 3 — Health Verification & i18n Support
- [x] Next.js `GET` `/api/health` endpoint with status, timestamp, synthetic mode, Supabase status, model version
- [x] Internationalization (`src/lib/i18n.ts`) for English (`en`) and Hindi (`hi`)

## Phase 4 — Deployment & Runbook
- [x] Updated `docs/DEPLOYMENT.md`, `docs/MEMORY.md`, `docs/TASKS.md`, and `README.md`
- [x] Production Vercel deployment verification
