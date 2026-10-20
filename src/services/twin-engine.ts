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

import {
  activityFromSteps,
  cvdAttribution,
  cvdCategory,
  cvdRiskPercent,
  estimateWaistCm,
  idrs,
  SOUTH_ASIAN_HAZARD_MULTIPLIER,
  type CvdInputs,
  type FamilyDiabetes,
  type Sex,
} from "./risk-models";
import { environmentRisk } from "./environment";
import type {
  EarlyWarning,
  EnvironmentSnapshot,
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
      temperatureC: 36.6,
      spO2,
      stepsToday,
      sleepHours: Number((sleepHours).toFixed(1)),
      sleepQuality: Number((sleepQuality * 100).toFixed(0)),
      lastUpdated: localNowIso(),
    },
    mergedEhr: patient,
  };
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
  /** Optional enrichments; sensible defaults are used when absent. */
  gender?: Sex;
  waistCm?: number;
  avgDailySteps?: number;
  onBpTreatment?: boolean;
  southAsian?: boolean;
}

function clamp100(value: number): number {
  return clamp(Math.round(value * 10) / 10, 0, 100);
}

function toCvdInputs(f: RiskFactorsInput): CvdInputs {
  return {
    age: f.age,
    sex: f.gender ?? "Male",
    totalCholesterol: f.cholesterolTotal,
    hdl: f.hdl,
    systolicBp: f.systolicBp,
    onBpTreatment: f.onBpTreatment ?? f.hypertension,
    smoker: f.smoking === "Current",
    diabetes: f.diabetes || f.hba1c >= 6.5,
    southAsian: f.southAsian ?? true,
    hba1c: f.hba1c,
  };
}

/**
 * 10-year cardiovascular risk (%). Framingham 2008 general-CVD equation,
 * South-Asian recalibrated (hazard ×1.4) and UKPDS-35 glycaemia-adjusted.
 * Every point of risk is attributed to a factor by counterfactual removal.
 */
export function computeCvD10YearRisk(factors: RiskFactorsInput): RiskResult {
  const inputs = toCvdInputs(factors);
  const value = cvdRiskPercent(inputs);
  const category = cvdCategory(value);

  const attributions = cvdAttribution(inputs);
  const factorsList: RiskFactorContribution[] = attributions.map((a) =>
    riskFactor(a.factor, "higher", a.deltaPct, `${a.note} (≈ +${a.deltaPct} points of 10-year risk)`),
  );

  const drivers = attributions.slice(0, 4).map((a) => a.factor);
  const explanation =
    `10-year cardiovascular risk is ${value}% (${category}). ` +
    `Framingham 2008 equation, South-Asian adjusted (×${SOUTH_ASIAN_HAZARD_MULTIPLIER}). ` +
    (drivers.length > 0 ? `Largest contributors: ${drivers.join("; ")}. ` : "") +
    "Decision-support estimate for clinician review — not a diagnosis.";

  return {
    type: "cvd-10yr",
    label: "10-year cardiovascular risk",
    value,
    category,
    factors: factorsList,
    explanation,
    lastUpdated: localNowIso(),
    modelVersion: "vita-twin-cvd-2.0-fram08-sa",
  };
}

function familyToIdrs(familyHistory: string): FamilyDiabetes {
  if (familyHistory === "Multiple") return "both-parents";
  if (familyHistory === "Parent" || familyHistory === "Siblings") return "one-parent";
  return "none";
}

/**
 * Diabetes risk, 0-100.
 *  - Not yet diabetic: Indian Diabetes Risk Score (IDRS, 0-100; ≥60 high),
 *    floored by prediabetic laboratory values.
 *  - Established diabetes: progression risk from glycaemic control (ADA
 *    HbA1c targets) plus adiposity, blood pressure and kidney function.
 */
