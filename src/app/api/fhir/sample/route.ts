import { NextResponse } from "next/server";
import { SAMPLE_FHIR_BUNDLE } from "@/data/sample-fhir";
import { guardRate } from "@/lib/request-guard";

/** Public synthetic sample so anyone can try the import. */
export function GET(request: Request) {
  const blocked = guardRate(request, "fhir-sample", 30, 60_000);
  if (blocked) return blocked;
  return NextResponse.json(SAMPLE_FHIR_BUNDLE, { headers: { "Content-Type": "application/fhir+json" } });
}
