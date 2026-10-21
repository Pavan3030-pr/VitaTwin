import { NextResponse } from "next/server";
import { getViewerSession } from "@/lib/auth";
import { getCohortBundles } from "@/lib/active";
import { guardRate } from "@/lib/request-guard";
import { buildCohortCsv } from "@/services/clinician-export";

export const dynamic = "force-dynamic";

/** CSV of the clinician patient panel (synthetic cohort). Session required. */
export async function GET(request: Request) {
  const session = await getViewerSession();
  if (session.source === "none") return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const blocked = await guardRate(request, "clinician-export", 10, 60_000);
  if (blocked) return blocked;

  const csv = buildCohortCsv(await getCohortBundles());
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vitatwin-clinician-panel.csv"',
      "Cache-Control": "no-store",
    },
  });
}
