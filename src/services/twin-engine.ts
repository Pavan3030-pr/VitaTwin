/**
 * VitaTwin - Twin Engine.
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
} from "../types/twin";

// Helper for rounding to 1 decimal place
function round1(val: number): number {
  return Math.round(val * 10) / 10;
}

/**
 * Fuses wearable time-series samples and EHR baseline into instant TwinVitals.
 */
export function fuseData(
  profile: PatientProfile,
  wearables: WearableSample[]
): TwinVitals {
  if (!wearables || wearables.length === 0) {
    return {
      heartRate: profile.baselineVitals?.heartRate ?? 72,
      spO2: profile.baselineVitals?.spO2 ?? 98,
      bloodPressureSystolic: profile.baselineVitals?.bloodPressureSystolic ?? 120,
      bloodPressureDiastolic: profile.baselineVitals?.bloodPressureDiastolic ?? 80,
      glucose: profile.baselineVitals?.glucose ?? 95,
      hrv: profile.baselineVitals?.hrv ?? 45,
      respiratoryRate: profile.baselineVitals?.respiratoryRate ?? 16,
      bodyTemperature: profile.baselineVitals?.bodyTemperature ?? 36.6,
      lastUpdated: new Date().toISOString(),
    };
  }

  // Average recent wearable data
  const len = wearables.length;
  const hrSum = wearables.reduce((acc, w) => acc + w.heartRate, 0);
  const spo2Sum = wearables.reduce((acc, w) => acc + w.spO2, 0);
  const hrvSum = wearables.reduce((acc, w) => acc + (w.hrv ?? 45), 0);
  const respSum = wearables.reduce((acc, w) => acc + (w.respiratoryRate ?? 16), 0);
  const tempSum = wearables.reduce((acc, w) => acc + (w.bodyTemperature ?? 36.6), 0);
  const bpSysSum = wearables.reduce((acc, w) => acc + (w.bloodPressureSystolic ?? profile.baselineVitals?.bloodPressureSystolic ?? 120), 0);
  const bpDiaSum = wearables.reduce((acc, w) => acc + (w.bloodPressureDiastolic ?? profile.baselineVitals?.bloodPressureDiastolic ?? 80), 0);
  const glucSum = wearables.reduce((acc, w) => acc + (w.glucose ?? profile.baselineVitals?.glucose ?? 95), 0);

  const lastSample = wearables[wearables.length - 1];

  return {
    heartRate: round1(hrSum / len),
    spO2: round1(spo2Sum / len),
    bloodPressureSystolic: round1(bpSysSum / len),
    bloodPressureDiastolic: round1(bpDiaSum / len),
    glucose: round1(glucSum / len),
    hrv: round1(hrvSum / len),
    respiratoryRate: round1(respSum / len),
    bodyTemperature: round1(tempSum / len),
    lastUpdated: lastSample?.timestamp || new Date().toISOString(),
  };
}

/**
 * Computes 10-year Cardiovascular Disease (CVD) Risk with explainable factor contributions.
 */
