import { describe, expect, it } from "vitest";
import { generateDemoBundle } from "@/lib/data";
import {
  baselineScenario,
  sanitizeScenario,
  simulateScenario,
  type ScenarioBaseline,
} from "@/services/scenario";

function baseline(personaId?: string): ScenarioBaseline {
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

const scoreOf = (result: ReturnType<typeof simulateScenario>, type: string) =>
  result.scores.find((score) => score.type === type)!;

describe("what-if scenarios", () => {
  it("returns no change when nothing is moved", () => {
    const base = baseline();
    const result = simulateScenario(base, baselineScenario(base));
    expect(result.scores).toHaveLength(3);
    expect(result.scores.every((score) => score.delta === 0)).toBe(true);
    expect(result.headline).toMatch(/no change/i);
  });

  it("lower HbA1c reduces both cardiovascular and diabetes risk", () => {
    const base = baseline();
    const result = simulateScenario(base, { ...baselineScenario(base), hba1c: 6.2 });
    expect(scoreOf(result, "cvd-10yr").delta).toBeLessThan(0);
    expect(scoreOf(result, "diabetes-progression").delta).toBeLessThan(0);
    expect(result.headline).toMatch(/lower/i);
  });

  it("quitting smoking lowers cardiovascular risk", () => {
    const base = baseline("vt-005"); // current smoker with premature CAD in the family
    expect(base.riskInput.smoking).toBe("Current");
    const result = simulateScenario(base, { ...baselineScenario(base), smoker: false });
    expect(scoreOf(result, "cvd-10yr").delta).toBeLessThan(0);
  });

  it("a rough week of sleep raises acute stress and explains why", () => {
    const base = baseline();
    const result = simulateScenario(base, {
      ...baselineScenario(base),
      sleepHours: 4.5,
      restingHr: 92,
    });
    const acute = scoreOf(result, "acute-stress");
    expect(acute.delta).toBeGreaterThan(0);
    expect(acute.drivers.length).toBeGreaterThan(0);
    expect(result.headline).toMatch(/raise/i);
  });

  it("sanitizes hostile input instead of trusting it", () => {
    const base = baseline();
    const start = baselineScenario(base);
    const clean = sanitizeScenario(
      { hba1c: 9999, ldl: -5, bmi: "abc", smoker: "yes", sleepHours: NaN, restingHr: null },
      start,
    );
    expect(clean.hba1c).toBe(12);
    expect(clean.ldl).toBe(60);
    expect(clean.bmi).toBe(start.bmi);
    expect(clean.smoker).toBe(start.smoker);
    expect(clean.sleepHours).toBe(start.sleepHours);
    expect(clean.restingHr).toBe(45);
    expect(sanitizeScenario("not an object", start)).toEqual(start);
    expect(() => simulateScenario(base, undefined)).not.toThrow();
  });
});

describe("what-if knock-on effects", () => {
  it("losing weight lowers cardiovascular risk through blood pressure", () => {
    const base = baseline();
    const result = simulateScenario(base, { ...baselineScenario(base), bmi: base.riskInput.bmi - 3 });
    expect(scoreOf(result, "cvd-10yr").delta).toBeLessThan(0);
  });

  it("lowering LDL lowers cardiovascular risk via total cholesterol", () => {
    const base = baseline();
    const result = simulateScenario(base, { ...baselineScenario(base), ldl: 70 });
    expect(scoreOf(result, "cvd-10yr").delta).toBeLessThan(0);
  });
});
