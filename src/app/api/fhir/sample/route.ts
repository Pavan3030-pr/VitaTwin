import { NextResponse } from "next/server";
import { SAMPLE_FHIR_BUNDLE } from "@/data/sample-fhir";

/** Public synthetic sample so anyone can try the import. */
export function GET() {
  return NextResponse.json(SAMPLE_FHIR_BUNDLE, { headers: { "Content-Type": "application/fhir+json" } });
}
