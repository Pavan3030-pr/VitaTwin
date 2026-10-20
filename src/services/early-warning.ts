/**
 * VitaTwin — personal-baseline early warning.
 *
 * Population thresholds miss the person whose resting heart rate drifts from
 * 58 to 67 bpm: still "normal", but a 3-SD departure for them. The twin
 * therefore learns each patient's own baseline from their wearable stream and
 * scores how far the most recent days have moved against it (robust z-scores
 * on nocturnal heart rate, HRV, sleep and activity). A damped linear trend is
 * then projected 72 hours ahead so the clinician gets a lead time, not just a
 * status.
 *
 * Basis: lower HRV, higher resting HR and short sleep each predict adverse
 * cardiac events independently (Fang, JACC 2020; Cooney, Eur J Prev Cardiol
 * 2010; Cappuccio, Eur Heart J 2011). The weights below are a transparent PoC
 * choice, not a fitted model.
 */

import type { EarlyWarning, EarlyWarningSignal, ForecastPoint, WearableSample } from "@/types/twin";

const MIN_SD = { restingHr: 3, hrv: 5, sleep: 0.7, steps: 1500 } as const;
const WEIGHTS = { restingHr: 0.35, hrv: 0.35, sleep: 0.2, steps: 0.1 } as const;
const RECENT_DAYS = 2;
const URGENT_LINE = 75;

interface DayStats {
  day: string;
  restingHr: number;
  hrv: number;
  sleep: number;
  steps: number;
}

function mean(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length;
}

function sd(values: number[], floor: number): number {
  if (values.length < 2) return floor;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.max(Math.sqrt(variance), floor);
}

function clamp(value: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, value));
}

/** Groups the stream into complete UTC days (the stream is UTC-stamped). */
export function dailyStats(samples: WearableSample[], now: number = Date.now()): DayStats[] {
  const todayKey = new Date(now).toISOString().slice(0, 10);
  const byDay = new Map<string, WearableSample[]>();
  for (const sample of samples) {
    const day = sample.timestamp.slice(0, 10);
    if (day >= todayKey) continue; // today is partial
    const bucket = byDay.get(day) ?? [];
    bucket.push(sample);
    byDay.set(day, bucket);
  }

  return [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([, list]) => list.length >= 20)
    .map(([day, list]) => {
      const asleep = list.filter((s) => s.sleepStage !== "awake");
      const basis = asleep.length > 0 ? asleep : list;
      return {
        day,
        restingHr: mean(basis.map((s) => s.heartRateBpm)),
        hrv: mean(basis.map((s) => s.hrvMs)),
        sleep: asleep.length,
        steps: list.reduce((sum, s) => sum + s.steps, 0),
      };
    });
}

interface Baseline {
  restingHr: { m: number; s: number };
  hrv: { m: number; s: number };
  sleep: { m: number; s: number };
  steps: { m: number; s: number };
}

function baselineOf(days: DayStats[]): Baseline {
  const stat = (pick: (d: DayStats) => number, floor: number) => ({
    m: mean(days.map(pick)),
    s: sd(days.map(pick), floor),
  });
  return {
    restingHr: stat((d) => d.restingHr, MIN_SD.restingHr),
    hrv: stat((d) => d.hrv, MIN_SD.hrv),
    sleep: stat((d) => d.sleep, MIN_SD.sleep),
    steps: stat((d) => d.steps, MIN_SD.steps),
  };
}

function zScores(day: Pick<DayStats, "restingHr" | "hrv" | "sleep" | "steps">, base: Baseline) {
  // Positive = worse for the heart.
  return {
    restingHr: clamp((day.restingHr - base.restingHr.m) / base.restingHr.s, -3, 4),
    hrv: clamp((base.hrv.m - day.hrv) / base.hrv.s, -3, 4),
    sleep: clamp((base.sleep.m - day.sleep) / base.sleep.s, -3, 4),
    steps: clamp((base.steps.m - day.steps) / base.steps.s, -3, 4),
  };
}

function strainIndex(z: ReturnType<typeof zScores>): number {
  const raw =
    WEIGHTS.restingHr * z.restingHr +
    WEIGHTS.hrv * z.hrv +
    WEIGHTS.sleep * z.sleep +
    WEIGHTS.steps * z.steps;
  return Math.round(100 / (1 + Math.exp(-1.4 * (raw - 1))));
}

function levelOf(index: number): EarlyWarning["level"] {
  if (index >= URGENT_LINE) return "urgent";
  if (index >= 55) return "warning";
  if (index >= 35) return "watch";
  return "stable";
}

