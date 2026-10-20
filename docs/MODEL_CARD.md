# VitaTwin Model Card (v2.0)

**Intended use:** hackathon proof of concept demonstrating an explainable cardiometabolic digital twin for clinician review. **Not** for diagnosis, treatment or triage of real patients.

## Models

| Model | Basis | Output | Version |
|---|---|---|---|
| 10-year CVD risk | Framingham 2008 general-CVD (age, sex, TC, HDL, SBP±treatment, smoking, diabetes) × South-Asian hazard 1.4 × UKPDS-35 (1.14 per HbA1c point vs 7%, diabetics only) | % over 10 years; bands <7.5 / 7.5–20 / 20–30 / ≥30 | `vita-twin-cvd-2.0-fram08-sa` |
| Diabetes risk & progression | Not diabetic: IDRS (age, waist, activity, family history; ≥60 high) floored by prediabetic labs. Diabetic: HbA1c vs ADA targets + BMI (Asian cut-off 27.5), hypertension, eGFR | 0–100 | `vita-twin-diabetes-2.0-idrs-ada` |
| Acute cardiac stress | Resting HR, sleep, HRV, stress index + personal-baseline strain index + live PM2.5 / heat | 0–100 | `vita-twin-acute-2.0-baseline-env` |
| Early warning | Robust z-scores of nocturnal HR, HRV, sleep, steps vs the person's own baseline; damped linear 72 h projection | strain 0–100, level, lead time | — |

Explainability: CVD factors are one-at-a-time counterfactual attributions (points of risk removed if the factor were optimal). Others list weighted factors with notes.

## Evidence on real data
UCI Cleveland (n = 303, angiographic CAD): AUC 0.706 (95% CI 0.649–0.762); age alone 0.638; logistic refit (5-fold CV) 0.709. Observed disease by risk quartile 21% → 38% → 51% → 71%. `npm run validate` regenerates `src/data/validation.json`.

## Known limitations
- Framingham was derived in US cohorts; the ×1.4 South-Asian multiplier is a guideline-based recalibration, not locally fitted. Absolute risks may be over- or under-estimated.
- Validation outcome is prevalent CAD in a referral cohort, not incident events; HDL and smoking absent from that dataset.
- Wearable and EHR data are synthetic; early-warning weights are a transparent design choice, not a fitted model, and have not been prospectively tested.
- Waist is estimated from BMI when unmeasured (always disclosed in the factor name).
- Live environment layer depends on Open-Meteo availability; the twin degrades gracefully without it.

## Safety and privacy
Synthetic patients only; FHIR import is stateless; no PHI logged; all authorisation server-side.
