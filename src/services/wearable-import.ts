/**
 * VitaTwin — wearable CSV / Apple Health / Google Fit import.
 * Stateless: parse CSV → hourly samples → early-warning + risk scores. Nothing stored.
 */

import { computeEarlyWarning } from "./early-warning";
import {
  computeCvD10YearRisk,
  computeDiabetesProgressionRisk,
  computeAcuteStressRisk,
  type RiskFactorsInput,
} from "./twin-engine";
import type { EarlyWarning, RiskScore, WearableSample } from "@/types/twin";

const MAX_BYTES = 2_000_000;
const MAX_ROWS = 50_000;

export interface WearableImportOk {
  ok: true;
  patientLabel: string;
  sampleCount: number;
  dayCount: number;
  windowDays: number;
  format: string;
  found: { label: string; value: string }[];
  assumed: string[];
  warnings: string[];
  risks: RiskScore[];
  earlyWarning: EarlyWarning;
  recentSamples: WearableSample[];
}

export interface WearableImportFail {
  ok: false;
  errors: string[];
}

export type WearableImportResult = WearableImportOk | WearableImportFail;

function norm(header: string): string {
  return header.trim().toLowerCase().replace(/[\s\-]+/g, "_");
}

const TS_KEYS = new Set(["timestamp", "date", "datetime", "start_time", "starttime", "time", "day"]);
const HR_KEYS = new Set(["heart_rate", "hr", "bpm", "resting_hr", "heart_rate_bpm", "heartrate", "resting_heart_rate"]);
const HRV_KEYS = new Set(["hrv", "hrv_ms", "rmssd", "sdnn", "hrv_rmssd", "heart_rate_variability"]);
const STEPS_KEYS = new Set(["steps", "step_count", "daily_steps", "stepcount", "steps_total"]);
const SLEEP_KEYS = new Set(["sleep", "sleep_hours", "sleep_duration", "hours_asleep", "sleep_time", "total_sleep_hours"]);
const SPO2_KEYS = new Set(["spo2", "sp_o2", "oxygen_saturation", "spo2_pct", "blood_oxygen"]);

function findCol(headers: string[], keys: Set<string>): number {
  for (let i = 0; i < headers.length; i += 1) {
    if (keys.has(norm(headers[i]))) return i;
  }
  return -1;
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') inQuotes = false;
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out;
}

