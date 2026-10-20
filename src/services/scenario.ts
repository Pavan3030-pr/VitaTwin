/**
 * VitaTwin — what-if scenarios.
 *
 * Re-runs the same explainable risk models with a few inputs changed, so a
 * person (or clinician) can see how the twin would respond. Pure functions,
 * server-side only. Synthetic inputs only.
 */

import type { RiskResult } from "@/types/twin";
import {
  SCENARIO_LIMITS,
  type ScenarioInput,
  type ScenarioResult,
  type ScenarioScore,
} from "@/types/scenario";
import {
  computeAcuteStressRisk,
  computeCvD10YearRisk,
  computeDiabetesProgressionRisk,
  type RiskFactorsInput,
} from "./twin-engine";

export type { ScenarioInput, ScenarioResult, ScenarioScore };
export { SCENARIO_LIMITS };

export interface ScenarioBaseline {
  riskInput: RiskFactorsInput;
  vitals: {
    heartRateBpm: number;
    hrvMs: number;
    sleepHours: number;
    sleepQuality: number;
  };
}

function clampNumber(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Validates untrusted input: unknown shapes fall back to the baseline value. */
export function sanitizeScenario(raw: unknown, baseline: ScenarioInput): ScenarioInput {
  const source = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;
  const L = SCENARIO_LIMITS;
  return {
    hba1c: clampNumber(source.hba1c, L.hba1c.min, L.hba1c.max, baseline.hba1c),
    ldl: clampNumber(source.ldl, L.ldl.min, L.ldl.max, baseline.ldl),
    bmi: clampNumber(source.bmi, L.bmi.min, L.bmi.max, baseline.bmi),
    smoker: typeof source.smoker === "boolean" ? source.smoker : baseline.smoker,
    sleepHours: clampNumber(source.sleepHours, L.sleepHours.min, L.sleepHours.max, baseline.sleepHours),
    restingHr: clampNumber(source.restingHr, L.restingHr.min, L.restingHr.max, baseline.restingHr),
  };
}

/** The scenario that equals today's twin (all sliders at their current values). */
export function baselineScenario(baseline: ScenarioBaseline): ScenarioInput {
  const { riskInput, vitals } = baseline;
  return {
    hba1c: riskInput.hba1c,
    ldl: riskInput.ldl,
    bmi: riskInput.bmi,
    smoker: riskInput.smoking === "Current",
    sleepHours: vitals.sleepHours,
    restingHr: vitals.heartRateBpm,
  };
}

function runModels(
  baseline: ScenarioBaseline,
  scenario: ScenarioInput,
): [RiskResult, RiskResult, RiskResult] {
  const base = baseline.riskInput;
  // Knock-on effects use published relationships so the sliders behave like a
  // body, not like isolated numbers:
  //  - LDL moves total cholesterol 1:1 (HDL and triglycerides unchanged).
  //  - ≈1 mmHg systolic BP per kg of weight (Neter, Hypertension 2003);
  //    one BMI unit ≈ 2.9 kg at 170 cm.
  const input: RiskFactorsInput = {
    ...base,
    hba1c: scenario.hba1c,
    ldl: scenario.ldl,
    bmi: scenario.bmi,
    cholesterolTotal: Math.max(100, base.cholesterolTotal + (scenario.ldl - base.ldl)),
    systolicBp: Math.round(base.systolicBp + 2.9 * (scenario.bmi - base.bmi)),
    smoking: scenario.smoker
      ? "Current"
      : baseline.riskInput.smoking === "Current"
        ? "Former"
        : baseline.riskInput.smoking,
  };

  const cvd = computeCvD10YearRisk(input);
  const diabetes = computeDiabetesProgressionRisk(input);
  const acute = computeAcuteStressRisk(input, {
    heartRateBpm: scenario.restingHr,
    hrvMs: baseline.vitals.hrvMs,
    sleepHours: scenario.sleepHours,
    sleepQuality: baseline.vitals.sleepQuality,
    stressIndex: 6,
  });

  return [cvd, diabetes, acute];
}

/** Projects the twin under the scenario and compares it with today's state. */
export function simulateScenario(
  baseline: ScenarioBaseline,
  rawScenario: unknown,
): ScenarioResult {
  const scenario = sanitizeScenario(rawScenario, baselineScenario(baseline));
  const before = runModels(baseline, baselineScenario(baseline));
  const after = runModels(baseline, scenario);

  const scores: ScenarioScore[] = after.map((projected, index) => ({
    type: projected.type,
    label: projected.label,
    baseline: before[index].value,
    projected: projected.value,
    delta: Math.round((projected.value - before[index].value) * 10) / 10,
    category: projected.category,
    drivers: projected.factors.slice(0, 3).map((factor) => factor.factor),
  }));

  const total = Math.round(scores.reduce((sum, score) => sum + score.delta, 0) * 10) / 10;
  const headline =
    total === 0
      ? "No change from today's twin."
      : total < 0
        ? `These changes lower the combined risk score by ${Math.abs(total)} points.`
        : `These changes raise the combined risk score by ${total} points.`;

  return { scores, headline };
}
