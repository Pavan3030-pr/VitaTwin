import { Download, Stethoscope } from "lucide-react";
import { PrintButton } from "@/components/ui/print-button";
import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { getActiveBundle, getCohortBundles } from "@/lib/active";
import { selectPatient } from "@/lib/patient-actions";

export const dynamic = "force-dynamic";

export default async function ClinicianPage() {
  const { twin, patient, vitals, personaId } = await getActiveBundle();
  const cohort = await getCohortBundles();
  const rank = { critical: 4, high: 3, moderate: 2, low: 1 } as const;
  const priority = (b: (typeof cohort)[number]) =>
    Math.max(...b.twin.riskScores.map((r) => rank[r.category])) * 10 +
    ({ urgent: 3, warning: 2, watch: 1, stable: 0 } as const)[b.earlyWarning.level] * 3 +
    b.twin.alerts.length;
  const panel = [...cohort].sort((a, b) => priority(b) - priority(a));
  const hba1c = patient.recentLabs.find((l) => l.name === "HbA1c")?.value;
  const ldl = patient.recentLabs.find((l) => l.name === "LDL cholesterol")?.value;

  const measurements = [
    { label: "Blood pressure", value: `${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic} mmHg` },
    { label: "Resting HR", value: `${vitals.heartRateBpm} bpm` },
    { label: "HRV", value: `${vitals.hrvMs} ms` },
    { label: "SpO₂", value: `${vitals.spO2} %` },
    { label: "BMI", value: `${patient.bmI} kg/m²` },
    { label: "HbA1c", value: hba1c ? `${hba1c} %` : "—" },
    { label: "LDL", value: ldl ? `${ldl} mg/dL` : "—" },
    { label: "Sleep (mean)", value: `${vitals.sleepHours} h` },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Clinician view"
        description="Same twin, clinical framing. Prioritised measurements, model provenance, and immediate actions."
        aside={
          <span className="inline-flex items-center gap-2 rounded-full bg-bg-wash px-3 py-1.5 text-sm font-medium text-primary-deep">
            <Stethoscope className="h-4 w-4" aria-hidden="true" />
            {patient.demographics.firstName} {patient.demographics.lastName} · {patient.age}y
          </span>
        }
      />

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <a
          href="/api/clinician/export"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-border-strong bg-bg-card px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary-strong hover:text-primary-strong"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Download panel (CSV)
        </a>
        <PrintButton />
      </div>

      <section>
        <SectionTitle hint="Sorted by urgency">Patient panel</SectionTitle>
        <Card className="p-0">
          <div className="overflow-x-auto">
            <form action={selectPatient}>
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-bg-subtle text-xs text-text-secondary">
                  <tr>
                    <th className="px-4 py-2 font-medium">Patient</th>
                    <th className="px-4 py-2 font-medium">CVD 10-yr</th>
                    <th className="px-4 py-2 font-medium">Diabetes</th>
                    <th className="px-4 py-2 font-medium">Early warning</th>
                    <th className="px-4 py-2 font-medium">Lead time</th>
                    <th className="px-4 py-2 font-medium">Air (AQI)</th>
                    <th className="px-4 py-2 font-medium">Alerts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {panel.map((b) => {
                    const cvd = b.twin.riskScores.find((r) => r.type === "cvd-10yr")!;
                    const dia = b.twin.riskScores.find((r) => r.type === "diabetes-progression")!;
                    return (
                      <tr key={b.personaId} className={b.personaId === personaId ? "bg-bg-wash" : ""}>
                        <td className="px-4 py-2.5">
                          <button type="submit" name="patientId" value={b.personaId} className="text-left font-semibold text-primary-strong hover:underline">
                            {b.patient.demographics.firstName} {b.patient.demographics.lastName}
                          </button>
                          <span className="block text-xs text-text-muted">
                            {b.patient.age}y · {b.patient.demographics.location.split(",")[0]}
                          </span>
                        </td>
                        <td className="px-4 py-2.5"><span className="num font-semibold">{cvd.value}%</span> <RiskBadge category={cvd.category} /></td>
                        <td className="px-4 py-2.5"><span className="num font-semibold">{dia.value}</span> <RiskBadge category={dia.category} /></td>
                        <td className="px-4 py-2.5 capitalize">{b.earlyWarning.level} <span className="num text-xs text-text-muted">({b.earlyWarning.index})</span></td>
                        <td className="num px-4 py-2.5">{b.earlyWarning.leadTimeHours != null ? `~${b.earlyWarning.leadTimeHours} h` : "—"}</td>
                        <td className="num px-4 py-2.5">{b.environment?.usAqi ?? "—"}</td>
                        <td className="num px-4 py-2.5">{b.twin.alerts.length}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </form>
          </div>
        </Card>
      </section>

      <section>
        <SectionTitle hint="Today">Measurements</SectionTitle>
        <Card className="p-0">
          <dl className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-4">
            {measurements.map((item) => (
              <div key={item.label} className="px-4 py-3">
                <dt className="text-xs text-text-muted">
                  {item.label}
                </dt>
                <dd className="mt-0.5 text-sm font-semibold tabular-nums text-text-primary">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <section>
        <SectionTitle hint="Prioritised">Risk panel</SectionTitle>
        <Card className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="bg-bg-subtle text-xs text-text-secondary">
                <tr>
                  <th className="px-4 py-2 font-medium">Model</th>
                  <th className="px-4 py-2 font-medium">Score</th>
                  <th className="px-4 py-2 font-medium">Band</th>
                  <th className="px-4 py-2 font-medium">Primary driver</th>
                  <th className="px-4 py-2 font-medium">Version</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {twin.riskScores.map((score) => (
                  <tr key={score.type}>
                    <td className="px-4 py-2.5 text-text-primary">{score.label}</td>
                    <td className="px-4 py-2.5 font-semibold tabular-nums text-text-primary">
                      {score.value}{score.type === "cvd-10yr" ? "%" : ""}
                    </td>
                    <td className="px-4 py-2.5">
                      <RiskBadge category={score.category} />
                    </td>
                    <td className="px-4 py-2.5 text-text-secondary">
                      {score.factors[0]?.factor ?? "No elevated driver"}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-text-muted">
                      {score.modelVersion}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section>
          <SectionTitle hint="Escalate first">Actions needed</SectionTitle>
          <div className="space-y-3">
            {twin.alerts.length === 0 && (
              <Card>
                <p className="text-sm text-text-secondary">Nothing to escalate.</p>
              </Card>
            )}
            {twin.alerts.map((alert) => (
              <Card key={alert.id}>
                <p className="text-sm font-semibold text-text-primary">{alert.title}</p>
                <p className="mt-1 text-xs text-text-secondary">{alert.recommendedAction}</p>
                <p className="mt-2 text-xs text-text-muted">
                  Severity: {alert.severity}
                </p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle hint="EHR snapshot">Problem list & medication</SectionTitle>
          <Card>
            <p className="text-xs font-semibold text-text-secondary">
              Diagnoses
            </p>
            <ul className="mt-1 space-y-1 text-sm text-text-primary">
              {patient.diagnoses.map((diagnosis) => (
                <li key={diagnosis} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {diagnosis}
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs font-semibold text-text-secondary">
              Medications
            </p>
            <ul className="mt-1 space-y-1 text-sm text-text-primary">
              {patient.medications.map((medication) => (
                <li key={medication} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                  {medication}
                </li>
              ))}
            </ul>
          </Card>
        </section>
      </div>

      <Card className="border-dashed">
        <p className="text-xs leading-relaxed text-text-secondary">
          For clinical review only as a demonstration. Models are published equations (see Validation) applied to synthetic patients; they have not been
          prospectively validated in an Indian cohort. Do not use for diagnosis or prescribing.
        </p>
      </Card>
    </div>
  );
}

export const metadata = { title: "Clinician view" };
