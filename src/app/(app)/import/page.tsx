import { Download } from "lucide-react";
import { PageHeader, Card } from "@/components/ui/card";
import { FhirImportForm } from "@/components/twin/fhir-import-form";

export const dynamic = "force-dynamic";

export default function ImportPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        title="FHIR import & export"
        description="India's ABDM standardises health records on HL7 FHIR R4. Bring a real bundle in and get a twin; send the twin's observations and risk assessments back out."
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
      <FhirImportForm />
      <Card className="border-dashed">
        <p className="text-xs leading-relaxed text-text-secondary">
          Reads Patient, Observation (LOINC: HbA1c, glucose, lipids, BP, heart rate, BMI, waist, creatinine, eGFR),
          Condition (SNOMED/ICD-10) and MedicationStatement. Handles mmol/L, µmol/L, mmol/mol and other unit variants,
          takes the latest value per metric, rejects implausible values, and lists every input it had to assume.
        </p>
      </Card>
    </div>
  );
}
