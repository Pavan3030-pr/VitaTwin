import { describe, expect, it } from "vitest";
import { generateDemoBundle } from "@/lib/data";
import { PERSONAS } from "@/lib/cohort";
import { baselineScenario, simulateScenario, type ScenarioBaseline } from "@/services/scenario";
import { rankLevers } from "@/services/levers";

function baselineFor(personaId: string): ScenarioBaseline {
  const { riskInput, vitals } = generateDemoBundle(personaId);
  return {
    riskInput,
    vitals: {
      heartRateBpm: vitals.heartRateBpm,
      hrvMs: vitals.hrvMs,
      sleepHours: vitals.sleepHours,
      sleepQuality: vitals.sleepQuality,
    },
  };
}

describe("rankLevers", () => {
  it("ranks only risk-lowering single changes, best first, at most four", () => {
    for (const persona of PERSONAS) {
      const levers = rankLevers(baselineFor(persona.id));
      expect(levers.length).toBeLessThanOrEqual(4);
      for (const lever of levers) expect(lever.totalDelta).toBeLessThanOrEqual(-0.5);
      const totals = levers.map((lever) => lever.totalDelta);
      expect(totals).toEqual([...totals].sort((a, b) => a - b));
    }
  });

  it("is deterministic and agrees with the what-if simulator", () => {
    const base = baselineFor(PERSONAS[0].id);
    const first = rankLevers(base);
    expect(rankLevers(base)).toEqual(first);
    expect(first.length).toBeGreaterThan(0);

    const top = first[0];
    const result = simulateScenario(base, { ...baselineScenario(base), ...top.change });
    const total = Math.round(result.scores.reduce((sum, score) => sum + score.delta, 0) * 10) / 10;
    expect(total).toBe(top.totalDelta);
  });

  it("never offers 'stop smoking' to a non-smoker", () => {
    for (const persona of PERSONAS) {
      const base = baselineFor(persona.id);
      if (baselineScenario(base).smoker) continue;
      expect(rankLevers(base).some((lever) => lever.id === "smoking")).toBe(false);
    }
  });
});
