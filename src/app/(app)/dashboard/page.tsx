import Link from "next/link";
import {
  Activity,
  ArrowRight,
  Brain,
  Clock,
  Droplets,
  HeartPulse,
  Moon,
  ShieldAlert,
} from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/card";
import { RiskBadge, SeverityBadge } from "@/components/ui/risk-badge";
import { generateDemoBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { twin, patient, vitals } = generateDemoBundle();
  const byType = (type: string) => twin.riskScores.find((score) => score.type === type);
  const cardiac = byType("cvd-10yr");
  const metabolic = byType("diabetes-progression");
  const acute = byType("acute-stress");
  const primaryAlert = [...twin.alerts].sort((a, b) => {
    const weight = { critical: 4, high: 3, moderate: 2, low: 1 } as Record<string, number>;
    return (weight[b.severity] ?? 0) - (weight[a.severity] ?? 0);
  })[0];

  const metrics = [
    { label: "Resting heart rate", value: `${vitals.heartRateBpm}`, unit: "bpm", icon: HeartPulse },
    { label: "Sleep last night", value: `${vitals.sleepHours}`, unit: "h", icon: Moon },
    { label: "HRV", value: `${vitals.hrvMs}`, unit: "ms", icon: Activity },
    { label: "Blood oxygen", value: `${vitals.spO2}`, unit: "%", icon: Droplets },
  ];

  return (
    <div className="space-y-7">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-bg-card shadow-sm">
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary-soft via-transparent to-accent-soft opacity-70"
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
              </span>
              Twin live
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
              {patient.demographics.firstName} {patient.demographics.lastName}
            </h1>

            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-text-secondary">
              <span>
                {patient.age} yrs · {patient.demographics.gender} ·{" "}
                {patient.demographics.location}
              </span>
              <span className="inline-flex items-center gap-1 text-text-muted">
                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                Updated {formatTime(twin.updatedAt)}
              </span>
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
              {[
                `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg`,
                `BMI ${patient.bmI}`,
                `HbA1c ${patient.recentLabs.find((l) => l.name === "HbA1c")?.value ?? "—"}%`,
                `${vitals.stepsToday.toLocaleString()} steps`,
              ].map((chip) => (
                <span
                  key={chip}
                  className="rounded-md border border-border bg-bg-card px-2.5 py-1 text-text-secondary"
                >
                  {chip}
                </span>
              ))}
            </div>
          </div>

          {primaryAlert && (
            <div className="w-full max-w-sm rounded-xl border border-danger/20 bg-danger-soft/60 p-4">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="mt-0.5 h-4.5 w-4.5 shrink-0 text-danger" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    {primaryAlert.title}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                    {primaryAlert.readable}
                  </p>
                  <Link
                    href="/insights"
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-danger hover:underline"
                  >
                    Review the explanation
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Metrics */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map(({ label, value, unit, icon: Icon }) => (
          <Card key={label} className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs text-text-secondary">{label}</p>
              <p className="text-xl font-semibold tabular-nums text-text-primary">
                {value}
                <span className="ml-1 text-xs font-normal text-text-muted">{unit}</span>
              </p>
            </div>
          </Card>
        ))}
      </section>

      {/* Risks */}
      <section>
        <SectionTitle hint="Every score lists its drivers">Explainable risk</SectionTitle>
        <div className="grid gap-3 lg:grid-cols-3">
          {[cardiac, metabolic, acute].filter(Boolean).map((score) => (
            <Card key={score!.type}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-text-secondary">{score!.label}</p>
                  <p className="mt-1 text-3xl font-semibold tabular-nums text-text-primary">
                    {score!.value}
                    <span className="ml-1 text-sm font-normal text-text-muted">/100</span>
                  </p>
                </div>
                <RiskBadge category={score!.category} />
              </div>

              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-subtle">
                <div
                  className={`h-full rounded-full ${
                    score!.category === "low"
                      ? "bg-success"
                      : score!.category === "moderate"
                        ? "bg-warning"
                        : "bg-danger"
                  }`}
                  style={{ width: `${Math.max(4, score!.value)}%` }}
                />
              </div>

              <p className="mt-3 text-xs font-medium text-text-primary">Top drivers</p>
              <ul className="mt-1 space-y-1 text-xs text-text-secondary">
                {score!.factors.slice(0, 3).map((factor) => (
                  <li key={factor.factor} className="flex gap-1.5">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-muted" />
                    {factor.factor}
                  </li>
                ))}
                {score!.factors.length === 0 && (
                  <li className="text-text-muted">No elevated drivers detected.</li>
                )}
              </ul>
            </Card>
          ))}
        </div>
      </section>

      {/* Alerts + recommendations */}
      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <SectionTitle hint={`${twin.alerts.length} open`}>Alerts</SectionTitle>
          <div className="space-y-3">
            {twin.alerts.length === 0 && (
              <Card>
                <p className="text-sm text-text-secondary">
                  No alerts right now. The twin is stable.
                </p>
              </Card>
            )}
            {twin.alerts.map((alert) => (
              <Card key={alert.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-text-primary">{alert.title}</p>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                  {alert.body}
                </p>
                <p className="mt-2 rounded-md bg-bg-subtle px-2.5 py-1.5 text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">Next step: </span>
                  {alert.recommendedAction}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle hint="Personalised">Recommendations</SectionTitle>
          <div className="space-y-3">
            {twin.recommendations.map((rec) => (
              <Card key={rec.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-text-primary">{rec.title}</p>
                  <span className="rounded-full border border-border bg-bg-subtle px-2 py-0.5 text-[11px] font-medium capitalize text-text-secondary">
                    {rec.priority}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-text-secondary">{rec.body}</p>
                <p className="mt-2 text-[11px] uppercase tracking-wide text-text-muted">
                  Seek care: {rec.whenToSeekCare}
                </p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      {/* Provenance */}
      <Card className="flex flex-wrap items-center gap-x-4 gap-y-2 border-dashed">
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-primary">
          <Brain className="h-4 w-4" aria-hidden="true" />
          Twin engine v1
        </span>
        <span className="text-xs text-text-secondary">
          {twin.riskScores.length} explainable models · {twin.vitals.lastUpdated.slice(0, 10)} window
        </span>
        <span className="text-xs text-text-muted">
          Synthetic dataset · not a clinical tool
        </span>
      </Card>
    </div>
  );
}
