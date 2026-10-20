import { describe, expect, it } from "vitest";
import { computeEarlyWarning } from "@/services/early-warning";
import { generateDemoBundle } from "@/lib/data";
import { generateWearableStream, seedRandom } from "@/lib/synthetic-data";
import type { WearableSample } from "@/types/twin";

function stableStream(days: number): WearableSample[] {
  seedRandom(7);
  return generateWearableStream("t", days, {
    restingHr: 66,
    stepsRange: [6000, 7000],
    sleepRange: [7, 7.6],
  }).samples;
}

describe("early warning", () => {
  it("stays quiet for a person who is behaving like themselves", () => {
    const result = computeEarlyWarning(stableStream(10));
    expect(result.level).toBe("stable");
    expect(result.index).toBeLessThan(35);
    expect(result.history.length).toBeGreaterThanOrEqual(6);
  });

  it("flags a deteriorating trend against the person's own baseline", () => {
    seedRandom(7);
    const samples = generateWearableStream("t", 10, {
      restingHr: 66,
      stepsRange: [6000, 7000],
      sleepRange: [7, 7.6],
      deterioration: { lastDays: 3, hrDelta: 12, hrvFactor: 0.6, sleepCut: 2, stepsFactor: 0.6 },
    }).samples;
    const result = computeEarlyWarning(samples);
    expect(["warning", "urgent"]).toContain(result.level);
    expect(result.signals.some((signal) => signal.direction === "worse")).toBe(true);
    expect(result.forecast).toHaveLength(3);
    expect(result.forecast.every((p) => p.low <= p.index && p.index <= p.high)).toBe(true);
    expect(result.headline.length).toBeGreaterThan(10);
  });

  it("asks for more data instead of guessing", () => {
    const result = computeEarlyWarning(stableStream(3));
    expect(result.level).toBe("stable");
    expect(result.signals).toHaveLength(0);
    expect(result.headline).toMatch(/baseline/i);
  });

  it("drives the hero persona's alert and acute-risk score", () => {
    const hero = generateDemoBundle("vt-001");
    const control = generateDemoBundle("vt-004");
    expect(["warning", "urgent"]).toContain(hero.earlyWarning.level);
    expect(control.earlyWarning.level).toBe("stable");
    expect(hero.twin.alerts.some((alert) => alert.type === "trend")).toBe(true);
    const heroAcute = hero.twin.riskScores.find((s) => s.type === "acute-stress")!;
    expect(heroAcute.factors.some((f) => /baseline/i.test(f.factor))).toBe(true);
  });
});
