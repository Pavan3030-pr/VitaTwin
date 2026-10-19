# VitaTwin — Architecture & Product Decisions

Record permanent choices here so the agent (and future teammates) never reverse them without explicit discussion.

| Date       | Decision | Reason |
|------------|----------|--------|
| 2026-10-19 | Add a **what-if simulator** (server action re-running the same explainable models) | Core digital-twin behaviour. Not on the "Not Now" list; inputs validated, auth re-checked server-side. |
| 2026-10-19 | Filled buttons and small teal text use teal-700 `#0F766E`; brand teal `#0D9488` kept for graphics/logo; muted text `#64748B` | WCAG AA. White on `#0D9488` is 3.7:1; `#94A3B8` on white is 2.6:1. |
| 2026-10-19 | Display font Bricolage Grotesque + body Figtree (supersedes Inter) | Distinct, warm, readable identity for the light redesign. |
| 2026-10-19 | In-memory auth rate limit + baseline security headers | SECURITY.md requires auth rate limiting; per-instance is fine for a PoC. |
| 2026-10-18 | Auth = Supabase Auth with **email/password + RLS**, no `service_role` key in the app | The anon key is public, so RLS is the real boundary. The service-role key grants total DB access and would be a catastrophic leak in a student PoC. |
| 2026-10-18 | Keep an **offline demo session** next to real auth | A jury demo must never depend on network, email confirmation or a paused project. Supabase sessions take precedence when present, so the demo path can never mask a real login. |
| 2026-10-18 | Dashboard vitals are derived from the **most recent complete day** | An early-morning run only has night samples; deriving “today” made steps/hba1c read as zero. Complete-day windows make the twin stable at any clock time. |
| 2026-10-18 | Synthetic timestamps are generated in **UTC** | Mixing local-time generation with UTC slicing shifted nights across days (sleep ≈ 1 h). UTC everywhere makes the data deterministic across machines. |
| 2026-10-18 | Product name = **VitaTwin** | Clear, memorable, health-focused, works in English and feels premium for a digital twin. |
| 2026-10-18 | Light theme only | Clinical calm, accessibility, jury-friendly, matches “hopeful healthcare” positioning. Dark mode is explicitly forbidden. |
| 2026-10-18 | Focus domain = Cardiometabolic risk (diabetes, hypertension, CVD) | Highest relevance to Indian population burden and wearable data availability. |
| 2026-10-18 | Synthetic data only for PoC | Privacy, ethics, and legal safety for a student hackathon. Real PHI is out of scope. |
| 2026-10-18 | Stack = Next.js 15 + TypeScript + Tailwind + Supabase + Vercel | Fastest path to a polished, deployable full-stack PoC with excellent DX and security primitives (RLS). |
| 2026-10-18 | Twin computation on server | Keeps models, keys, and logic away from the browser; easier to evolve later. |
| 2026-10-18 | Explainable risk scores mandatory | Jury and clinicians need to trust the “why”, not just a black-box number. |
| 2026-10-18 | No real wearable APIs in MVP | Simulation is sufficient and more reliable for a timed hackathon. Real integrations are post-MVP. |

*Add new rows at the top. Never delete previous decisions — mark superseded ones clearly.*
