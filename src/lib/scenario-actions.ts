"use server";

import { getViewerSession } from "./auth";
import { generateDemoBundle } from "./data";
import { simulateScenario } from "@/services/scenario";
import type { ScenarioResult } from "@/types/scenario";

/**
 * Server action behind the what-if panel. Authorization is re-checked on the
 * server (SECURITY.md), the input is validated inside `simulateScenario`, and
 * the models run on the server — the browser only gets the derived numbers.
 */
export async function runScenario(raw: unknown): Promise<ScenarioResult | null> {
  const session = await getViewerSession();
  if (session.source === "none") return null;

  const { riskInput, vitals } = generateDemoBundle();
  return simulateScenario(
    {
      riskInput,
      vitals: {
        heartRateBpm: vitals.heartRateBpm,
        hrvMs: vitals.hrvMs,
        sleepHours: vitals.sleepHours,
        sleepQuality: vitals.sleepQuality,
      },
    },
    raw,
  );
}