/** Least-squares line through (x = 0..n-1, y). */
function linearFit(y: number[]): { slope: number; intercept: number; residualSd: number } {
  const n = y.length;
  if (n < 2) return { slope: 0, intercept: y[0] ?? 0, residualSd: 5 };
  const xm = (n - 1) / 2;
  const ym = mean(y);
  let num = 0;
  let den = 0;
  y.forEach((v, i) => {
    num += (i - xm) * (v - ym);
    den += (i - xm) ** 2;
  });
  const slope = den === 0 ? 0 : num / den;
  const intercept = ym - slope * xm;
  const resid = y.map((v, i) => v - (intercept + slope * i));
  const residualSd = Math.sqrt(resid.reduce((a, r) => a + r * r, 0) / Math.max(1, n - 2));
  return { slope, intercept, residualSd: Math.max(residualSd, 4) };
}

const WEEKDAY = new Intl.DateTimeFormat("en-IN", { weekday: "short", timeZone: "UTC" });

export function computeEarlyWarning(
  samples: WearableSample[],
  now: number = Date.now(),
): EarlyWarning {
  const days = dailyStats(samples, now);

  if (days.length < RECENT_DAYS + 3) {
    return {
      level: "stable",
      index: 0,
      leadTimeHours: null,
      headline: "Learning this person's baseline — at least five full days of wearable data are needed.",
      signals: [],
      history: [],
      forecast: [],
      baselineDays: Math.max(0, days.length - RECENT_DAYS),
    };
  }

  const baselineDays = days.slice(0, days.length - RECENT_DAYS);
  const recentDays = days.slice(days.length - RECENT_DAYS);
  const base = baselineOf(baselineDays);

  const recent = {
    restingHr: mean(recentDays.map((d) => d.restingHr)),
    hrv: mean(recentDays.map((d) => d.hrv)),
    sleep: mean(recentDays.map((d) => d.sleep)),
    steps: mean(recentDays.map((d) => d.steps)),
  };
  const z = zScores(recent, base);
  const index = strainIndex(z);

  const signal = (
    metric: EarlyWarningSignal["metric"],
    label: string,
    unit: string,
    current: number,
    baselineValue: number,
    zWorse: number,
    decimals = 0,
  ): EarlyWarningSignal => ({
    metric,
    label,
    unit,
    current: Number(current.toFixed(decimals)),
    baseline: Number(baselineValue.toFixed(decimals)),
    zScore: Number(zWorse.toFixed(1)),
    direction: zWorse >= 1.2 ? "worse" : zWorse <= -1.2 ? "better" : "stable",
  });

  const signals: EarlyWarningSignal[] = [
    signal("restingHr", "Nocturnal heart rate", "bpm", recent.restingHr, base.restingHr.m, z.restingHr),
    signal("hrv", "Heart-rate variability", "ms", recent.hrv, base.hrv.m, z.hrv),
    signal("sleep", "Sleep duration", "h", recent.sleep, base.sleep.m, z.sleep, 1),
    signal("steps", "Daily steps", "steps", recent.steps, base.steps.m, z.steps),
  ];

  // Per-day index series (for the chart and the trend fit).
  const history = days.map((d) => ({
    day: d.day,
    index: strainIndex(zScores(d, base)),
  }));

  const trendWindow = history.slice(-4).map((h) => h.index);
  const fit = linearFit(trendWindow);
  const damp = 0.6; // trends rarely continue linearly; be conservative
  const forecast: ForecastPoint[] = [1, 2, 3].map((step) => {
    const projected = clamp(
      index + fit.slope * damp * step,
      0,
      100,
    );
    const spread = fit.residualSd * (0.6 + 0.35 * step);
    const target = new Date(now + step * 86_400_000);
    return {
      label: step === 1 ? "Tomorrow" : WEEKDAY.format(target),
      hoursAhead: step * 24,
      index: Math.round(projected),
      low: Math.round(clamp(projected - spread, 0, 100)),
      high: Math.round(clamp(projected + spread, 0, 100)),
    };
  });

  let leadTimeHours: number | null = null;
  const slopePerDay = fit.slope * damp;
  if (index < URGENT_LINE && slopePerDay > 1) {
    leadTimeHours = Math.round(((URGENT_LINE - index) / slopePerDay) * 24);
    if (leadTimeHours > 96) leadTimeHours = null;
  }

  const level = levelOf(index);
  const worst = [...signals].sort((a, b) => b.zScore - a.zScore)[0];

  let headline: string;
  if (level === "stable") {
    headline = "Physiology is within this person's normal range. No early-warning signal.";
  } else {
    const drivers = signals
      .filter((s) => s.direction === "worse")
      .map((s) => s.label.toLowerCase());
    const driverText =
      drivers.length > 0
        ? drivers.join(", ")
        : `${worst.label.toLowerCase()} (${worst.zScore >= 0 ? "+" : ""}${worst.zScore} SD)`;
    headline =
      leadTimeHours !== null
        ? `Strain is rising (${driverText}). At this pace it crosses the urgent line in about ${leadTimeHours} h.`
        : level === "urgent"
          ? `Strong departure from personal baseline: ${driverText}.`
          : `Departure from personal baseline: ${driverText}.`;
  }

  return {
    level,
    index,
    leadTimeHours,
    headline,
    signals,
    history,
    forecast,
    baselineDays: baselineDays.length,
  };
}
