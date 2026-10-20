"use client";

import { useEffect, useState } from "react";
import { Activity, HeartPulse } from "lucide-react";

interface Tick {
  t: string;
  heartRateBpm: number;
  hrvMs: number;
  spO2: number;
  stepsPerMin: number;
}

function Spark({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const pts = values
    .map((v, i) => `${(i / (values.length - 1)) * 100},${30 - ((v - min) / (max - min)) * 28}`)
    .join(" ");
  return (
    <svg viewBox="0 0 100 32" className="h-10 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#0D9488" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Polls the simulated wearable stream every 5 s. */
export function LiveVitals() {
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const res = await fetch("/api/twin/live", { cache: "no-store" });
        if (!res.ok) throw new Error(String(res.status));
        const json = (await res.json()) as { ticks: Tick[] };
        if (alive) {
          setTicks(json.ticks);
          setOffline(false);
        }
      } catch {
        if (alive) setOffline(true);
      }
    };
    void load();
    const id = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  const last = ticks[ticks.length - 1];
  return (
    <section aria-label="Live wearable stream" className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-2 text-sm font-semibold text-text-primary">
          <HeartPulse className="h-4 w-4 text-primary-strong" aria-hidden="true" />
          Live wearable stream
        </p>
        <span className="rounded-full bg-bg-wash px-2.5 py-0.5 text-[11px] font-semibold text-primary-deep">
          {offline ? "Reconnecting…" : "● LIVE · simulated · 5 s"}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Heart rate", value: last?.heartRateBpm, unit: "bpm", series: ticks.map((t) => t.heartRateBpm) },
          { label: "HRV", value: last?.hrvMs, unit: "ms", series: ticks.map((t) => t.hrvMs) },
          { label: "SpO₂", value: last?.spO2, unit: "%", series: ticks.map((t) => t.spO2) },
          { label: "Cadence", value: last?.stepsPerMin, unit: "steps/min", series: ticks.map((t) => t.stepsPerMin) },
        ].map((m) => (
          <div key={m.label}>
            <p className="text-xs text-text-muted">{m.label}</p>
            <p className="num font-display text-2xl font-semibold text-text-primary">
              {m.value ?? "—"}
              <span className="ml-1 text-xs font-normal text-text-muted">{m.unit}</span>
            </p>
            <Spark values={m.series} />
          </div>
        ))}
      </div>
      <p className="mt-2 inline-flex items-center gap-1 text-xs text-text-muted">
        <Activity className="h-3 w-3" aria-hidden="true" /> Simulated device feed; swap in Apple Health / Google Fit via the provider interface.
      </p>
    </section>
  );
}
