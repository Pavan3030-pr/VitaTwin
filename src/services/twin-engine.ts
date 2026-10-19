/**
 * VitaTwin — Twin Engine.
 *
 * Pure TypeScript services that fuse wearable data + EHR snapshot into an
 * explainable digital-twin state. All computation runs server-side; the
 * browser only receives the derived, explainable summary.
 *
 * Risk models are transparent: every score returns contributing factors,
 * not only a number (ARCHITECTURE.md rule 6).
 *
 * Synthetic input data only. No real PHI ever reaches this module.
 */

import type {
  TwinState,
  Alert,
  Insight,
  Recommendation,
  RiskFactorContribution,
  RiskResult,
  PatientProfile,
  WearableSample,
  TwinVitals,
} from "@/types/twin";

function localNowIso(): string {
  return new Date().toISOString();
}

function riskFactor(factor: string, direction: "higher" | "lower" | "neutral", weight: number, note: string): RiskFactorContribution {
  return { factor, direction, weight, note };
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, value));
}

// ---------------------------------------------------------------------------
// Fusion
// ---------------------------------------------------------------------------

export interface FusedInput {
  patient: PatientProfile;
  samples: WearableSample[];
  windowDays: number;
}

export interface FusedResult {
  vitals: TwinVitals;
  mergedEhr: PatientProfile;
}

/**
 * Fuses a wearable window + EHR snapshot into a vitals summary.
 * Graceful fallbacks when data is missing (edge-case safety).
 */
export function fuseData(input: FusedInput): FusedResult {
  const { patient, samples, windowDays } = input;
  const now = Date.now();

  const valid = samples.filter(
    (s) => Date.parse(s.timestamp) <= now && Date.parse(s.timestamp) > now - windowDays * 86400000,
  );

  const hrValues = valid.map((s) => s.heartRateBpm).filter((v) => Number.isFinite(v));
  const hrvValues = valid.map((s) => s.hrvMs).filter((v) => Number.isFinite(v));
  const spO2Values = valid.map((s) => s.spO2).filter((v) => Number.isFinite(v));
  const stepsToday = valid.reduce((acc, s) => acc + s.steps, 0);

  // The stream is hourly, so one non-awake sample equals one hour slept.
  const sleepSamples = valid.filter((s) => s.sleepStage !== "awake");
  const sleepHours = sleepSamples.length;

  // Sleep quality proxy vs the population baseline HRV (~40ms)
  const avgHrv = hrvValues.length > 0
    ? hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length
    : patient.riskFactors.hyperlipidemia ? 35 : 45;
  const sleepQuality = clamp(1 - Math.abs(avgHrv - 40) / 40, 0, 1);

  const hr = hrValues.length > 0
    ? Math.round(hrValues.reduce((a, b) => a + b, 0) / hrValues.length)
    : 75;
  const hrv = hrvValues.length > 0
    ? Math.round(hrvValues.reduce((a, b) => a + b, 0) / hrvValues.length)
    : 38;
  const sysBp = patient.systolicBp ?? 120;
  const diaBp = patient.diastolicBp ?? 80;
  const spO2 = spO2Values.length > 0
    ? Math.round(spO2Values.reduce((a, b) => a + b, 0) / spO2Values.length)
    : 97;

  return {
    vitals: {
      heartRateBpm: hr,
      hrvMs: hrv,
      respiratoryRate: 14 + Math.round((hr - 70) * 0.3),
      bloodPressureSystolic: sysBp,
      bloodPressureDiastolic: diaBp,
      temperatureC: 36.5 + randomOffset(-0.4, 0.4),
      spO2,
      stepsToday,
      sleepHours: Number((sleepHours).toFixed(1)),
      sleepQuality: Number((sleepQuality * 100).toFixed(0)),
      lastUpdated: localNowIso(),
    },
    mergedEhr: patient,
  };
}

/** Deterministic-ish pseudo-random for the fusion thermal baseline. */
function randomOffset(min: number, max: number): number {
  const x = Math.sin(Date.now() * 0.0001 + min) * 10000;
  return min + (x - Math.floor(x)) * (max - min);
}

