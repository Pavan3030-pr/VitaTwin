/**
 * VitaTwin — server-side data layer.
 *
 * Synthetic-only PoC. Generates a deterministic demo patient, fuses its
 * wearable + EHR streams, and returns an explainable twin state.
 *
 * All twin computation happens here, on the server. The browser only ever
 * receives the derived, explainable summary.
 */

import {
  generateDemographics,
  generateEhrSnapshot,
  generateWearableStream,
  seedRandom,
} from "./synthetic-data";
import {
  computeCvD10YearRisk,
  computeDiabetesProgressionRisk,
  computeAcuteStressRisk,
  generateAlerts,
  generateRecommendations,
  buildTwinState,
  type RiskFactorsInput,
} from "../services/twin-engine";
import type {
  TwinState,
  PatientProfile,
  TwinVitals,
  WearableSample,
} from "@/types/twin";

/** Fixed seed => the jury always sees the same coherent synthetic patient. */
const DEMO_SEED = 20261018;
const WINDOW_DAYS = 7;

export interface DemoBundle {
  twin: TwinState;
  patient: PatientProfile;
  vitals: TwinVitals;
  samples: WearableSample[];
  riskInput: RiskFactorsInput;
}

/** Build the patient + EHR snapshot from a deterministic seed. */
function buildPatient(): PatientProfile {
  seedRandom(DEMO_SEED);
  const demographics = generateDemographics();
  return generateEhrSnapshot(demographics, {
    hypertension: true,
    diabetes: true,
    hyperlipidemia: true,
  });
}

function labValue(patient: PatientProfile, name: string, fallback: number): number {
  return patient.recentLabs.find((lab) => lab.name === name)?.value ?? fallback;
}

function toRiskInput(patient: PatientProfile): RiskFactorsInput {
  return {
    age: patient.age,
    systolicBp: patient.systolicBp,
    diastolicBp: patient.diastolicBp,
    cholesterolTotal: labValue(patient, "Total cholesterol", 210),
    hdl: labValue(patient, "HDL cholesterol", 42),
    ldl: labValue(patient, "LDL cholesterol", 135),
    triglycerides: labValue(patient, "Triglycerides", 165),
    fastingGlucose: labValue(patient, "Fasting glucose", 128),
    hba1c: labValue(patient, "HbA1c", 7.2),
    hypertension: patient.riskFactors.hypertension,
    diabetes: patient.riskFactors.diabetes,
    hyperlipidemia: patient.riskFactors.hyperlipidemia,
    familyHistory: patient.riskFactors.familyHistory,
    bmi: patient.bmI,
    smoking: patient.demographics.smoking,
    creatinine: labValue(patient, "Creatinine", 0.95),
    egfr: labValue(patient, "eGFR", 88),
    hemoglobin: labValue(patient, "Hemoglobin", 13.4),
    alcoholPerWeek: patient.demographics.alcoholPerWeek,
  };
}

/**
 * Builds the full demo bundle. Deterministic, so every page renders the same
 * twin. Safe to call from any server component.
 */
export function generateDemoBundle(): DemoBundle {
  const patient = buildPatient();
  const samples = generateWearableStream(patient.demographics.id, WINDOW_DAYS).samples;
  const riskInput = toRiskInput(patient);

  const vitals = deriveVitals(patient, samples);

  const cvd = computeCvD10YearRisk(riskInput);
  const diabetes = computeDiabetesProgressionRisk(riskInput);
  const acuteStress = computeAcuteStressRisk(riskInput, {
    heartRateBpm: vitals.heartRateBpm,
    hrvMs: vitals.hrvMs,
    sleepHours: vitals.sleepHours,
    sleepQuality: vitals.sleepQuality,
    stressIndex: 6,
  });
  const riskScores = [cvd, diabetes, acuteStress];

  const alerts = generateAlerts(riskScores, vitals, { vitals, mergedEhr: patient });
  const recommendations = generateRecommendations(
    { patient, samples, windowDays: WINDOW_DAYS, vitals, riskScores },
    alerts,
  );

  const twin = buildTwinState(
    patient.demographics.id,
    `twin-${patient.demographics.id.slice(0, 8)}`,
    { patient, samples, windowDays: WINDOW_DAYS, vitals },
    riskScores,
    alerts,
    recommendations,
  );

  return { twin, patient, vitals, samples, riskInput };
}

/**
 * Derives a vitals summary from the wearable window, with the EHR systolic /
 * diastolic BP as the authoritative reading.
 */
function deriveVitals(patient: PatientProfile, samples: WearableSample[]): TwinVitals {
  const recent = samples.filter((sample) => {
    const age = Date.now() - Date.parse(sample.timestamp);
    return age >= 0 && age <= WINDOW_DAYS * 86_400_000;
  });

  const average = (values: number[], fallback: number) =>
    values.length > 0
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : fallback;

  // Report the most recent *complete* day. Using the partial current day meant
  // that early in the UTC day the twin showed "0 steps" and a one-hour night.
  const todayKey = new Date().toISOString().slice(0, 10);
  const dayKeys = Array.from(
    new Set(recent.map((sample) => sample.timestamp.slice(0, 10))),
  ).sort();
  const latestDay =
    [...dayKeys].reverse().find((day) => day < todayKey) ?? dayKeys[dayKeys.length - 1];

  const latestDaySamples = recent.filter(
    (sample) => sample.timestamp.slice(0, 10) === latestDay,
  );

  // One sample per hour, so non-awake samples equal hours slept.
  const sleepHours = latestDaySamples.filter((sample) => sample.sleepStage !== "awake").length;

  const restingSamples =
    latestDaySamples.length > 0
      ? latestDaySamples.filter((sample) => sample.sleepStage !== "awake")
      : recent.filter((sample) => sample.sleepStage !== "awake");

  const restingHr = average(
    (restingSamples.length > 0 ? restingSamples : recent).map((s) => s.heartRateBpm),
    74,
  );
  const sleepQuality = Math.max(
    0,
    Math.min(100, Math.round(72 + (average(restingSamples.map((s) => s.hrvMs), 44) - 44))),
  );

  const stepsToday =
    latestDaySamples.length > 0
      ? latestDaySamples.reduce((sum, sample) => sum + sample.steps, 0)
      : recent.reduce((sum, sample) => sum + sample.steps, 0);

  return {
    heartRateBpm: restingHr,
    hrvMs: average(restingSamples.map((s) => s.hrvMs), 44),
    respiratoryRate: 16,
    bloodPressureSystolic: patient.systolicBp,
    bloodPressureDiastolic: patient.diastolicBp,
    temperatureC: 36.6,
    spO2: average(recent.map((s) => s.spO2), 97),
    stepsToday,
    sleepHours,
    sleepQuality,
    lastUpdated: new Date().toISOString(),
  };
}

export { generateDemographics };
