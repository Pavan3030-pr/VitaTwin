import { describe, expect, it } from "vitest";
import { convertUnit, importFhirBundle, toFhirBundle } from "@/services/fhir";
import { SAMPLE_FHIR_BUNDLE } from "@/data/sample-fhir";
import { generateDemoBundle } from "@/lib/data";

const NOW = new Date("2026-10-20T10:00:00Z");

describe("FHIR import", () => {
  it("builds a twin from the ABDM-style sample bundle", () => {
    const result = importFhirBundle(SAMPLE_FHIR_BUNDLE, NOW);
    expect(result.ok).toBe(true);
    expect(result.patientLabel).toBe("Sanjay Kulkarni");
    expect(result.city).toBe("Pune");
    const input = result.riskInput!;
    expect(input.age).toBe(54);
    expect(input.gender).toBe("Male");
    expect(input.diabetes).toBe(true);
    expect(input.hypertension).toBe(true);
    expect(input.smoking).toBe("Current");
    expect(input.onBpTreatment).toBe(true);
    // mmol/L converted to mg/dL
    expect(input.cholesterolTotal).toBeGreaterThan(220);
    expect(input.cholesterolTotal).toBeLessThan(235);
    expect(input.hdl).toBeGreaterThan(35);
    expect(input.systolicBp).toBe(152);
    expect(input.waistCm).toBe(102);
    expect(result.risks).toHaveLength(3);
    const cvd = result.risks.find((r) => r.type === "cvd-10yr")!;
    expect(cvd.value).toBeGreaterThan(20);
    // Anything missing is disclosed, never silently invented.
    expect(result.assumed.some((a) => /Family history/.test(a))).toBe(true);
    expect(result.found.some((f) => f.label === "HbA1c" && f.value === "8.3")).toBe(true);
  });

  it("takes the most recent value and rejects implausible ones", () => {
    const bundle = {
      resourceType: "Bundle",
      entry: [
        { resource: { resourceType: "Patient", gender: "female", birthDate: "1980-01-01" } },
        { resource: { resourceType: "Observation", effectiveDateTime: "2024-01-01", code: { coding: [{ code: "8480-6" }] }, valueQuantity: { value: 150, unit: "mmHg" } } },
        { resource: { resourceType: "Observation", effectiveDateTime: "2026-05-01", code: { coding: [{ code: "8480-6" }] }, valueQuantity: { value: 118, unit: "mmHg" } } },
        { resource: { resourceType: "Observation", effectiveDateTime: "2026-05-01", code: { coding: [{ code: "2093-3" }] }, valueQuantity: { value: 99999, unit: "mg/dL" } } },
      ],
    };
    const result = importFhirBundle(bundle, NOW);
    expect(result.ok).toBe(true);
    expect(result.riskInput!.systolicBp).toBe(118);
    expect(result.warnings.some((w) => /Total cholesterol/.test(w))).toBe(true);
    expect(result.assumed.some((a) => /Total cholesterol/.test(a))).toBe(true);
  });

  it("rejects malformed and hostile input without throwing", () => {
    for (const bad of [null, "text", 42, [], {}, { resourceType: "Patient" }, { resourceType: "Bundle" }, { resourceType: "Bundle", entry: [] }]) {
      const result = importFhirBundle(bad, NOW);
      expect(result.ok).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    }
    expect(importFhirBundle({ resourceType: "Bundle", entry: [{ resource: { resourceType: "Observation" } }] }, NOW).errors[0]).toMatch(/Patient/);
    expect(importFhirBundle({ resourceType: "Bundle", entry: [{ resource: { resourceType: "Patient", birthDate: "not-a-date" } }] }, NOW).errors[0]).toMatch(/birthDate/);
    const tooMany = { resourceType: "Bundle", entry: Array.from({ length: 2001 }, () => ({ resource: { resourceType: "Patient" } })) };
    expect(importFhirBundle(tooMany, NOW).errors[0]).toMatch(/limit/);
  });

  it("converts clinical units", () => {
    expect(convertUnit("totalCholesterol", 5, "mmol/L")).toBeCloseTo(193.35, 1);
    expect(convertUnit("fastingGlucose", 5.5, "mmol/L")).toBeCloseTo(99.1, 1);
    expect(convertUnit("hba1c", 53, "mmol/mol")).toBeCloseTo(7.0, 1);
    expect(convertUnit("creatinine", 88.4, "umol/L")).toBeCloseTo(1, 2);
    expect(convertUnit("heightCm", 1.7, "m")).toBeCloseTo(170, 5);
  });
});

describe("FHIR export", () => {
  it("emits a valid-shaped, synthetic-tagged Bundle with risk assessments", () => {
    const bundle = toFhirBundle(generateDemoBundle("vt-001")) as {
      resourceType: string;
      type: string;
      meta: { security: { code: string }[] };
      entry: { resource: { resourceType: string } }[];
    };
    expect(bundle.resourceType).toBe("Bundle");
    expect(bundle.type).toBe("collection");
    expect(bundle.meta.security[0].code).toBe("HTEST");
    const kinds = bundle.entry.map((e) => e.resource.resourceType);
    expect(kinds.filter((k) => k === "Patient")).toHaveLength(1);
    expect(kinds.filter((k) => k === "RiskAssessment")).toHaveLength(3);
    expect(kinds).toContain("Observation");
    // Round trip: what we export, we can import.
    const back = importFhirBundle(bundle, NOW);
    expect(back.ok).toBe(true);
    expect(back.riskInput!.hba1c).toBeCloseTo(7.6, 1);
  });
});
