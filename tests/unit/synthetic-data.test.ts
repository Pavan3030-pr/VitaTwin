import { describe, expect, it } from "vitest";
import {
  FEMALE_NAMES,
  MALE_NAMES,
  generateDemographics,
  generateEhrSnapshot,
  generateWearableStream,
  seedRandom,
} from "@/lib/synthetic-data";

/**
 * These tests pin the synthetic-data invariants that the twin depends on.
 * They also guard the two bugs we hit in the first dashboard render:
 * an HbA1c that reused glucose numbers, and a wearable stream with no night
 * samples (so sleep looked like 0–1 hours).
 */

const RISK = { hypertension: true, diabetes: true, hyperlipidemia: true };

describe("generateDemographics", () => {
  it("produces a plausible, internally consistent profile", () => {
    seedRandom(42);
    const demographics = generateDemographics();

    expect(demographics.heightCm).toBeGreaterThanOrEqual(150);
    expect(demographics.heightCm).toBeLessThanOrEqual(200);
    expect(demographics.weightKg).toBeGreaterThanOrEqual(40);
    expect(demographics.location).toContain("Karnataka");

    const birthYear = Number(demographics.dateOfBirth.slice(0, 4));
    const age = new Date().getFullYear() - birthYear;
    expect(age).toBeGreaterThanOrEqual(30);
    expect(age).toBeLessThanOrEqual(65);

    // Names must match the stated gender (a jury notices contradictions).
    const pool = demographics.gender === "Male" ? MALE_NAMES : FEMALE_NAMES;
    expect(pool).toContain(demographics.firstName);
  });

  it("never pairs a male name with a female gender, or vice versa", () => {
    for (let seed = 1; seed <= 50; seed += 1) {
      seedRandom(seed);
      const demographics = generateDemographics();
      if (demographics.gender === "Male") {
        expect(FEMALE_NAMES).not.toContain(demographics.firstName);
      } else {
        expect(MALE_NAMES).not.toContain(demographics.firstName);
      }
    }
  });

  it("is deterministic for a fixed seed", () => {
    seedRandom(7);
    const first = generateDemographics();
    seedRandom(7);
    const second = generateDemographics();
    expect(first.firstName).toBe(second.firstName);
    expect(first.dateOfBirth).toBe(second.dateOfBirth);
  });
});

describe("generateEhrSnapshot", () => {
  it("keeps HbA1c in %, never glucose units", () => {
    for (let seed = 1; seed <= 40; seed += 1) {
      seedRandom(seed);
      const demographics = generateDemographics();
      const profile = generateEhrSnapshot(demographics, RISK);

      const hba1c = profile.recentLabs.find((lab) => lab.name === "HbA1c");
      const glucose = profile.recentLabs.find((lab) => lab.name === "Fasting glucose");

      expect(hba1c).toBeDefined();
      expect(glucose).toBeDefined();
      expect(hba1c!.value).toBeGreaterThanOrEqual(5);
      expect(hba1c!.value).toBeLessThanOrEqual(10);
      expect(glucose!.value).toBeGreaterThanOrEqual(80);
      expect(glucose!.value).toBeLessThanOrEqual(200);
      // The bug was these two sharing a value.
      expect(hba1c!.value).not.toBe(glucose!.value);
    }
  });

  it("flags values outside their reference range", () => {
    seedRandom(11);
    const demographics = generateDemographics();
    const profile = generateEhrSnapshot(demographics, RISK);

    for (const lab of profile.recentLabs) {
      const [low, high] = lab.referenceRange;
      if (lab.value > high) expect(lab.flag).toBe("high");
      if (lab.value < low) expect(lab.flag).toBe("low");
      if (lab.value >= low && lab.value <= high) expect(lab.flag).toBe("normal");
    }
  });

  it("systolic BP sits above diastolic BP", () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      seedRandom(seed);
      const profile = generateEhrSnapshot(generateDemographics(), RISK);
      expect(profile.systolicBp).toBeGreaterThan(profile.diastolicBp);
    }
  });
});

describe("generateWearableStream", () => {
  it("emits one hourly sample per day across the window", () => {
    seedRandom(3);
    const stream = generateWearableStream("p1", 7);
    expect(stream.isSynthetic).toBe(true);
    expect(stream.samples).toHaveLength(7 * 24);
  });

  it("includes overnight sleep so sleep duration is realistic", () => {
    for (let seed = 1; seed <= 10; seed += 1) {
      seedRandom(seed);
      const stream = generateWearableStream("p1", 7);

      const byDay = new Map<string, number>();
      for (const sample of stream.samples) {
        if (sample.sleepStage === "awake") continue;
        const day = sample.timestamp.slice(0, 10);
        byDay.set(day, (byDay.get(day) ?? 0) + 1);
      }

      expect(byDay.size).toBeGreaterThan(0);
      for (const hours of byDay.values()) {
        expect(hours).toBeGreaterThanOrEqual(4);
        expect(hours).toBeLessThanOrEqual(10);
      }
    }
  });

  it("never reports impossible physiological values", () => {
    seedRandom(5);
    const stream = generateWearableStream("p1", 7);
    for (const sample of stream.samples) {
      expect(sample.heartRateBpm).toBeGreaterThanOrEqual(35);
      expect(sample.heartRateBpm).toBeLessThanOrEqual(190);
      expect(sample.spO2).toBeGreaterThanOrEqual(90);
      expect(sample.spO2).toBeLessThanOrEqual(100);
      expect(sample.steps).toBeGreaterThanOrEqual(0);
      expect(sample.hrvMs).toBeGreaterThan(0);
    }
  });

  it("never marks daytime hours as sleep", () => {
    seedRandom(9);
    const stream = generateWearableStream("p1", 7);
    const daySleep = stream.samples.filter((sample) => {
      const hour = new Date(sample.timestamp).getUTCHours();
      return hour >= 6 && hour < 22 && sample.sleepStage !== "awake";
    });
    expect(daySleep).toHaveLength(0);
  });
});
