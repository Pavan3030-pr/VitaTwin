/**
 * VitaTwin — HL7 FHIR R4 interoperability.
 *
 * India's Ayushman Bharat Digital Mission (ABDM) standardises health records
 * on FHIR R4, so the twin speaks it in both directions:
 *
 *  - IMPORT: a FHIR Bundle (Patient, Observation, Condition, Medication*) is
 *    parsed defensively into the twin's inputs. Nothing is stored.
 *  - EXPORT: the twin's vitals, labs and risk assessments leave as a valid
 *    FHIR Bundle (Patient, Observation, RiskAssessment).
 *
 * Parsing is strictly bounded and never trusts the payload: size limits,
 * numeric plausibility ranges, unit conversion, unknown fields ignored.
 */

import type { DemoBundle } from "@/lib/data";
import type { RiskFactorsInput } from "./twin-engine";
import {
  computeAcuteStressRisk,
  computeCvD10YearRisk,
  computeDiabetesProgressionRisk,
} from "./twin-engine";
import type { RiskResult } from "@/types/twin";

const MAX_ENTRIES = 2000;

// ---------------------------------------------------------------------------
// LOINC maps
// ---------------------------------------------------------------------------

type Metric =
  | "hba1c" | "fastingGlucose" | "totalCholesterol" | "hdl" | "ldl" | "triglycerides"
  | "systolicBp" | "diastolicBp" | "heartRate" | "weightKg" | "heightCm" | "bmi"
  | "waistCm" | "creatinine" | "egfr" | "hemoglobin";

const LOINC: Record<string, Metric> = {
  "4548-4": "hba1c", "17856-6": "hba1c", "41995-2": "hba1c",
  "1558-6": "fastingGlucose", "76629-5": "fastingGlucose", "14771-0": "fastingGlucose", "2339-0": "fastingGlucose",
  "2093-3": "totalCholesterol", "2085-9": "hdl",
  "18262-6": "ldl", "13457-7": "ldl", "2089-1": "ldl",
  "2571-8": "triglycerides",
  "8480-6": "systolicBp", "8462-4": "diastolicBp",
  "8867-4": "heartRate",
  "29463-7": "weightKg", "8302-2": "heightCm", "39156-5": "bmi", "8280-0": "waistCm",
  "2160-0": "creatinine", "33914-3": "egfr", "62238-1": "egfr", "98979-8": "egfr",
  "718-7": "hemoglobin",
};

/** Plausible physiological ranges (after unit conversion). */
const RANGE: Record<Metric, [number, number]> = {
  hba1c: [3, 18], fastingGlucose: [40, 600], totalCholesterol: [60, 500], hdl: [10, 150],
  ldl: [10, 400], triglycerides: [20, 2000], systolicBp: [60, 260], diastolicBp: [30, 160],
  heartRate: [25, 220], weightKg: [20, 300], heightCm: [100, 230], bmi: [10, 70],
  waistCm: [40, 200], creatinine: [0.2, 15], egfr: [3, 200], hemoglobin: [3, 24],
};

const LABEL: Record<Metric, string> = {
  hba1c: "HbA1c", fastingGlucose: "Fasting glucose", totalCholesterol: "Total cholesterol",
  hdl: "HDL cholesterol", ldl: "LDL cholesterol", triglycerides: "Triglycerides",
  systolicBp: "Systolic BP", diastolicBp: "Diastolic BP", heartRate: "Heart rate",
  weightKg: "Weight", heightCm: "Height", bmi: "BMI", waistCm: "Waist circumference",
  creatinine: "Creatinine", egfr: "eGFR", hemoglobin: "Hemoglobin",
};

