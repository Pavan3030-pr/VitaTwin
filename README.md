# VitaTwin

**Your Living Digital Health Twin**

Proof-of-concept for the **Digital Twin Challenge 2026**  
Reimagining & Reforming Healthcare in India Summit 2026 · Happiest Health

---

## What is VitaTwin?

VitaTwin is a dynamic digital twin that continuously fuses simulated wearable signals and EHR data to predict adverse cardiometabolic events and personalize care. Built as a practical, privacy-first student PoC focused on the Indian disease burden (diabetes, hypertension, CVD).

**All patient data in this demonstration is synthetic.**

## Stack

- Next.js 15 + TypeScript + Tailwind CSS (light theme only)
- Supabase (Postgres + Auth + RLS)
- Recharts + custom twin visualizations
- Playwright + Vitest
- Vercel

## Quick start (once code exists)

```bash
cp .env.example .env.local   # fill Supabase keys etc.
npm install
npm run dev
```

## Documentation (give these to your coding agent)

Everything the agent needs lives in `/docs`:

| File | Purpose |
|------|---------|
| [PRD.md](docs/PRD.md) | What we are building and why |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | How it is built |
| [DESIGN.md](docs/DESIGN.md) | Light-theme design system + logo concept |
| [RULES.md](docs/RULES.md) | How the AI must behave |
| [TASKS.md](docs/TASKS.md) | Ordered checklist of work |
| [DECISIONS.md](docs/DECISIONS.md) | Permanent choices + reasons |
| [MEMORY.md](docs/MEMORY.md) | Current state of the project |
| [TEST_PLAN.md](docs/TEST_PLAN.md) | What “working” means |
| [SECURITY.md](docs/SECURITY.md) | Privacy & security rules |

## Logo & Brand

- **Name:** VitaTwin  
- **Logo concept:** Two soft overlapping circles with a gentle ECG line. Medical teal on warm off-white.  
- **Theme:** Light only. Calm, clinical, hopeful.

## Hackathon context

- Prototype & Code Submission: 18 Sep – 20 Oct 2026  
- Jury presentation for top 10  
- Summit showcase for top 5 (Bengaluru, 20 Nov 2026)  
- Prizes + pre-placement interview opportunities with Happiest Health

---

Built following the Vibe Coding Playbook philosophy: planning docs first, small tasks, constant testing, living documentation.
