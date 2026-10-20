import { describe, expect, it, vi } from "vitest";
import {
  CITIES,
  aqiCategory,
  environmentRisk,
  fetchEnvironment,
  parseEnvironment,
  resolveCity,
} from "@/services/environment";

const DELHI = CITIES.delhi;

const AQ = { current: { time: "2026-10-20T08:00", pm2_5: 142.3, pm10: 210.1, us_aqi: 198 } };
const WX = { current: { temperature_2m: 29.4, apparent_temperature: 31.2, relative_humidity_2m: 48 } };

describe("environment", () => {
  it("resolves Indian cities from a patient location string", () => {
    expect(resolveCity("Hyderabad, Telangana").city).toBe("Hyderabad");
    expect(resolveCity("Delhi, NCT").city).toBe("Delhi");
    expect(resolveCity("Nowhere, Atlantis").city).toBe("Bengaluru");
  });

  it("parses Open-Meteo payloads defensively", () => {
    const env = parseEnvironment(DELHI, AQ, WX)!;
    expect(env.pm25).toBe(142.3);
    expect(env.usAqi).toBe(198);
    expect(env.aqiCategory).toBe("Unhealthy");
    expect(env.apparentTemperatureC).toBe(31.2);
    expect(env.source).toBe("open-meteo");

    expect(parseEnvironment(DELHI, null, null)).toBeNull();
    expect(parseEnvironment(DELHI, { current: { pm2_5: "oops" } }, undefined)).toBeNull();
  });

  it("maps AQI to EPA categories", () => {
    expect(aqiCategory(30)).toBe("Good");
    expect(aqiCategory(120)).toBe("Unhealthy for sensitive groups");
    expect(aqiCategory(320)).toBe("Hazardous");
    expect(aqiCategory(null)).toBe("Unavailable");
  });

  it("adds explainable risk points for pollution and heat, none for clean air", () => {
    const smog = environmentRisk(parseEnvironment(DELHI, AQ, WX));
    expect(smog.points).toBeGreaterThanOrEqual(10);
    expect(smog.factors[0].factor).toMatch(/PM2\.5/);

    const heat = environmentRisk(
      parseEnvironment(DELHI, { current: { pm2_5: 8, us_aqi: 30 } }, { current: { temperature_2m: 40, apparent_temperature: 44 } }),
    );
    expect(heat.factors.some((f) => /heat/i.test(f.factor))).toBe(true);

    const clean = environmentRisk(parseEnvironment(DELHI, { current: { pm2_5: 6, us_aqi: 25 } }, WX));
    expect(clean.points).toBe(0);
    expect(environmentRisk(null).points).toBe(0);
  });

  it("fetches both feeds and fails soft", async () => {
    const ok = vi.fn(async (url: string | URL | Request) =>
      new Response(JSON.stringify(String(url).includes("air-quality") ? AQ : WX), { status: 200 }),
    );
    const env = await fetchEnvironment(DELHI, ok as unknown as typeof fetch);
    expect(env?.pm25).toBe(142.3);
    expect(ok).toHaveBeenCalledTimes(2);

    const down = vi.fn(async () => {
      throw new Error("network down");
    });
    await expect(fetchEnvironment(DELHI, down as unknown as typeof fetch)).resolves.toBeNull();

    const bad = vi.fn(async () => new Response("nope", { status: 503 }));
    await expect(fetchEnvironment(DELHI, bad as unknown as typeof fetch)).resolves.toBeNull();
  });
});
