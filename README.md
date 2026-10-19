# VitaTwin

<image-card alt="Build" src="https://img.shields.io/badge/build-passing-brightgreen" ></image-card>
<image-card alt="Tests" src="https://img.shields.io/badge/tests-42%20passing-brightgreen" ></image-card>
<image-card alt="Theme" src="https://img.shields.io/badge/theme-light%20only-blue" ></image-card>
<image-card alt="Data" src="https://img.shields.io/badge/data-synthetic%20only-orange" ></image-card>

**Your Living Digital Health Twin**

Proof-of-concept for the **Digital Twin Challenge 2026** —
Reimagining & Reforming Healthcare in India Summit 2026 · Happiest Health.

> **All patient data in this application is synthetic.** No real personal health
> information is processed, stored, or transmitted. VitaTwin is not a medical
> device and does not provide a diagnosis.

---

## What it does

VitaTwin continuously fuses a wearable signal stream (heart rate, HRV, SpO₂,
sleep stages, steps) with an EHR snapshot (diagnoses, medications, labs) into a
living digital twin of one patient. The twin then:

- estimates **explainable** cardiometabolic risk (10-year CVD, diabetes
  progression, acute cardiac stress) with per-factor contributions, never a
  bare number;
- raises prioritised **alerts** with a plain-language reading and a recommended
  action;
- produces **insights and recommendations** framed for both patient and
  clinician views.

The demo patient is a 52-year-old Indian adult with hypertension, type 2
diabetes and hyperlipidaemia — the profile the Indian cardiometabolic burden is
built around.

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) + TypeScript strict |
| Styling | Tailwind CSS — **light theme only** |
| Data + Auth | Supabase (Postgres + Auth + RLS) |
| Charts | Recharts + custom SVG |
| Tests | Vitest (unit) + Playwright (e2e) |
| Deploy | Vercel |

## Quick start

```bash
cp .env.example .env.local   # optional: add Supabase keys for real auth
npm install
npm run dev                  # http://localhost:3000
```

The app runs **without any keys**: the landing page and the
“Continue with demo twin” button open the synthetic twin offline. Email
sign-in, session refresh and RLS are activated automatically once Supabase
credentials are present.

### Supabase setup (optional but recommended)

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. Apply the schema in [supabase/migrations/0001_init.sql](supabase/migrations/0001_init.sql)
   (`profiles` + `twin_snapshots`, both protected by RLS on `auth.uid()`).
3. Put the Project URL and **anon** public key in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```

4. Restart `npm run dev`. The login screen now offers **Sign in / Create
   account**, sessions are refreshed in middleware, and every row is scoped to
   the owning user by RLS.

The `service_role` key is never used by this app and never leaves the server.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint (flat config, Next core-web-vitals + TS) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest unit tests |
| `npm run test:e2e` | Playwright journey/auth/theme/responsive specs |

## Project layout

```
src/
  app/                 routes: landing, login, and the (app) twin group
  components/          UI kit, charts, app shell
  lib/                 synthetic data, demo bundle, auth + Supabase clients
  services/            twin engine (fusion, risk, alerts, recommendations)
  types/               shared twin domain model
supabase/migrations/   Postgres schema + RLS policies
tests/unit             Vitest specs (data generator, twin engine, bundle)
tests/e2e              Playwright specs (journey, auth, theme, responsive)
docs/                  PRD, ARCHITECTURE, DESIGN, RULES, TASKS, DECISIONS,
                       MEMORY, TEST_PLAN, SECURITY, DEMO_SCRIPT
```

## Documentation

The `/docs` folder is the project’s brain and stays current:

| File | Purpose |
|------|---------|
| [PRD.md](docs/PRD.md) | What we are building and why |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | How it is built |
| [DESIGN.md](docs/DESIGN.md) | Light-theme design system |
| [RULES.md](docs/RULES.md) | How the agent must behave |
| [TASKS.md](docs/TASKS.md) | Ordered checklist |
| [DECISIONS.md](docs/DECISIONS.md) | Permanent choices + reasons |
| [MEMORY.md](docs/MEMORY.md) | Current state of the project |
| [TEST_PLAN.md](docs/TEST_PLAN.md) | What “working” means |
| [SECURITY.md](docs/SECURITY.md) | Privacy & security rules |
| [DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) | 3-minute jury walkthrough |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Deploy + post-deploy verification runbook |

## Hackathon context

- Prototype & code submission: 18 Sep – 20 Oct 2026
- Jury presentation for the top 10, live showcase for the top 5 (Bengaluru)

---

Built following the Vibe Coding Playbook: planning docs first, small testable
loops, verification before trust, living documentation.
