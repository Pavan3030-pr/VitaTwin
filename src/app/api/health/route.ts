import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json({
    status: "ok",
    service: "VitaTwin",
    version: "2.0.0",
    modelVersions: {
      cvd: "vita-twin-cvd-2.0-fram08-sa",
      diabetes: "vita-twin-diabetes-2.0-idrs-ada",
      acute: "vita-twin-acute-2.0-baseline-env",
    },
    mode: "synthetic-patients+real-environment",
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
    timestamp: new Date().toISOString(),
  });
}
