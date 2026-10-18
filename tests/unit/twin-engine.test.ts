import { describe, expect, it } from "vitest";
import {
  buildTwinState,
  computeAcuteStressRisk,
  computeCvD10YearRisk,
  computeDiabetesProgressionRisk,
  fuseData,
  generateAlerts,
  generateRecommendations,
  type RiskFactorsInput,
} from "@/services/twin-engine";
import type { PatientProfile, TwinVitals, WearableSample } from "@/types/twin";

/** A healthy baseline; tests raise individual factors from here. */
const HEALTHY: RiskFactorsInput = {
  age: 32,
  systolicBp: 116,
  diastolicBp: 74,
  cholesterolTotal: 168,
  hdl: 58,
  ldl: 88,
  triglycerides: 96,
  fastingGlucose: 88,
  hba1c: 5.2,
  hypertension: false,
  diabetes: false,
  hyperlipidemia: false,
  familyHistory: "None",
  bmi: 22.4,
  smoking: "Never",
  creatinine: 0.8,
  egfr: 104,
  hemoglobin: 14.2,
  alcoholPerWeek: 0,
};

const UNHEALTHY: RiskFactorsInput = {
  ...HEALTHY,
  age: 58,
  systolicBp: 168,
  diastolicBp: 102,
  ldl: 178,
  hdl: 34,
  triglycerides: 260,
  fastingGlucose: 168,
  hba1c: 8.6,
  hypertension: true,
  diabetes: true,
  hyperlipidemia: true,
  familyHistory: "Multiple",
  bmi: 33.1,
  smoking: "Current",
  creatinine: 1.5,
  egfr: 52,
  alcoholPerWeek: 18,
};

const VITALS: TwinVitals = {
  heartRateBpm: 72,
  hrvMs: 48,
  respiratoryRate: 15,
  bloodPressureSystolic: 118,
  bloodPressureDiastolic: 76,
  temperatureC: 36.6,
  spO2: 98,
  stepsToday: 6400,
  sleepHours: 7.4,
  sleepQuality: 78,
  lastUpdated: new Date().toISOString(),
};

function sample(overrides: Partial<WearableSample> = {}): WearableSample {
  return {
    timestamp: new Date().toISOString(),
    heartRateBpm: 70,
    hrvMs: 45,
    steps: 120,
    sleepStage: "awake",
    spO2: 98,
    activity: "light",
    stressIndex: 4,
    ...overrides,
  };
}

function profile(): PatientProfile {
  return {
    demographics: {
      id: "p1",
      firstName: "Test",
      lastName: "Patient",
      dateOfBirth: "1980-01-01",
      gender: "Male",
      ethnicity: "Kannada",
      heightCm: 172,
      weightKg: 78,
      bloodType: "O+",
      smoking: "Never",
      alcoholPerWeek: 2,
      occupation: "Engineer",
      location: "Bengaluru, Karnataka",
    },
    riskFactors: {
      hypertension: true,
      diabetes: true,
      hyperlipidemia: true,
      familyHistory: "Parent",
      chronicKidneyDisease: false,
      previousStroke: false,
      previousMI: false,
    },
    diagnoses: ["Hypertension (Stage 1)"],
    medications: ["Amlodipine 5 mg"],
    recentLabs: [],
    bmI: 26.4,
    age: 46,
    systolicBp: 146,
    diastolicBp: 92,
    lastUpdated: new Date().toISOString(),
  };
}

describe("computeCvD10YearRisk", () => {
  it("scores a healthy profile lower than a high-risk profile", () => {
    const healthy = computeCvD10YearRisk(HEALTHY);
    const unhealthy = computeCvD10YearRisk(UNHEALTHY);
    expect(healthy.value).toBeLessThan(unhealthy.value);
  });

  it("stays inside 0–100 and picks a matching category band", () => {
    for (const factors of [HEALTHY, UNHEALTHY, { ...HEALTHY, age: 90, hba1c: 12, bmi: 44 }]) {
      const result = computeCvD10YearRisk(factors);
      expect(result.value).toBeGreaterThanOrEqual(0);
      expect(result.value).toBeLessThanOrEqual(100);

      const band =
        result.value < 20
          ? "low"
          : result.value < 40
            ? "moderate"
            : result.value < 70
              ? "high"
              : "critical";
      expect(result.category).toBe(band);
    }
  });

  it("is explainable: every raised factor carries a note and a direction", () => {
    const result = computeCvD10YearRisk(UNHEALTHY);
    expect(result.factors.length).toBeGreaterThan(0);
    expect(result.explanation).toContain(String(result.value));
    for (const factor of result.factors) {
      expect(factor.factor.length).toBeGreaterThan(0);
      expect(factor.note.length).toBeGreaterThan(0);
      expect(factor.weight).toBeGreaterThan(0);
      expect(["higher", "lower", "neutral"]).toContain(factor.direction);
    }
    expect(result.modelVersion).toMatch(/^vita-twin-/);
    expect(result.label.length).toBeGreaterThan(0);
    expect(result.type).toBe("cvd-10yr");
  });
});