export function computeDiabetesProgressionRisk(factors: RiskFactorsInput): RiskResult {
  const rf: RiskFactorContribution[] = [];
  const sex = factors.gender ?? "Male";
  const diabetic = factors.diabetes || factors.hba1c >= 6.5;

  let value: number;
  let basis: string;

  if (!diabetic) {
    const waist = factors.waistCm ?? estimateWaistCm(factors.bmi, sex);
    const activity = factors.avgDailySteps !== undefined ? activityFromSteps(factors.avgDailySteps) : "moderate";
    const score = idrs({ age: factors.age, sex, waistCm: waist, activity, family: familyToIdrs(factors.familyHistory) });

    if (score.age > 0) rf.push(riskFactor(`Age ${Math.round(factors.age)}`, "higher", score.age, "IDRS age points (Mohan 2005)."));
    if (score.waist > 0)
      rf.push(
        riskFactor(
          `Waist ${waist} cm${factors.waistCm === undefined ? " (estimated)" : ""}`,
          "higher",
          score.waist,
          "Central adiposity: South Asians develop diabetes at lower BMI and waist cut-offs.",
        ),
      );
    if (score.activity > 0)
      rf.push(riskFactor("Low physical activity", "higher", score.activity, "Wearable step count used as the IDRS activity proxy."));
    if (score.family > 0) rf.push(riskFactor("Family history of diabetes", "higher", score.family, "First-degree relative with diabetes."));

    let labFloor = 0;
    if (factors.hba1c >= 5.7) labFloor = 45 + clamp(((factors.hba1c - 5.7) / 0.8) * 25, 0, 25);
    else if (factors.fastingGlucose >= 100) labFloor = 45 + clamp(((factors.fastingGlucose - 100) / 25) * 20, 0, 20);
    if (labFloor > 0) {
      rf.push(
        riskFactor(
          factors.hba1c >= 5.7 ? `HbA1c ${factors.hba1c.toFixed(1)}% (prediabetes range)` : `Fasting glucose ${Math.round(factors.fastingGlucose)} mg/dL`,
          "higher",
          Math.round(labFloor),
          "ADA prediabetes range: ≈5-10% a year convert to diabetes without intervention.",
        ),
      );
    }
    value = Math.max(score.total, labFloor);
    basis = `Indian Diabetes Risk Score ${score.total}/100${labFloor > score.total ? ", raised by prediabetic labs" : ""}.`;
  } else {
    const a1c = factors.hba1c;
    let base: number;
    if (a1c <= 7) base = 25 + ((a1c - 6.5) / 0.5) * 5;
    else if (a1c <= 8) base = 30 + (a1c - 7) * 20;
    else if (a1c <= 10) base = 50 + ((a1c - 8) / 2) * 30;
    else base = 80 + clamp(((a1c - 10) / 3) * 15, 0, 15);
    value = base;
    rf.push(
      riskFactor(
        `HbA1c ${a1c.toFixed(1)}%`,
        "higher",
        Math.round(base),
        a1c > 7 ? "Above the ADA <7% target: microvascular complication risk rises steeply." : "Within the ADA target range.",
      ),
    );
    if (factors.bmi >= 27.5) {
      value += 6;
      rf.push(riskFactor(`BMI ${factors.bmi}`, "higher", 6, "Asian cut-off for obesity risk is 27.5 kg/m² (WHO 2004)."));
    }
    if (factors.hypertension) {
      value += 4;
      rf.push(riskFactor("Hypertension", "higher", 4, "Hypertension compounds diabetic vascular and kidney damage."));
    }
    if (factors.egfr < 60) {
      value += 8;
      rf.push(riskFactor(`eGFR ${Math.round(factors.egfr)}`, "higher", 8, "Diabetic kidney disease marker (CKD stage 3 or worse)."));
    }
    basis = `Glycaemic control (HbA1c ${a1c.toFixed(1)}%) against ADA targets, plus comorbidities.`;
  }

  // IDRS bands are published as <30 low, 30-59 moderate, >=60 high.
  const finalValue = clamp100(value);
  const category: RiskResult["category"] =
    finalValue < 30 ? "low" : finalValue < 60 ? "moderate" : finalValue < 85 ? "high" : "critical";

  return {
    type: "diabetes-progression",
    label: "Diabetes risk & progression",
    value: finalValue,
    category,
    factors: rf.sort((a, b) => b.weight - a.weight),
    explanation: `Diabetes score ${finalValue}/100 (${category}). ${basis} Decision-support estimate, not a diagnosis.`,
    lastUpdated: localNowIso(),
    modelVersion: "vita-twin-diabetes-2.0-idrs-ada",
  };
}

export interface AcuteVitalsInput {
  heartRateBpm: number;
  hrvMs: number;
  sleepHours: number;
  sleepQuality: number;
  stressIndex: number;
  /** Live ambient exposure for the patient's city. */
  environment?: EnvironmentSnapshot | null;
  /** 0-100 strain index versus the person's own baseline (early warning). */
  strainIndex?: number;
}

/**
 * Acute / short-term cardiac stress risk. Combines absolute physiology
 * (resting HR, sleep, HRV, stress), the person's deviation from their own
 * baseline, and live air-quality / heat exposure.
 */
