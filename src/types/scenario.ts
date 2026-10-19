/**
 * VitaTwin — what-if scenario types and slider limits.
 *
 * Deliberately free of engine imports so client components can use the limits
 * without pulling any twin computation into the browser bundle.
 */

/** The knobs a person can move. Validated server-side by `sanitizeScenario`. */
export interface ScenarioInput {
  hba1c: number;
  ldl: number;
  bmi: number;
  smoker: boolean;
  sleepHours: number;
  restingHr: number;
}

export interface ScenarioScore {
  type: "cvd-10yr" | "diabetes-progression" | "acute-stress";
  label: string;
  baseline: number;
  projected: number;
  delta: number;
  category: "low" | "moderate" | "high" | "critical";
  drivers: string[];
}

export interface ScenarioResult {
  scores: ScenarioScore[];
  /** Plain-language one-liner describing the overall movement. */
  headline: string;
}

export const SCENARIO_LIMITS = {
  hba1c: { min: 5, max: 12, step: 0.1 },
  ldl: { min: 60, max: 220, step: 1 },
  bmi: { min: 16, max: 45, step: 0.1 },
  sleepHours: { min: 3, max: 10, step: 0.5 },
  restingHr: { min: 45, max: 110, step: 1 },
} as const;
