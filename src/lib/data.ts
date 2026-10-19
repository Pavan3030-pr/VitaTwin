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
  generateAlerts,
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
