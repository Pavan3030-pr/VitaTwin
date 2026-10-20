/**
 * VitaTwin — published clinical risk equations (pure, dependency-free).
 *
 * These are the real, peer-reviewed models the twin is built on:
 *
 *  1. Framingham General CVD 10-year risk (D'Agostino et al., Circulation
 *     2008;117:743-753) — the lipid-based version, coefficients as published.
 *  2. South Asian recalibration: ACC/AHA 2019 primary-prevention guideline
 *     lists South Asian ancestry as a risk enhancer; QRISK-family models put
 *     the relative hazard at roughly 1.4-1.5. We apply 1.4 to the hazard.
 *  3. UKPDS-35 glycaemic adjustment (Stratton et al., BMJ 2000;321:405):
 *     each 1 percentage-point lower HbA1c ≈ 14% lower myocardial infarction
 *     risk in people with type 2 diabetes.
 *  4. Indian Diabetes Risk Score, IDRS (Mohan et al., JAPI 2005;53:759-763;
 *     Chennai Urban Rural Epidemiology Study): age, waist, activity, family
 *     history; ≥60 = high risk.
 *
 * Keep this file free of imports from the app so scripts can reuse it for
 * validation against real data (scripts/validate-real-data.ts).
 */

export type Sex = "Male" | "Female" | "Other";

export const SOUTH_ASIAN_HAZARD_MULTIPLIER = 1.4;

// ---------------------------------------------------------------------------
// Framingham 2008 general CVD
// ---------------------------------------------------------------------------

const FRAMINGHAM = {
  male: {
    age: 3.06117,
    totalCholesterol: 1.1237,
    hdl: -0.93263,
    sbpUntreated: 1.93303,
    sbpTreated: 1.99881,
    smoker: 0.65451,
    diabetes: 0.57367,
    mean: 23.9802,
    baselineSurvival: 0.88936,
  },
  female: {
    age: 2.32888,
    totalCholesterol: 1.20904,
    hdl: -0.70833,
    sbpUntreated: 2.76157,
    sbpTreated: 2.82263,
    smoker: 0.52873,
    diabetes: 0.69154,
    mean: 26.1931,
    baselineSurvival: 0.95012,
  },
} as const;

