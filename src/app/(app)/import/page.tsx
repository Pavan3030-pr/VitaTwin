import { Download, Upload } from "lucide-react";
import { PageHeader, Card, SectionTitle } from "@/components/ui/card";
import { FhirImportForm } from "@/components/twin/fhir-import-form";
import { WearableImportForm } from "@/components/twin/wearable-import-form";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="Connect your own data"
        description="Bring a wearable export or a FHIR R4 bundle. Both paths run entirely in memory, build an explainable twin, and discard the input — nothing is stored."
        aside={
          <a
            href="/api/fhir/export"
            className="inline-flex items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm font-semibold text-primary-strong hover:border-primary-strong"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export active twin (FHIR)
          </a>
        }
      />

      <section className="space-y-3">
        <SectionTitle hint="Closes the simulated-wearable gap">
          <span className="inline-flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary-strong" aria-hidden="true" />
            Wearable CSV (Apple Health · Google Fit · generic)
          </span>
        </SectionTitle>
        <WearableImportForm />
        <Card className="border-dashed">
          <p className="text-xs leading-relaxed text-text-secondary">
            Accepts daily or hourly tables with date/timestamp plus heart rate, HRV, steps, sleep
            hours and optional SpO₂. Daily rows are expanded to hourly samples so the personal
            baseline still learns. Risk equations use population-typical labs until you refine
            them with a FHIR bundle below.
          </p>
        </Card>
      </section>

      <section className="space-y-3">
        <SectionTitle hint="ABDM / HL7 FHIR R4">FHIR import &amp; export</SectionTitle>
        <FhirImportForm />
        <Card className="border-dashed">
          <p className="text-xs leading-relaxed text-text-secondary">
            Reads Patient, Observation (LOINC: HbA1c, glucose, lipids, BP, heart rate, BMI, waist,
            creatinine, eGFR), Condition (SNOMED/ICD-10) and MedicationStatement. Handles unit
            variants, takes the latest value per metric, rejects implausible values, and lists
            every input it had to assume.
          </p>
        </Card>
      </section>
    </div>
  );
}

export const metadata = { title: "Connect your data" };
