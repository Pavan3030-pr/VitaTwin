/**
 * Early-warning detector backtest — controlled physiological series.
 * Run: npm run backtest-ew
 */
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { computeEarlyWarning } from "../src/services/early-warning";
import type { WearableSample } from "../src/types/twin";

const here = dirname(fileURLToPath(import.meta.url));
const outPath = resolve(here, "../src/data/early-warning-backtest.json");

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface PersonaPhys {
  restingHr: number; hrv: number; sleepH: number; steps: number; spo2: number;
}
const PERSONAS: PersonaPhys[] = [
  { restingHr: 58, hrv: 52, sleepH: 7.2, steps: 8500, spo2: 97.5 },
  { restingHr: 64, hrv: 44, sleepH: 6.8, steps: 6200, spo2: 97.0 },
  { restingHr: 70, hrv: 38, sleepH: 6.5, steps: 5100, spo2: 96.5 },
  { restingHr: 62, hrv: 48, sleepH: 7.0, steps: 7400, spo2: 97.2 },
  { restingHr: 75, hrv: 32, sleepH: 6.0, steps: 4200, spo2: 96.0 },
];
type EventKind = "none" | "hr_rise" | "hrv_drop" | "sleep_loss" | "multi";

function buildStream(phys: PersonaPhys, totalDays: number, kind: EventKind, onsetDay: number, rampDays: number, seed: number): WearableSample[] {
  const rnd = lcg(seed);
  const samples: WearableSample[] = [];
  const start = Date.UTC(2026, 8, 1, 0, 0, 0);
  for (let d = 0; d < totalDays; d += 1) {
    let hrShift = 0, hrvShift = 0, sleepShift = 0, stepsShift = 0;
    if (kind !== "none" && d >= onsetDay) {
      const t = Math.min(1, (d - onsetDay + 1) / rampDays);
      if (kind === "hr_rise" || kind === "multi") hrShift = 10 * t + 4 * t * t;
      if (kind === "hrv_drop" || kind === "multi") hrvShift = -(14 * t);
      if (kind === "sleep_loss" || kind === "multi") sleepShift = -(2.0 * t);
      if (kind === "multi") stepsShift = -(2200 * t);
    }
    const dayHr = phys.restingHr + hrShift + (rnd() - 0.5) * 2.5;
    const dayHrv = phys.hrv + hrvShift + (rnd() - 0.5) * 4;
    const daySleep = Math.max(3.2, phys.sleepH + sleepShift + (rnd() - 0.5) * 0.35);
    const daySteps = Math.max(600, phys.steps + stepsShift + (rnd() - 0.5) * 800);
    const nightHours = [0, 1, 2, 3, 4, 5, 23];
    for (let h = 0; h < 24; h += 1) {
      const ts = new Date(start + (d * 24 + h) * 3_600_000).toISOString();
      const night = nightHours.includes(h);
      const hr = night ? dayHr + (rnd() - 0.5) * 3 : dayHr + 14 + (rnd() - 0.5) * 8;
      const hrv = night ? dayHrv + 3 + (rnd() - 0.5) * 4 : dayHrv - 5 + (rnd() - 0.5) * 5;
      let sleepStage: WearableSample["sleepStage"] = "awake";
      if (night) {
        const idx = nightHours.indexOf(h);
        if (idx < Math.round(daySleep)) sleepStage = idx === 1 || idx === 2 ? "deep" : idx === 3 ? "rem" : "light";
      }
      const hourSteps = night ? Math.round(15 + rnd() * 20) : Math.round(daySteps / 16 + (rnd() - 0.5) * 40);
      samples.push({
        timestamp: ts,
        heartRateBpm: Math.round(Math.min(140, Math.max(40, hr))),
        hrvMs: Math.round(Math.min(120, Math.max(10, hrv))),
        steps: Math.max(0, hourSteps),
        sleepStage,
        spO2: Math.round(phys.spo2 + (rnd() - 0.5) * 0.6),
        activity: night ? "sedentary" : hourSteps > 400 ? "moderate" : "light",
        stressIndex: night ? 18 : 30 + Math.round(rnd() * 10),
      });
    }
  }
  return samples;
}

