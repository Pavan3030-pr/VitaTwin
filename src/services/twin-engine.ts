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