// ---------------------------------------------------------------------------
// Risk models (explainable)
// ---------------------------------------------------------------------------

export interface RiskFactorsInput {
  age: number;
  systolicBp: number;
  diastolicBp: number;
  cholesterolTotal: number;
  hdl: number;
  ldl: number;
  triglycerides: number;
  fastingGlucose: number;
  hba1c: number;
  hypertension: boolean;
  diabetes: boolean;
  hyperlipidemia: boolean;
  familyHistory: string;
  bmi: number;
  smoking: string;
  creatinine: number;
  egfr: number;
  hemoglobin: number;
  alcoholPerWeek: number;
}

/**
 * CVD risk approximation (ASCVD-style heuristic, 10-year cardiometabolic
 * risk). Returns an explainable score 0-100.
 */
export function computeCvD10YearRisk(factors: RiskFactorsInput): RiskResult {
  let score = 0;

  if (factors.age >= 55) score += 8;
  if (factors.hypertension) score += 8;
  if (factors.diabetes) score += 12;
  if (factors.hyperlipidemia) score += 10;
  if (factors.familyHistory === "Parent") score += 6;
  if (factors.familyHistory === "Multiple") score += 10;
  if (factors.smoking === "Current") score += 8;
  if (factors.smoking === "Former") score += 3;

  // Cholesterol
  if (factors.ldl > 160) score += 12;
  else if (factors.ldl > 130) score += 7;
  if (factors.hdl < 40) score += 8;
  if (factors.triglycerides > 200) score += 5;

  // BP
  if (factors.systolicBp > 160) score += 8;
  else if (factors.systolicBp > 140) score += 5;

  // Glucose / metabolic
  if (factors.hba1c > 8.0) score += 14;
  else if (factors.hba1c > 6.5) score += 8;
  else if (factors.fastingGlucose > 126) score += 6;
  if (factors.bmi > 30) score += 6;
  if (factors.alcoholPerWeek > 14) score += 2;

  // Kidney function
  if (factors.egfr < 60) score += 8;
  if (factors.creatinine > 1.3) score += 4;

  const raw = clamp(score, 0, 100);
  const category: RiskResult["category"] =
    raw < 20 ? "low" : raw < 40 ? "moderate" : raw < 70 ? "high" : "critical";

  const factorsList: RiskFactorContribution[] = [];
  if (factors.age >= 55) factorsList.push(riskFactor("Age >= 55", "higher", 8, "Age is the strongest single predictor in ASCVD models."));
  if (factors.hypertension) factorsList.push(riskFactor("Hypertension", "higher", 8, "Elevated BP accelerates atherosclerosis."));
  if (factors.diabetes) factorsList.push(riskFactor("Diabetes mellitus", "higher", 12, "Metabolic disease markedly raises CVD risk."));
  if (factors.hyperlipidemia) factorsList.push(riskFactor("Dyslipidemia", "higher", 10, "High LDL / low HDL drives plaque formation."));
  if (factors.familyHistory === "Parent") factorsList.push(riskFactor("Family history (parent)", "higher", 6, "Genetic predisposition to early CVD."));
  if (factors.smoking === "Current") factorsList.push(riskFactor("Current smoker", "higher", 8, "Tobacco use damages vascular endothelium."));
  if (factors.ldl > 160) factorsList.push(riskFactor("LDL > 160 mg/dL", "higher", 12, "Elevated LDL is causal for atherosclerotic events."));
  if (factors.hdl < 40) factorsList.push(riskFactor("HDL < 40 mg/dL", "lower", 8, "Low protective HDL reduces reverse cholesterol transport."));
  if (factors.systolicBp > 160) factorsList.push(riskFactor("Systolic BP > 160 mmHg", "higher", 8, "Severe hypertension increases cardiac workload."));
  if (factors.hba1c > 8.0) factorsList.push(riskFactor("HbA1c > 8.0%", "higher", 14, "Poor long-term glucose control accelerates vascular damage."));
  if (factors.bmi > 30) factorsList.push(riskFactor("BMI > 30", "higher", 6, "Obesity is associated with hypertension and insulin resistance."));
  if (factors.egfr < 60) factorsList.push(riskFactor("eGFR < 60 mL/min", "higher", 8, "Reduced kidney function independently raises CVD risk."));
  if (factors.alcoholPerWeek > 14) factorsList.push(riskFactor("Alcohol > 14/week", "higher", 2, "Excess alcohol contributes to hypertension and dyslipidemia."));

  const explanation = `10-year cardiometabolic risk approximated at ${raw}/100. Main drivers: ${factorsList
    .map((f) => f.factor)
    .join(", ")}. This is a heuristic PoC model — not a clinical tool.`;

  return {
    type: "cvd-10yr",
    label: "10-year cardiovascular risk",
    value: raw,
    category,
    factors: factorsList,
    explanation,
    lastUpdated: localNowIso(),
    modelVersion: "vita-twin-cvd-1.0",
  };
}

