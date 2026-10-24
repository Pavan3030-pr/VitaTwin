import { NextResponse } from "next/server";
import pkg from "../../../../package.json";
import { isSharedLimiterConfigured } from "@/lib/rate-limit-shared";
import { checkAuthService } from "@/lib/health";
import { guardRate } from "@/lib/request-guard";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const blocked = await guardRate(request, "health", 30, 60_000);
  if (blocked) return blocked;

  return NextResponse.json({
    status: "ok",
    service: "VitaTwin",
    version: pkg.version,
    modelVersions: {
      cvd: "vita-twin-cvd-2.0-fram08-sa",
      diabetes: "vita-twin-diabetes-2.0-idrs-ada",
      acute: "vita-twin-acute-2.0-baseline-env",
    },
    mode: "synthetic-patients+real-environment",
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    auth: await checkAuthService(),
    rateLimiter: isSharedLimiterConfigured() ? "shared-redis" : "in-memory",
    timestamp: new Date().toISOString(),
  });
}