function main() {
  const trials: { kind: EventKind; level: string; leadTimeHours: number | null }[] = [];
  let seed = 20261020;
  const totalDays = 14;
  for (let p = 0; p < PERSONAS.length; p += 1) {
    for (let r = 0; r < 8; r += 1) {
      seed += 17;
      const samples = buildStream(PERSONAS[p], totalDays, "none", 99, 1, seed);
      const now = Date.UTC(2026, 8, 1) + totalDays * 86_400_000;
      const ew = computeEarlyWarning(samples, now);
      trials.push({ kind: "none", level: ew.level, leadTimeHours: ew.leadTimeHours });
    }
  }
  const kinds: EventKind[] = ["hr_rise", "hrv_drop", "sleep_loss", "multi"];
  for (const kind of kinds) {
    for (let p = 0; p < PERSONAS.length; p += 1) {
      for (let r = 0; r < 6; r += 1) {
        seed += 31;
        const onsetDay = 8 + (r % 3);
        const samples = buildStream(PERSONAS[p], totalDays, kind, onsetDay, 3, seed);
        const now = Date.UTC(2026, 8, 1) + totalDays * 86_400_000;
        const ew = computeEarlyWarning(samples, now);
        trials.push({ kind, level: ew.level, leadTimeHours: ew.leadTimeHours });
      }
    }
  }
  const stable = trials.filter((t) => t.kind === "none");
  const events = trials.filter((t) => t.kind !== "none");
  const fpr = stable.filter((t) => t.level === "warning" || t.level === "urgent").length / stable.length;
  const watchStable = stable.filter((t) => t.level === "watch").length / stable.length;
  const detAny = events.filter((t) => ["watch", "warning", "urgent"].includes(t.level)).length / events.length;
  const detStrong = events.filter((t) => t.level === "warning" || t.level === "urgent").length / events.length;
  const withLead = events.filter((t) => t.leadTimeHours != null && t.leadTimeHours > 0);
  const meanLead = withLead.length ? withLead.reduce((a, t) => a + (t.leadTimeHours as number), 0) / withLead.length : null;
  const byKind: Record<string, { n: number; detected: number; strong: number }> = {};
  for (const t of events) {
    const b = byKind[t.kind] ?? { n: 0, detected: 0, strong: 0 };
    b.n += 1;
    if (["watch", "warning", "urgent"].includes(t.level)) b.detected += 1;
    if (t.level === "warning" || t.level === "urgent") b.strong += 1;
    byKind[t.kind] = b;
  }
  const report = {
    generatedAt: "2026-10-20",
    method: {
      description:
        "Controlled physiological series from published resting-HR / HRV / sleep distributions with injected deterioration. Detector = production early-warning (v2.1 weights).",
      totalDays: 14,
      personas: PERSONAS.length,
      stableTrials: stable.length,
      eventTrials: events.length,
      eventKinds: kinds,
      weights: { restingHr: 0.32, hrv: 0.3, sleep: 0.28, steps: 0.1 },
      references: [
        "Cooney MT et al. Eur J Prev Cardiol 2010.",
        "Fang SC et al. JACC 2020.",
        "Cappuccio FP et al. Eur Heart J 2011.",
      ],
    },
    results: {
      falsePositiveRate: Number(fpr.toFixed(3)),
      falsePositiveRatePct: Number((fpr * 100).toFixed(1)),
      watchRateOnStablePct: Number((watchStable * 100).toFixed(1)),
      detectionRateAny: Number(detAny.toFixed(3)),
      detectionRateAnyPct: Number((detAny * 100).toFixed(1)),
      detectionRateWarningOrUrgent: Number(detStrong.toFixed(3)),
      detectionRateWarningOrUrgentPct: Number((detStrong * 100).toFixed(1)),
      meanLeadTimeHoursWhenProjected: meanLead != null ? Number(meanLead.toFixed(1)) : null,
      trialsWithLeadTime: withLead.length,
      byKind: Object.fromEntries(
        Object.entries(byKind).map(([k, v]) => [
          k,
          { n: v.n, detectionPct: Number(((v.detected / v.n) * 100).toFixed(1)), warningOrUrgentPct: Number(((v.strong / v.n) * 100).toFixed(1)) },
        ]),
      ),
    },
    limitations: [
      "Streams are synthetic, grounded in published vital distributions — not labelled real outcomes.",
      "Weights tuned on these controlled series; not prospectively validated in clinic.",
      "No open-licence South-Asian wearable outcome cohort was available for this PoC.",
    ],
  };
  writeFileSync(outPath, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report.results, null, 2));
}
main();
