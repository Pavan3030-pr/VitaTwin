import { describe, expect, it } from "vitest";
import { PERSONAS, buildProfile, getPersona, isPersonaId } from "@/lib/cohort";
import { generateDemoBundle } from "@/lib/data";
import { CITIES, resolveCity } from "@/services/environment";

describe("synthetic cohort", () => {
  it("has six unique, plausible personas in known Indian cities", () => {
    expect(PERSONAS).toHaveLength(6);
    expect(new Set(PERSONAS.map((p) => p.id)).size).toBe(6);
    for (const persona of PERSONAS) {
      const profile = buildProfile(persona);
      expect(profile.age).toBeGreaterThanOrEqual(18);
      expect(profile.bmI).toBeGreaterThan(15);
      expect(profile.bmI).toBeLessThan(45);
      expect(profile.systolicBp).toBeGreaterThan(profile.diastolicBp);
      expect(Object.values(CITIES).map((c) => c.city)).toContain(resolveCity(profile.demographics.location).city);
    }
  });

  it("falls back to the default persona for unknown ids", () => {
    expect(getPersona("nope").id).toBe(PERSONAS[0].id);
    expect(isPersonaId("vt-003")).toBe(true);
    expect(isPersonaId("../etc/passwd")).toBe(false);
    expect(isPersonaId(undefined)).toBe(false);
  });

  it("orders cardiovascular risk sensibly across the cohort", () => {
    const cvd = (id: string) =>
      generateDemoBundle(id).twin.riskScores.find((s) => s.type === "cvd-10yr")!.value;
    expect(cvd("vt-004")).toBeLessThan(2);
    expect(cvd("vt-004")).toBeLessThan(cvd("vt-002"));
    expect(cvd("vt-002")).toBeLessThan(cvd("vt-005"));
    expect(cvd("vt-001")).toBeGreaterThan(20);
  });

  it("reflects live air quality in the acute-risk score for the same patient", () => {
    const clean = generateDemoBundle("vt-002", null);
    const smog = generateDemoBundle("vt-002", {
      city: "Delhi", latitude: 28.6, longitude: 77.2, observedAt: "now",
      pm25: 160, pm10: 230, usAqi: 215, aqiCategory: "Very unhealthy",
      temperatureC: 30, apparentTemperatureC: 32, humidityPct: 40, source: "open-meteo",
    });
    const acute = (b: ReturnType<typeof generateDemoBundle>) =>
      b.twin.riskScores.find((s) => s.type === "acute-stress")!;
    expect(acute(smog).value).toBeGreaterThan(acute(clean).value);
    expect(acute(smog).factors.some((f) => /PM2\.5/.test(f.factor))).toBe(true);
    expect(smog.twin.alerts.some((a) => /air/i.test(a.title))).toBe(true);
    expect(smog.provenance.find((p) => p.id === "environment")?.kind).toBe("real-live");
    expect(clean.provenance.find((p) => p.id === "environment")?.kind).not.toBe("real-live");
  });
});
