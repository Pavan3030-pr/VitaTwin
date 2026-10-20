import { describe, expect, it } from "vitest";
import { importWearableCsv, sampleWearableCsv } from "@/services/wearable-import";

describe("importWearableCsv", () => {
  it("parses the sample CSV and produces early warning", () => {
    const result = importWearableCsv(sampleWearableCsv(), { label: "Sample" });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.patientLabel).toBe("Sample");
    expect(result.dayCount).toBeGreaterThanOrEqual(10);
    expect(result.sampleCount).toBeGreaterThan(40);
    expect(result.risks).toHaveLength(3);
  });

  it("rejects empty input", () => {
    expect(importWearableCsv("").ok).toBe(false);
  });

  it("rejects CSV without a date column", () => {
    expect(importWearableCsv("heart_rate,hrv\n70,40\n").ok).toBe(false);
  });
});
