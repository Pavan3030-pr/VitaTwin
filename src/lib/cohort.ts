/**
 * VitaTwin — synthetic patient cohort.
 *
 * Six hand-authored, clinically coherent personas across Indian cities. Every
 * record is SYNTHETIC (no real person), but the profiles mirror the
 * cardiometabolic patterns seen in Indian primary care (ICMR-INDIAB 2023):
 * young-onset diabetes, central obesity, low HDL, high-normal BP.
 * Hand-authoring (instead of random draws) lets each persona demonstrate one
 * capability of the twin deterministically.
 */

import type {
  LabResult,
  PatientDemographics,
  PatientProfile,
  RiskFactors,
} from "@/types/twin";
import type { StreamOptions } from "./synthetic-data";

export interface Persona {
  id: string;
  seed: number;
  /** One line shown in the patient switcher. */
  headline: string;
  demographics: Omit<PatientDemographics, "dateOfBirth" | "id"> & { age: number };
  riskFactors: RiskFactors;
  diagnoses: string[];
  medications: string[];
  labs: {
    fastingGlucose: number;
    hba1c: number;
    totalCholesterol: number;
    hdl: number;
    ldl: number;
    triglycerides: number;
    creatinine: number;
    egfr: number;
    hemoglobin: number;
  };
  systolicBp: number;
  diastolicBp: number;
  stream: StreamOptions;
}

const NO_FLAGS: RiskFactors = {
  hypertension: false,
  diabetes: false,
  hyperlipidemia: false,
  familyHistory: "None",
  chronicKidneyDisease: false,
  previousStroke: false,
  previousMI: false,
};

