import { describe, expect, it } from "vitest";
import { generateDemoBundle } from "@/lib/data";

/**
 * Contract test for what the dashboard actually renders. These assertions are
 * deliberately about plausibility, because a jury immediately notices values
 * like "HbA1c 130%" or "sleep 0.8 h".
 */
describe("generateDemoBundle", () => {
  const bundle = generateDemoBundle();
  const { twin, patient, vitals, samples } = bundle;

  it("is deterministic across calls", () => {
    const again = generateDemoBundle();
    expect(again.patient.demographics.firstName).toBe(patient.demographics.firstName);
    expect(again.vitals.heartRateBpm).toBe(vitals.heartRateBpm);
    expect(again.twin.riskScores.map((s) => s.value)).toEqual(
      twin.riskScores.map((s) => s.value),
    );
  });

  it("renders physiologically plausible vitals", () => {
    expect(vitals.heartRateBpm).toBeGreaterThanOrEqual(45);
    expect(vitals.heartRateBpm).toBeLessThanOrEqual(100);

    expect(vitals.hrvMs).toBeGreaterThanOrEqual(10);
    expect(vitals.hrvMs).toBeLessThanOrEqual(120);

    expect(vitals.spO2).toBeGreaterThanOrEqual(90);
    expect(vitals.spO2).toBeLessThanOrEqual(100);

    expect(vitals.bloodPressureSystolic).toBeGreaterThan(vitals.bloodPressureDiastolic);

    // The headline bug: sleep was reported as ~1 hour.
    expect(vitals.sleepHours).toBeGreaterThanOrEqual(4);
    expect(vitals.sleepHours).toBeLessThanOrEqual(10);

    expect(vitals.sleepQuality).toBeGreaterThanOrEqual(0);
    expect(vitals.sleepQuality).toBeLessThanOrEqual(100);

    // Steps must not be zero — the dashboard shows them as "today".
    expect(vitals.stepsToday).toBeGreaterThan(500);
  });

  it("renders plausible laboratory values", () => {
    const hba1c = patient.recentLabs.find((lab) => lab.name === "HbA1c");
    expect(hba1c?.value).toBeGreaterThanOrEqual(4);
    expect(hba1c?.value).toBeLessThanOrEqual(12);
    expect(hba1c?.unit).toBe("%");

    const glucose = patient.recentLabs.find((lab) => lab.name === "Fasting glucose");
    expect(glucose?.value).toBeGreaterThanOrEqual(70);
    expect(glucose?.value).toBeLessThanOrEqual(250);

    expect(patient.bmI).toBeGreaterThanOrEqual(15);
    expect(patient.bmI).toBeLessThanOrEqual(45);
    expect(patient.age).toBeGreaterThanOrEqual(30);
    expect(patient.age).toBeLessThanOrEqual(70);
  });

  it("exposes a wearable window with hourly coverage", () => {
    expect(samples.length).toBe(10 * 24);
  });

  it("produces three explainable risk scores inside 0–100", () => {
    expect(twin.riskScores).toHaveLength(3);
    const types = twin.riskScores.map((score) => score.type).sort();
    expect(types).toEqual(["acute-stress", "cvd-10yr", "diabetes-progression"]);

    for (const score of twin.riskScores) {
      expect(score.value).toBeGreaterThanOrEqual(0);
      expect(score.value).toBeLessThanOrEqual(100);
      expect(score.explanation.length).toBeGreaterThan(20);
      expect(score.modelVersion).toMatch(/^vita-twin-/);
    }
  });

  it("marks the twin as synthetic", () => {
    expect(twin.source).toBe("synthetic");
  });

  it("shows the documented India-relevant context", () => {
    expect(patient.demographics.location).toMatch(/Telangana|Delhi|Maharashtra|Kerala|Tamil Nadu|West Bengal|Karnataka/);
  });
});
