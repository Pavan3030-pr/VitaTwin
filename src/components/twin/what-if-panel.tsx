"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, RotateCcw } from "lucide-react";
import { runScenario } from "@/lib/scenario-actions";
import {
  SCENARIO_LIMITS,
  type ScenarioInput,
  type ScenarioResult,
  type ScenarioScore,
} from "@/types/scenario";

interface WhatIfPanelProps {
  /** Today's twin values: the slider starting point and the "reset" target. */
  baseline: ScenarioInput;
  /** Server-rendered result for the baseline so first paint is never empty. */
  initial: ScenarioResult;
}

const PRESETS: { id: string; label: string; apply: (base: ScenarioInput) => ScenarioInput }[] = [
  { id: "today", label: "Today", apply: (base) => base },
  { id: "glucose", label: "Glucose under control", apply: (base) => ({ ...base, hba1c: Math.min(base.hba1c, 6.9) }) },
  { id: "lipids", label: "LDL on target", apply: (base) => ({ ...base, ldl: Math.min(base.ldl, 100) }) },
  { id: "smoke", label: "Quit smoking", apply: (base) => ({ ...base, smoker: false }) },
  { id: "night", label: "A rough week of sleep", apply: (base) => ({ ...base, sleepHours: 4.5, restingHr: 92 }) },
];

const SLIDERS: {
  key: "hba1c" | "ldl" | "bmi" | "sleepHours" | "restingHr";
  label: string;
  unit: string;
  format: (value: number) => string;
}[] = [
  { key: "hba1c", label: "HbA1c", unit: "%", format: (v) => v.toFixed(1) },
  { key: "ldl", label: "LDL cholesterol", unit: "mg/dL", format: (v) => String(Math.round(v)) },
  { key: "bmi", label: "BMI", unit: "kg/m²", format: (v) => v.toFixed(1) },
  { key: "sleepHours", label: "Sleep per night", unit: "h", format: (v) => v.toFixed(1) },
  { key: "restingHr", label: "Resting heart rate", unit: "bpm", format: (v) => String(Math.round(v)) },
];

const FILL: Record<ScenarioScore["category"], string> = {
  low: "bg-success",
  moderate: "bg-warning",
  high: "bg-danger",
  critical: "bg-danger",
};