export function computeAcuteStressRisk(factors: RiskFactorsInput, vitals: AcuteVitalsInput): RiskResult {
  const { heartRateBpm, hrvMs, sleepHours, stressIndex } = vitals;

  let score = 0;
  const rf: RiskFactorContribution[] = [];

  if (heartRateBpm > 90) {
    score += 12;
    rf.push(riskFactor("Resting HR > 90 bpm", "higher", 12, "Each +10 bpm resting HR raises cardiovascular mortality ≈10-20% (Cooney 2010)."));
  } else if (heartRateBpm > 80) {
    score += 6;
    rf.push(riskFactor("Resting HR > 80 bpm", "higher", 6, "Mildly elevated resting heart rate."));
  }

  if (sleepHours < 5) {
    score += 14;
    rf.push(riskFactor("Sleep < 5 h", "lower", 14, "Short sleep is linked to ≈48% higher coronary events (Cappuccio 2011)."));
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
    rf.push(riskFactor("Stress index > 8", "higher", 10, "Derived stress elevation from the wearable."));
  } else if (stressIndex > 6) {
    score += 5;
    rf.push(riskFactor("Stress index > 6", "higher", 5, "Moderate stress elevation."));
  }

  if (vitals.strainIndex !== undefined && vitals.strainIndex >= 35) {
    const add = Math.round(clamp((vitals.strainIndex - 30) / 70, 0, 1) * 18);
    score += add;
    rf.push(
      riskFactor(
        `Departure from personal baseline (strain ${vitals.strainIndex}/100)`,
        "higher",
        add,
        "Nocturnal HR, HRV, sleep and activity compared with this person's own recent baseline.",
      ),
    );
  }

  const env = environmentRisk(vitals.environment);
  score += env.points;
  rf.push(...env.factors);

  if (factors.hyperlipidemia) score += 3;
  if (factors.diabetes) score += 3;

  const raw = clamp(score, 0, 100);
  const category: RiskResult["category"] =
    raw < 20 ? "low" : raw < 40 ? "moderate" : raw < 70 ? "high" : "critical";

  const explanation = `Short-term acute-event risk is ${raw}/100 (${category}). Main drivers: ${
    rf.map((f) => f.factor).join(", ") || "none"
  }. Fuses wearable physiology, personal-baseline drift and live air quality/heat.`;

  return {
    type: "acute-stress",
    label: "Acute cardiac stress risk",
    value: raw,
    category,
    factors: rf.sort((a, b) => b.weight - a.weight),
    explanation,
    lastUpdated: localNowIso(),
    modelVersion: "vita-twin-acute-2.0-baseline-env",
  };
}

// ---------------------------------------------------------------------------
// Alerts
// ---------------------------------------------------------------------------

export interface TwinExtras {
  environment?: EnvironmentSnapshot | null;
  earlyWarning?: EarlyWarning;
}