export const PERSONAS: Persona[] = [
  {
    id: "vt-001",
    seed: 20261018,
    headline: "Type 2 diabetes · early-warning demo",
    demographics: {
      firstName: "Rajesh", lastName: "Reddy", gender: "Male", ethnicity: "Telugu",
      heightCm: 168, weightKg: 82, bloodType: "B+", smoking: "Former", alcoholPerWeek: 4,
      occupation: "Bank employee", location: "Hyderabad, Telangana", age: 54,
    },
    riskFactors: { ...NO_FLAGS, hypertension: true, diabetes: true, hyperlipidemia: true, familyHistory: "Parent" },
    diagnoses: ["Type 2 diabetes mellitus", "Hypertension (Stage 1)", "Dyslipidemia", "Overweight (Asian BMI cut-off)"],
    medications: ["Metformin 1000 mg", "Telmisartan 40 mg", "Atorvastatin 20 mg"],
    labs: { fastingGlucose: 134, hba1c: 7.6, totalCholesterol: 196, hdl: 42, ldl: 122, triglycerides: 190, creatinine: 1.0, egfr: 84, hemoglobin: 14.1 },
    systolicBp: 138, diastolicBp: 88,
    stream: {
      restingHr: 70, stepsRange: [4500, 6500], sleepRange: [6.4, 7.4],
      deterioration: { lastDays: 3, hrDelta: 11, hrvFactor: 0.66, sleepCut: 1.9, stepsFactor: 0.7 },
    },
  },
  {
    id: "vt-002",
    seed: 4172026,
    headline: "Prediabetes · desk job · Delhi air quality",
    demographics: {
      firstName: "Priya", lastName: "Sharma", gender: "Female", ethnicity: "North Indian",
      heightCm: 158, weightKg: 71, bloodType: "O+", smoking: "Never", alcoholPerWeek: 0,
      occupation: "Software engineer", location: "Delhi, NCT", age: 41,
    },
    riskFactors: { ...NO_FLAGS, familyHistory: "Parent" },
    diagnoses: ["Prediabetes", "Overweight (Asian BMI cut-off)", "Vitamin D deficiency"],
    medications: ["Cholecalciferol 60,000 IU weekly"],
    labs: { fastingGlucose: 112, hba1c: 6.1, totalCholesterol: 196, hdl: 44, ldl: 122, triglycerides: 168, creatinine: 0.8, egfr: 108, hemoglobin: 12.6 },
    systolicBp: 128, diastolicBp: 84,
    stream: { restingHr: 74, stepsRange: [2800, 4200], sleepRange: [5.8, 6.8] },
  },
  {
    id: "vt-003",
    seed: 7311963,
    headline: "Hypertension with CKD stage 3a",
    demographics: {
      firstName: "Anil", lastName: "Kumar", gender: "Male", ethnicity: "Marathi",
      heightCm: 170, weightKg: 74, bloodType: "A+", smoking: "Former", alcoholPerWeek: 2,
      occupation: "Retired", location: "Mumbai, Maharashtra", age: 63,
    },
    riskFactors: { ...NO_FLAGS, hypertension: true, chronicKidneyDisease: true },
    diagnoses: ["Hypertension (Stage 1)", "Chronic kidney disease (stage 3a)"],
    medications: ["Amlodipine 5 mg", "Telmisartan 40 mg"],
    labs: { fastingGlucose: 104, hba1c: 6.0, totalCholesterol: 188, hdl: 41, ldl: 108, triglycerides: 150, creatinine: 1.5, egfr: 55, hemoglobin: 11.8 },
    systolicBp: 138, diastolicBp: 84,
    stream: { restingHr: 68, stepsRange: [3000, 5000], sleepRange: [6.0, 7.0] },
  },
  {
    id: "vt-004",
    seed: 1982022,
    headline: "Healthy adult · low-risk control",
    demographics: {
      firstName: "Kavya", lastName: "Nair", gender: "Female", ethnicity: "Malayali",
      heightCm: 162, weightKg: 55, bloodType: "O+", smoking: "Never", alcoholPerWeek: 0,
      occupation: "Teacher", location: "Kochi, Kerala", age: 29,
    },
    riskFactors: NO_FLAGS,
    diagnoses: ["No chronic conditions"],
    medications: [],
    labs: { fastingGlucose: 86, hba1c: 5.1, totalCholesterol: 172, hdl: 58, ldl: 94, triglycerides: 90, creatinine: 0.7, egfr: 118, hemoglobin: 13.4 },
    systolicBp: 112, diastolicBp: 72,
    stream: { restingHr: 64, stepsRange: [7500, 10500], sleepRange: [7.0, 8.0] },
  },
  {
    id: "vt-005",
    seed: 5552024,
    headline: "Smoker · premature CAD in family",
    demographics: {
      firstName: "Suresh", lastName: "Iyer", gender: "Male", ethnicity: "Tamil",
      heightCm: 172, weightKg: 79, bloodType: "AB+", smoking: "Current", alcoholPerWeek: 6,
      occupation: "Software engineer", location: "Chennai, Tamil Nadu", age: 47,
    },
    riskFactors: { ...NO_FLAGS, hyperlipidemia: true, familyHistory: "Multiple" },
    diagnoses: ["Dyslipidemia", "Tobacco use disorder"],
    medications: ["Atorvastatin 40 mg", "Aspirin 75 mg"],
    labs: { fastingGlucose: 104, hba1c: 5.9, totalCholesterol: 248, hdl: 36, ldl: 168, triglycerides: 245, creatinine: 0.95, egfr: 96, hemoglobin: 15.0 },
    systolicBp: 136, diastolicBp: 88,
    stream: { restingHr: 76, stepsRange: [3500, 5500], sleepRange: [5.5, 6.5] },
  },
  {
    id: "vt-006",
    seed: 8812026,
    headline: "Hypertension · mild upward drift",
    demographics: {
      firstName: "Meera", lastName: "Das", gender: "Female", ethnicity: "Bengali",
      heightCm: 155, weightKg: 68, bloodType: "B+", smoking: "Never", alcoholPerWeek: 0,
      occupation: "Homemaker", location: "Kolkata, West Bengal", age: 58,
    },
    riskFactors: { ...NO_FLAGS, hypertension: true, familyHistory: "Parent" },
    diagnoses: ["Hypertension (Stage 1)", "Prediabetes", "Overweight (Asian BMI cut-off)"],
    medications: ["Amlodipine 5 mg"],
    labs: { fastingGlucose: 118, hba1c: 6.4, totalCholesterol: 226, hdl: 47, ldl: 138, triglycerides: 170, creatinine: 0.9, egfr: 82, hemoglobin: 12.2 },
    systolicBp: 142, diastolicBp: 90,
    stream: {
      restingHr: 72, stepsRange: [3800, 5800], sleepRange: [6.2, 7.2],
      deterioration: { lastDays: 3, hrDelta: 5, hrvFactor: 0.85, sleepCut: 0.9, stepsFactor: 0.85 },
    },
  },
];

