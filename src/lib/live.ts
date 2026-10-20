/**
 * Live wearable tick. Pure and deterministic per 5-second bucket so the demo
 * "stream" is reproducible, continuous across requests, and needs no state.
 * SIMULATED data: it follows the persona's resting HR and today's circadian
 * rhythm, and drifts with the persona's deterioration setting.
 */
import { getPersona } from "./cohort";

export interface LiveTick {
  t: string;
  heartRateBpm: number;
  hrvMs: number;
  spO2: number;
  stepsPerMin: number;
  simulated: true;
}

function hash01(n: number): number {
  const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export function liveTick(personaId: string, nowMs: number = Date.now()): LiveTick {
  const persona = getPersona(personaId);
  const bucket = Math.floor(nowMs / 5000);
  const seed = bucket + persona.seed % 9973;
  const hourIst = (new Date(nowMs).getUTCHours() + 5.5 + new Date(nowMs).getUTCMinutes() / 60) % 24;
  const asleep = hourIst >= 23 || hourIst < 6;
  const resting = persona.stream.restingHr ?? 72;
  const drift = persona.stream.deterioration ? persona.stream.deterioration.hrDelta * 0.8 : 0;

  const activeBoost = asleep ? -8 : 6 + 10 * Math.max(0, Math.sin(((hourIst - 6) / 16) * Math.PI));
  const walking = !asleep && hash01(seed * 0.37) > 0.72;
  const hr = resting + drift + activeBoost + (walking ? 14 : 0) + (hash01(seed) - 0.5) * 6;
  const hrvBase = (asleep ? 58 : 38) * (persona.stream.deterioration?.hrvFactor ?? 1);
  return {
    t: new Date(bucket * 5000).toISOString(),
    heartRateBpm: Math.round(hr),
    hrvMs: Math.round(hrvBase + (hash01(seed + 1) - 0.5) * 8),
    spO2: Math.round((96.6 + hash01(seed + 2) * 2.2) * 10) / 10,
    stepsPerMin: walking ? Math.round(85 + hash01(seed + 3) * 30) : 0,
    simulated: true,
  };
}
