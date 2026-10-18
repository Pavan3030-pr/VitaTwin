/**
 * VitaTwin — Synthetic data generators.
 *
 * The ONLY source of patient data in this PoC. All output is clearly labelled
 * synthetic in the UI and in code comments.
 *
 * Reference ranges and plausible value bands are drawn from common Indian
 * cardiometabolic screening guidance (fasting glucose, HbA1c, lipids, BP).
 */

import type {
  PatientDemographics,
  PatientProfile,
  LabResult,
  WearableSample,
  WearableStream,
} from "@/types/twin";

// ---------------------------------------------------------------------------
// Deterministic pseudo-randomness (seeded, so the demo is reproducible)
// ---------------------------------------------------------------------------

let seed = 1;

/** Resets the generator. Call before generating to get repeatable output. */
export function seedRandom(value: number): void {
  seed = value >>> 0 || 1;
}

/** Park–Miller LCG — small, dependency-free and deterministic. */
function rand(min: number, max: number): number {
  seed = (seed * 1103515245 + 12345) & 0x7fffffff;
  return min + (seed / 0x7fffffff) * (max - min);
}

function pick<T>(items: readonly T[]): T {
  return items[Math.floor(rand(0, items.length))];
}

function toFixed(value: number, digits = 1): number {
  return Number(value.toFixed(digits));
}

// ---------------------------------------------------------------------------
// Reference data
// ---------------------------------------------------------------------------

export const MALE_NAMES = [
  "Arjun", "Rohan", "Vikram", "Karthik", "Rahul", "Amit", "Deepak", "Sanjay",
  "Manoj", "Ramesh", "Suresh", "Anil", "Naveen", "Rajesh", "Girish",
] as const;

export const FEMALE_NAMES = [
  "Priya", "Ananya", "Neha", "Sneha", "Pooja", "Sunita", "Lakshmi", "Kamala",
  "Geeta", "Meera", "Divya", "Shruti", "Kavya", "Aarti", "Savita",
] as const;

const LAST_NAMES = [
  "Sharma", "Patel", "Singh", "Kumar", "Reddy", "Iyer", "Rao", "Das",
  "Chatterjee", "Yadav", "Gupta", "Khan", "Nair", "Menon", "Desai", "Joshi",
] as const;

const ETHNICITIES = [
  "Bengali", "Malayali", "Tamil", "Telugu", "Kannada", "Marathi", "Gujarati",
  "Punjabi", "North Indian",
] as const;

const OCCUPATIONS = [
  "Software engineer", "Teacher", "Shopkeeper", "Bank employee",
  "Healthcare worker", "Driver", "Homemaker", "Salesperson", "Retired",
] as const;

const DIAGNOSES = [
  "Hypertension (Stage 1)", "Type 2 diabetes mellitus", "Dyslipidemia",
  "Obesity (Class I)", "Vitamin D deficiency", "Hypothyroidism",
  "Allergic rhinitis", "Osteoarthritis", "Non-alcoholic fatty liver disease",
] as const;

const MEDICATIONS = [
  "Amlodipine 5 mg", "Metformin 500 mg", "Atorvastatin 20 mg",
  "Telmisartan 40 mg", "Aspirin 75 mg", "Sitagliptin 100 mg",
  "Levothyroxine 50 mcg", "Pantoprazole 40 mg",
] as const;

const BLOOD_TYPES = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"] as const;

/** (systolic, diastolic) bands. */
const BP_BANDS = {
  normal: [118, 76],
  elevated: [132, 84],
  high: [148, 94],
} as const;

/** Fasting glucose bands (mg/dL). */
const GLUCOSE_BANDS = {
  normal: [88, 96],
  impaired: [108, 122],
  diabetic: [148, 178],
} as const;

/** HbA1c bands (%). */
const HBA1C_BANDS = {
  normal: [5.2, 5.6],
  prediabetic: [6.0, 6.4],
  diabetic: [7.1, 8.6],
} as const;

