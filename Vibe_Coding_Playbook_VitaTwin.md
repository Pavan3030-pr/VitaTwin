# Vibe Coding Playbook — VitaTwin
### Idea to Live Digital Twin (Hackathon Edition)

**Digital Twin Challenge 2026 · Happiest Health**  
Reimagining & Reforming Healthcare in India Summit 2026

---

## Application Identity

| | |
|---|---|
| **Name** | **VitaTwin** |
| **Tagline** | Your Living Digital Health Twin |
| **Logo concept** | Two soft overlapping circles (the twin) with a gentle ECG / heartbeat line running through the centre. Primary colour: medical teal `#0D9488` on warm off-white. Clean, clinical, hopeful. **Light theme only — never dark.** |

---

## Why this playbook exists

This is the exact operating system you (and your coding agent) will follow to go from a rough idea to a working, jury-ready Digital Twin proof-of-concept. It is adapted from the proven “Vibe Coding” method and specialised for the Happiest Health Digital Twin Challenge.

**Core philosophy**

1. Think before you prompt.
2. Give the AI a brain (living docs).
3. Build in small, testable loops.
4. Verify before you trust.
5. Ship with discipline.
6. Keep the docs alive.

---

## Phase 1: Think before you prompt

Spend the first focused hour on paper (or this document), not inside Cursor.

### Five questions you already answered

| Question | VitaTwin Answer |
|----------|-----------------|
| What problem are you solving? | Reactive healthcare for India’s cardiometabolic epidemic. Patients and doctors lack a living model that predicts risk before events happen. |
| Who is the user? | At-risk adults (25–65) + their clinicians. Secondary: hackathon jury. |
| What is the main outcome? | A continuously updated digital twin that surfaces predictive risk and personalised guidance from wearable + EHR data. |
| What is the MVP? | Synthetic patient → fused wearable/EHR streams → explainable risk scores + alerts + recommendations → light-theme dashboard + clinician framing. |
| What is NOT in version one? | Real device APIs, real PHI, full clinical decision support, native mobile apps, multi-language, payments, hospital EMR deep links, complex multi-organ simulation. |

### Research checklist (do once)

- Users & pain: young-onset diabetes/hypertension burden in India, rising wearable adoption.
- Competitors / prior art: research digital twins, existing dashboards — most are closed, expensive, or lack continuous fusion.
- Technical feasibility: time-series viz, simple explainable models, auth, hosting — all available and budget-friendly.
- Trust official docs over random blogs for any library decisions.

---

## Phase 2: Set up your foundation

**Recommended stack (already locked in DECISIONS.md)**

| Layer | Choice |
|-------|--------|
| AI editor | Cursor |
| Frontend | Next.js 15 + TypeScript |
| Styling | Tailwind CSS — **light theme tokens only** |
| Database + Auth | Supabase (Postgres + Auth + RLS) |
| Charts / Twin viz | Recharts + custom SVG |
| Testing | Playwright (e2e) + Vitest |
| Deployment | Vercel |
| Version control | Git + GitHub |

**Day-one commands**

```bash
npx create-next-app@latest vita-twin --typescript --tailwind --eslint --app --src-dir
cd vita-twin
git init
# create GitHub repo and push
```

- Keep real secrets in `.env.local`. Commit only `.env.example`.
- Run `node --version`, `npm --version`, `git --version` and confirm they are modern.

**Why Git comes first**  
AI will occasionally break working code. Git is your instant undo button.

---

## Phase 3: Give the AI a brain

These short files live in `/docs` and are the agent’s permanent context.  
**Never let the agent work from stale or missing docs.**

| File | Question it answers |
|------|---------------------|
| PRD.md | What are we building, and why? |
| ARCHITECTURE.md | How is it built? |
| DESIGN.md | How should it look and feel? (light theme only) |
| RULES.md | How should the AI behave? |
| TASKS.md | What is next? |
| DECISIONS.md | Permanent choices and their reasons |
| MEMORY.md | Where are we right now? |
| TEST_PLAN.md | What does “working” mean? |
| SECURITY.md | Privacy & security rules |

**Tiny-project rule:** If time is extremely tight, start with PRD + RULES + TASKS and grow the rest.

**Suggested structure** (already created for you):

```
VitaTwin/
  docs/          ← all the files above
  .cursor/rules/ ← optional Cursor rule files
  src/
  tests/
  README.md
  TASKS.md
  .env.example
  .gitignore
```

---

## Phase 4: Build in small loops

Never ask for the whole app in one prompt.

1. Start every feature with:  
   *“Read the docs (especially PRD, ARCHITECTURE, DESIGN, RULES and the current task). Do not write code yet. Tell me your plan in 3–6 bullets.”*
2. Build one complete user flow at a time (e.g., “synthetic patient loads and twin dashboard renders with risk cards”).
3. Structure every prompt with: Context → Task → Files → Constraints → Acceptance criteria → Tests to run.
4. After each feature: lint → typecheck → tests → build → commit → update MEMORY.md + TASKS.md.

---

## Phase 5: Verify before you trust

“It compiled” ≠ “it works”.

- Ask the agent to review its own code against the docs and list issues before fixing.
- Debug with structure: paste the error, expected vs actual, steps to reproduce → then “Find the root cause first, make the smallest fix.”
- Add at least one Playwright test for the main user journey (login/demo → dashboard → alert explanation).
- Manually check 375 px, 768 px, 1440 px.
- Confirm the light theme is still pure (no dark classes).

---

## Phase 6: Ship it and keep it alive

1. Local → Vercel preview → final production URL.
2. Separate environment variables for development and production.
3. After launch: test the live URL on mobile and desktop, logged-out, and with bad input.
4. Add basic error tracking / uptime notes.
5. Update the docs whenever the app changes so the agent never works from stale context.

### The daily loop (print this)

**Read → Plan → Build → Test → Review → Fix → Commit → Update docs**

---

## Hackathon-specific reminders

- **Submission window:** 18 Sep 2026 – 20 Oct 2026, 07:00 PM IST  
- Top 10 → virtual jury presentation  
- Top 5 → live showcase at the Summit in Bengaluru (20 Nov 2026)  
- Prizes + pre-placement interview opportunities with Happiest Health  

**What the jury will care about most**

1. Working, demo-able Digital Twin PoC (not just slides)
2. Clear India-relevant impact story (cardiometabolic)
3. Clean engineering + privacy posture (synthetic data, RLS, no secrets in client)
4. Explainable predictions
5. Thoughtful UX (light, calm, clinical)

---

## Final checklist before you submit

- [ ] All Phase 0–6 tasks in TASKS.md are complete or explicitly deferred
- [ ] MEMORY.md reflects final state
- [ ] README is clear and runnable
- [ ] Synthetic-data notice is visible
- [ ] Light theme is pure
- [ ] Main user journey has Playwright coverage
- [ ] GitHub repo is clean and public (or as required)
- [ ] Deployed URL works
- [ ] Demo script is ready

---

**You now have everything the coding agent needs.**  
Open the project in Cursor, point it at `/docs`, and start with Phase 0.

Good luck — build something the jury (and Indian patients) will remember.

*— VitaTwin team, following the Vibe Coding method*