function parseNumber(raw: string): number | null {
  const t = raw.trim().replace(/[%]/g, "");
  if (!t || t === "—" || t === "-" || t.toLowerCase() === "null") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

function parseTimestamp(raw: string): Date | null {
  const t = raw.trim();
  if (!t) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
    const d = new Date(`${t}T12:00:00.000Z`);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const slash = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (slash) {
    const a = Number(slash[1]);
    const b = Number(slash[2]);
    const y = Number(slash[3]);
    const hh = Number(slash[4] ?? 12);
    const mm = Number(slash[5] ?? 0);
    const ss = Number(slash[6] ?? 0);
    let day: number;
    let month: number;
    if (a > 12) {
      day = a;
      month = b;
    } else if (b > 12) {
      month = a;
      day = b;
    } else {
      day = a;
      month = b;
    }
    const d = new Date(Date.UTC(y, month - 1, day, hh, mm, ss));
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(t);
  return Number.isNaN(d.getTime()) ? null : d;
}

interface RawRow {
  ts: Date;
  hr: number | null;
  hrv: number | null;
  steps: number | null;
  sleep: number | null;
  spo2: number | null;
}

function expandDailyToHourly(rows: RawRow[]): WearableSample[] {
  const samples: WearableSample[] = [];
  for (const row of rows) {
    const dayStart = Date.UTC(row.ts.getUTCFullYear(), row.ts.getUTCMonth(), row.ts.getUTCDate(), 0, 0, 0);
    const baseHr = row.hr ?? 68;
    const baseHrv = row.hrv ?? 42;
    const daySteps = row.steps ?? 5500;
    const sleepH = row.sleep ?? 6.8;
    const spo2 = row.spo2 ?? 97;
    const nightHours = new Set([0, 1, 2, 3, 4, 5, 23]);
    let stepsAssigned = 0;
    for (let h = 0; h < 24; h += 1) {
      const ts = new Date(dayStart + h * 3_600_000).toISOString();
      const night = nightHours.has(h);
      const hr = night ? baseHr + Math.sin(h) * 2 : baseHr + 12 + Math.sin(h / 3) * 6;
      const hrv = night ? baseHrv + 4 : baseHrv - 6 + Math.sin(h) * 3;
      const hourSteps = night ? 20 : Math.round(daySteps / 16);
      stepsAssigned += hourSteps;
      let sleepStage: WearableSample["sleepStage"] = "awake";
      if (night) {
        const nightIdx = [...nightHours].indexOf(h);
        if (nightIdx < Math.round(sleepH)) {
          sleepStage = h === 1 || h === 3 ? "deep" : h === 4 || h === 5 ? "rem" : "light";
        }
      }
      samples.push({
        timestamp: ts,
        heartRateBpm: Math.round(Math.min(140, Math.max(40, hr))),
        hrvMs: Math.round(Math.min(120, Math.max(10, hrv))),
        steps: hourSteps,
        sleepStage,
        spO2: Math.round(Math.min(100, Math.max(88, spo2 + (night ? 0.3 : -0.2)))),
        activity: night ? "sedentary" : hourSteps > 400 ? "moderate" : "light",
        stressIndex: night ? 20 : 35,
      });
    }
    if (samples.length > 0 && daySteps > 0) {
      const last = samples[samples.length - 1];
      last.steps = Math.max(0, last.steps + (daySteps - stepsAssigned));
    }
  }
  return samples;
}

function rowsToHourlySamples(rows: RawRow[], isDaily: boolean): WearableSample[] {
  if (isDaily) return expandDailyToHourly(rows);
  const byHour = new Map<string, { hrs: number[]; hrvs: number[]; spo2s: number[]; steps: number }>();
  for (const row of rows) {
    const hourKey = new Date(
      Date.UTC(row.ts.getUTCFullYear(), row.ts.getUTCMonth(), row.ts.getUTCDate(), row.ts.getUTCHours()),
    ).toISOString();
    const bucket = byHour.get(hourKey) ?? { hrs: [], hrvs: [], spo2s: [], steps: 0 };
    if (row.hr != null) bucket.hrs.push(row.hr);
    if (row.hrv != null) bucket.hrvs.push(row.hrv);
    if (row.spo2 != null) bucket.spo2s.push(row.spo2);
    if (row.steps != null) bucket.steps += row.steps;
    byHour.set(hourKey, bucket);
  }
  const samples: WearableSample[] = [];
  for (const [ts, b] of [...byHour.entries()].sort(([a], [c]) => a.localeCompare(c))) {
    const hour = new Date(ts).getUTCHours();
    const night = hour <= 5 || hour >= 23;
    const hr = b.hrs.length ? b.hrs.reduce((a, c) => a + c, 0) / b.hrs.length : night ? 62 : 78;
    const hrv = b.hrvs.length ? b.hrvs.reduce((a, c) => a + c, 0) / b.hrvs.length : night ? 48 : 35;
    const spo2 = b.spo2s.length ? b.spo2s.reduce((a, c) => a + c, 0) / b.spo2s.length : 97;
    let sleepStage: WearableSample["sleepStage"] = "awake";
    if (night) sleepStage = hour === 2 || hour === 3 ? "deep" : hour === 4 ? "rem" : "light";
    samples.push({
      timestamp: ts,
      heartRateBpm: Math.round(Math.min(160, Math.max(35, hr))),
      hrvMs: Math.round(Math.min(150, Math.max(8, hrv))),
      steps: Math.round(Math.max(0, b.steps)),
      sleepStage,
      spO2: Math.round(Math.min(100, Math.max(85, spo2))),
      activity: night ? "sedentary" : b.steps > 500 ? "moderate" : "light",
      stressIndex: night ? 18 : 32,
    });
  }
  return samples;
}

function defaultRiskInput(): RiskFactorsInput {
  return {
    age: 48,
    systolicBp: 128,
    diastolicBp: 82,
    cholesterolTotal: 205,
    hdl: 42,
    ldl: 130,
    triglycerides: 160,
    fastingGlucose: 108,
    hba1c: 6.1,
    hypertension: false,
    diabetes: false,
    hyperlipidemia: false,
    familyHistory: "None",
    bmi: 26.5,
    smoking: "Never",
    creatinine: 0.95,
    egfr: 90,
    hemoglobin: 13.5,
    alcoholPerWeek: 2,
    gender: "Male",
    avgDailySteps: undefined,
    onBpTreatment: false,
    southAsian: true,
  };
}

export function importWearableCsv(text: string, opts?: { label?: string }): WearableImportResult {
  if (!text || !text.trim()) return { ok: false, errors: ["File is empty."] };
  if (text.length > MAX_BYTES) return { ok: false, errors: ["File is larger than 2 MB."] };

  const cleaned = text.replace(/^\uFEFF/, "");
  const lines = cleaned.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { ok: false, errors: ["Need a header row and at least one data row."] };

  const headers = splitCsvLine(lines[0]);
  const tsIdx = findCol(headers, TS_KEYS);
  const hrIdx = findCol(headers, HR_KEYS);
  const hrvIdx = findCol(headers, HRV_KEYS);
  const stepsIdx = findCol(headers, STEPS_KEYS);
  const sleepIdx = findCol(headers, SLEEP_KEYS);
  const spo2Idx = findCol(headers, SPO2_KEYS);

  if (tsIdx < 0) {
    return { ok: false, errors: ["No timestamp/date column found. Expected: timestamp, date, datetime, or start_time."] };
  }
  if (hrIdx < 0 && hrvIdx < 0 && stepsIdx < 0 && sleepIdx < 0) {
    return { ok: false, errors: ["No physiology columns found. Need heart_rate, hrv, steps, and/or sleep_hours."] };
  }

  const raw: RawRow[] = [];
  const warnings: string[] = [];
  let skipped = 0;

  for (let i = 1; i < lines.length && raw.length < MAX_ROWS; i += 1) {
    const cells = splitCsvLine(lines[i]);
    const ts = parseTimestamp(cells[tsIdx] ?? "");
    if (!ts) {
      skipped += 1;
      continue;
    }
    const hr = hrIdx >= 0 ? parseNumber(cells[hrIdx] ?? "") : null;
    const hrv = hrvIdx >= 0 ? parseNumber(cells[hrvIdx] ?? "") : null;
    const steps = stepsIdx >= 0 ? parseNumber(cells[stepsIdx] ?? "") : null;
    const sleep = sleepIdx >= 0 ? parseNumber(cells[sleepIdx] ?? "") : null;
    const spo2 = spo2Idx >= 0 ? parseNumber(cells[spo2Idx] ?? "") : null;
    if (hr != null && (hr < 30 || hr > 220)) {
      skipped += 1;
      continue;
    }
    if (hrv != null && (hrv < 5 || hrv > 300)) {
      skipped += 1;
      continue;
    }
    if (spo2 != null && (spo2 < 70 || spo2 > 100)) {
      skipped += 1;
      continue;
    }
    raw.push({ ts, hr, hrv, steps, sleep, spo2 });
  }

  if (raw.length < 3) {
    return { ok: false, errors: [`Only ${raw.length} usable rows (skipped ${skipped}). Need several days of data.`] };
  }

  const dayKeys = new Set(raw.map((r) => r.ts.toISOString().slice(0, 10)));
  const isDaily = dayKeys.size >= raw.length * 0.85 && raw.length <= dayKeys.size + 2;

  let format = "generic CSV";
  if (headers.some((h) => /apple|hkquantity/i.test(h))) format = "Apple Health–style CSV";
  else if (headers.some((h) => /google|fit/i.test(h))) format = "Google Fit–style CSV";
  else if (isDaily) format = "daily summary CSV";
  else format = "hourly / continuous CSV";

  if (skipped > 0) warnings.push(`Skipped ${skipped} rows with missing timestamps or out-of-range values.`);
  if (isDaily) warnings.push("Detected daily rows — expanded to hourly samples for baseline learning.");
  if (hrIdx < 0) warnings.push("No heart-rate column — nocturnal HR baseline uses a population prior.");
  if (hrvIdx < 0) warnings.push("No HRV column — HRV baseline uses a population prior.");

  const samples = rowsToHourlySamples(raw, isDaily);
  if (samples.length < 40) {
    return { ok: false, errors: [`Only ${samples.length} hourly samples. Need roughly 2+ full days.`] };
  }

  const lastTs = new Date(samples[samples.length - 1].timestamp).getTime();
  const now = lastTs + 3_600_000;
  const earlyWarning = computeEarlyWarning(samples, now);
  const riskInput = defaultRiskInput();
  const last = samples[samples.length - 1];
  const risks: RiskScore[] = [
    computeCvD10YearRisk(riskInput),
    computeDiabetesProgressionRisk(riskInput),
    computeAcuteStressRisk(riskInput, {
      heartRateBpm: last?.heartRateBpm ?? 72,
      hrvMs: last?.hrvMs ?? 40,
      sleepHours: 6.5,
      sleepQuality: 70,
      stressIndex: last?.stressIndex ?? 30,
      strainIndex: earlyWarning.index,
    }),
  ];

  const found: { label: string; value: string }[] = [
    { label: "Rows parsed", value: String(raw.length) },
    { label: "Hourly samples", value: String(samples.length) },
    { label: "Calendar days", value: String(dayKeys.size) },
    { label: "Format", value: format },
  ];
  if (hrIdx >= 0) found.push({ label: "Heart rate column", value: headers[hrIdx] });
  if (hrvIdx >= 0) found.push({ label: "HRV column", value: headers[hrvIdx] });
  if (stepsIdx >= 0) found.push({ label: "Steps column", value: headers[stepsIdx] });
  if (sleepIdx >= 0) found.push({ label: "Sleep column", value: headers[sleepIdx] });

  return {
    ok: true,
    patientLabel: opts?.label?.trim() || "Uploaded wearable",
    sampleCount: samples.length,
    dayCount: dayKeys.size,
    windowDays: Math.max(1, dayKeys.size),
    format,
    found,
    assumed: [
      "Age 48, male, South-Asian — not in wearable file (override via FHIR import).",
      "BP 128/82, lipids and glucose at population-typical values.",
      "City / environment layer omitted (no location in wearable file).",
    ],
    warnings,
    risks,
    earlyWarning,
    recentSamples: samples.slice(-48),
  };
}

export function sampleWearableCsv(): string {
  const lines = ["date,heart_rate,hrv_ms,steps,sleep_hours,spo2"];
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - 12);
  start.setUTCHours(0, 0, 0, 0);
  for (let d = 0; d < 12; d += 1) {
    const day = new Date(start.getTime() + d * 86_400_000);
    const late = d >= 9;
    const hr = 62 + (late ? (d - 8) * 3.5 : 0) + (d % 3) * 0.4;
    const hrv = 48 - (late ? (d - 8) * 4 : 0) - (d % 2);
    const steps = 7200 - (late ? (d - 8) * 900 : 0) + (d % 4) * 120;
    const sleep = 7.1 - (late ? (d - 8) * 0.45 : 0);
    const spo2 = 97.2 - (late ? 0.4 : 0);
    lines.push(
      `${day.toISOString().slice(0, 10)},${hr.toFixed(1)},${hrv.toFixed(1)},${Math.round(steps)},${sleep.toFixed(1)},${spo2.toFixed(1)}`,
    );
  }
  return lines.join("\n");
}
