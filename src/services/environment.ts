/**
 * VitaTwin — real-world environmental exposure.
 *
 * Air pollution and heat are established, quantified triggers of acute
 * cardiovascular events (Brook et al., AHA Scientific Statement, Circulation
 * 2010;121:2331; Bhaskaran et al., Heart 2009). This module pulls the *live*
 * PM2.5, AQI and apparent temperature for the patient's city from Open-Meteo
 * (free, keyless, CC BY 4.0) and converts them into explainable risk points.
 *
 * Network access is server-side only and fails soft: if the API is
 * unreachable the twin simply runs without the environment layer and says so.
 */

import type { EnvironmentSnapshot, RiskFactorContribution } from "@/types/twin";

export interface CityCoords {
  city: string;
  latitude: number;
  longitude: number;
}

/** Major Indian cities (lat/lon from public gazetteers). */
export const CITIES: Record<string, CityCoords> = {
  hyderabad: { city: "Hyderabad", latitude: 17.385, longitude: 78.4867 },
  delhi: { city: "Delhi", latitude: 28.6139, longitude: 77.209 },
  mumbai: { city: "Mumbai", latitude: 19.076, longitude: 72.8777 },
  bengaluru: { city: "Bengaluru", latitude: 12.9716, longitude: 77.5946 },
  chennai: { city: "Chennai", latitude: 13.0827, longitude: 80.2707 },
  kolkata: { city: "Kolkata", latitude: 22.5726, longitude: 88.3639 },
  kochi: { city: "Kochi", latitude: 9.9312, longitude: 76.2673 },
  pune: { city: "Pune", latitude: 18.5204, longitude: 73.8567 },
  lucknow: { city: "Lucknow", latitude: 26.8467, longitude: 80.9462 },
  ahmedabad: { city: "Ahmedabad", latitude: 23.0225, longitude: 72.5714 },
};

export const DEFAULT_CITY = CITIES.bengaluru;

/** "Hyderabad, Telangana" → Hyderabad coordinates; unknown → Bengaluru. */
export function resolveCity(location: string): CityCoords {
  const key = location.split(",")[0]?.trim().toLowerCase() ?? "";
  return CITIES[key] ?? DEFAULT_CITY;
}

/** US EPA AQI categories. */
export function aqiCategory(aqi: number | null): string {
  if (aqi === null) return "Unavailable";
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for sensitive groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very unhealthy";
  return "Hazardous";
}

function finiteOrNull(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

interface OpenMeteoCurrent {
  current?: Record<string, unknown>;
}

/** Defensive parse of Open-Meteo payloads (exported for tests). */
export function parseEnvironment(
  city: CityCoords,
  airQuality: unknown,
  weather: unknown,
  now: Date = new Date(),
): EnvironmentSnapshot | null {
  const aq = ((airQuality ?? {}) as OpenMeteoCurrent).current ?? {};
  const wx = ((weather ?? {}) as OpenMeteoCurrent).current ?? {};

  const pm25 = finiteOrNull(aq.pm2_5);
  const pm10 = finiteOrNull(aq.pm10);
  const usAqi = finiteOrNull(aq.us_aqi);
  const temperatureC = finiteOrNull(wx.temperature_2m);
  const apparentTemperatureC = finiteOrNull(wx.apparent_temperature);
  const humidityPct = finiteOrNull(wx.relative_humidity_2m);

  if (pm25 === null && usAqi === null && temperatureC === null) return null;

  const observed = typeof aq.time === "string" ? aq.time : typeof wx.time === "string" ? wx.time : null;

  return {
    city: city.city,
    latitude: city.latitude,
    longitude: city.longitude,
    observedAt: observed ?? now.toISOString(),
    pm25,
    pm10,
    usAqi,
    aqiCategory: aqiCategory(usAqi),
    temperatureC,
    apparentTemperatureC,
    humidityPct,
    source: "open-meteo",
  };
}

async function getJson(url: string, fetchImpl: typeof fetch): Promise<unknown> {
  try {
    const response = await fetchImpl(url, {
      signal: AbortSignal.timeout(4500),
      // 15-minute data cache keeps the demo fast and polite to the free API.
      next: { revalidate: 900 },
    } as RequestInit);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

/** Fetches live conditions; resolves to null when the provider is unreachable. */
export async function fetchEnvironment(
  city: CityCoords,
  fetchImpl: typeof fetch = fetch,
): Promise<EnvironmentSnapshot | null> {
  const { latitude, longitude } = city;
  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
    `&current=pm2_5,pm10,us_aqi&timezone=auto`;
  const wxUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m&timezone=auto`;

  const [airQuality, weather] = await Promise.all([
    getJson(aqUrl, fetchImpl),
    getJson(wxUrl, fetchImpl),
  ]);
  return parseEnvironment(city, airQuality, weather);
}

export interface EnvironmentRisk {
  points: number;
  factors: RiskFactorContribution[];
}

/**
 * Converts exposure into acute-risk points. Bands follow WHO 2021 (24 h PM2.5
 * guideline 15 µg/m³), India NAAQS (60 µg/m³) and heat-stress thresholds from
 * the heat-index literature. Points are deliberately modest: the effect on
 * cardiovascular events is real but small per person (≈0.4-1% per 10 µg/m³).
 */
export function environmentRisk(env: EnvironmentSnapshot | null | undefined): EnvironmentRisk {
  const factors: RiskFactorContribution[] = [];
  let points = 0;
  if (!env) return { points, factors };

  if (env.pm25 !== null) {
    let add = 0;
    if (env.pm25 > 120) add = 18;
    else if (env.pm25 > 60) add = 10;
    else if (env.pm25 > 35) add = 6;
    else if (env.pm25 > 15) add = 3;
    if (add > 0) {
      points += add;
      factors.push({
        factor: `PM2.5 ${Math.round(env.pm25)} µg/m³ in ${env.city}`,
        direction: "higher",
        weight: add,
        note:
          env.pm25 > 60
            ? "Above India's 24-h standard (60 µg/m³). Short-term PM2.5 exposure raises MI and arrhythmia risk within hours to days (AHA 2010)."
            : "Above the WHO 24-h guideline (15 µg/m³). Short-term PM2.5 exposure is linked to acute cardiovascular events.",
      });
    }
  }

  const apparent = env.apparentTemperatureC;
  if (apparent !== null) {
    let add = 0;
    if (apparent >= 41) add = 8;
    else if (apparent >= 38) add = 4;
    if (add > 0) {
      points += add;
      factors.push({
        factor: `Heat stress, feels like ${Math.round(apparent)} °C`,
        direction: "higher",
        weight: add,
        note: "High apparent temperature increases cardiac load and dehydration; cardiovascular admissions rise in heatwaves.",
      });
    }
  }

  return { points, factors };
}