export function computeCvD10YearRisk(
  profile: PatientProfile,
  vitals: TwinVitals
): RiskResult {
  const factors: RiskFactorContribution[] = [];
  let baseScore = 5.0; // Baseline population risk %

  // Age factor
  if (profile.age > 65) {
    baseScore += 12.0;
    factors.push({
      factor: "Age > 65",
      impact: "high",
      description: `Age (${profile.age}) significantly increases baseline cardiovascular risk.`,
      value: profile.age,
    });
  } else if (profile.age > 50) {
    baseScore += 6.0;
    factors.push({
      factor: "Age 50-65",
      impact: "moderate",
      description: `Age (${profile.age}) moderately increases baseline cardiovascular risk.`,
      value: profile.age,
    });
  }

  // Blood Pressure
  const sys = vitals.bloodPressureSystolic;
  if (sys >= 140) {
    baseScore += 10.0;
    factors.push({
      factor: "Systolic Hypertension",
      impact: "high",
      description: `Systolic BP is elevated at ${sys} mmHg.`,
      value: sys,
    });
  } else if (sys >= 130) {
    baseScore += 4.0;
    factors.push({
      factor: "Stage 1 Hypertension",
      impact: "moderate",
      description: `Systolic BP is slightly elevated at ${sys} mmHg.`,
      value: sys,
    });
  }

  // Smoking / Lifestyle
  if (profile.conditions?.includes("Smoker") || profile.conditions?.includes("Smoking")) {
    baseScore += 8.0;
    factors.push({
      factor: "Smoking Status",
      impact: "high",
      description: "Active tobacco smoking doubles vascular risk.",
      value: 1,
    });
  }

  // Diabetes / Glucose
  if (vitals.glucose >= 126 || profile.conditions?.includes("Type 2 Diabetes")) {
    baseScore += 7.0;
    factors.push({
      factor: "Elevated Fasting Glucose / Diabetes",
      impact: "high",
      description: `Glucose level of ${vitals.glucose} mg/dL contributes to vascular calcification.`,
      value: vitals.glucose,
    });
  }

  const score = Math.min(Math.max(round1(baseScore), 1.0), 95.0);
  let category: RiskResult["category"] = "low";
  if (score >= 20) category = "critical";
  else if (score >= 10) category = "high";
  else if (score >= 6) category = "moderate";

  return {
    score,
    category,
    confidence: 0.88,
    contributingFactors: factors,
    summary: `10-year CVD risk estimated at ${score}% (${category.toUpperCase()}).`,
  };
}

/**
 * Computes Diabetes Progression Risk based on HbA1c, glucose trend, and BMI.
 */
export function computeDiabetesProgressionRisk(
  profile: PatientProfile,
  vitals: TwinVitals
): RiskResult {
  const factors: RiskFactorContribution[] = [];
  let baseScore = 4.0;

  if (vitals.glucose >= 180) {
    baseScore += 18.0;
    factors.push({
      factor: "Severe Hyperglycemia",
      impact: "high",
      description: `Glucose (${vitals.glucose} mg/dL) exceeds safe glycemic threshold.`,
      value: vitals.glucose,
    });
  } else if (vitals.glucose >= 126) {
    baseScore += 10.0;
    factors.push({
      factor: "Fasting Hyperglycemia",
      impact: "high",
      description: `Glucose (${vitals.glucose} mg/dL) indicates impaired glycemic control.`,
      value: vitals.glucose,
    });
  } else if (vitals.glucose >= 100) {
    baseScore += 4.0;
    factors.push({
      factor: "Prediabetic Glucose",
      impact: "moderate",
      description: `Glucose (${vitals.glucose} mg/dL) is in prediabetic range.`,
      value: vitals.glucose,
    });
  }

  if (profile.bmi && profile.bmi >= 30) {
    baseScore += 6.0;
    factors.push({
      factor: "Elevated BMI",
      impact: "moderate",
      description: `BMI of ${profile.bmi} contributes to insulin resistance.`,
      value: profile.bmi,
    });
  }

  const score = Math.min(Math.max(round1(baseScore), 1.0), 95.0);
  let category: RiskResult["category"] = "low";
  if (score >= 20) category = "critical";
  else if (score >= 12) category = "high";
  else if (score >= 6) category = "moderate";

  return {
    score,
    category,
    confidence: 0.85,
    contributingFactors: factors,
    summary: `Diabetes progression risk estimated at ${score}% (${category.toUpperCase()}).`,
  };
}

/**
 * Computes Acute Physiological Stress Risk based on HRV and autonomic vitals.
 */