/** Converts a FHIR Quantity to the twin's units; returns null if unconvertible. */
export function convertUnit(metric: Metric, value: number, unit: string | undefined): number | null {
  const u = (unit ?? "").trim().toLowerCase();
  switch (metric) {
    case "totalCholesterol":
    case "hdl":
    case "ldl":
      return u === "mmol/l" ? value * 38.67 : value;
    case "triglycerides":
      return u === "mmol/l" ? value * 88.57 : value;
    case "fastingGlucose":
      return u === "mmol/l" ? value * 18.016 : value;
    case "creatinine":
      return u === "umol/l" || u === "µmol/l" ? value / 88.4 : value;
    case "hba1c":
      return u === "mmol/mol" ? value * 0.0915 + 2.15 : value;
    case "hemoglobin":
      return u === "g/l" ? value / 10 : value;
    case "heightCm":
      return u === "m" ? value * 100 : u === "[in_i]" || u === "in" ? value * 2.54 : value;
    case "weightKg":
      return u === "[lb_av]" || u === "lb" ? value * 0.45359237 : value;
    default:
      return value;
  }
}

// ---------------------------------------------------------------------------
// Minimal FHIR shapes (only what we read)
// ---------------------------------------------------------------------------

interface Coding { system?: string; code?: string; display?: string }
interface CodeableConcept { coding?: Coding[]; text?: string }
interface Quantity { value?: number; unit?: string; code?: string }
interface Component { code?: CodeableConcept; valueQuantity?: Quantity }
interface Resource {
  resourceType?: string;
  gender?: string;
  birthDate?: string;
  name?: { given?: string[]; family?: string; text?: string }[];
  address?: { city?: string }[];
  code?: CodeableConcept;
  valueQuantity?: Quantity;
  valueCodeableConcept?: CodeableConcept;
  effectiveDateTime?: string;
  issued?: string;
  component?: Component[];
  medicationCodeableConcept?: CodeableConcept;
}
interface BundleLike { resourceType?: string; entry?: { resource?: Resource }[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function conceptText(concept: CodeableConcept | undefined): string {
  if (!concept) return "";
  return [concept.text, ...(concept.coding ?? []).map((c) => `${c.code ?? ""} ${c.display ?? ""}`)]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function hasCode(concept: CodeableConcept | undefined, codes: string[]): boolean {
  return (concept?.coding ?? []).some((c) => c.code !== undefined && codes.includes(c.code));
}

function ageFromBirthDate(birthDate: string | undefined, now: Date): number | null {
  if (!birthDate || !/^\d{4}(-\d{2}(-\d{2})?)?$/.test(birthDate)) return null;
  const born = new Date(birthDate.length === 4 ? `${birthDate}-06-30` : birthDate);
  if (Number.isNaN(born.getTime())) return null;
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------

export interface FhirImportResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
  patientLabel: string;
  city: string | null;
  /** What came from the bundle, with the value used. */
  found: { label: string; value: string }[];
  /** Inputs the bundle did not contain; defaults were assumed. */
  assumed: string[];
  riskInput: RiskFactorsInput | null;
  restingHr: number;
  risks: RiskResult[];
}

const EMPTY: Omit<FhirImportResult, "errors" | "ok"> = {
  warnings: [],
  patientLabel: "Imported patient",
  city: null,
  found: [],
  assumed: [],
  riskInput: null,
  restingHr: 72,
  risks: [],
};

function fail(...errors: string[]): FhirImportResult {
  return { ok: false, errors, ...EMPTY };
}

export function importFhirBundle(raw: unknown, now: Date = new Date()): FhirImportResult {
  if (!isRecord(raw) || (raw as BundleLike).resourceType !== "Bundle") {
    return fail("Expected a FHIR R4 Bundle (resourceType \"Bundle\").");
  }
  const entries = (raw as BundleLike).entry;
  if (!Array.isArray(entries) || entries.length === 0) {
    return fail("The Bundle has no entries.");
  }
  if (entries.length > MAX_ENTRIES) {
    return fail(`The Bundle has ${entries.length} entries; the limit is ${MAX_ENTRIES}.`);
  }

  const warnings: string[] = [];
  const resources = entries
    .map((entry) => (isRecord(entry) && isRecord(entry.resource) ? (entry.resource as Resource) : null))
    .filter((r): r is Resource => r !== null);

  const patient = resources.find((r) => r.resourceType === "Patient");
  if (!patient) return fail("The Bundle contains no Patient resource.");

  const age = ageFromBirthDate(patient.birthDate, now);
  if (age === null) return fail("Patient.birthDate is missing or invalid (expected YYYY, YYYY-MM or YYYY-MM-DD).");

  const gender = patient.gender === "female" ? "Female" : patient.gender === "male" ? "Male" : "Other";
  const name = patient.name?.[0];
  const patientLabel =
    name?.text?.slice(0, 80) ||
    [name?.given?.[0], name?.family].filter(Boolean).join(" ").slice(0, 80) ||
    "Imported patient";
  const city = typeof patient.address?.[0]?.city === "string" ? patient.address[0].city.slice(0, 60) : null;

  // Latest value per metric.
  const latest = new Map<Metric, { value: number; at: string }>();
  const consider = (metric: Metric, quantity: Quantity | undefined, at: string) => {
    if (!quantity || typeof quantity.value !== "number" || !Number.isFinite(quantity.value)) return;
    const converted = convertUnit(metric, quantity.value, quantity.unit ?? quantity.code);
    if (converted === null) return;
    const [lo, hi] = RANGE[metric];
    if (converted < lo || converted > hi) {
      warnings.push(`${LABEL[metric]} value ${quantity.value} ${quantity.unit ?? ""} is outside the plausible range and was ignored.`);
      return;
    }
    const existing = latest.get(metric);
    if (!existing || at >= existing.at) latest.set(metric, { value: converted, at });
  };

  let smoking: "Never" | "Former" | "Current" | null = null;
  let hypertension = false;
  let diabetes = false;
  let hyperlipidemia = false;
  let ckd = false;
  let onBpMeds = false;

  for (const r of resources) {
    const at = (r.effectiveDateTime ?? r.issued ?? "").slice(0, 25);
    if (r.resourceType === "Observation") {
      const metric = (r.code?.coding ?? []).map((c) => (c.code ? LOINC[c.code] : undefined)).find(Boolean);
      if (metric) consider(metric, r.valueQuantity, at);
      for (const component of r.component ?? []) {
        const cm = (component.code?.coding ?? []).map((c) => (c.code ? LOINC[c.code] : undefined)).find(Boolean);
        if (cm) consider(cm, component.valueQuantity, at);
      }
      if (hasCode(r.code, ["72166-2"]) && r.valueCodeableConcept) {
        const text = conceptText(r.valueCodeableConcept);
        if (hasCode(r.valueCodeableConcept, ["77176002"]) || /current|every day|some days/.test(text)) smoking = "Current";
        else if (hasCode(r.valueCodeableConcept, ["8517006"]) || /former|ex-/.test(text)) smoking = "Former";
        else if (hasCode(r.valueCodeableConcept, ["266919005"]) || /never/.test(text)) smoking = "Never";
      }
    } else if (r.resourceType === "Condition") {
      const text = conceptText(r.code);
      if (hasCode(r.code, ["38341003", "59621000"]) || /hypertens|i1[0-5]\b/.test(text)) hypertension = true;
      if (hasCode(r.code, ["44054006", "73211009", "46635009"]) || /diabet|\be1[0-4]/.test(text)) diabetes = true;
      if (hasCode(r.code, ["55822004", "370992007"]) || /hyperlipid|dyslipid|\be78/.test(text)) hyperlipidemia = true;
      if (hasCode(r.code, ["709044004", "431855005"]) || /chronic kidney|\bn18/.test(text)) ckd = true;
    } else if (r.resourceType === "MedicationStatement" || r.resourceType === "MedicationRequest") {
      const text = conceptText(r.medicationCodeableConcept);
      if (/amlodipine|telmisartan|losartan|olmesartan|ramipril|enalapril|metoprolol|atenolol|bisoprolol|hydrochlorothiazide|chlorthalidone/.test(text)) onBpMeds = true;
    }
  }

  // BMI from height/weight if absent.
  if (!latest.has("bmi") && latest.has("heightCm") && latest.has("weightKg")) {
    const m = latest.get("heightCm")!.value / 100;
    latest.set("bmi", { value: latest.get("weightKg")!.value / (m * m), at: "" });
  }

  const found: FhirImportResult["found"] = [
    { label: "Age / sex", value: `${age} y, ${gender}` },
  ];
  for (const [metric, { value }] of latest) {
    found.push({ label: LABEL[metric], value: String(Math.round(value * 10) / 10) });
  }
  if (smoking) found.push({ label: "Smoking", value: smoking });

  const assumed: string[] = [];
  const pick = (metric: Metric, fallback: number, why: string): number => {
    const hit = latest.get(metric);
    if (hit) return hit.value;
    assumed.push(`${LABEL[metric]} → ${fallback} (${why})`);
    return fallback;
  };

  const sbp = pick("systolicBp", 125, "typical adult");
  const dbp = pick("diastolicBp", 80, "typical adult");
  const tc = pick("totalCholesterol", 195, "population mean");
  const hdl = pick("hdl", gender === "Female" ? 52 : 44, "sex-typical value");
  const ldl = pick("ldl", Math.max(60, tc - hdl - 30), "Friedewald estimate, TG assumed 150");
  const tg = pick("triglycerides", 150, "borderline-normal");
  const fpg = pick("fastingGlucose", 95, "normal");
  const hba1c = pick("hba1c", 5.5, "normal");
  const bmi = pick("bmi", 24, "reference value");
  const creatinine = pick("creatinine", 0.9, "normal");
  const egfr = pick("egfr", 90, "normal");
  const hemoglobin = pick("hemoglobin", gender === "Female" ? 12.5 : 14, "normal");

  // Newly discovered diabetes from labs, even if no Condition resource.
  if (!diabetes && (hba1c >= 6.5 || fpg >= 126)) {
    diabetes = true;
    warnings.push("Diabetes inferred from HbA1c ≥ 6.5% or fasting glucose ≥ 126 mg/dL (no Condition resource).");
  }
  if (!hypertension && sbp >= 140) hypertension = true;
  if (!hyperlipidemia && (ldl >= 160 || tc >= 240)) hyperlipidemia = true;

  const riskInput: RiskFactorsInput = {
    age,
    systolicBp: sbp,
    diastolicBp: dbp,
    cholesterolTotal: tc,
    hdl,
    ldl,
    triglycerides: tg,
    fastingGlucose: fpg,
    hba1c,
    hypertension,
    diabetes,
    hyperlipidemia,
    familyHistory: "None",
    bmi,
    smoking: smoking ?? "Never",
    creatinine,
    egfr: ckd ? Math.min(egfr, 59) : egfr,
    hemoglobin,
    alcoholPerWeek: 0,
    gender,
    waistCm: latest.get("waistCm")?.value,
    onBpTreatment: onBpMeds || undefined,
    southAsian: true,
  };
  if (!smoking) assumed.push("Smoking → Never (not in bundle)");
  assumed.push("Family history → none (not in bundle)");

  const restingHr = Math.round(latest.get("heartRate")?.value ?? 72);
  const risks = [
    computeCvD10YearRisk(riskInput),
    computeDiabetesProgressionRisk(riskInput),
    computeAcuteStressRisk(riskInput, {
      heartRateBpm: restingHr,
      hrvMs: 45,
      sleepHours: 7,
      sleepQuality: 70,
      stressIndex: 4,
    }),
  ];

  return { ok: true, errors: [], warnings, patientLabel, city, found, assumed, riskInput, restingHr, risks };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

const LOINC_SYSTEM = "http://loinc.org";
const UCUM = "http://unitsofmeasure.org";

function observation(
  id: string,
  patientRef: string,
  loinc: string,
  display: string,
  value: number,
  unit: string,
  ucum: string,
  when: string,
) {
  return {
    resourceType: "Observation",
    id,
    status: "final",
    code: { coding: [{ system: LOINC_SYSTEM, code: loinc, display }], text: display },
    subject: { reference: patientRef },
    effectiveDateTime: when,
    valueQuantity: { value, unit, system: UCUM, code: ucum },
  };
}

/** FHIR R4 collection Bundle: Patient, Observations, RiskAssessments. */
export function toFhirBundle(bundle: DemoBundle): Record<string, unknown> {
  const { patient, vitals, twin } = bundle;
  const pid = patient.demographics.id;
  const ref = `Patient/${pid}`;
  const when = twin.updatedAt;
  const lab = (name: string) => patient.recentLabs.find((l) => l.name === name)?.value;

  const observations = [
    observation("hr", ref, "8867-4", "Heart rate", vitals.heartRateBpm, "beats/minute", "/min", when),
    observation("sbp", ref, "8480-6", "Systolic blood pressure", vitals.bloodPressureSystolic, "mmHg", "mm[Hg]", when),
    observation("dbp", ref, "8462-4", "Diastolic blood pressure", vitals.bloodPressureDiastolic, "mmHg", "mm[Hg]", when),
    observation("spo2", ref, "59408-5", "Oxygen saturation by pulse oximetry", vitals.spO2, "%", "%", when),
    observation("bmi", ref, "39156-5", "Body mass index", patient.bmI, "kg/m2", "kg/m2", when),
    ...([
      ["hba1c", "4548-4", "Hemoglobin A1c", "HbA1c", "%", "%"],
      ["fpg", "1558-6", "Fasting glucose", "Fasting glucose", "mg/dL", "mg/dL"],
      ["tc", "2093-3", "Total cholesterol", "Total cholesterol", "mg/dL", "mg/dL"],
      ["hdl", "2085-9", "HDL cholesterol", "HDL cholesterol", "mg/dL", "mg/dL"],
      ["ldl", "13457-7", "LDL cholesterol (calculated)", "LDL cholesterol", "mg/dL", "mg/dL"],
      ["tg", "2571-8", "Triglycerides", "Triglycerides", "mg/dL", "mg/dL"],
    ] as const).flatMap(([id, code, display, labName, unit, ucum]) => {
      const value = lab(labName);
      return value === undefined ? [] : [observation(id, ref, code, display, value, unit, ucum, when)];
    }),
  ];

  const riskAssessments = twin.riskScores.map((score) => ({
    resourceType: "RiskAssessment",
    id: `risk-${score.type}`,
    status: "final",
    subject: { reference: ref },
    occurrenceDateTime: when,
    method: { text: `${score.modelVersion} (VitaTwin)` },
    code: { text: score.label },
    prediction: [
      {
        outcome: { text: score.label },
        qualitativeRisk: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/risk-probability",
              code: score.category === "low" ? "low" : score.category === "moderate" ? "moderate" : "high",
            },
          ],
          text: score.category,
        },
        ...(score.type === "cvd-10yr"
          ? { probabilityDecimal: Math.round(score.value) / 100, whenRange: { low: { value: 0, unit: "years" }, high: { value: 10, unit: "years" } } }
          : {}),
        rationale: score.explanation,
      },
    ],
    note: [{ text: "Synthetic data. Decision-support estimate for clinician review; not a diagnosis." }],
  }));

  return {
    resourceType: "Bundle",
    type: "collection",
    timestamp: when,
    meta: {
      security: [
        {
          system: "http://terminology.hl7.org/CodeSystem/v3-ActReason",
          code: "HTEST",
          display: "test health data",
        },
      ],
    },
    entry: [
      {
        fullUrl: `urn:uuid:${pid}`,
        resource: {
          resourceType: "Patient",
          id: pid,
          name: [{ family: patient.demographics.lastName, given: [patient.demographics.firstName] }],
          gender: patient.demographics.gender.toLowerCase(),
          birthDate: patient.demographics.dateOfBirth,
          address: [{ city: patient.demographics.location.split(",")[0], country: "IN" }],
        },
      },
      ...observations.map((resource) => ({ fullUrl: `urn:uuid:${pid}-${resource.id}`, resource })),
      ...riskAssessments.map((resource) => ({ fullUrl: `urn:uuid:${pid}-${resource.id}`, resource })),
    ],
  };
}
