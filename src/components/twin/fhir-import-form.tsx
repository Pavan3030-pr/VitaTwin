"use client";

import { useActionState } from "react";
import { analyzeFhir, type FhirActionState } from "@/lib/fhir-actions";
import { Card } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { RiskRing } from "@/components/twin/risk-ring";

const INITIAL: FhirActionState = { result: null, error: null };

export function FhirImportForm() {
  const [state, action, pending] = useActionState(analyzeFhir, INITIAL);
  const result = state.result;

  return (
    <div className="space-y-5">
      <Card>
        <form action={action} className="space-y-3">
          <label htmlFor="bundle" className="text-sm font-semibold text-text-primary">
            Paste a FHIR R4 Bundle (JSON)
          </label>
          <textarea
            id="bundle"
            name="bundle"
            rows={7}
            spellCheck={false}
            placeholder='{"resourceType":"Bundle","entry":[…]}'
            className="w-full rounded-lg border border-border-strong bg-bg-card p-3 font-mono text-xs"
          />
          <div className="flex flex-wrap items-center gap-3">
            <input type="file" name="file" accept=".json,application/json,application/fhir+json" className="text-xs" aria-label="Or upload a JSON file" />
            <button
              type="submit"
              disabled={pending}
              className="rounded-full bg-primary-strong px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {pending ? "Building twin…" : "Build twin from bundle"}
            </button>
            <a href="/api/fhir/sample" className="text-sm font-medium text-primary-strong hover:underline">
              Open the sample bundle
            </a>
          </div>
          <p className="text-xs text-text-muted">
            Processed in memory and discarded. Nothing is stored or logged. Use synthetic or consented, de-identified data only.
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
          <h2 className="font-display text-xl font-semibold text-text-primary">
            Twin for {result.patientLabel}
            {result.city ? <span className="text-text-muted"> · {result.city}</span> : null}
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {result.risks.map((r) => (
              <Card key={r.type} className="space-y-2">
                <RiskRing value={r.value} category={r.category} size={80} unit={r.type === "cvd-10yr" ? "% / 10 yr" : "of 100"} />
                <p className="text-sm font-semibold text-text-primary">{r.label}</p>
                <RiskBadge category={r.category} />
                <ul className="space-y-1 text-xs text-text-secondary">
                  {r.factors.slice(0, 3).map((f) => (<li key={f.factor}>• {f.factor}</li>))}
                </ul>
              </Card>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Card>
              <p className="text-sm font-semibold text-text-primary">Read from the bundle</p>
              <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                {result.found.map((f) => (<li key={f.label}>{f.label}: <span className="num font-semibold text-text-primary">{f.value}</span></li>))}
              </ul>
            </Card>
            <Card>
              <p className="text-sm font-semibold text-text-primary">Not in the bundle (assumed)</p>
              <ul className="mt-2 space-y-1 text-xs text-text-secondary">
                {result.assumed.map((a) => (<li key={a}>• {a}</li>))}
              </ul>
              {result.warnings.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-warning-ink">
                  {result.warnings.map((w) => (<li key={w}>⚠ {w}</li>))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