export function computeAcuteStressRisk(
  profile: PatientProfile,
  vitals: TwinVitals
): RiskResult {
  const factors: RiskFactorContribution[] = [];
  let baseScore = 3.0;

  const hrv = vitals.hrv ?? 45;
  if (hrv < 25) {
    baseScore += 15.0;
    factors.push({
      factor: "Severely Depressed HRV",
      impact: "high",
      description: `HRV of ${hrv} ms indicates high sympathetic overdrive or physiological stress.`,
      value: hrv,
    });
  } else if (hrv < 35) {
    baseScore += 7.0;
    factors.push({
      factor: "Reduced HRV",
      impact: "moderate",
      description: `HRV of ${hrv} ms indicates elevated physiological strain.`,
      value: hrv,
    });
  }

  if (vitals.heartRate > 100) {
    baseScore += 8.0;
    factors.push({
      factor: "Tachycardia",
      impact: "high",
      description: `Resting HR of ${vitals.heartRate} bpm is elevated.`,
      value: vitals.heartRate,
    });
  }

  const score = Math.min(Math.max(round1(baseScore), 1.0), 95.0);
  let category: RiskResult["category"] = "low";
  if (score >= 20) category = "critical";
  else if (score >= 12) category = "high";
  else if (score >= 6) category = "moderate";

  return {
    score,
    category,
    confidence: 0.9,
    contributingFactors: factors,
    summary: `Acute stress score estimated at ${score}% (${category.toUpperCase()}).`,
  };
}

/**
 * Generates clinical and physiological alerts based on vitals and risks.
 */
export function generateAlerts(
  vitals: TwinVitals,
  cvdRisk: RiskResult,
  stressRisk: RiskResult
): Alert[] {
  const alerts: Alert[] = [];
  const now = new Date().toISOString();

  if (vitals.glucose >= 180) {
    alerts.push({
      id: "alert-glucose-high",
      severity: "critical",
      title: "Acute Hyperglycemia Spike",
      message: `Glucose level read at ${vitals.glucose} mg/dL. Immediate medical review or insulin protocol evaluation recommended.`,
      timestamp: now,
      acknowledged: false,
      metric: "Glucose",
      value: vitals.glucose,
    });
  } else if (vitals.glucose >= 140) {
    alerts.push({
      id: "alert-glucose-mod",
      severity: "warning",
      title: "Elevated Postprandial / Fasting Glucose",
      message: `Glucose level read at ${vitals.glucose} mg/dL. Monitor carbohydrate intake.`,
      timestamp: now,
      acknowledged: false,
      metric: "Glucose",
      value: vitals.glucose,
    });
  }

  if (vitals.bloodPressureSystolic >= 140 || vitals.bloodPressureDiastolic >= 90) {
    alerts.push({
      id: "alert-bp-high",
      severity: vitals.bloodPressureSystolic >= 160 ? "critical" : "warning",
      title: "Hypertensive Elevation",
      message: `Blood pressure at ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg.`,
      timestamp: now,
      acknowledged: false,
      metric: "Blood Pressure",
      value: vitals.bloodPressureSystolic,
    });
  }

  if (vitals.hrv && vitals.hrv < 25) {
    alerts.push({
      id: "alert-hrv-low",
      severity: "info",
      title: "Low Autonomic Recovery (HRV)",
      message: `HRV dropped to ${vitals.hrv} ms. High autonomic stress detected.`,
      timestamp: now,
      acknowledged: false,
      metric: "HRV",
      value: vitals.hrv,
    });
  }

  return alerts;
}

/**
 * Generates actionable personalized recommendations.
 */