export const DEFAULT_PERSONA_ID = PERSONAS[0].id;

export function getPersona(id: string | undefined | null): Persona {
  return PERSONAS.find((persona) => persona.id === id) ?? PERSONAS[0];
}

export function isPersonaId(id: unknown): id is string {
  return typeof id === "string" && PERSONAS.some((persona) => persona.id === id);
}

function lab(
  name: string,
  value: number,
  unit: string,
  range: [number, number],
  flag: LabResult["flag"],
): LabResult {
  return { name, value, unit, referenceRange: range, flag };
}

/** Builds the lab panel with flags derived from the reference ranges. */
export function buildLabs(persona: Persona): LabResult[] {
  const l = persona.labs;
  const { systolicBp, diastolicBp } = persona;
  return [
    lab("Fasting glucose", l.fastingGlucose, "mg/dL", [70, 100], l.fastingGlucose > 100 ? "high" : "normal"),
    lab("HbA1c", l.hba1c, "%", [4.0, 5.7], l.hba1c > 5.7 ? "high" : "normal"),
    lab("Total cholesterol", l.totalCholesterol, "mg/dL", [0, 200], l.totalCholesterol > 200 ? "high" : "normal"),
    lab("HDL cholesterol", l.hdl, "mg/dL", [40, 60], l.hdl < 40 ? "low" : "normal"),
    lab("LDL cholesterol", l.ldl, "mg/dL", [0, 100], l.ldl > 100 ? "high" : "normal"),
    lab("Triglycerides", l.triglycerides, "mg/dL", [0, 150], l.triglycerides > 150 ? "high" : "normal"),
    lab("Systolic BP", systolicBp, "mmHg", [90, 120], systolicBp > 120 ? "high" : "normal"),
    lab("Diastolic BP", diastolicBp, "mmHg", [60, 80], diastolicBp > 80 ? "high" : "normal"),
    lab("Creatinine", l.creatinine, "mg/dL", [0.6, 1.3], l.creatinine > 1.3 ? "high" : "normal"),
    lab("eGFR", l.egfr, "mL/min/1.73m²", [90, 120], l.egfr < 90 ? "low" : "normal"),
    lab("Hemoglobin", l.hemoglobin, "g/dL", [12.0, 16.0], l.hemoglobin < 12 ? "low" : "normal"),
  ];
}

export function buildProfile(persona: Persona): PatientProfile {
  const d = persona.demographics;
  const birthYear = new Date().getFullYear() - d.age;
  const metres = d.heightCm / 100;
  return {
    demographics: {
      id: persona.id,
      firstName: d.firstName,
      lastName: d.lastName,
      dateOfBirth: `${birthYear}-06-15`,
      gender: d.gender,
      ethnicity: d.ethnicity,
      heightCm: d.heightCm,
      weightKg: d.weightKg,
      bloodType: d.bloodType,
      smoking: d.smoking,
      alcoholPerWeek: d.alcoholPerWeek,
      occupation: d.occupation,
      location: d.location,
    },
    riskFactors: persona.riskFactors,
    diagnoses: persona.diagnoses,
    medications: persona.medications,
    recentLabs: buildLabs(persona),
    bmI: Number((d.weightKg / (metres * metres)).toFixed(1)),
    age: d.age,
    systolicBp: persona.systolicBp,
    diastolicBp: persona.diastolicBp,
    lastUpdated: new Date().toISOString(),
  };
}
