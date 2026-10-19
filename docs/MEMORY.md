# VitaTwin — Current State (Memory)

**Last updated:** 2026-10-19

## What is done

### Foundation & UI
- Next.js 15 (App Router) + TypeScript strict + Tailwind CSS.
- All agent docs live in `/docs`; README rewritten for the real app.
- Internationalization (`src/lib/i18n.ts`) for English (`en`) and Hindi (`hi`) clinical headings, risk labels, simulator terms, and disclaimer.

### Data Layer & Multi-Patient Architecture
- Multi-patient migration (`supabase/migrations/0002_multi_patient_and_clinician.sql`) adding patient selection, clinician observation notes, and RBAC policies.
- Data providers abstraction (`src/services/data-providers/index.ts`) supporting both Supabase persistence and synthetic default fallback.
- Deterministic synthetic patient records calibrated for South-Asian clinical profiles.

### Twin Engine & Risk Models
- Pure TypeScript server-side twin engine (`src/services/twin-engine.ts`).
- Calibrated 10-year CVD risk, Type 2 Diabetes progression, and Acute Stress models.
- What-If counterfactual simulator and automated insight/recommendation generation.

### Health Verification & Deployment
- JSON health endpoint at `src/app/api/health/route.ts` returning system status, timestamp, synthetic mode, Supabase status, and model version.
- Vercel production deployment setup with Supabase integration.
