# VitaTwin — Architecture

## High-level view

```
┌─────────────────────────────────────┐
│  Next.js 15 (App Router) + TS       │
│  Tailwind CSS (light theme only)    │
│  Recharts / custom twin visuals     │
└──────────────┬──────────────────────┘
               │ Server Actions / API Routes
               ▼
┌─────────────────────────────────────┐
│  Twin Engine (TypeScript services)  │
│  • Data fusion                      │
│  • Risk models (rules + light ML)   │
│  • Insight generator                │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐   ┌─────────────────┐
│  Supabase   │   │  Synthetic Data │
│  Postgres   │   │  Generators     │
│  Auth + RLS │   │  (wearable +    │
│             │   │   EHR streams)  │
└─────────────┘   └─────────────────┘
```

**Core principle:** The browser never holds secrets. All twin computation that involves models or sensitive logic runs on the server. Synthetic data is clearly labelled.

## Stack (beginner-friendly + production-capable)

| Layer              | Choice                                      | Why |
|--------------------|---------------------------------------------|-----|
| AI Editor          | Cursor                                      | Best control for structured agent work |
| Frontend           | Next.js 15 + TypeScript + App Router        | Full-stack, excellent DX, Vercel-native |
| Styling            | Tailwind CSS + light design tokens only     | Fast, consistent, forced light theme |
| UI Components      | Custom + shadcn/ui (light variants)         | Clean clinical look |
| Charts / Twin Viz  | Recharts + custom SVG twin components       | Lightweight, controllable |
| Database & Auth    | Supabase (Postgres + Auth + RLS)            | Fast setup, row-level security |
| Twin Engine        | Pure TypeScript services + optional small ML| Transparent, debuggable |
| Testing            | Playwright (e2e) + Vitest (unit)            | Reliable user-journey tests |
| Deployment         | Vercel                                      | Zero-config for Next.js |
| Version control    | Git + GitHub                                | Mandatory from day 1 |

## Folder structure (suggested)

```
VitaTwin/
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DESIGN.md
│   ├── RULES.md
│   ├── TASKS.md
│   ├── DECISIONS.md
│   ├── MEMORY.md
│   ├── TEST_PLAN.md
│   └── SECURITY.md
├── .cursor/rules/
│   ├── general.mdc
│   ├── frontend.mdc
│   ├── backend.mdc
│   └── testing.mdc
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # Shared UI
│   ├── features/            # Feature modules (dashboard, twin, alerts…)
│   ├── services/            # Twin engine, data fusion, risk models
│   ├── lib/                 # Utils, supabase client, constants
│   ├── types/               # Shared TypeScript types
│   └── utils/
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── README.md
├── TASKS.md                 # Living task list (also in docs/)
├── .env.example
└── .gitignore
```

## Key architectural rules

1. **UI components never contain database or twin-model logic.** They receive props or call server actions.
2. **Authorization is verified on the server** for every sensitive operation.
3. **All twin state is derived**, never stored as a black-box blob without an audit trail.
4. **Synthetic data generators** live in a clearly marked module and are the only source of patient data in the PoC.
5. **Light theme is non-negotiable** — no dark mode classes, no dark CSS variables.
6. **Every risk score must be explainable** — return the contributing factors, not just a number.

## Data model (conceptual)

- **Patient** (synthetic profile)
- **EHR Snapshot** (labs, diagnoses, medications, family history)
- **Wearable Stream** (time-series: HR, HRV, steps, sleep stages, SpO2, activity intensity)
- **Twin State** (computed: current vitals summary, risk scores, trends, last updated)
- **Alert / Insight** (type, severity, explanation, recommended action, timestamp)
- **Recommendation** (category, text, priority)

## Request flow example

1. User opens dashboard → server action loads patient + latest wearable window + EHR.
2. Twin Engine fuses data → computes risk scores + generates insights.
3. Results returned to client → rendered with light-theme components + charts.
4. Any mutation (e.g., “acknowledge alert”) goes through a server action that re-checks ownership.

## Why this architecture wins for the hackathon

- Fast to build and demo
- Clear separation of concerns (easy for jury to understand)
- Privacy posture is visible in the design
- Easy to extend later with real device APIs or heavier models
- Matches the Vibe Coding Playbook philosophy: small loops, constant testing, living docs