export function generateAlerts(
  riskScores: RiskResult[],
  vitals: TwinVitals,
  fused: FusedResult,
  extras: TwinExtras = {},
): Alert[] {
  const alerts: Alert[] = [];
  const now = localNowIso();

  const cvd = riskScores.find((r) => r.type === "cvd-10yr");
  const diabetes = riskScores.find((r) => r.type === "diabetes-progression");
  const stress = riskScores.find((r) => r.type === "acute-stress");

  if (cvd && cvd.value >= 20) {
    alerts.push({
      id: `alert-cvd-${now}`,
      type: "risk",
      severity: "high",
      title: "High 10-year cardiovascular risk",
      body: `Estimated 10-year cardiovascular risk is ${cvd.value}% (Framingham 2008, South-Asian adjusted). Without intervention this twin is at elevated risk of a cardiovascular event in the next decade.`,
      timestamp: now,
      readable: "10-year CVD risk is high.",
      factors: cvd.factors.map((f) => `${f.factor}: ${f.note}`),
      recommendedAction: "Book a preventive cardiology review within 1 week; review BP and statin therapy with a clinician.",
      acknowledged: false,
    });
  }

  if (diabetes && diabetes.value >= 50) {
    alerts.push({
      id: `alert-diabetes-${now}`,
      type: "risk",
      severity: diabetes.value >= 70 ? "high" : "moderate",
      title: "Elevated diabetes progression risk",
      body: `Diabetes risk score is ${diabetes.value}/100 (${diabetes.category}). Glycemic control needs intensification and lifestyle review.`,
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

  const ew = extras.earlyWarning;
  if (ew && (ew.level === "warning" || ew.level === "urgent")) {
    alerts.push({
      id: `alert-early-${now}`,
      type: "trend",
      severity: ew.level === "urgent" ? "high" : "moderate",
      title:
        ew.leadTimeHours !== null
          ? `Early warning: strain rising, urgent in ~${ew.leadTimeHours} h`
          : "Early warning: departure from personal baseline",
      body: ew.headline,
      timestamp: now,
      readable: `Personal-baseline strain index ${ew.index}/100. ${ew.headline}`,
      factors: ew.signals
        .filter((signal) => signal.direction === "worse")
        .map(
          (signal) =>
            `${signal.label}: ${signal.current} ${signal.unit} vs baseline ${signal.baseline} ${signal.unit} (${signal.zScore >= 0 ? "+" : ""}${signal.zScore} SD)`,
        ),
      recommendedAction:
        "Arrange a same-week clinician check-in, repeat BP and resting HR at home, and avoid strenuous exertion until the trend settles.",
      acknowledged: false,
    });
  }

  const env = extras.environment;
  if (env && ((env.usAqi ?? 0) >= 151 || (env.apparentTemperatureC ?? 0) >= 41)) {
    const smog = (env.usAqi ?? 0) >= 151;
    alerts.push({
      id: `alert-env-${now}`,
      type: "advice",
      severity: (env.usAqi ?? 0) >= 201 ? "high" : "moderate",
      title: smog ? `Unhealthy air in ${env.city} today` : `Heat stress in ${env.city} today`,
      body: smog
        ? `Live air quality in ${env.city}: AQI ${env.usAqi} (${env.aqiCategory}), PM2.5 ${env.pm25 ?? "—"} µg/m³. Fine-particle exposure raises short-term cardiac risk, especially with diabetes or hypertension.`
        : `Feels like ${Math.round(env.apparentTemperatureC ?? 0)} °C in ${env.city}. Heat increases cardiac load and dehydration risk.`,
      timestamp: now,
      readable: smog ? `AQI ${env.usAqi} in ${env.city}: ${env.aqiCategory}.` : `Feels like ${Math.round(env.apparentTemperatureC ?? 0)} °C in ${env.city}.`,
      factors: [
        `Source: Open-Meteo live data, ${env.observedAt}`,
        ...(env.pm25 !== null ? [`PM2.5 ${Math.round(env.pm25)} µg/m³`] : []),
      ],
      recommendedAction: smog
        ? "Move exercise indoors, keep windows closed, wear an N95 mask outdoors, and carry prescribed medication."
        : "Hydrate, avoid midday exertion, and rest in a cool place.",
      acknowledged: false,
    });
  }

  return alerts;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

export function generateRecommendations(
  input: FusedInput & {
    patient: PatientProfile;
    vitals: TwinVitals;
    riskScores: RiskResult[];
  } & TwinExtras,
  alerts: Alert[],
): Recommendation[] {
  const { patient, vitals, riskScores: scores } = input;
  const recommendations: Recommendation[] = [];

  if (scores.find((r) => r.type === "cvd-10yr")) {
    const cvd = scores.find((r) => r.type === "cvd-10yr")!;
    if (cvd.value >= 15) {
      recommendations.push({
        id: `rec-cvd-${localNowIso()}`,
        category: "clinical",
        title: "Preventive cardiac review",
        body: `10-year cardiovascular risk is ${cvd.value}%. Evidence-based lifestyle modification (salt reduction, aerobic exercise, smoking cessation) plus review of antihypertensive/statin therapy is recommended.`,
        priority: cvd.value >= 20 ? "high" : "medium",
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

  const environment = input.environment;
  if (environment && (environment.pm25 ?? 0) > 60) {
    recommendations.push({
      id: `rec-air-${localNowIso()}`,
      category: "lifestyle",
      title: `Protect against polluted air in ${environment.city}`,
      body: `PM2.5 is ${Math.round(environment.pm25 ?? 0)} µg/m³ right now (India's 24-h standard is 60). Shift outdoor exercise indoors, use an N95 mask outside, and keep inhalers or cardiac medication within reach.`,
      priority: (environment.pm25 ?? 0) > 120 ? "high" : "medium",
      relatedInsightIds: [],
      whenToSeekCare: "routine",
      lastUpdated: localNowIso(),
    });
  }

  if (input.earlyWarning && (input.earlyWarning.level === "warning" || input.earlyWarning.level === "urgent")) {
    recommendations.push({
      id: `rec-early-${localNowIso()}`,
      category: "monitoring",
      title: "Book a clinician check-in this week",
      body: `${input.earlyWarning.headline} Share the last seven days of wearable trends with the care team.`,
      priority: "high",
      relatedInsightIds: [],
      whenToSeekCare: "soon",
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
  extras: TwinExtras = {},
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
    environment: extras.environment ?? null,
    earlyWarning: extras.earlyWarning,
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
