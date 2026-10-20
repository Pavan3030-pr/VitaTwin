import { NextResponse } from "next/server";
import { getViewerSession } from "@/lib/auth";
import { getActiveBundle } from "@/lib/active";
import { toFhirBundle } from "@/services/fhir";

export const dynamic = "force-dynamic";

/** FHIR R4 Bundle (Patient, Observation, RiskAssessment) for the active twin. */
export async function GET() {
  const session = await getViewerSession();
  if (session.source === "none") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const bundle = toFhirBundle(await getActiveBundle());
  return new NextResponse(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/fhir+json",
      "Content-Disposition": 'attachment; filename="vitatwin-fhir-bundle.json"',
      "Cache-Control": "no-store",
    },
  });
}
