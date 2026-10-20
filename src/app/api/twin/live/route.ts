import { NextResponse } from "next/server";
import { getViewerSession } from "@/lib/auth";
import { getActivePersonaId } from "@/lib/active";
import { liveTick } from "@/lib/live";

export const dynamic = "force-dynamic";

/** Latest simulated wearable tick plus a short backfill, for the live panel. */
export async function GET() {
  const session = await getViewerSession();
  if (session.source === "none") return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const id = await getActivePersonaId();
  const now = Date.now();
  const ticks = Array.from({ length: 24 }, (_, i) => liveTick(id, now - (23 - i) * 5000));
  return NextResponse.json({ ticks }, { headers: { "Cache-Control": "no-store" } });
}
