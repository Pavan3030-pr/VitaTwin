/**
 * VitaTwin — server-side data layer.
 *
 * Synthetic-only PoC. Generates a deterministic demo patient, fuses its
 * wearable + EHR streams, and returns an explainable twin state.
 *
 * All twin computation happens here, on the server. The browser only ever
 * receives the derived, explainable summary.
 */

import { generateDemographics, generateWearableStream, seedRandom } from "./synthetic-data";
import { buildProfile, DEFAULT_PERSONA_ID, getPersona } from "./cohort";
import { computeEarlyWarning, dailyStats } from "../services/early-warning";
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
  DataProvenance,
  EarlyWarning,
  EnvironmentSnapshot,
  TwinState,
  PatientProfile,
  TwinVitals,
  WearableSample,
} from "@/types/twin";

const WINDOW_DAYS = 7;
/** Longer stream so each person has a real baseline to compare against. */
const STREAM_DAYS = 10;

export interface DemoBundle {
  twin: TwinState;
  patient: PatientProfile;
  vitals: TwinVitals;
  samples: WearableSample[];
  riskInput: RiskFactorsInput;
  personaId: string;
  environment: EnvironmentSnapshot | null;
  earlyWarning: EarlyWarning;
  provenance: DataProvenance[];
}

function labValue(patient: PatientProfile, name: string, fallback: number): number {
  return patient.recentLabs.find((lab) => lab.name === name)?.value ?? fallback;
}

function toRiskInput(patient: PatientProfile, samples: WearableSample[]): RiskFactorsInput {
  const days = dailyStats(samples);
  const avgDailySteps = days.length > 0
    ? days.reduce((sum, day) => sum + day.steps, 0) / days.length
    : undefined;
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
    gender: patient.demographics.gender,
    avgDailySteps,
    onBpTreatment: patient.medications.some((m) => /amlodipine|telmisartan|losartan|ramipril|metoprolol|atenolol/i.test(m)),
    southAsian: true,
  };
}

export function buildProvenance(environment: EnvironmentSnapshot | null): DataProvenance[] {
  return [
    {
      id: "wearable",
      label: "Wearable stream",
      kind: "synthetic",
      detail: "Simulated hourly HR, HRV, SpO₂, sleep and steps (no real person).",
    },
    {
      id: "ehr",
      label: "EHR snapshot",
      kind: "synthetic",
      detail: "Synthetic labs, diagnoses and medications mirroring Indian primary-care patterns (ICMR-INDIAB 2023).",
    },
    {
      id: "environment",
      label: "Air quality & heat",
      kind: environment ? "real-live" : "real-published",
      detail: environment
        ? `Live Open-Meteo reading for ${environment.city}: PM2.5 ${environment.pm25 ?? "—"} µg/m³, AQI ${environment.usAqi ?? "—"}.`
        : "Open-Meteo live feed unreachable right now; running without the environment layer.",
      asOf: environment?.observedAt,
    },
    {
      id: "equations",
      label: "Risk equations",
      kind: "real-published",
      detail: "Framingham 2008 (South-Asian ×1.4), UKPDS-35 glycaemic adjustment, Indian Diabetes Risk Score.",
    },
    {
      id: "validation",
      label: "Validation cohort",
      kind: "real-dataset",
      detail: "UCI Cleveland Heart Disease: 303 real angiography-referred patients (see Validation).",
    },
  ];
}

/**
 * Builds the full bundle for a persona. Deterministic apart from the live
 * environment layer, which the caller fetches (server-side) and passes in.
 */
export function generateDemoBundle(
  personaId: string = DEFAULT_PERSONA_ID,
  environment: EnvironmentSnapshot | null = null,
): DemoBundle {
  const persona = getPersona(personaId);
  const patient = buildProfile(persona);

  seedRandom(persona.seed);
  const samples = generateWearableStream(persona.id, STREAM_DAYS, persona.stream).samples;
  const riskInput = toRiskInput(patient, samples);
  const vitals = deriveVitals(patient, samples);
  const earlyWarning = computeEarlyWarning(samples);

  const cvd = computeCvD10YearRisk(riskInput);
  const diabetes = computeDiabetesProgressionRisk(riskInput);
  const acuteStress = computeAcuteStressRisk(riskInput, {
    heartRateBpm: vitals.heartRateBpm,
    hrvMs: vitals.hrvMs,
    sleepHours: vitals.sleepHours,
    sleepQuality: vitals.sleepQuality,
    stressIndex: 6,
    environment,
    strainIndex: earlyWarning.index,
  });
  const riskScores = [cvd, diabetes, acuteStress];
  const extras = { environment, earlyWarning };

  const alerts = generateAlerts(riskScores, vitals, { vitals, mergedEhr: patient }, extras);
  const recommendations = generateRecommendations(
    { patient, samples, windowDays: WINDOW_DAYS, vitals, riskScores, ...extras },
    alerts,
  );

  const twin = buildTwinState(
    patient.demographics.id,
    `twin-${patient.demographics.id}`,
    { patient, samples, windowDays: WINDOW_DAYS, vitals },
    riskScores,
    alerts,
    recommendations,
    extras,
  );

  return {
    twin,
    patient,
    vitals,
    samples,
    riskInput,
    personaId: persona.id,
    environment,
    earlyWarning,
    provenance: buildProvenance(environment),
  };
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