type BpBand = keyof typeof BP_BANDS;
type GlucoseBand = keyof typeof GLUCOSE_BANDS;
type Hba1cBand = keyof typeof HBA1C_BANDS;

/** Picks a whole number from the given band. */
function pickBand<K extends string>(
  bands: Record<K, readonly [number, number]>,
  band: K,
): number {
  const [low, high] = bands[band];
  return Math.round(rand(low, high));
}

// ---------------------------------------------------------------------------
// Demographics
// ---------------------------------------------------------------------------

export function generateDemographics(): PatientDemographics {
  const gender = rand(0, 1) > 0.5 ? "Male" : "Female";
  const firstName = gender === "Male" ? pick(MALE_NAMES) : pick(FEMALE_NAMES);
  const lastName = pick(LAST_NAMES);

  const heightCm = Math.round(rand(152, 178));
  const weightKg = Math.round(rand(52, 92));

  const age = Math.round(rand(34, 62));
  const birthYear = new Date().getFullYear() - age;
  const birthMonth = String(Math.floor(rand(1, 13))).padStart(2, "0");
  const birthDay = String(Math.floor(rand(1, 28))).padStart(2, "0");

  const smoking = rand(0, 1) > 0.65 ? "Never" : rand(0, 1) > 0.5 ? "Former" : "Current";

  return {
    id: `synthetic-${Math.floor(rand(100000, 999999))}`,
    firstName,
    lastName,
    dateOfBirth: `${birthYear}-${birthMonth}-${birthDay}`,
    gender,
    ethnicity: pick(ETHNICITIES),
    heightCm,
    weightKg,
    bloodType: pick(BLOOD_TYPES),
    smoking,
    alcoholPerWeek: Math.round(rand(0, 6)),
    occupation: pick(OCCUPATIONS),
    location: "Bengaluru, Karnataka",
  };
}

export function computeBmi(heightCm: number, weightKg: number): number {
  const metres = heightCm / 100;
  return toFixed(weightKg / (metres * metres), 1);
}

// ---------------------------------------------------------------------------
// EHR snapshot
// ---------------------------------------------------------------------------

export function generateEhrSnapshot(
  demographics: PatientDemographics,
  riskFactors: { hypertension: boolean; diabetes: boolean; hyperlipidemia: boolean },
): PatientProfile {
  const birthYear = Number(demographics.dateOfBirth.slice(0, 4));
  const age = new Date().getFullYear() - birthYear;

  const bpBand: BpBand = riskFactors.hypertension
    ? "high"
    : rand(0, 1) > 0.5
      ? "elevated"
      : "normal";
  const systolicBp = pickBand(BP_BANDS, bpBand);
  const diastolicBp = BP_BANDS[bpBand][1];

  const glucoseBand: GlucoseBand = riskFactors.diabetes
    ? "diabetic"
    : rand(0, 1) > 0.55
      ? "impaired"
      : "normal";
  const fastingGlucose = pickBand(GLUCOSE_BANDS, glucoseBand);

  const hba1cBand: Hba1cBand = riskFactors.diabetes
    ? "diabetic"
    : glucoseBand === "impaired"
      ? "prediabetic"
      : "normal";
  const hba1c = toFixed(rand(HBA1C_BANDS[hba1cBand][0], HBA1C_BANDS[hba1cBand][1]), 1);

  const recentLabs = generateLabs({
    systolicBp,
    diastolicBp,
    fastingGlucose,
    hba1c,
    hyperlipidemia: riskFactors.hyperlipidemia,
  });

  return {
    demographics,
    riskFactors: {
      hypertension: riskFactors.hypertension,
      diabetes: riskFactors.diabetes,
      hyperlipidemia: riskFactors.hyperlipidemia,
      familyHistory: rand(0, 1) > 0.5 ? "Parent" : "None",
      chronicKidneyDisease: false,
      previousStroke: false,
      previousMI: false,
    },
    diagnoses: generateDiagnoses(riskFactors),
    medications: generateMedications(riskFactors),
    recentLabs,
    bmI: computeBmi(demographics.heightCm, demographics.weightKg),
    age,
    systolicBp,
    diastolicBp,
    lastUpdated: new Date().toISOString(),
  };
}

