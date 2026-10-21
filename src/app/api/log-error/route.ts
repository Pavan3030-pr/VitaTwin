import { NextResponse } from "next/server";
import { reportError } from "@/lib/monitoring";
import { guardRate } from "@/lib/request-guard";

export const dynamic = "force-dynamic";

const MAX_BODY = 2_000;

/** Receives browser-side error reports. Tiny, rate-limited, scrubbed. */
export async function POST(request: Request) {
  const blocked = guardRate(request, "log-error", 20, 60_000);
  if (blocked) return blocked;

  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ ok: false }, { status: 413 });

  let data: { scope?: unknown; digest?: unknown; message?: unknown } = {};
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  reportError({
    scope: `client:${typeof data.scope === "string" ? data.scope : "unknown"}`,
    digest: typeof data.digest === "string" ? data.digest : undefined,
    message: typeof data.message === "string" ? data.message : undefined,
  });
  return NextResponse.json({ ok: true });
}
