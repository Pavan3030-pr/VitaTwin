/**
 * A SYNTHETIC ABDM-style FHIR R4 bundle used by the import demo.
 * Not a real person. LOINC / SNOMED codes are real so the parser is exercised
 * exactly as it would be with a hospital export.
 */
export const SAMPLE_FHIR_BUNDLE = {
  resourceType: "Bundle",
  type: "collection",
  entry: [
    {
      resource: {
        resourceType: "Patient",
        id: "sample-pune-001",
        name: [{ given: ["Sanjay"], family: "Kulkarni" }],
        gender: "male",
        birthDate: "1972-03-14",
        address: [{ city: "Pune", country: "IN" }],
      },
    },
    { resource: { resourceType: "Condition", code: { coding: [{ system: "http://snomed.info/sct", code: "38341003", display: "Hypertensive disorder" }] } } },
    { resource: { resourceType: "Condition", code: { coding: [{ system: "http://snomed.info/sct", code: "44054006", display: "Type 2 diabetes mellitus" }] } } },
    { resource: { resourceType: "MedicationStatement", medicationCodeableConcept: { text: "Telmisartan 40 mg" } } },
    { resource: { resourceType: "Observation", code: { coding: [{ system: "http://loinc.org", code: "72166-2" }] }, valueCodeableConcept: { coding: [{ system: "http://snomed.info/sct", code: "77176002", display: "Smoker" }] } } },
    { resource: { resourceType: "Observation", effectiveDateTime: "2026-09-30", code: { coding: [{ system: "http://loinc.org", code: "4548-4" }] }, valueQuantity: { value: 8.3, unit: "%" } } },
    { resource: { resourceType: "Observation", effectiveDateTime: "2026-09-30", code: { coding: [{ system: "http://loinc.org", code: "2093-3" }] }, valueQuantity: { value: 5.9, unit: "mmol/L" } } },
    { resource: { resourceType: "Observation", effectiveDateTime: "2026-09-30", code: { coding: [{ system: "http://loinc.org", code: "2085-9" }] }, valueQuantity: { value: 0.95, unit: "mmol/L" } } },
    { resource: { resourceType: "Observation", effectiveDateTime: "2026-09-30", code: { coding: [{ system: "http://loinc.org", code: "2571-8" }] }, valueQuantity: { value: 2.6, unit: "mmol/L" } } },
    { resource: { resourceType: "Observation", effectiveDateTime: "2026-10-12", code: { coding: [{ system: "http://loinc.org", code: "85354-9" }] }, component: [
      { code: { coding: [{ system: "http://loinc.org", code: "8480-6" }] }, valueQuantity: { value: 152, unit: "mmHg" } },
      { code: { coding: [{ system: "http://loinc.org", code: "8462-4" }] }, valueQuantity: { value: 94, unit: "mmHg" } },
    ] } },
    { resource: { resourceType: "Observation", effectiveDateTime: "2026-10-12", code: { coding: [{ system: "http://loinc.org", code: "8867-4" }] }, valueQuantity: { value: 82, unit: "/min" } } },
    { resource: { resourceType: "Observation", effectiveDateTime: "2026-10-12", code: { coding: [{ system: "http://loinc.org", code: "39156-5" }] }, valueQuantity: { value: 29.8, unit: "kg/m2" } } },
    { resource: { resourceType: "Observation", effectiveDateTime: "2026-10-12", code: { coding: [{ system: "http://loinc.org", code: "8280-0" }] }, valueQuantity: { value: 102, unit: "cm" } } },
  ],
} as const;