function generateDiagnoses(riskFactors: {
  hypertension: boolean;
  diabetes: boolean;
  hyperlipidemia: boolean;
}): string[] {
  const chosen: string[] = [];
  if (riskFactors.hypertension) chosen.push("Hypertension (Stage 1)");
  if (riskFactors.diabetes) chosen.push("Type 2 diabetes mellitus");
  if (riskFactors.hyperlipidemia) chosen.push("Dyslipidemia");

  const extras = DIAGNOSES.filter((item) => !chosen.includes(item));
  const extraCount = Math.floor(rand(0, 3));
  for (let index = 0; index < extraCount; index += 1) {
    const candidate = pick(extras);
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }
  return chosen;
}

function generateMedications(riskFactors: {
  hypertension: boolean;
  diabetes: boolean;
  hyperlipidemia: boolean;
}): string[] {
  const chosen: string[] = [];
  if (riskFactors.hypertension) chosen.push("Amlodipine 5 mg");
  if (riskFactors.diabetes) chosen.push("Metformin 500 mg");
  if (riskFactors.hyperlipidemia) chosen.push("Atorvastatin 20 mg");

  const extras = MEDICATIONS.filter((item) => !chosen.includes(item));
  const extraCount = Math.floor(rand(0, 2));
  for (let index = 0; index < extraCount; index += 1) {
    const candidate = pick(extras);
    if (!chosen.includes(candidate)) chosen.push(candidate);
  }
  return chosen;
}

interface LabInput {
  systolicBp: number;
  diastolicBp: number;
  fastingGlucose: number;
  hba1c: number;
  hyperlipidemia: boolean;
}

function lab(
  name: string,
  value: number,
  unit: string,
  referenceRange: [number, number],
  flag: LabResult["flag"],
): LabResult {
  return { name, value, unit, referenceRange, flag };
}

function generateLabs(input: LabInput): LabResult[] {
  const totalCholesterol = input.hyperlipidemia
    ? Math.round(rand(215, 275))
    : Math.round(rand(160, 205));
  const hdl = Math.round(rand(32, 52));
  const ldl = Math.round(rand(input.hyperlipidemia ? 140 : 88, input.hyperlipidemia ? 185 : 125));
  const triglycerides = Math.round(rand(input.hyperlipidemia ? 175 : 95, input.hyperlipidemia ? 280 : 165));
  const creatinine = toFixed(rand(0.7, 1.2), 2);
  const egfr = Math.round(rand(72, 112));
  const hemoglobin = toFixed(rand(11.5, 15.5), 1);

  return [
    lab("Fasting glucose", input.fastingGlucose, "mg/dL", [70, 100], input.fastingGlucose > 100 ? "high" : "normal"),
    lab("HbA1c", input.hba1c, "%", [4.0, 5.7], input.hba1c > 5.7 ? "high" : "normal"),
    lab("Total cholesterol", totalCholesterol, "mg/dL", [0, 200], totalCholesterol > 200 ? "high" : "normal"),
    lab("HDL cholesterol", hdl, "mg/dL", [40, 60], hdl < 40 ? "low" : "normal"),
    lab("LDL cholesterol", ldl, "mg/dL", [0, 100], ldl > 100 ? "high" : "normal"),
    lab("Triglycerides", triglycerides, "mg/dL", [0, 150], triglycerides > 150 ? "high" : "normal"),
    lab("Systolic BP", input.systolicBp, "mmHg", [90, 120], input.systolicBp > 120 ? "high" : "normal"),
    lab("Diastolic BP", input.diastolicBp, "mmHg", [60, 80], input.diastolicBp > 80 ? "high" : "normal"),
    lab("Creatinine", creatinine, "mg/dL", [0.6, 1.3], creatinine > 1.3 ? "high" : "normal"),
    lab("eGFR", egfr, "mL/min/1.73m²", [90, 120], egfr < 90 ? "low" : "normal"),
    lab("Hemoglobin", hemoglobin, "g/dL", [12.0, 16.0], hemoglobin < 12 ? "low" : "normal"),
  ];
}

