import Link from "next/link";
import { ArrowRight, Brain, Clock, ShieldAlert } from "lucide-react";
import { Card, SectionTitle, Well } from "@/components/ui/card";
import { RiskBadge, SeverityBadge } from "@/components/ui/risk-badge";
import { RiskRing } from "@/components/twin/risk-ring";
import { TwinFigure } from "@/components/twin/twin-figure";
import { WhatIfPanel } from "@/components/twin/what-if-panel";
import { LeversCard } from "@/components/twin/levers-card";
import { LiveVitals } from "@/components/twin/live-vitals";
import { EarlyWarningCard } from "@/components/twin/early-warning-card";
import { EnvironmentCard } from "@/components/twin/environment-card";
import { ProvenanceCard } from "@/components/twin/provenance-card";
import { PatientSwitcher } from "@/components/twin/patient-switcher";
import { getActiveBundle } from "@/lib/active";
import { baselineScenario, simulateScenario } from "@/services/scenario";
import { rankLevers } from "@/services/levers";

export const dynamic = "force-dynamic";

const SEVERITY_WEIGHT: Record<string, number> = { critical: 4, high: 3, moderate: 2, low: 1 };

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage() {
  const { twin, patient, vitals, riskInput, environment, earlyWarning, provenance, personaId } =
    await getActiveBundle();
  const byType = (type: string) => twin.riskScores.find((score) => score.type === type);
  const risks = [byType("cvd-10yr"), byType("diabetes-progression"), byType("acute-stress")].filter(
    (score): score is NonNullable<typeof score> => Boolean(score),
  );
  const primaryAlert = [...twin.alerts].sort(
    (a, b) => (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0),
  )[0];

  const hba1c = patient.recentLabs.find((lab) => lab.name === "HbA1c")?.value ?? null;

  const scenarioBaseline = {
    riskInput,
    vitals: {
      heartRateBpm: vitals.heartRateBpm,
      hrvMs: vitals.hrvMs,
      sleepHours: vitals.sleepHours,
      sleepQuality: vitals.sleepQuality,
    },
  };
  const whatIfBaseline = baselineScenario(scenarioBaseline);
  const whatIfInitial = simulateScenario(scenarioBaseline, whatIfBaseline);
  const levers = rankLevers(scenarioBaseline);

  const chips = [
    `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg`,
    `BMI ${patient.bmI}`,
    `HbA1c ${hba1c ?? "—"}%`,
    `${vitals.stepsToday.toLocaleString("en-IN")} steps`,
  ];

  return (
    <div className="space-y-10">
      <PatientSwitcher activeId={personaId} />

      <div className="rounded-xl border border-primary/15 bg-bg-wash/50 px-4 py-2.5 text-xs leading-relaxed text-text-secondary">
        <span className="font-semibold text-text-primary">India context (ICMR-INDIAB 2023):</span>{" "}
        diabetes ~11.4% · prediabetes ~15.3%. Models use South-Asian CVD hazard ×1.4 and IDRS — clinician decision support, not a diagnosis.
      </div>

      {/* Identity row */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary-strong">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-primary/50" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Twin live
          </p>
          <h1 className="mt-1 font-display text-4xl font-semibold tracking-tight text-text-primary sm:text-[2.6rem]">
            {patient.demographics.firstName} {patient.demographics.lastName}
          </h1>
          <p className="mt-1 text-[15px] text-text-secondary">
            {patient.age} yrs · {patient.demographics.gender} · {patient.demographics.location}
          </p>
        </div>
        <p className="inline-flex items-center gap-1.5 text-sm text-text-muted">
          <Clock className="h-4 w-4" aria-hidden="true" />
          Updated {formatTime(twin.updatedAt)}
        </p>
      </header>

      {/* Twin + risks */}
      <div className="grid gap-5 lg:grid-cols-[5fr_7fr]">
        <section
          aria-label="Digital twin"
          className="rounded-2xl bg-bg-wash px-4 py-6 sm:px-6"
        >
          <TwinFigure
            readings={{
              heartRate: vitals.heartRateBpm,
              spo2: vitals.spO2,
              sleepHours: vitals.sleepHours,
              hba1c,
            }}
          />
          <ul className="mt-4 flex flex-wrap justify-center gap-2 text-xs font-medium">
            {chips.map((chip) => (
              <li
                key={chip}
                className="num rounded-full bg-bg-card px-3 py-1 text-text-secondary"
              >
                {chip}
              </li>
            ))}
          </ul>
        </section>

        <div className="space-y-5">
          {primaryAlert && (
            <div className="rounded-xl border border-danger/30 bg-danger-soft/60 p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-danger-ink" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="font-display text-lg font-semibold leading-snug text-text-primary">
                    {primaryAlert.title}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                    {primaryAlert.readable}
                  </p>
                  <Link
                    href="/insights"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-danger-ink hover:underline"
                  >
                    Review the explanation
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          <section>
            <SectionTitle hint="Every score lists its drivers">Explainable risk</SectionTitle>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              {risks.map((score) => (
                <Card key={score.type} className="flex flex-col gap-3">
                  <div className="flex items-center gap-4 sm:flex-col sm:items-start xl:flex-col lg:flex-row">
                    <RiskRing value={score.value} category={score.category} size={88} unit={score.type === "cvd-10yr" ? "% / 10 yr" : "of 100"} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text-primary">{score.label}</p>
                      <div className="mt-1">
                        <RiskBadge category={score.category} />
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Top drivers</p>
                    <ul className="mt-1 space-y-1 text-xs text-text-secondary">
                      {score.factors.slice(0, 3).map((factor) => (
                        <li key={factor.factor} className="flex gap-1.5">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-muted" aria-hidden="true" />
                          {factor.factor}
                        </li>
                      ))}
                      {score.factors.length === 0 && (
                        <li className="text-text-muted">No elevated drivers detected.</li>
                      )}
                    </ul>
                  </div>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>

      <LiveVitals />

      <div className="grid gap-8 lg:grid-cols-2">
        <EarlyWarningCard ew={earlyWarning} />
        <EnvironmentCard env={environment} city={patient.demographics.location.split(",")[0]} />
      </div>

      {/* Key readings (labels kept stable for e2e and the clinician hand-off) */}
      <section aria-label="Key readings" className="grid grid-cols-2 gap-x-6 gap-y-5 border-y border-border py-5 sm:grid-cols-4">
        {[
          { label: "Resting heart rate", value: vitals.heartRateBpm, unit: "bpm" },
          { label: "Sleep last night", value: vitals.sleepHours, unit: "h" },
          { label: "HRV", value: vitals.hrvMs, unit: "ms" },
          { label: "Blood oxygen", value: vitals.spO2, unit: "%" },
        ].map((metric) => (
          <div key={metric.label}>
            <p className="text-sm text-text-secondary">{metric.label}</p>
            <p className="num font-display text-3xl font-semibold text-text-primary">
              {metric.value}
              <span className="ml-1 text-sm font-normal text-text-muted">{metric.unit}</span>
            </p>
          </div>
        ))}
      </section>

      {/* What-if */}
      <section aria-labelledby="whatif-title">
        <div className="mb-4 max-w-2xl">
          <h2 id="whatif-title" className="font-display text-2xl font-semibold tracking-tight text-text-primary">
            Try a change on the twin
          </h2>
          <p className="mt-1 text-[15px] text-text-secondary">
            Move a slider and the same explainable models re-run on the server. Synthetic patient,
            illustrative models.
          </p>
        </div>
        <Card className="p-5 sm:p-6">
          <WhatIfPanel baseline={whatIfBaseline} initial={whatIfInitial} />
          <LeversCard levers={levers} />
        </Card>
      </section>

      {/* Alerts + recommendations */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <SectionTitle hint={`${twin.alerts.length} open`}>Alerts</SectionTitle>
          <div className="space-y-3">
            {twin.alerts.length === 0 && (
              <Card>
                <p className="text-sm text-text-secondary">No alerts right now. The twin is stable.</p>
              </Card>
            )}
            {twin.alerts.map((alert) => (
              <Card key={alert.id}>
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-text-primary">{alert.title}</p>
                  <SeverityBadge severity={alert.severity} />
                </div>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{alert.body}</p>
                <Well className="mt-3 text-sm text-text-secondary">
                  <span className="font-semibold text-text-primary">Next step: </span>
                  {alert.recommendedAction}
                </Well>
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
                  <span className="shrink-0 rounded-full bg-bg-subtle px-2.5 py-0.5 text-xs font-medium capitalize text-text-secondary">
                    {rec.priority} priority
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-text-secondary">{rec.body}</p>
                <p className="mt-2 text-xs text-text-muted">Seek care: {rec.whenToSeekCare}</p>
              </Card>
            ))}
          </div>
        </section>
      </div>

      <ProvenanceCard items={provenance} />

      {/* Provenance */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-dashed border-border-strong px-4 py-3">
        <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-strong">
          <Brain className="h-4 w-4" aria-hidden="true" />
          Twin engine v2
        </span>
        <span className="text-sm text-text-secondary">
          {twin.riskScores.length} explainable models · {twin.vitals.lastUpdated.slice(0, 10)} window
        </span>
        <span className="text-sm text-text-muted">Synthetic patients · real equations, real air quality · not a clinical tool</span>
      </div>
    </div>
  );
}

export const metadata = { title: "Dashboard" };
