import { Stethoscope } from "lucide-react";
import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { generateDemoBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function ClinicianPage() {
  const { twin, patient, vitals } = generateDemoBundle();
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
                      {score.value}
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
          For clinical review only as a demonstration. Models are heuristics and
          have not been validated against Indian cohort guidelines. Do not use
          for diagnosis or prescribing.
        </p>
      </Card>
    </div>
  );
}
