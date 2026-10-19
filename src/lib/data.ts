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
  RiskFactorsInput,
} from "../types/twin";
