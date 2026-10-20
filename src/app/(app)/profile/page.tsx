import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { getActiveBundle } from "@/lib/active";

export const dynamic = "force-dynamic";

const FLAG_STYLES: Record<string, string> = {
  normal: "text-success-ink",
  high: "text-danger-ink",
  low: "text-warning-ink",
};

export default async function ProfilePage() {
  const { patient } = await getActiveBundle();
  const { demographics, riskFactors } = patient;

  const facts = [
    { label: "Age", value: `${patient.age}` },
    { label: "Sex", value: demographics.gender },
    { label: "Height", value: `${demographics.heightCm} cm` },
    { label: "Weight", value: `${demographics.weightKg} kg` },
    { label: "BMI", value: `${patient.bmI}` },
    { label: "Blood group", value: demographics.bloodType },
    { label: "Occupation", value: demographics.occupation },
    { label: "Location", value: demographics.location },
    { label: "Smoking", value: demographics.smoking },
    { label: "Alcohol / week", value: `${demographics.alcoholPerWeek} units` },
  ];

  const flags = [
    { label: "Hypertension", on: riskFactors.hypertension },
    { label: "Diabetes", on: riskFactors.diabetes },
    { label: "Dyslipidemia", on: riskFactors.hyperlipidemia },
    { label: "Family history", on: riskFactors.familyHistory !== "None" },
    { label: "Chronic kidney disease", on: riskFactors.chronicKidneyDisease },
    { label: "Previous MI", on: riskFactors.previousMI },
  ];

  return (
    <div className="space-y-7">
      <PageHeader
        title="Profile & EHR snapshot"
        description="Synthetic demographics and a read-only electronic health record snapshot. Nothing here is real patient data."
      />

      <section>
        <SectionTitle hint="Synthetic">Demographics</SectionTitle>
        <Card className="p-0">
          <dl className="grid grid-cols-2 divide-x divide-y divide-border sm:grid-cols-3 lg:grid-cols-5">
            {facts.map((fact) => (
              <div key={fact.label} className="px-4 py-3">
                <dt className="text-xs text-text-muted">
                  {fact.label}
                </dt>
                <dd className="mt-0.5 text-sm font-medium text-text-primary">
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </section>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <section>
          <SectionTitle hint={`${patient.recentLabs.length} results`}>Laboratory results</SectionTitle>
          <Card className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="bg-bg-subtle text-xs text-text-secondary">
                  <tr>
                    <th className="px-4 py-2 font-medium">Test</th>
                    <th className="px-4 py-2 font-medium">Result</th>
                    <th className="px-4 py-2 font-medium">Reference</th>
                    <th className="px-4 py-2 font-medium">Flag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {patient.recentLabs.map((lab) => (
                    <tr key={lab.name}>
                      <td className="px-4 py-2.5 text-text-primary">{lab.name}</td>
                      <td className="px-4 py-2.5 font-medium tabular-nums text-text-primary">
                        {typeof lab.value === "number" ? String(Number(lab.value.toFixed(2))) : lab.value}{" "}
                        <span className="text-xs font-normal text-text-muted">{lab.unit}</span>
                      </td>
                      <td className="px-4 py-2.5 text-xs tabular-nums text-text-secondary">
                        {lab.referenceRange[0]}–{lab.referenceRange[1]} {lab.unit}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-xs font-semibold capitalize ${
                          FLAG_STYLES[lab.flag] ?? "text-text-secondary"
                        }`}
                      >
                        {lab.flag}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section>
          <SectionTitle hint="EHR">Risk factors</SectionTitle>
          <Card>
            <ul className="space-y-2">
              {flags.map((flag) => (
                <li key={flag.label} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-text-secondary">{flag.label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      flag.on ? "bg-danger-soft text-danger-ink" : "bg-success-soft text-success-ink"
                    }`}
                  >
                    {flag.on ? "present" : "absent"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs font-semibold text-text-secondary">
                Current diagnoses
              </p>
              <ul className="mt-1 space-y-1 text-sm text-text-primary">
                {patient.diagnoses.map((diagnosis) => (
                  <li key={diagnosis}>· {diagnosis}</li>
                ))}
              </ul>

              <p className="mt-3 text-xs font-semibold text-text-secondary">
                Medications
              </p>
              <ul className="mt-1 space-y-1 text-sm text-text-primary">
                {patient.medications.map((medication) => (
                  <li key={medication}>· {medication}</li>
                ))}
              </ul>
            </div>
          </Card>
        </section>
      </div>

      <Card className="border-dashed">
        <p className="text-xs leading-relaxed text-text-secondary">
          Every value on this page is generated by the synthetic data module.
          VitaTwin never ingests real personal health information in this
          proof-of-concept.
        </p>
      </Card>
    </div>
  );
}