describe("computeDiabetesProgressionRisk", () => {
  it("rises with glycaemic and adiposity markers", () => {
    const healthy = computeDiabetesProgressionRisk(HEALTHY);
    const unhealthy = computeDiabetesProgressionRisk(UNHEALTHY);
    expect(unhealthy.value).toBeGreaterThan(healthy.value);
    expect(unhealthy.value).toBeLessThanOrEqual(100);
  });

  it("names HbA1c as a driver when control is poor", () => {
    const result = computeDiabetesProgressionRisk({ ...HEALTHY, hba1c: 8.4 });
    expect(result.factors.some((factor) => factor.factor.includes("HbA1c"))).toBe(true);
  });
});

describe("computeAcuteStressRisk", () => {
  it("flags the documented nocturnal-HR-plus-poor-sleep pattern", () => {
    const resting = computeAcuteStressRisk(HEALTHY, {
      heartRateBpm: 62,
      hrvMs: 62,
      sleepHours: 7.8,
      sleepQuality: 85,
      stressIndex: 2,
    });
    const stressed = computeAcuteStressRisk(HEALTHY, {
      heartRateBpm: 96,
      hrvMs: 22,
      sleepHours: 4.2,
      sleepQuality: 30,
      stressIndex: 9,
    });

    expect(stressed.value).toBeGreaterThan(resting.value);
    expect(stressed.factors.length).toBeGreaterThan(resting.factors.length);
  });

  it("does not crash on extreme inputs", () => {
    const result = computeAcuteStressRisk(UNHEALTHY, {
      heartRateBpm: 250,
      hrvMs: 0,
      sleepHours: 0,
      sleepQuality: 0,
      stressIndex: 12,
    });
    expect(result.value).toBeLessThanOrEqual(100);
    expect(result.value).toBeGreaterThanOrEqual(0);
  });
});

describe("fuseData", () => {
  it("reduces an hourly window to a summary", () => {
    const samples: WearableSample[] = [];
    const now = Date.now();
    for (let hour = 0; hour < 48; hour += 1) {
      samples.push(
        sample({
          timestamp: new Date(now - hour * 3_600_000).toISOString(),
          heartRateBpm: 60 + (hour % 10),
          hrvMs: 40 + (hour % 5),
          steps: 100,
          sleepStage: hour % 24 < 6 ? "deep" : "awake",
          spO2: 97,
        }),
      );
    }

    const fused = fuseData({ patient: profile(), samples, windowDays: 7 });
    expect(fused.vitals.heartRateBpm).toBeGreaterThan(0);
    expect(fused.vitals.hrvMs).toBeGreaterThan(0);
    expect(fused.vitals.stepsToday).toBeGreaterThan(0);
    expect(fused.vitals.lastUpdated).toBeTruthy();
    expect(fused.mergedEhr.demographics.id).toBe("p1");
  });

  it("falls back to the EHR when there is no wearable window", () => {
    const fused = fuseData({ patient: profile(), samples: [], windowDays: 7 });
    expect(fused.vitals.bloodPressureSystolic).toBe(146);
    expect(fused.vitals.bloodPressureDiastolic).toBe(92);
    expect(Number.isFinite(fused.vitals.heartRateBpm)).toBe(true);
    expect(fused.vitals.sleepHours).toBe(0);
  });
});