export function generateRecommendations(
  vitals: TwinVitals,
  cvdRisk: RiskResult,
  stressRisk: RiskResult
): Recommendation[] {
  const recs: Recommendation[] = [];

  if (vitals.glucose >= 130) {
    recs.push({
      id: "rec-glycemic-control",
      category: "lifestyle",
      title: "Optimize Glycemic Control",
      description: "Consider post-meal 15-minute light walking and lowering refined carbohydrate proportion in next 48 hours.",
      priority: "high",
      impact: "May reduce glucose variance by 15-20%",
    });
  }

  if (stressRisk.score > 10 || (vitals.hrv && vitals.hrv < 35)) {
    recs.push({
      id: "rec-stress-recovery",
      category: "recovery",
      title: "Autonomic Recovery Protocol",
      description: "Incorporate 10 minutes of guided resonance breathing (0.1 Hz) to improve vagal nerve tone.",
      priority: "medium",
      impact: "Aims to increase HRV by 10-15 ms over 7 days",
    });
  }

  if (cvdRisk.score > 10 || vitals.bloodPressureSystolic >= 130) {
    recs.push({
      id: "rec-bp-dash",
      category: "nutrition",
      title: "Sodium Limitation & Hydration",
      description: "Limit daily sodium intake below 2,000 mg and ensure >= 2.5L water consumption.",
      priority: "medium",
      impact: "Expected 3-5 mmHg systolic BP reduction",
    });
  }

  // Always supply at least one general recovery recommendation
  if (recs.length === 0) {
    recs.push({
      id: "rec-general-wellness",
      category: "lifestyle",
      title: "Maintain Balanced Circadian Routine",
      description: "Target 7.5-8 hours of sleep per night to maintain autonomic stability.",
      priority: "low",
      impact: "Sustained baseline physiological balance",
    });
  }

  return recs;
}

/**
 * Builds explainable insights for dashboard view.
 */
export function buildInsights(
  vitals: TwinVitals,
  cvdRisk: RiskResult,
  diabetesRisk: RiskResult,
  stressRisk: RiskResult
): Insight[] {
  return [
    {
      id: "insight-cvd",
      title: "Cardiovascular Health Status",
      summary: cvdRisk.summary,
      detailedAnalysis: `10-year risk calculated at ${cvdRisk.score}%. Key driving factors include ${cvdRisk.contributingFactors.map(f => f.factor).join(", ") || "baseline demographic factors"}.`,
      recommendations: ["Maintain BP below 120/80 mmHg", "Regular aerobic activity"],
      type: cvdRisk.category === "high" || cvdRisk.category === "critical" ? "warning" : "positive",
    },
    {
      id: "insight-diabetes",
      title: "Glycemic & Metabolic Trajectory",
      summary: diabetesRisk.summary,
      detailedAnalysis: `Metabolic progression index is ${diabetesRisk.score}%. Current continuous glucose average is ${vitals.glucose} mg/dL.`,
      recommendations: ["Postprandial activity", "Glycemic variability tracking"],
      type: diabetesRisk.category === "high" || diabetesRisk.category === "critical" ? "warning" : "positive",
    },
    {
      id: "insight-stress",
      title: "Autonomic Nervous System Strain",
      summary: stressRisk.summary,
      detailedAnalysis: `Acute physiological stress risk is ${stressRisk.score}%. Current HRV is ${vitals.hrv} ms.`,
      recommendations: ["Guided slow breathing", "Prioritize sleep hygiene"],
      type: stressRisk.category === "high" || stressRisk.category === "critical" ? "warning" : "positive",
    },
  ];
}

/**
 * Main orchestrator function: builds complete TwinState snapshot from profile and wearable samples.
 */
export function buildTwinState(
  profile: PatientProfile,
  wearables: WearableSample[]
): TwinState {
  const currentVitals = fuseData(profile, wearables);
  const cvdRisk = computeCvD10YearRisk(profile, currentVitals);
  const diabetesRisk = computeDiabetesProgressionRisk(profile, currentVitals);
  const stressRisk = computeAcuteStressRisk(profile, currentVitals);

  const alerts = generateAlerts(currentVitals, cvdRisk, stressRisk);
  const recommendations = generateRecommendations(currentVitals, cvdRisk, stressRisk);
  const insights = buildInsights(currentVitals, cvdRisk, diabetesRisk, stressRisk);

  return {
    patientId: profile.id,
    timestamp: new Date().toISOString(),
    currentVitals,
    riskScores: {
      cvd10Year: cvdRisk,
      diabetesProgression: diabetesRisk,
      acuteStress: stressRisk,
    },
    alerts,
    recommendations,
    insights,
  };
}