/**
 * Diabetes progression / metabolic risk. Rises with HbA1c, fasting glucose,
 * BMI, and hypertension. Outputs an explainable score.
 */
export function computeDiabetesProgressionRisk(factors: RiskFactorsInput): RiskResult {
  let score = 0;
  const rf: RiskFactorContribution[] = [];

  if (factors.hba1c > 8.0) score += 20;
  else if (factors.hba1c > 7.0) score += 14;
  else if (factors.hba1c > 6.5) score += 8;
  if (factors.fastingGlucose > 126) score += 12;
  else if (factors.fastingGlucose > 100) score += 5;
  if (factors.bmi > 30) score += 10;
  else if (factors.bmi > 25) score += 5;
  if (factors.hypertension) score += 6;
  if (factors.familyHistory === "Multiple") score += 8;
  if (factors.familyHistory === "Parent") score += 5;
  if (factors.smoking === "Current") score += 5;
  if (factors.alcoholPerWeek > 14) score += 3;
  if (factors.hdl < 40) score += 4;
  if (factors.triglycerides > 200) score += 4;

  const raw = clamp(score, 0, 100);
  const category: RiskResult["category"] =
    raw < 20 ? "low" : raw < 40 ? "moderate" : raw < 70 ? "high" : "critical";

  if (factors.hba1c > 8.0) rf.push(riskFactor("HbA1c > 8.0%", "higher", 20, "Long-term hyperglycemia is the primary driver of progression."));
  else if (factors.hba1c > 7.0) rf.push(riskFactor("HbA1c > 7.0%", "higher", 14, "Elevated average glucose signals advancing diabetes."));
  else if (factors.hba1c > 6.5) rf.push(riskFactor("HbA1c > 6.5%", "higher", 8, "Above diagnostic threshold, progression likely."));
  if (factors.fastingGlucose > 126) rf.push(riskFactor("Fasting glucose > 126 mg/dL", "higher", 12, "Overt hyperglycemia indicates decompensation."));
  if (factors.bmi > 30) rf.push(riskFactor("BMI > 30", "higher", 10, "Obesity drives insulin resistance."));
  else if (factors.bmi > 25) rf.push(riskFactor("BMI > 25", "higher", 5, "Overweight contributes to metabolic syndrome."));
  if (factors.hypertension) rf.push(riskFactor("Hypertension", "higher", 6, "Hypertension clusters with insulin resistance."));
  if (factors.alcoholPerWeek > 14) rf.push(riskFactor("Alcohol > 14/week", "higher", 3, "Heavy alcohol raises triglycerides and glucose."));

  const explanation = `Metabolic risk approximated at ${raw}/100. Main drivers: ${rf.map((f) => f.factor).join(", ")}. PoC heuristic only.`;

  return {
    type: "diabetes-progression",
    label: "Diabetes progression risk",
    value: raw,
    category,
    factors: rf,
    explanation,
    lastUpdated: localNowIso(),
    modelVersion: "vita-twin-diabetes-1.0",
  };
}

