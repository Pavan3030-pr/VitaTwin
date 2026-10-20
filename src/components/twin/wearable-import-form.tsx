"use client";

import { useActionState } from "react";
import { analyzeWearable, type WearableActionState } from "@/lib/wearable-actions";
import { Card } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { RiskRing } from "@/components/twin/risk-ring";

const INITIAL: WearableActionState = { result: null, error: null };

const LEVEL_STYLE: Record<string, string> = {
  stable: "bg-success-soft text-success-ink",
  watch: "bg-warning-soft text-warning-ink",
  warning: "bg-warning-soft text-warning-ink",
  urgent: "bg-danger-soft text-danger-ink",
};

export function WearableImportForm() {
  const [state, action, pending] = useActionState(analyzeWearable, INITIAL);
  const result = state.result;

  return (
    <div className="space-y-5">
      <Card>
        <form action={action} className="space-y-3">
          <label htmlFor="wearable-csv" className="text-sm font-semibold text-text-primary">
            Connect your own data — wearable CSV
          </label>
          <p className="text-xs leading-relaxed text-text-secondary">
            Upload a daily or hourly export from Apple Health, Google Fit, Garmin, Fitbit or any
            generic table with date, heart rate, HRV, steps and/or sleep hours. The twin learns
            your personal baseline and runs the same early-warning detector used on the demo cohort.
          </p>
          <input
            id="label"
            name="label"
            type="text"
            placeholder="Optional label (e.g. My watch — last 2 weeks)"
            className="w-full rounded-lg border border-border-strong bg-bg-card px-3 py-2 text-sm"
          />
          <textarea
            id="wearable-csv"
            name="csv"
            rows={5}
            spellCheck={false}
            placeholder={"date,heart_rate,hrv_ms,steps,sleep_hours,spo2\n2026-10-01,64,46,7100,7.2,97.1\n…"}
            className="w-full rounded-lg border border-border-strong bg-bg-card p-3 font-mono text-xs"
          />
          <div className="flex flex-wrap items-center gap-3">
            <input type="file" name="file" accept=".csv,text/csv,text/plain" className="text-xs" aria-label="Or upload a CSV file" />
            <button type="submit" disabled={pending} className="rounded-full bg-primary-strong px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {pending ? "Building twin…" : "Build twin from wearable"}
            </button>
            <a href="/api/wearable/sample" className="text-sm font-medium text-primary-strong hover:underline">
              Download sample CSV
            </a>
          </div>
          <p className="text-xs text-text-muted">
            Processed in memory and discarded. Nothing is stored. Prefer de-identified exports.
            Full Apple Health XML is not supported — export a CSV table instead.
          </p>
        </form>
      </Card>

      {state.error && (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft/60 p-4 text-sm text-danger-ink">
          {state.error}
        </div>
      )}

      {result?.ok && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-display text-xl font-semibold text-text-primary">
              Twin for {result.patientLabel}
              <span className="text-text-muted"> · {result.dayCount} days · {result.sampleCount} samples</span>
            </h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${LEVEL_STYLE[result.earlyWarning.level] ?? ""}`}>
              Early warning: {result.earlyWarning.level}
              {result.earlyWarning.leadTimeHours != null ? ` · ~${result.earlyWarning.leadTimeHours} h lead` : ""}
            </span>
          </div>

          <Card className="space-y-2">
            <p className="text-sm font-semibold text-text-primary">Personal-baseline early warning</p>
            <p className="text-sm text-text-secondary">{result.earlyWarning.headline}</p>
            <p className="num text-3xl font-semibold text-text-primary">
              {result.earlyWarning.index}
              <span className="ml-2 text-sm font-normal text-text-muted">strain index</span>
            </p>
            {result.earlyWarning.signals.length > 0 && (
              <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                {result.earlyWarning.signals.map((s) => (
                  <li key={s.metric} className="rounded-lg border border-border bg-bg-subtle/60 px-3 py-2 text-xs">
                    <span className="font-semibold text-text-primary">{s.label}</span>
                    <span className="text-text-muted">
                      {" "}· now {s.current}{s.unit} vs baseline {s.baseline}{s.unit} ({s.zScore >= 0 ? "+" : ""}{s.zScore} SD)
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            {result.risks.map((r) => (
              <Card key={r.type} className="space-y-2">
                <RiskRing value={r.value} category={r.category} size={80} unit={r.type === "cvd-10yr" ? "% / 10 yr" : "of 100"} />
                <p className="text-sm font-semibold text-text-primary">{r.label}</p>
                <RiskBadge category={r.category} />
                <ul className="space-y-1 text-xs text-text-secondary">
                  {r.factors.slice(0, 3).map((f) => (
                    <li key={f.factor}>• {f.factor}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <p className="text-sm font-semibold text-text-primary">Read from the file</p>
              <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                {result.found.map((f) => (
                  <li key={f.label}>{f.label}: <span className="num font-semibold text-text-primary">{f.value}</span></li>
                ))}
              </ul>
              {result.warnings.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-warning-ink">
                  {result.warnings.map((w) => (
                    <li key={w}>⚠ {w}</li>
                  ))}
                </ul>
              )}
            </Card>
            <Card>
              <p className="text-sm font-semibold text-text-primary">Not in the file (assumed)</p>
              <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                {result.assumed.map((a) => (
                  <li key={a}>• {a}</li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-text-muted">
                Format: {result.format}. Import a FHIR bundle next to refine labs and demographics.
              </p>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