function DeltaChip({ delta }: { delta: number }) {
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-bg-subtle px-2 py-0.5 text-xs font-semibold text-text-secondary">
        <ArrowRight className="h-3 w-3" aria-hidden="true" />
        No change
      </span>
    );
  }
  const better = delta < 0;
  const Icon = better ? ArrowDownRight : ArrowUpRight;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        better ? "bg-success-soft text-success-ink" : "bg-danger-soft text-danger-ink"
      }`}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {better ? "Down" : "Up"} {Math.abs(delta)} pts
    </span>
  );
}

function ScoreRow({ score, name }: { score: ScenarioScore; name: string }) {
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-sm font-semibold text-text-primary">{name}</p>
        <p className="num text-sm text-text-secondary">
          <span>{score.baseline}</span>
          <ArrowRight className="mx-1 inline h-3 w-3 align-[-1px]" aria-hidden="true" />
          <span className="font-display text-lg font-semibold text-text-primary">
            {score.projected}
          </span>
        </p>
      </div>
      <div
        className="relative mt-2 h-2 overflow-hidden rounded-full bg-bg-subtle"
        role="img"
        aria-label={`${name}: ${score.baseline} today, ${score.projected} projected out of 100`}
      >
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${FILL[score.category]}`}
          style={{ width: `${Math.max(3, score.projected)}%` }}
        />
        <span
          className="absolute top-0 h-full w-0.5 bg-text-primary/70"
          style={{ left: `${Math.min(99, score.baseline)}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1.5 flex flex-wrap items-center justify-between gap-2">
        <DeltaChip delta={score.delta} />
        <p className="text-xs text-text-muted">
          {score.drivers.length > 0
            ? `Drivers: ${score.drivers.join(", ")}`
            : "No elevated drivers"}
        </p>
      </div>
    </li>
  );
}

const DISPLAY_NAME: Record<ScenarioScore["type"], string> = {
  "cvd-10yr": "Cardiovascular (10-year)",
  "diabetes-progression": "Diabetes progression",
  "acute-stress": "Acute cardiac stress",
};

export function WhatIfPanel({ baseline, initial }: WhatIfPanelProps) {
  const [scenario, setScenario] = useState<ScenarioInput>(baseline);
  const [result, setResult] = useState<ScenarioResult>(initial);
  const [failed, setFailed] = useState(false);
  const [pending, startTransition] = useTransition();
  const requestId = useRef(0);
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const id = ++requestId.current;
    const timer = setTimeout(() => {
      startTransition(async () => {
        try {
          const next = await runScenario(scenario);
          if (id !== requestId.current) return;
          if (next) {
            setResult(next);
            setFailed(false);
          } else {
            setFailed(true);
          }
        } catch {
          if (id === requestId.current) setFailed(true);
        }
      });
    }, 140);
    return () => clearTimeout(timer);
  }, [scenario]);

  const isBaseline = JSON.stringify(scenario) === JSON.stringify(baseline);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:gap-8">
      <div>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Scenario presets">
          {PRESETS.filter(
            // Hide presets that would change nothing for this patient (e.g. "Quit smoking" for a non-smoker).
            (preset) => preset.id === "today" || JSON.stringify(preset.apply(baseline)) !== JSON.stringify(baseline),
          ).map((preset) => {
            const active = JSON.stringify(preset.apply(baseline)) === JSON.stringify(scenario);
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={active}
                onClick={() => setScenario(preset.apply(baseline))}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? "border-primary-strong bg-primary-strong text-white"
                    : "border-border-strong bg-bg-card text-text-secondary hover:border-primary-strong hover:text-primary-strong"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 space-y-4">
          {SLIDERS.map(({ key, label, unit, format }) => {
            const limits = SCENARIO_LIMITS[key];
            const value = scenario[key];
            const changed = value !== baseline[key];
            const id = `whatif-${key}`;
            return (
              <div key={key}>
                <div className="flex items-baseline justify-between gap-3">
                  <label htmlFor={id} className="text-sm font-medium text-text-primary">
                    {label}
                  </label>
                  <span className="num text-sm text-text-secondary">
                    <span className={changed ? "font-semibold text-primary-strong" : ""}>
                      {format(value)}
                    </span>{" "}
                    {unit}
                    {changed && (
                      <span className="ml-1.5 text-xs text-text-muted">
                        (today {format(baseline[key])})
                      </span>
                    )}
                  </span>
                </div>
                <input
                  id={id}
                  type="range"
                  min={limits.min}
                  max={limits.max}
                  step={limits.step}
                  value={value}
                  aria-valuetext={`${format(value)} ${unit}`}
                  onChange={(event) =>
                    setScenario((prev) => ({ ...prev, [key]: Number(event.target.value) }))
                  }
                  className="mt-1.5 h-2 w-full cursor-pointer accent-primary-strong"
                />
              </div>
            );
          })}

          <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-bg-subtle px-3 py-2.5">
            <span className="text-sm font-medium text-text-primary">Smokes today</span>
            <input
              type="checkbox"
              checked={scenario.smoker}
              onChange={(event) =>
                setScenario((prev) => ({ ...prev, smoker: event.target.checked }))
              }
              className="h-5 w-5 rounded border-border-strong text-primary-strong focus:ring-primary-strong/40"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => setScenario(baseline)}
          disabled={isBaseline}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-primary-strong disabled:cursor-not-allowed disabled:opacity-40"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          Reset to today
        </button>
      </div>

      <div className="rounded-xl bg-bg-wash/70 p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-lg font-semibold leading-snug text-text-primary" aria-live="polite">
            {result.headline}
          </p>
          <span
            className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${
              pending ? "animate-pulse bg-primary" : "bg-transparent"
            }`}
            aria-hidden="true"
          />
        </div>
        <p className="mt-1 text-xs text-text-muted">
          Tick marks show today. Bars show the projection from the same explainable models.
        </p>

        {failed ? (
          <p role="alert" className="mt-4 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-ink">
            The projection could not be refreshed. Your session may have expired — reload the page.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-border/70" aria-busy={pending}>
            {result.scores.map((score) => (
              <ScoreRow key={score.type} score={score} name={DISPLAY_NAME[score.type]} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