// ---------------------------------------------------------------------------
// Wearable stream
// ---------------------------------------------------------------------------

const SLEEP_STAGES = ["deep", "light", "rem"] as const;

function isNightHour(hour: number): boolean {
  return hour >= 22 || hour < 6;
}

/**
 * Sleep architecture: deep sleep is denser in the first half of the night,
 * REM later on. Keeps the fused sleep-quality signal believable.
 */
function pickSleepStage(hour: number): WearableSample["sleepStage"] {
  const [deep, light, rem] = SLEEP_STAGES;
  return hour < 3 ? pick([deep, deep, light]) : pick([light, rem, light]);
}

/**
 * Generates one sample per hour across the window. Night hours (22:00–05:59)
 * carry sleep stages, so the fused twin has a realistic sleep duration.
 */
export function generateWearableStream(
  patientId: string,
  windowDays: number,
): WearableStream {
  const samples: WearableSample[] = [];

  // Everything is generated in UTC so the ISO date part of a timestamp always
  // matches the day it belongs to (no local-timezone day drift).
  const today = new Date();
  const startDay = Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate() - windowDays + 1,
  );

  // A per-patient baseline so trends look like a person, not noise.
  const restingHr = Math.round(rand(62, 84));

  for (let day = 0; day < windowDays; day += 1) {
    const dayStepsTarget = Math.round(rand(2800, 11000));
    const sleepHoursTonight = toFixed(rand(4.5, 8.2), 1);

    for (let hour = 0; hour < 24; hour += 1) {
      const night = isNightHour(hour);

      let sleepStage: WearableSample["sleepStage"] = "awake";
      if (night && hour < 6 && sleepHoursTonight > 0) {
        // Sleep occupies the small hours.
        sleepStage = pickSleepStage(hour);
      } else if (night && hour >= 22) {
        sleepStage = rand(0, 1) > 0.5 ? "light" : "awake";
      }

      const asleep = sleepStage !== "awake";

      const heartRateBpm = asleep
        ? Math.round(restingHr - rand(4, 12))
        : Math.round(restingHr + rand(0, 22));
      const hrvMs = Math.round(asleep ? rand(42, 68) : rand(26, 52));
      const spO2 = toFixed(rand(asleep ? 96 : 95, 99), 1);

      // Steps are spread across waking hours with a mid-day peak.
      const wakingWeight = night ? 0 : 0.35 + Math.sin(((hour - 5) / 17) * Math.PI) * 0.9;
      const steps = Math.round(wakingWeight * (dayStepsTarget / 12));

      const activity: WearableSample["activity"] = asleep
        ? "sedentary"
        : steps > 900
          ? "moderate"
          : steps > 300
            ? "light"
            : "sedentary";

      const stressIndex = Math.round(asleep ? rand(1, 3) : rand(2, 9));

      const timestamp = new Date(
        startDay + day * 86_400_000 + hour * 3_600_000,
      );
      timestamp.setUTCMinutes(Math.floor(rand(0, 60)), 0, 0);

      samples.push({
        timestamp: timestamp.toISOString(),
        heartRateBpm,
        hrvMs,
        steps,
        sleepStage,
        spO2,
        activity,
        stressIndex,
      });
    }
  }

  const startTime = samples[0]?.timestamp ?? new Date().toISOString();
  const endTime = samples[samples.length - 1]?.timestamp ?? new Date().toISOString();

  return {
    patientId,
    source: "simulated-wearable",
    windowDays,
    samples,
    startTime,
    endTime,
    isSynthetic: true,
  };
}
