import { describe, expect, it } from "vitest";
import {
  activityFromSteps,
  aucRoc,
  cvdAttribution,
  cvdCategory,
  cvdRiskPercent,
  estimateWaistCm,
  framingham2008,
  idrs,
  type CvdInputs,
} from "@/services/risk-models";

const REFERENCE: CvdInputs = {
  age: 55,
  sex: "Male",
  totalCholesterol: 213,
  hdl: 50,
  systolicBp: 125,
  onBpTreatment: false,
  smoker: false,
  diabetes: false,
};

describe("Framingham 2008 general CVD", () => {
  it("reproduces the published worked example (55-year-old man ≈ 11%)", () => {
    const risk = framingham2008(REFERENCE);
    expect(risk).toBeGreaterThan(0.105);
    expect(risk).toBeLessThan(0.115);
  });

  it("ranks risk factors in the clinically expected order", () => {
    const base = framingham2008(REFERENCE);
    expect(framingham2008({ ...REFERENCE, smoker: true })).toBeGreaterThan(base);
    expect(framingham2008({ ...REFERENCE, diabetes: true })).toBeGreaterThan(base);
    expect(framingham2008({ ...REFERENCE, systolicBp: 160 })).toBeGreaterThan(base);
    expect(framingham2008({ ...REFERENCE, hdl: 35 })).toBeGreaterThan(base);
    expect(framingham2008({ ...REFERENCE, age: 65 })).toBeGreaterThan(base);
    // Women carry lower absolute risk at the same profile.
    expect(framingham2008({ ...REFERENCE, sex: "Female" })).toBeLessThan(base);
  });

  it("never extrapolates outside its fitted range", () => {
    const wild = cvdRiskPercent({ ...REFERENCE, age: 140, totalCholesterol: 9999, hdl: 1, systolicBp: 400 });
    expect(wild).toBeGreaterThan(0);
    expect(wild).toBeLessThanOrEqual(99.9);
  });
});

describe("South-Asian recalibration and UKPDS adjustment", () => {
  it("raises risk by the hazard multiplier without exceeding 100%", () => {
    const plain = cvdRiskPercent({ ...REFERENCE, southAsian: false });
    const sa = cvdRiskPercent({ ...REFERENCE, southAsian: true });
    expect(sa).toBeGreaterThan(plain);
    expect(sa / plain).toBeGreaterThan(1.25);
    expect(sa / plain).toBeLessThan(1.5);
  });

  it("each HbA1c point above 7 raises a diabetic's risk (UKPDS-35, ≈14%)", () => {
    const diabetic: CvdInputs = { ...REFERENCE, diabetes: true, hba1c: 7 };
    const worse = cvdRiskPercent({ ...diabetic, hba1c: 8 });
    const better = cvdRiskPercent(diabetic);
    expect(worse).toBeGreaterThan(better);
    expect(worse / better).toBeGreaterThan(1.08);
    expect(worse / better).toBeLessThan(1.2);
  });
});

describe("explainability", () => {
  it("attributes risk to factors, largest first, all positive", () => {
    const parts = cvdAttribution({ ...REFERENCE, smoker: true, diabetes: true, hba1c: 8.5, systolicBp: 155 });
    expect(parts.length).toBeGreaterThan(3);
    for (let i = 1; i < parts.length; i += 1) {
      expect(parts[i - 1].deltaPct).toBeGreaterThanOrEqual(parts[i].deltaPct);
    }
    expect(parts.every((part) => part.deltaPct > 0 && part.note.length > 0)).toBe(true);
    expect(parts.map((part) => part.factor).join()).toMatch(/smoker/i);
  });

  it("uses ACC/AHA-style bands", () => {
    expect(cvdCategory(3)).toBe("low");
    expect(cvdCategory(7.5)).toBe("moderate");
    expect(cvdCategory(20)).toBe("high");
    expect(cvdCategory(35)).toBe("critical");
  });
});

describe("Indian Diabetes Risk Score", () => {
  it("scores the published maximum and minimum", () => {
    expect(idrs({ age: 60, sex: "Male", waistCm: 110, activity: "sedentary", family: "both-parents" }).total).toBe(100);
    expect(idrs({ age: 25, sex: "Female", waistCm: 70, activity: "regular", family: "none" }).total).toBe(0);
  });

  it("uses sex-specific waist cut-offs", () => {
    const woman = idrs({ age: 25, sex: "Female", waistCm: 85, activity: "regular", family: "none" });
    const man = idrs({ age: 25, sex: "Male", waistCm: 85, activity: "regular", family: "none" });
    expect(woman.waist).toBe(10);
    expect(man.waist).toBe(0);
  });

  it("maps wearable steps to activity classes and estimates waist from BMI", () => {
    expect(activityFromSteps(9000)).toBe("regular");
    expect(activityFromSteps(5000)).toBe("moderate");
    expect(activityFromSteps(2000)).toBe("sedentary");
    expect(estimateWaistCm(22, "Male")).toBeGreaterThan(75);
    expect(estimateWaistCm(30, "Male")).toBeGreaterThan(estimateWaistCm(22, "Male"));
  });
});

describe("aucRoc", () => {
  it("is 1 for a perfect ranker, 0.5 for a constant and handles ties", () => {
    expect(aucRoc([0.9, 0.8, 0.2, 0.1], [true, true, false, false])).toBe(1);
    expect(aucRoc([1, 1, 1, 1], [true, false, true, false])).toBe(0.5);
    expect(aucRoc([1, 2], [true, true])).toBeNaN();
  });
});
