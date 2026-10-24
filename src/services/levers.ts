/**
 * VitaTwin — "biggest levers".
 *
 * Tries one realistic change at a time on the same explainable models the
 * what-if panel uses, and ranks the changes by how much they lower the combined
 * risk. Pure and deterministic; synthetic inputs only, decision support only.
 */
import { SCENARIO_LIMITS, type ScenarioInput } from "@/types/scenario";
import { baselineScenario, simulateScenario, type ScenarioBaseline } from "./scenario";

export interface LeverEffect {
  label: string;
  delta: number;
}

export interface Lever {
  id: "smoking" | "glucose" | "ldl" | "weight" | "sleep" | "heart-rate";
  label: string;
  change: Partial<ScenarioInput>;
  /** Sum of the three score deltas (negative = lower risk). */
  totalDelta: number;
  effects: LeverEffect[];
}

const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function candidates(base: ScenarioInput): Array<Pick<Lever, "id" | "label" | "change">> {
  const L = SCENARIO_LIMITS;
  const list: Array<Pick<Lever, "id" | "label" | "change">> = [];
  if (base.smoker) list.push({ id: "smoking", label: "Stop smoking", change: { smoker: false } });
  if (base.hba1c > 6.9) list.push({ id: "glucose", label: "Bring HbA1c to 6.9%", change: { hba1c: 6.9 } });
  if (base.ldl > 100) list.push({ id: "ldl", label: "Bring LDL to 100 mg/dL", change: { ldl: 100 } });
  if (base.bmi > 23) {
    const target = round1(clamp(base.bmi - 2, L.bmi.min, L.bmi.max));
    list.push({ id: "weight", label: `Lose about 6 kg (BMI ${target})`, change: { bmi: target } });
  }
  if (base.sleepHours < 7) list.push({ id: "sleep", label: "Sleep 7.5 hours a night", change: { sleepHours: 7.5 } });
  if (base.restingHr > 65) {
    const target = Math.round(clamp(base.restingHr - 6, L.restingHr.min, L.restingHr.max));
    list.push({ id: "heart-rate", label: `Lower resting HR to ${target} bpm (regular exercise)`, change: { restingHr: target } });
  }
  return list;
}

/** Ranked list of single changes that lower risk by at least 0.5 combined points. */
export function rankLevers(baseline: ScenarioBaseline, limit = 4): Lever[] {
  const base = baselineScenario(baseline);
  return candidates(base)
    .map((candidate) => {
      const result = simulateScenario(baseline, { ...base, ...candidate.change });
      return {
        ...candidate,
        totalDelta: round1(result.scores.reduce((sum, score) => sum + score.delta, 0)),
        effects: result.scores
          .filter((score) => score.delta !== 0)
          .map((score) => ({ label: score.label, delta: score.delta })),
      };
    })
    .filter((lever) => lever.totalDelta <= -0.5)
    .sort((a, b) => a.totalDelta - b.totalDelta)
    .slice(0, limit);
}