/**
 * Acute event / short-term stress risk. Flags elevated nocturnal HR, poor
 * sleep, high stress index, and tachycardia — the alert example in PRD §4.
 */
export function computeAcuteStressRisk(factors: RiskFactorsInput, vitals: {
  heartRateBpm: number;
  hrvMs: number;
  sleepHours: number;
  sleepQuality: number;
  stressIndex: number;
}): RiskResult {
  const { heartRateBpm, hrvMs, sleepHours, stressIndex } = vitals;

  let score = 0;
  const rf: RiskFactorContribution[] = [];

  // Rising nocturnal HR (accelerated autonomic stress)
  if (heartRateBpm > 90) {
    score += 12;
    rf.push(riskFactor("Resting HR > 90 bpm", "higher", 12, "Elevated resting heart rate correlates with acute cardiac stress."));
  } else if (heartRateBpm > 80) {
    score += 6;
    rf.push(riskFactor("Resting HR > 80 bpm", "higher", 6, "Mildly elevated resting heart rate."));
  }

  // Poor sleep / reduced HRV as acute stress markers
  if (sleepHours < 5) {
    score += 14;
    rf.push(riskFactor("Sleep < 5 h", "lower", 14, "Sleep deprivation acutely raises cardiac stress hormones."));
  } else if (sleepHours < 6.5) {
    score += 8;
    rf.push(riskFactor("Sleep < 6.5 h", "lower", 8, "Reduced sleep duration increases next-day cardiac load."));
  }

  if (hrvMs < 25) {
    score += 10;
    rf.push(riskFactor("HRV < 25 ms", "lower", 10, "Low heart-rate variability indicates poor autonomic recovery."));
  } else if (hrvMs < 35) {
    score += 5;
    rf.push(riskFactor("HRV < 35 ms", "lower", 5, "Reduced variability signals stress."));
  }

  if (stressIndex > 8) {
    score += 10;
    rf.push(riskFactor("Stress index > 8", "higher", 10, "Subjective/derived stress elevation."));
  } else if (stressIndex > 6) {
    score += 5;
    rf.push(riskFactor("Stress index > 6", "higher", 5, "Moderate stress elevation."));
  }

  if (factors.hyperlipidemia) score += 3;
  if (factors.diabetes) score += 3;

  const raw = clamp(score, 0, 100);
  const category: RiskResult["category"] =
    raw < 20 ? "low" : raw < 40 ? "moderate" : raw < 70 ? "high" : "critical";

  const explanation = `Short-term acute-event risk approximated at ${raw}/100. Main drivers: ${rf.map((f) => f.factor).join(", ")}. PoC heuristic only.`;

  return {
    type: "acute-stress",
    label: "Acute cardiac stress risk",
    value: raw,
    category,
    factors: rf,
    explanation,
    lastUpdated: localNowIso(),
    modelVersion: "vita-twin-stress-1.0",
  };
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export function generateAlerts(
  riskScores: RiskResult[],
  vitals: TwinVitals,
  fused: FusedResult,
): Alert[] {
  const alerts: Alert[] = [];
  const now = localNowIso();

  const cvd = riskScores.find((r) => r.type === "cvd-10yr");
  const diabetes = riskScores.find((r) => r.type === "diabetes-progression");
  const stress = riskScores.find((r) => r.type === "acute-stress");

  if (cvd && cvd.value >= 70) {
    alerts.push({
      id: `alert-cvd-${now}`,
      type: "risk",
      severity: "high",
      title: "High 10-year cardiovascular risk",
      body: `Cardiovascular risk is ${cvd.value}/100. Without intervention this twin is at elevated risk of a cardiometabolic event in the next decade.`,
      timestamp: now,
      readable: "10-year CVD risk is high.",
      factors: cvd.factors.map((f) => `${f.factor}: ${f.note}`),
      recommendedAction: "Book a preventive cardiology review within 1 week; review BP and statin therapy with a clinician.",
      acknowledged: false,
    });
  }

  if (diabetes && diabetes.value >= 70) {
    alerts.push({
      id: `alert-diabetes-${now}`,
      type: "risk",
      severity: cvd && cvd.value >= 70 ? "high" : "moderate",
      title: "Elevated diabetes progression risk",
      body: `Diabetes progression risk is ${diabetes.value}/100. Glycemic control needs intensification and lifestyle review.`,
      timestamp: now,
      readable: "Diabetes progression risk is elevated.",
      factors: diabetes.factors.map((f) => `${f.factor}: ${f.note}`),
      recommendedAction: "Discuss HbA1c-lowering strategy with your care team; review diet and metformin plan.",
      acknowledged: false,
    });
  }

  // Acute stress alert: rising nocturnal HR + poor sleep
  const hasAcuteSignals =
    vitals.heartRateBpm > 80 &&
    vitals.sleepHours < 6.5 &&
    vitals.sleepQuality < 50 &&
    stress !== undefined && stress.value >= 50;

  if (hasAcuteSignals) {
    alerts.push({
      id: `alert-stress-${now}`,
      type: "risk",
      severity: vitals.heartRateBpm > 90 ? "high" : "moderate",
      title: "Elevated next-day cardiac stress detected",
      body: `Nocturnal heart rate is ${vitals.heartRateBpm} bpm, sleep is only ${vitals.sleepHours} hours with quality ${vitals.sleepQuality}/100, and HRV is low. Predictive modelling shows higher next-day cardiac stress risk.`,
      timestamp: now,
      readable: "Rising nocturnal HR + poor sleep → elevated next-day cardiac stress.",
      factors: [
        `HR ${vitals.heartRateBpm} bpm (resting)`,
        `Sleep ${vitals.sleepHours} h (quality ${vitals.sleepQuality}/100)`,
        `HRV ${vitals.hrvMs} ms`,
      ],
      recommendedAction: "Prioritize a wind-down routine, avoid late caffeine, and monitor next-day resting HR.",
      acknowledged: false,
    });
  }

  // EHR-driven alert: a lab the clinician flagged as out of range
  const flaggedMetabolicLab = fused.mergedEhr.recentLabs.find(
    (lab) => lab.flag === "high" && /hba1c|fasting glucose/i.test(lab.name),
  );
  if (flaggedMetabolicLab) {
    alerts.push({
      id: `alert-lab-${now}`,
      type: "advice",
      severity: "moderate",
      title: `${flaggedMetabolicLab.name} above reference range`,
      body: `Latest ${flaggedMetabolicLab.name.toLowerCase()} is ${flaggedMetabolicLab.value} ${flaggedMetabolicLab.unit} against a reference of ${flaggedMetabolicLab.referenceRange[0]}–${flaggedMetabolicLab.referenceRange[1]} ${flaggedMetabolicLab.unit}. This EHR value is driving the metabolic risk estimate.`,
      timestamp: now,
      readable: `${flaggedMetabolicLab.name} is above the reference range.`,
      factors: [
        `${flaggedMetabolicLab.name} ${flaggedMetabolicLab.value} ${flaggedMetabolicLab.unit}`, `Reference ${flaggedMetabolicLab.referenceRange[0]}–${flaggedMetabolicLab.referenceRange[1]} ${flaggedMetabolicLab.unit}`,
      ],
      recommendedAction: "Confirm the lab was fasting, repeat in 3 months, and review the treatment plan with your clinician.",
      acknowledged: false,
    });
  }

  // Advice alert for borderline readings
  if (vitals.bloodPressureSystolic > 140) {
    alerts.push({
      id: `alert-bp-${now}`,
      type: "advice",
      severity: "moderate",
      title: "Blood pressure above target",
      body: `${vitals.bloodPressureSystolic} mmHg systolic — above the 140 target. Repeated elevated readings raise long-term risk.`,
      timestamp: now,
      readable: "Blood pressure above target.",
      factors: [`Systolic ${vitals.bloodPressureSystolic} mmHg`],
      recommendedAction: "Measure BP twice daily for a week, reduce sodium, and consult a clinician if it persists.",
      acknowledged: false,
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export function generateRecommendations(
  input: FusedInput & { patient: PatientProfile; vitals: TwinVitals; riskScores: RiskResult[] },
  alerts: Alert[],
): Recommendation[] {
  const { patient, vitals, riskScores: scores } = input;
  const recommendations: Recommendation[] = [];

  if (scores.find((r) => r.type === "cvd-10yr")) {
    const cvd = scores.find((r) => r.type === "cvd-10yr")!;
    if (cvd.value >= 50) {
      recommendations.push({
        id: `rec-cvd-${localNowIso()}`,
        category: "clinical",
        title: "Preventive cardiac review",
        body: "High 10-year cardiovascular risk. Evidence-based lifestyle modification (salt reduction, aerobic exercise, smoking cessation) plus review of antihypertensive/statin therapy is recommended.",
        priority: cvd.value >= 70 ? "high" : "medium",
        relatedInsightIds: [],
        whenToSeekCare: "soon",
        lastUpdated: localNowIso(),
      });
    }
  }

  if (scores.find((r) => r.type === "diabetes-progression")) {
    const diabetes = scores.find((r) => r.type === "diabetes-progression")!;
    if (diabetes.value >= 50) {
      recommendations.push({
        id: `rec-diab-${localNowIso()}`,
        category: "clinical",
        title: "Glycemic control plan",
        body: "Elevated metabolic risk. Reinforce medical nutrition therapy, increase daily steps, consider medication titration, and boost home glucose monitoring.",
        priority: diabetes.value >= 70 ? "high" : "medium",
        relatedInsightIds: [],
        whenToSeekCare: "soon",
        lastUpdated: localNowIso(),
      });
    }
  }

  if (vitals.sleepHours < 6.5) {
    recommendations.push({
      id: `rec-sleep-${localNowIso()}`,
      category: "lifestyle",
      title: "Extend nightly sleep",
      body: `Aiming for 7–8 hours of quality sleep reduces next-day cardiac stress. Try a fixed bedtime, dim screens 1 hour before bed, and keep the bedroom cool.`,
      priority: vitals.sleepHours < 6 ? "high" : "medium",
      relatedInsightIds: [],
      whenToSeekCare: "routine",
      lastUpdated: localNowIso(),
    });
  }

  if (vitals.heartRateBpm > 80 && vitals.sleepQuality < 50) {
    recommendations.push({
      id: `rec-stress-${localNowIso()}`,
      category: "lifestyle",
      title: "Lower daily stress load",
      body: "Biometric signals indicate elevated stress. Try 10 minutes of slow breathing, a 20-minute walk, or a mindfulness exercise daily.",
      priority: "medium",
      relatedInsightIds: [],
      whenToSeekCare: "routine",
      lastUpdated: localNowIso(),
    });
  }

  if (vitals.spO2 < 95) {
    recommendations.push({
      id: `rec-spo2-${localNowIso()}`,
      category: "monitoring",
      title: "Monitor blood oxygen",
      body: `SpO2 is below 95%. Re-check at rest, stay hydrated, and if it remains low or you feel breathless, seek care promptly.`,
      priority: "medium",
      relatedInsightIds: [],
      whenToSeekCare: "immediate",
      lastUpdated: localNowIso(),
    });
  }

  // Escalate open high-severity alerts into an explicit action item
  const openAlerts = alerts.filter((a) => !a.acknowledged);
  const highAlerts = openAlerts.filter((a) => a.severity === "high");
  if (highAlerts.length > 0) {
    recommendations.push({
      id: `rec-alerts-${localNowIso()}`,
      category: "monitoring",
      title: "Review today's high-priority alerts",
      body: `${highAlerts.length} open alert(s) need attention: ${highAlerts.map((a) => a.title).join("; ")}. Review each flagged factor with your twin before the next clinician visit.`,
      priority: "high",
      relatedInsightIds: highAlerts.map((a) => a.id),
      whenToSeekCare: "soon",
      lastUpdated: localNowIso(),
    });
  }

  // Always provide one personalised lifestyle nudge
  if (recommendations.length === 0) {
    const conditionNote = patient.riskFactors.diabetes
      ? " With diabetes in your profile, a 10-minute walk after each meal also blunts post-meal glucose spikes."
      : patient.riskFactors.hypertension
        ? " With hypertension in your profile, regular aerobic activity is one of the most effective non-drug ways to lower systolic blood pressure."
        : "";
    recommendations.push({
      id: `rec-nudge-${localNowIso()}`,
      category: "lifestyle",
      title: "Daily movement goal",
      body: `At ${patient.age}, a 30-minute brisk walk on most days meaningfully improves cardiometabolic markers. Start with an achievable target and build up.${conditionNote}`,
      priority: "low",
      relatedInsightIds: [],
      whenToSeekCare: "routine",
      lastUpdated: localNowIso(),
    });
  }

  // Cap so the UI never overwhelms
  return recommendations.slice(0, 6);
}

// ---------------------------------------------------------------------------
// Twin state assembly
// ---------------------------------------------------------------------------

export function buildTwinState(
  patientId: string,
  twinId: string,
  input: FusedInput & { patient: PatientProfile; vitals: TwinVitals },
  riskScores: RiskResult[],
  alerts: Alert[],
  recommendations: Recommendation[],
): TwinState {
  return {
    patientId,
    twinId,
    updatedAt: localNowIso(),
    vitals: input.vitals,
    riskScores,
    alerts,
    insights: buildInsights(riskScores, input.vitals, alerts),
    recommendations,
    dataFreshnessSeconds: 0, // set by API layer
    source: "synthetic",
  };
}

function buildInsights(
  riskScores: RiskResult[],
  vitals: TwinVitals,
  alerts: Alert[],
): Insight[] {
  const insights: Insight[] = [];
  const now = localNowIso();

  const cvd = riskScores.find((r) => r.type === "cvd-10yr");
  const diabetes = riskScores.find((r) => r.type === "diabetes-progression");
  const stress = riskScores.find((r) => r.type === "acute-stress");

  if (cvd) {
    insights.push({
      id: `insight-cvd-${now}`,
      type: "observation",
      severity: cvd.category === "critical" ? "danger" : cvd.category === "high" ? "warning" : "info",
      title: "Cardiovascular risk trend",
      body: cvd.explanation,
      timestamp: now,
      actionable: false,
      evidence: cvd.factors.map((f) => f.factor),
      recommendedAction: "Discuss with your clinician.",
    });
  }

  if (diabetes) {
    insights.push({
      id: `insight-diab-${now}`,
      type: "observation",
      severity: diabetes.category === "critical" ? "danger" : diabetes.category === "high" ? "warning" : "info",
      title: "Metabolic trend",
      body: diabetes.explanation,
      timestamp: now,
      actionable: false,
      evidence: diabetes.factors.map((f) => f.factor),
      recommendedAction: "Review glucose-lowering strategy.",
    });
  }

  if (stress) {
    insights.push({
      id: `insight-stress-${now}`,
      type: stress.category === "low" ? "observation" : "alert",
      severity: stress.category === "critical" ? "danger" : stress.category === "high" ? "warning" : "info",
      title: stress.category === "low" ? "Short-term cardiac stress looks stable" : "Acute cardiac stress detected",
      body: stress.explanation,
      timestamp: now,
      actionable: stress.category !== "low",
      evidence: stress.factors.map((f) => f.factor),
      recommendedAction: stress.factors.find((f) => f.factor.includes("Sleep"))?.note ?? "Prioritize rest.",
    });
  }

  if (alerts.some((a) => a.severity === "critical")) {
    insights.push({
      id: `insight-alert-${now}`,
      type: "alert",
      severity: "danger",
      title: "Actionable alert requires attention",
      body: `${alerts.filter((a) => a.severity === "critical").length} critical alert(s) need review today.`,
      timestamp: now,
      actionable: true,
      evidence: alerts.map((a) => a.title),
      recommendedAction: "Review the alerts dashboard and follow flagged actions.",
    });
  }

  return insights;
}
