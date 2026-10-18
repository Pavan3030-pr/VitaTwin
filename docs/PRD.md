# VitaTwin — Product Requirements Document (PRD)

**Hackathon:** Reimagining & Reforming Healthcare in India Summit 2026  
**Challenge:** Digital Twin Challenge 2026 by Happiest Health  
**Team size:** 1–4 members  
**Submission deadline:** 20 Oct 2026, 07:00 PM IST  

---

## 1. Product Name & Identity

| Item | Value |
|------|-------|
| **Name** | **VitaTwin** |
| **Tagline** | Your Living Digital Health Twin |
| **One-liner** | A dynamic digital twin that continuously fuses wearable signals and EHR data to predict adverse cardiometabolic events before they happen and personalize care for every Indian patient. |
| **Logo concept** | Two soft overlapping circles (twin) with a gentle ECG line running through the centre. Light theme only: soft white / warm off-white background, medical teal `#0D9488`, soft sky-blue accents, charcoal text. Clean, clinical, hopeful. Never dark mode. |

---

## 2. Problem Statement

India faces a massive and growing burden of cardiometabolic disease (diabetes, hypertension, heart failure, stroke). Care is still largely **reactive**: patients present after an event.  

A true **Digital Twin** — a continuously updated virtual replica of a patient’s physiology — can shift medicine from reactive to **proactive**. By simulating the unique physiology of each person using real-time wearable data + EHR, we can:

- Predict adverse events days or weeks earlier
- Personalize lifestyle and treatment recommendations
- Give clinicians a living, queryable model of the patient

Most existing solutions are either research-only, hospital-closed, or too expensive for the Indian context. VitaTwin is built as a **practical, privacy-first proof-of-concept** that demonstrates this future is achievable by student teams today.

---

## 3. Target Users

| Persona | Description | Primary need |
|---------|-------------|--------------|
| **Patient / Care-seeker** | Adults 25–65 with or at risk of diabetes, hypertension, or early CVD. Urban + semi-urban India. | Clear risk signals + actionable daily guidance |
| **Clinician / Care team** | Doctors, diabetes educators, primary-care physicians | A living patient model they can query and trust |
| **Hackathon evaluators** | Technical + clinical jury | Working PoC, clear impact narrative, clean engineering |

---

## 4. Goal & Success Criteria (MVP)

**Goal:** Deliver a working Digital Twin proof-of-concept that continuously updates a patient’s virtual state from simulated wearable + EHR data and surfaces predictive risk + personalized insights.

**MVP Success Criteria (must all be true):**

1. User can create / select a patient profile (synthetic data only).
2. System ingests and visualizes continuous wearable streams (HR, HRV, steps, sleep, SpO2, activity) + static EHR snapshot (labs, diagnoses, meds, history).
3. Digital Twin state is computed and displayed: current vitals, risk scores (CVD 10-yr, diabetes progression, acute event risk), and trend.
4. At least one predictive alert is generated with explanation (e.g., rising nocturnal HR + poor sleep → elevated next-day cardiac stress risk).
5. Personalized recommendations appear (lifestyle + when to seek care).
6. Full user journey works end-to-end on desktop + mobile (light theme).
7. Privacy notice + synthetic-data disclaimer are prominent.
8. Code is clean, documented, and runnable with one command or clear steps.

**Out of scope for Version 1 (explicit “Not Now” list):**

- Real device integrations (Fitbit, Apple Health, CGM) — use high-quality simulation
- Real patient identifiable data
- Full clinical decision support / prescription writing
- Multi-language UI beyond English (can note future Hindi support)
- Mobile native apps
- Payments, insurance, hospital EMR deep integration
- Complex multi-organ physiology simulation (keep focused on cardiometabolic)

---

## 5. Core Features (MVP)

1. **Patient Twin Dashboard** — living overview of the twin
2. **Data Fusion Engine** — wearable streams + EHR → twin state
3. **Risk Prediction Layer** — transparent, explainable risk scores + alerts
4. **Insight & Recommendation Engine** — personalized, actionable guidance
5. **Timeline / Memory** — how the twin evolved over days/weeks
6. **Clinician View (simplified)** — same twin, different emphasis
7. **Privacy & Trust Layer** — synthetic data only, clear ownership messaging

---

## 6. Research & Competitive Notes (for the team)

- Digital Twin literature focuses heavily on cardiac and metabolic models.
- Indian context: high prevalence of young-onset diabetes and hypertension; wearable adoption is rising in cities.
- Competitors / inspirations: existing research digital twins, some startup dashboards — most lack continuous wearable fusion or are not India-accessible.
- Technical feasibility: all required building blocks (time-series visualization, simple predictive models or rule + LLM reasoning, auth, hosting) exist and fit student budgets.

---

## 7. Success Metrics for Jury

- Working, demo-able PoC (not just slides)
- Clear problem → solution → impact story for India
- Technical soundness (architecture, code quality, security posture)
- Thoughtful handling of privacy and synthetic data
- Potential for real-world extension beyond the hackathon

---

*This PRD is the single source of truth for what we are building and why. Update it only with team consensus and record the change in DECISIONS.md.*
