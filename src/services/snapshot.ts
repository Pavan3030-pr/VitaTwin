/**
 * VitaTwin — compact twin snapshot (what is saved for signed-in users).
 * Pure functions: no I/O, fully unit-tested. Only derived numbers are kept,
 * never raw wearable streams.
 */
import type { DemoBundle } from "@/lib/data";

export const SNAPSHOT_VERSION = 1;
export const MAX_SNAPSHOTS_PER_USER = 50;

export interface SnapshotScore {
  type: string;
  label: string;
  value: number;
  category: "low" | "moderate" | "high" | "critical";
}

export interface SnapshotPayload {
  v: number;
  personaId: string;
  patientName: string;
  age: number;
  scores: SnapshotScore[];
  earlyWarning: { level: string; index: number; leadTimeHours: number | null };
  alerts: number;
  vitals: { heartRateBpm: number; hrvMs: number; spO2: number; sleepHours: number; stepsToday: number };
  hba1c: number | null;
}

export function buildSnapshotPayload(bundle: DemoBundle): SnapshotPayload {
  const { twin, patient, vitals, earlyWarning, personaId } = bundle;
  return {
    v: SNAPSHOT_VERSION,
    personaId,
    patientName: `${patient.demographics.firstName} ${patient.demographics.lastName}`.trim(),
    age: patient.age,
    scores: twin.riskScores.map((score) => ({
      type: score.type,
      label: score.label,
      value: score.value,
      category: score.category,
    })),
    earlyWarning: {
      level: earlyWarning.level,
      index: earlyWarning.index,
      leadTimeHours: earlyWarning.leadTimeHours,
    },
    alerts: twin.alerts.length,
    vitals: {
      heartRateBpm: vitals.heartRateBpm,
      hrvMs: vitals.hrvMs,
      spO2: vitals.spO2,
      sleepHours: vitals.sleepHours,
      stepsToday: vitals.stepsToday,
    },
    hba1c: patient.recentLabs.find((lab) => lab.name === "HbA1c")?.value ?? null,
  };
}

const CATEGORIES = new Set(["low", "moderate", "high", "critical"]);

/** Defensive read of a stored payload; returns null for anything malformed. */
export function parseSnapshotPayload(raw: unknown): SnapshotPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<SnapshotPayload>;
  if (p.v !== SNAPSHOT_VERSION || typeof p.patientName !== "string" || !Array.isArray(p.scores)) return null;
  const scores = p.scores.filter(
    (s): s is SnapshotScore =>
      !!s && typeof s.label === "string" && typeof s.value === "number" && CATEGORIES.has(String(s.category)),
  );
  if (!p.earlyWarning || typeof p.earlyWarning.level !== "string") return null;
  return { ...(p as SnapshotPayload), scores };
}