describe("generateAlerts", () => {
  it("raises a CVD alert for a high-risk twin", () => {
    const cvd = computeCvD10YearRisk(UNHEALTHY);
    const diabetes = computeDiabetesProgressionRisk(UNHEALTHY);
    const stress = computeAcuteStressRisk(UNHEALTHY, {
      heartRateBpm: 95,
      hrvMs: 20,
      sleepHours: 4,
      sleepQuality: 30,
      stressIndex: 9,
    });

    const alerts = generateAlerts(
      [cvd, diabetes, stress],
      { ...VITALS, heartRateBpm: 95, sleepHours: 4, sleepQuality: 30, hrvMs: 20 },
      { vitals: VITALS, mergedEhr: profile() },
    );

    expect(alerts.some((alert) => alert.title.toLowerCase().includes("cardiovascular"))).toBe(true);
    for (const alert of alerts) {
      expect(alert.factors.length).toBeGreaterThan(0);
      expect(alert.recommendedAction.length).toBeGreaterThan(0);
      expect(alert.acknowledged).toBe(false);
      expect(alert.readable.length).toBeGreaterThan(0);
    }
  });

  it("returns nothing for a low-risk, well-recovered twin", () => {
    const alerts = generateAlerts(
      [
        computeCvD10YearRisk(HEALTHY),
        computeDiabetesProgressionRisk(HEALTHY),
        computeAcuteStressRisk(HEALTHY, {
          heartRateBpm: 60,
          hrvMs: 60,
          sleepHours: 8,
          sleepQuality: 90,
          stressIndex: 2,
        }),
      ],
      { ...VITALS, heartRateBpm: 60, sleepHours: 8, sleepQuality: 90, hrvMs: 60 },
      { vitals: VITALS, mergedEhr: profile() },
    );
    expect(alerts).toHaveLength(0);
  });
});

describe("generateRecommendations", () => {
  it("adjusts priority to the severity of the risks", () => {
    const riskScores = [
      computeCvD10YearRisk(UNHEALTHY),
      computeDiabetesProgressionRisk(UNHEALTHY),
      computeAcuteStressRisk(UNHEALTHY, {
        heartRateBpm: 95,
        hrvMs: 20,
        sleepHours: 4,
        sleepQuality: 30,
        stressIndex: 9,
      }),
    ];
    const vitals = { ...VITALS, heartRateBpm: 95, sleepHours: 4, sleepQuality: 30 };

    const recommendations = generateRecommendations(
      {
        patient: profile(),
        samples: [],
        windowDays: 7,
        vitals,
        riskScores,
      },
      generateAlerts(riskScores, vitals, { vitals, mergedEhr: profile() }),
    );

    expect(recommendations.length).toBeGreaterThan(0);
    expect(recommendations.length).toBeLessThanOrEqual(6);
    expect(recommendations.some((rec) => rec.priority === "high")).toBe(true);
    for (const rec of recommendations) {
      expect(["lifestyle", "clinical", "medication", "monitoring"]).toContain(rec.category);
      expect(["immediate", "soon", "routine"]).toContain(rec.whenToSeekCare);
      expect(rec.body.length).toBeGreaterThan(0);
    }
  });

  it("always returns at least one actionable nudge", () => {
    const riskScores = [
      computeCvD10YearRisk(HEALTHY),
      computeDiabetesProgressionRisk(HEALTHY),
      computeAcuteStressRisk(HEALTHY, {
        heartRateBpm: 60,
        hrvMs: 60,
        sleepHours: 8,
        sleepQuality: 90,
        stressIndex: 2,
      }),
    ];
    const recommendations = generateRecommendations(
      {
        patient: profile(),
        samples: [],
        windowDays: 7,
        vitals: { ...VITALS, sleepHours: 8, sleepQuality: 90, heartRateBpm: 60 },
        riskScores,
      },
      [],
    );
    expect(recommendations.length).toBeGreaterThanOrEqual(1);
  });
});

describe("buildTwinState", () => {
  it("assembles an explainable, auditable twin", () => {
    const riskScores = [
      computeCvD10YearRisk(UNHEALTHY),
      computeDiabetesProgressionRisk(UNHEALTHY),
      computeAcuteStressRisk(UNHEALTHY, {
        heartRateBpm: 90,
        hrvMs: 24,
        sleepHours: 5,
        sleepQuality: 35,
        stressIndex: 8,
      }),
    ];
    const vitals = { ...VITALS, heartRateBpm: 90, sleepHours: 5, sleepQuality: 35 };
    const alerts = generateAlerts(riskScores, vitals, { vitals, mergedEhr: profile() });

    const twin = buildTwinState("p1", "twin-1", { patient: profile(), samples: [], windowDays: 7, vitals }, riskScores, alerts, []);

    expect(twin.source).toBe("synthetic");
    expect(twin.patientId).toBe("p1");
    expect(twin.twinId).toBe("twin-1");
    expect(twin.riskScores).toHaveLength(3);
    expect(twin.insights.length).toBeGreaterThan(0);
    expect(twin.updatedAt).toBeTruthy();

    // Every score must carry its factors — never a bare number.
    for (const score of twin.riskScores) {
      expect(Array.isArray(score.factors)).toBe(true);
      expect(score.explanation.length).toBeGreaterThan(0);
    }
  });
});
