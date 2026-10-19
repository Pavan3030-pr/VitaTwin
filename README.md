# VitaTwin

**Your Living Digital Health Twin**

Proof-of-concept for the **Digital Twin Challenge 2026** — Reimagining & Reforming Healthcare in India Summit 2026 · Happiest Health.

> **All patient data in this application is synthetic.** No real personal health information is processed, stored, or transmitted. VitaTwin is not a medical device and does not provide a diagnosis.

---

## What it does

VitaTwin continuously fuses a wearable signal stream (heart rate, HRV, SpO2, sleep stages, steps) with an EHR snapshot (diagnoses, medications, labs) into a living digital twin.

- **Multi-Patient Clinical Panel**: Multi-patient database schema migration (`supabase/migrations/0002_multi_patient_and_clinician.sql`) supporting clinician notes, patient switching, and role-based access.
- **Data Providers Abstraction**: Flexible architecture (`src/services/data-providers/index.ts`) with Supabase persistence and zero-config synthetic default fallback.
- **South-Asian Calibrated Risk Models**: Explainable cardiometabolic risk estimation (10-year CVD, Type 2 Diabetes, Acute Cardiac Stress) calibrated for South-Asian populations.
- **What-If Counterfactual Simulator**: Interactive biomarker and lifestyle counterfactual scenario exploration.
- **i18n Multi-Language Support**: Dual English (`en`) and Hindi (`hi`) translation support (`src/lib/i18n.ts`) for clinical panels, risk labels, and medical disclaimers.
- **Health Verification API**: Health check endpoint at `/api/health` returning system status, timestamp, `mode: 'synthetic-default'`, `supabaseConfigured`, and `modelVersion`.

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev

# 3. Test API Health Verification Endpoint
curl http://localhost:3000/api/health
```

---

## Deployment & Verification (Vercel + Supabase)

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for full deployment runbook instructions.
