/**
 * VitaTwin Data Layer.
 *
 * Provides synthetic data bundles and integration with twin-engine functions.
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
  generateAlerts,/**
 * VitaTwin Data Layer.
 *
 * Provides synthetic data bundles and integration with twin-engine functions.
 */

import {
  generateDemographics,
  generateEhrSnapshot,
  generateWearableStream,
  seedRandom,
} from "./synthetic-data";
import {
  computeCvd10YearRisk,
  computeDiabetesProgressionRisk,
  computeAcuteStressRisk,
  generateAlerts,
  generateRecommendations,
  buildTwinState,
} from "../services/twin-engine";
import type {
  TwinState,
  PatientProfile,
  TwinVitals,
  WearableSample,
  TelemetryEvent,
  RiskAssessment,
  TwinRecommendation,
  DigitalTwinState,
  VitalsHistoryPoint,
} from "../types/twin";

export interface DemoBundle {
  patient: PatientProfile;
  vitals: TwinVitals;
  vitalsHistory: VitalsHistoryPoint[];
  samples: WearableSample[];
  telemetry: TelemetryEvent[];
  risks: RiskAssessment[];
  recommendations: TwinRecommendation[];
  twinState: DigitalTwinState;
  twin: DigitalTwinState;
}

export function generateDemoBundle(seed = 42): DemoBundle {
  const rng = seedRandom(seed);
  const demoPatientProfile = generateEhrSnapshot(seed);
  const demoWearableSamples = generateWearableStream(seed, 24);
  const demoTwinVitals: TwinVitals = {
    heartRate: demoWearableSamples[demoWearableSamples.length - 1]?.heartRateBpm ?? 72,
    bloodPressureSystolic: demoPatientProfile.systolicBp,
    bloodPressureDiastolic: demoPatientProfile.diastolicBp,
    glucoseMgDl: demoWearableSamples[demoWearableSamples.length - 1]?.glucoseMgDl ?? 100,
    spO2Percent: demoWearableSamples[demoWearableSamples.length - 1]?.spO2Percent ?? 98,
    respiratoryRate: 16,
    bodyTemperatureC: 36.6,
    hrvMs: demoWearableSamples[demoWearableSamples.length - 1]?.hrvMs ?? 50,
    timestamp: new Date().toISOString(),
  };

  const demoVitalsHistory: VitalsHistoryPoint[] = demoWearableSamples.map((s) => ({
    timestamp: s.timestamp,
    heartRate: s.heartRateBpm,
    systolicBp: demoPatientProfile.systolicBp,
    diastolicBp: demoPatientProfile.diastolicBp,
    glucose: s.glucoseMgDl,
    spO2: s.spO2Percent,
    hrv: s.hrvMs,
  }));

  const demoTelemetryEvents: TelemetryEvent[] = demoWearableSamples.map((s, i) => ({
    id: `tel-${i}`,
    timestamp: s.timestamp,
    type: "wearable_sync",
    payload: { heartRate: s.heartRateBpm, glucose: s.glucoseMgDl },
  }));

  const cvd = computeCvd10YearRisk(demoPatientProfile, demoTwinVitals);
  const diabetes = computeDiabetesProgressionRisk(demoPatientProfile, demoTwinVitals);
  const stress = computeAcuteStressRisk(demoTwinVitals, demoWearableSamples);

  const demoRisks: RiskAssessment[] = [cvd, diabetes, stress];
  const demoAlerts = generateAlerts(demoTwinVitals, demoRisks);
  const demoRecommendations = generateRecommendations(demoPatientProfile, demoRisks);

  const demoTwinState = buildTwinState(
    demoPatientProfile,
    demoTwinVitals,
    demoWearableSamples,
    demoRisks,
    demoAlerts,
    demoRecommendations
  );

  return {
    patient: demoPatientProfile,
    vitals: demoTwinVitals,
    vitalsHistory: demoVitalsHistory,
    samples: demoWearableSamples,
    telemetry: demoTelemetryEvents,
    risks: demoRisks,
    recommendations: demoRecommendations,
    twinState: demoTwinState,
    twin: demoTwinState,
  };
}

export const demoPatientProfile = generateEhrSnapshot(42);
export const demoWearableSamples = generateWearableStream(42, 24);
export const demoTwinVitals: TwinVitals = {
  heartRate: 72,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  glucoseMgDl: 100,
  spO2Percent: 98,
  respiratoryRate: 16,
  bodyTemperatureC: 36.6,
  hrvMs: 50,
  timestamp: new Date().toISOString(),
};
export const demoVitalsHistory: VitalsHistoryPoint[] = [];
export const demoTelemetryEvents: TelemetryEvent[] = [];
export const demoRisks: RiskAssessment[] = [];
export const demoRecommendations: TwinRecommendation[] = [];
export const demoTwinState = buildTwinState(
  demoPatientProfile,
  demoTwinVitals,
  demoWearableSamples,
  demoRisks,
  [],
  []
);

  generateRecommendations,
  buildTwinState,
} from "../services/twin-engine";
import type {
  TwinState,
  PatientProfile,
  TwinVitals,
  WearableSample,
} from "../types/twin";

/**
 * Generates a complete synthetic demo bundle containing patient profile,
 * wearable stream, and computed twin state.
 */
export function generateDemoBundle(seed: number = 42) {
  seedRandom(seed);

  const profile: PatientProfile = {
    id: "demo-patient-001",
    name: "Alex Morgan",
    age: 58,
    gender: "female",
    bmi: 28.4,
    conditions: ["Hypertension", "Prediabetes"],
    baselineVitals: {
      heartRate: 72,
      spO2: 98,
      bloodPressureSystolic: 138,
      bloodPressureDiastolic: 86,
      glucose: 112,
      hrv: 38,
      respiratoryRate: 16,
      bodyTemperature: 36.6,
      lastUpdated: new Date().toISOString(),
    },
  };

  const wearables: WearableSample[] = generateWearableStream(24, 60);
  const twinState: TwinState = buildTwinState(profile, wearables);

  return {
    profile,
    wearables,
    twinState,
  };
}

export {
  computeCvD10YearRisk,
  computeDiabetesProgressionRisk,
  computeAcuteStressRisk,
  generateAlerts,
  generateRecommendations,
  buildTwinState,
};