export interface CvdInputs {
  age: number;
  sex: Sex;
  totalCholesterol: number; // mg/dL
  hdl: number; // mg/dL
  systolicBp: number; // mmHg
  onBpTreatment: boolean;
  smoker: boolean;
  diabetes: boolean;
  /** Apply the South Asian hazard multiplier (default true). */
  southAsian?: boolean;
  /** UKPDS-35 adjustment, only used when diabetic. */
  hba1c?: number;
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

function framinghamSex(inputs: CvdInputs, sex: "male" | "female"): number {
  const c = FRAMINGHAM[sex];
  // The published model is fitted for ages 30-74; clamp so out-of-range input
  // degrades gracefully instead of extrapolating.
  const age = clamp(inputs.age, 30, 79);
  const tc = clamp(inputs.totalCholesterol, 100, 400);
  const hdl = clamp(inputs.hdl, 20, 100);
  const sbp = clamp(inputs.systolicBp, 90, 200);

  const sum =
    c.age * Math.log(age) +
    c.totalCholesterol * Math.log(tc) +
    c.hdl * Math.log(hdl) +
    (inputs.onBpTreatment ? c.sbpTreated : c.sbpUntreated) * Math.log(sbp) +
    (inputs.smoker ? c.smoker : 0) +
    (inputs.diabetes ? c.diabetes : 0);

  return 1 - Math.pow(c.baselineSurvival, Math.exp(sum - c.mean));
}

/** Plain Framingham 2008 10-year probability (0-1), no ancestry adjustment. */
export function framingham2008(inputs: CvdInputs): number {
  if (inputs.sex === "Male") return framinghamSex(inputs, "male");
  if (inputs.sex === "Female") return framinghamSex(inputs, "female");
  return (framinghamSex(inputs, "male") + framinghamSex(inputs, "female")) / 2;
}

/**
 * Full VitaTwin CVD estimate as a percentage (0-99.9): Framingham, scaled by
 * the South Asian hazard multiplier and, for diabetes, the UKPDS-35 HbA1c
 * adjustment (referenced to HbA1c 7.0%).
 */
export function cvdRiskPercent(inputs: CvdInputs): number {
  const base = framingham2008(inputs);
  let hazard = inputs.southAsian === false ? 1 : SOUTH_ASIAN_HAZARD_MULTIPLIER;
  if (inputs.diabetes && inputs.hba1c !== undefined && Number.isFinite(inputs.hba1c)) {
    hazard *= Math.pow(1.14, clamp(inputs.hba1c, 5, 12) - 7);
  }
  const adjusted = 1 - Math.pow(1 - clamp(base, 0, 0.999), hazard);
  return Math.round(clamp(adjusted, 0.0005, 0.999) * 1000) / 10;
}

export interface CvdAttribution {
  factor: string;
  deltaPct: number;
  note: string;
}

/**
 * One-at-a-time counterfactual attribution: how many percentage points of
 * 10-year risk disappear if this factor sat at an optimal reference value.
 * It is easy to audit and does not need a model-specific explainer.
 */
export function cvdAttribution(inputs: CvdInputs): CvdAttribution[] {
  const total = cvdRiskPercent(inputs);
  const out: CvdAttribution[] = [];
  const push = (factor: string, counterfactual: CvdInputs, note: string) => {
    const delta = Math.round((total - cvdRiskPercent(counterfactual)) * 10) / 10;
    if (delta >= 0.3) out.push({ factor, deltaPct: delta, note });
  };

  push(
    `Age ${Math.round(inputs.age)}`,
    { ...inputs, age: 30 },
    "Age is the strongest predictor in every CVD model (non-modifiable). Compared with age 30.",
  );
  if (inputs.systolicBp > 120) {
    push(
      `Systolic BP ${Math.round(inputs.systolicBp)} mmHg`,
      { ...inputs, systolicBp: 120 },
      "Each 20 mmHg above 115 roughly doubles vascular mortality (Lewington, Lancet 2002).",
    );
  }
  if (inputs.totalCholesterol > 170) {
    push(
      `Total cholesterol ${Math.round(inputs.totalCholesterol)} mg/dL`,
      { ...inputs, totalCholesterol: 170 },
      "Atherogenic lipid burden; compared with 170 mg/dL.",
    );
  }
  if (inputs.hdl < 50) {
    push(
      `HDL ${Math.round(inputs.hdl)} mg/dL`,
      { ...inputs, hdl: 55 },
      "Low protective HDL; South Asians commonly show low HDL and high triglycerides.",
    );
  }
  if (inputs.smoker) {
    push(
      "Current smoker",
      { ...inputs, smoker: false },
      "Smoking roughly doubles coronary risk; risk falls quickly after quitting.",
    );
  }
  if (inputs.diabetes) {
    push(
      "Diabetes mellitus",
      { ...inputs, diabetes: false },
      "Diabetes confers a 2-3x relative risk of cardiovascular events.",
    );
    if (inputs.hba1c !== undefined && inputs.hba1c > 7) {
      push(
        `HbA1c ${inputs.hba1c.toFixed(1)}%`,
        { ...inputs, hba1c: 7 },
        "UKPDS-35: each 1-point HbA1c reduction ≈ 14% fewer myocardial infarctions.",
      );
    }
  }
  if (inputs.southAsian !== false) {
    push(
      "South Asian ancestry",
      { ...inputs, southAsian: false },
      "Risk-enhancer in ACC/AHA 2019; hazard ×1.4 (earlier, more diffuse coronary disease).",
    );
  }
  return out.sort((a, b) => b.deltaPct - a.deltaPct);
}

/**
 * ACC/AHA-aligned bands for 10-year risk percentages:
 * <7.5 low, 7.5-<20 intermediate, ≥20 high, ≥30 very high.
 */
export function cvdCategory(pct: number): "low" | "moderate" | "high" | "critical" {
  if (pct < 7.5) return "low";
  if (pct < 20) return "moderate";
  if (pct < 30) return "high";
  return "critical";
}

// ---------------------------------------------------------------------------
// Indian Diabetes Risk Score (IDRS)
// ---------------------------------------------------------------------------

export type ActivityLevel = "regular" | "moderate" | "sedentary";
export type FamilyDiabetes = "none" | "one-parent" | "both-parents";

export interface IdrsInputs {
  age: number;
  sex: Sex;
  waistCm: number;
  activity: ActivityLevel;
  family: FamilyDiabetes;
}

export interface IdrsBreakdown {
  total: number;
  age: number;
  waist: number;
  activity: number;
  family: number;
}

export function idrs(inputs: IdrsInputs): IdrsBreakdown {
  const age = inputs.age < 35 ? 0 : inputs.age < 50 ? 20 : 30;

  const female = inputs.sex === "Female";
  const lowCut = female ? 80 : 90;
  const highCut = female ? 90 : 100;
  const waist = inputs.waistCm < lowCut ? 0 : inputs.waistCm < highCut ? 10 : 20;

  const activity = inputs.activity === "regular" ? 0 : inputs.activity === "moderate" ? 20 : 30;
  const family = inputs.family === "none" ? 0 : inputs.family === "one-parent" ? 10 : 20;

  return { total: age + waist + activity + family, age, waist, activity, family };
}

/**
 * South-Asian waist regression on BMI, used only when waist was not measured.
 * Fitted to published Indian anthropometry (mean waist ≈ 80 cm at BMI 22,
 * ≈ 95 cm at BMI 27 for men). Always disclosed in the UI as "estimated".
 */
export function estimateWaistCm(bmi: number, sex: Sex): number {
  const b = clamp(bmi, 14, 50);
  return Math.round(sex === "Female" ? 2.7 * b + 16 : 2.9 * b + 17);
}

/** Daily steps → IDRS activity class (a wearable proxy, disclosed as such). */
export function activityFromSteps(avgDailySteps: number): ActivityLevel {
  if (avgDailySteps >= 8000) return "regular";
  if (avgDailySteps >= 4000) return "moderate";
  return "sedentary";
}

// ---------------------------------------------------------------------------
// Statistics helpers shared with the validation script
// ---------------------------------------------------------------------------

/** Area under the ROC curve by the rank-sum (Mann-Whitney) method. */
export function aucRoc(scores: number[], labels: boolean[]): number {
  const pos: number[] = [];
  const neg: number[] = [];
  scores.forEach((score, i) => (labels[i] ? pos : neg).push(score));
  if (pos.length === 0 || neg.length === 0) return NaN;
  let wins = 0;
  for (const p of pos) {
    for (const n of neg) {
      if (p > n) wins += 1;
      else if (p === n) wins += 0.5;
    }
  }
  return wins / (pos.length * neg.length);
}
