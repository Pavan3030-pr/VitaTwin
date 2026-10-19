# VitaTwin — Current State (Memory)

**Last updated:** 2026-10-19

## What is done

### Foundation & UI
- Next.js 15 (App Router) + TypeScript strict + Tailwind CSS.
- All agent docs live in `/docs`; README rewritten for the real app.
- Internationalization (`src/lib/i18n.ts`) for English (`en`) and Hindi (`hi`) clinical headings, risk labels, simulator terms, and disclaimer.

### Data Layer & Multi-Patient Architecture
- Multi-patient migration (`supabase/migrations/0002_multi_patient_and_clinician.sql`) adding patient selection, clinician observation notes, and RBAC policies.
- Cleaned migration directory structure (removed garbage `supabase/migrations/src/` folder).
- Data providers abstraction (`src/services/data-providers/index.ts`) supporting both Supabase persistence and synthetic default fallback without non-existent module imports.
- Deterministic synthetic patient records calibrated for South-Asian clinical profiles via `generateDemoBundle()`.

### Twin Engine & Risk Models
- Restored pure TypeScript server-side twin engine (`src/services/twin-engine.ts`).
- Calibrated 10-year CVD risk, Type 2 Diabetes progression, and Acute Stress models returning explainable `RiskFactorContribution` arrays.
- Automated insight, alert, and recommendation generation.

### Health Verification & Disclaimers
- Prominent disclaimers: Synthetic data only, educational/research PoC, not a validated medical device.
