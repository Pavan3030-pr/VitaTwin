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
| Where is user data protected? | Supabase RLS scoped to `auth.uid()`, server-side session checks on every private route, anon key only in the browser, no service-role key anywhere. |
| Why India-specific? | Young-onset diabetes/hypertension burden, low-cost wearable reality, clinician-facing framing. |
| Are the models validated? | Partly, and we say so. The equations are published; the CVD score is sanity-checked offline on the public UCI Cleveland dataset (see `/validation`); the early-warning backtest uses synthetic data; there is no prospective study. |
| Does any real patient data enter the app? | No. Cleveland is a public, de-identified benchmark used only offline by `npm run validate`. Every patient in the app is generated. |
| What if the live air-quality feed is down? | The app labels it unavailable and keeps working; the twin never depends on the network. |

---

# Extended walkthrough (10–20 minute recording)

Use this when the submission asks for a longer demo video. Each block is one
screen; say the quoted line, show the thing, move on.

| Time | Screen | Show | Say |
|------|--------|------|-----|
| 0:00 | `/` landing | Synthetic-data notice, India context, the twin figure | The problem: diabetes and hypertension in India, and care that reacts instead of predicts |
| 1:30 | `/login` → demo | Click **Continue with demo twin** | Instant synthetic patient; a real account is also available |
| 2:30 | `/dashboard` | Six personas, risk rings, "Top drivers" under each score | Every score lists its drivers; nothing is a black box |
| 4:00 | Early warning card | "x SD worse" rows and lead time | Compares today to the person's own baseline, not a population average |
| 5:00 | What-if panel | Presets and sliders (e.g. Glucose under control), then the **Biggest levers** list | Risk is recomputed live, and the twin ranks which single change would help this person most |
| 6:30 | Environment card | Live air quality and heat from Open-Meteo | The only real data is public weather; it is labelled and optional |
| 7:30 | `/insights`, `/vitals` | Alert explanation, wearable charts | Plain-language reasons, then the signals behind them |
| 9:00 | `/import` | FHIR sample bundle, wearable CSV sample | Standards-based in (FHIR R4) and out; files are analysed and discarded |
| 11:00 | `/clinician` | Urgency-sorted panel, **Download CSV**, **Print / save as PDF** | Same twin, framed for a doctor |
| 12:30 | `/validation` | AUC and calibration on the public Cleveland benchmark, backtest, limitations | Offline sanity check on public data; limits are stated, not hidden |
| 14:00 | Real account | Sign up with a throwaway email, open the confirmation mail, sign in | Row-level security isolates each user |
| 15:30 | `/timeline` | **Save today's snapshot**, then delete it | Users keep a private history of derived scores |
| 16:30 | `/account` | Reset-password link, then **Delete my account** | Self-service deletion; no service-role key |
| 17:30 | Engineering | Terminal: `npm run smoke`, green CI badge, Lighthouse scores | Tested, monitored, and checked after every deploy |
| 19:00 | Close | Landing page | Synthetic data only, explainable, privacy-first |

**Recording tips**

- Browser at 1440 px wide, light theme, notifications off, a clean profile with no other tabs visible.
- Run `npm run smoke -- https://vita-twin-ten.vercel.app` just before recording; fix anything red first.
- Use a throwaway email for the account section, and delete the account on camera so the project stays clean.
- Upload as **Unlisted** on YouTube, then paste the link into `README.md` under *Demo video*.
