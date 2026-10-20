/**
 * VitaTwin — shared TypeScript types.
 *
 * Single source of truth for the twin domain model across the app.
 */

export interface PatientDemographics {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  ethnicity: string;
  heightCm: number;
  weightKg: number;
  bloodType: string;
  smoking: "Never" | "Former" | "Current";
  alcoholPerWeek: number;
  occupation: string;
  location: string;
}

export interface RiskFactors {
  hypertension: boolean;
  diabetes: boolean;
  hyperlipidemia: boolean;
  familyHistory: "None" | "Parent" | "Siblings" | "Multiple";
  chronicKidneyDisease: boolean;
  previousStroke: boolean;
  previousMI: boolean;
}

export interface PatientProfile {
  demographics: PatientDemographics;
  riskFactors: RiskFactors;
  // EHR snapshot
  diagnoses: string[];
  medications: string[];
  recentLabs: LabResult[];
  // computed from labs (documented)
  bmI: number;
  age: number;
  systolicBp: number;
  diastolicBp: number;
  // last updated for audit trail
  lastUpdated: string;
}

export interface LabResult {
  name: string;
  value: number;
  unit: string;
  referenceRange: [number, number];
  flag: "normal" | "high" | "low";
}

export interface WearableSample {
  timestamp: string;
  heartRateBpm: number;
  hrvMs: number;
  steps: number;
  sleepStage: "deep" | "light" | "rem" | "awake";
  spO2: number;
  activity: "sedentary" | "light" | "moderate" | "vigorous";
  stressIndex: number;
}

export interface WearableStream {
  patientId: string;
  source: "simulated-wearable" | "simulated-ehr";
  windowDays: number;
  samples: WearableSample[];
  startTime: string;
  endTime: string;
  isSynthetic: true;
}

export interface TwinVitals {
  heartRateBpm: number;
  hrvMs: number;
  respiratoryRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  temperatureC: number;
  spO2: number;
  stepsToday: number;
  sleepHours: number;
  sleepQuality: number;
  lastUpdated: string;
}

export interface RiskResult extends RiskScore {
  score?: never;
}

export interface RiskScore {
  type: "cvd-10yr" | "diabetes-progression" | "acute-stress";
  label: string;
  value: number; // 0-100
  category: "low" | "moderate" | "high" | "critical";
  factors: RiskFactorContribution[];
  lastUpdated: string;
  modelVersion: string;
  explanation: string;
}

export interface RiskFactorContribution {
  factor: string;
  direction: "higher" | "lower" | "neutral";
  weight: number;
  note: string;
}

export interface Insight {
  id: string;
  type: "alert" | "recommendation" | "observation";
  severity: "info" | "warning" | "danger";
  title: string;
  body: string;
  timestamp: string;
  actionable: boolean;
  evidence: string[];
  recommendedAction: string;
}

export interface Recommendation {
  id: string;
  category: "lifestyle" | "clinical" | "medication" | "monitoring";
  title: string;
  body: string;
  priority: "high" | "medium" | "low";
  relatedInsightIds: string[];
  whenToSeekCare: "immediate" | "soon" | "routine";
  lastUpdated: string;
}

export interface TwinState {
  patientId: string;
  twinId: string;
  updatedAt: string;
  vitals: TwinVitals;
  riskScores: RiskScore[];
  alerts: Alert[];
  insights: Insight[];
  recommendations: Recommendation[];
  dataFreshnessSeconds: number;
  source: "synthetic";
  /** Live real-world exposure for the patient's city (null when unreachable). */
  environment?: EnvironmentSnapshot | null;
  /** Personal-baseline early-warning analysis of the wearable stream. */
  earlyWarning?: EarlyWarning;
}

/** Real, live ambient conditions (Open-Meteo, no key, CC BY 4.0). */
export interface EnvironmentSnapshot {
  city: string;
  latitude: number;
  longitude: number;
  observedAt: string;
  pm25: number | null;
  pm10: number | null;
  usAqi: number | null;
  aqiCategory: string;
  temperatureC: number | null;
  apparentTemperatureC: number | null;
  humidityPct: number | null;
  source: "open-meteo";
}

export interface EarlyWarningSignal {
  metric: "restingHr" | "hrv" | "sleep" | "steps";
  label: string;
  current: number;
  baseline: number;
  zScore: number;
  unit: string;
  direction: "worse" | "better" | "stable";
}

export interface ForecastPoint {
  label: string;
  hoursAhead: number;
  index: number;
  low: number;
  high: number;
}

export interface EarlyWarning {
  level: "stable" | "watch" | "warning" | "urgent";
  /** 0-100 composite strain index versus the person's own baseline. */
  index: number;
  /** Hours until the index is projected to cross the urgent line; null if not rising. */
  leadTimeHours: number | null;
  headline: string;
  signals: EarlyWarningSignal[];
  history: { day: string; index: number }[];
  forecast: ForecastPoint[];
  baselineDays: number;
}

export interface DataProvenance {
  id: string;
  label: string;
  kind: "synthetic" | "real-live" | "real-published" | "real-dataset";
  detail: string;
  asOf?: string;
}

export interface Alert {
  id: string;
  type: "risk" | "trend" | "advice";
  severity: "low" | "moderate" | "high" | "critical";
  title: string;
  body: string;
  timestamp: string;
  readable: string;
  factors: string[];
  recommendedAction: string;
  acknowledged: boolean;
}

export interface TwinDashboardSummary {
  twin: TwinState;
  latestHr: number;
  latestHrv: number;
  riskSummary: { label: string; score: number; category: string }[];
  primaryAlert: Alert | null;
  recommendedAction: string;
}
