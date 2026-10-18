# VitaTwin — Demo Script (3 minutes)

Target: the Digital Twin Challenge 2026 jury.
Setup: `npm run dev`, browser at 1440 px wide, signed out.

---

## 0:00 — The problem (20 s)

Open the landing page (**/**).

> “Diabetes and hypertension are exploding in India, and care is still
> reactive — we treat events after they happen. VitaTwin is a living digital
> twin that predicts them before they do.”

Point at the synthetic-data notice: *all patient data here is synthetic.*

## 0:20 — Sign in (10 s)

Click **Continue with demo twin**.

> “A real Supabase account works too — email/password with row-level security.
> For the demo we use the offline synthetic twin so nothing depends on the
> network.”

## 0:30 — Dashboard: the twin at a glance (45 s)

On **/dashboard**:

1. Twin vital tiles — resting HR, HRV, SpO₂, sleep, steps.
2. Risk cards: **10-year CVD**, **diabetes progression**, **acute stress**.
3. Open a card to show the **contributing factors**.

> “Every score is explainable. This twin’s CVD risk is driven mainly by
> hypertension, high LDL and age — not a black box.”

## 1:15 — Vitals: the fused signal stream (30 s)

On **/vitals**:

- Hover the heart-rate and HRV traces; note day/night banding.
- Point out that night hours carry sleep stages, which is how the twin knows
  sleep duration and quality.

> “We fuse continuous wearable signals — not a single clinic reading.”

## 1:45 — Insights + alerts (30 s)

On **/insights**:

> “High-priority alerts are ranked, each with a plain-language reading, the
> factors behind it, and one recommended action.”

Show a lab-driven alert (for example HbA1c above reference range) and the
recommendation panel below.

## 2:15 — Timeline + clinician view (30 s)

- **/timeline**: how the twin evolved over the window.
- **/clinician**: the same twin framed for a doctor — risk summary, adherence
  and lab context.

> “Same twin, two audiences: the patient sees a next action, the clinician sees
> the evidence.”

## 2:45 — Close (15 s)

> “VitaTwin is a privacy-first proof of concept: synthetic data only, RLS on
> every row, no secrets in the browser, and explainable models.
> Your twin. Your future. In your pocket.”

**Q&A ammo**

| Question | Answer |
|----------|--------|
| Is the data real? | No — fully synthetic and labelled everywhere. Real device APIs are deliberate v2 scope. |
| Where is PHI protected? | Supabase RLS scoped to `auth.uid()`, httpOnly cookies, anon key only in the browser. |
| Why India-specific? | Young-onset diabetes/hypertension burden, low-cost wearable reality, clinician-facing framing. |
| Are the models validated? | No — transparent heuristics with published-factor structure, clearly versioned (`vita-twin-*-1.0`). |
