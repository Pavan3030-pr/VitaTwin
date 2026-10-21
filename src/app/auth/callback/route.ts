import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/auth";
import { friendlyAuthError } from "@/lib/auth-errors";
import { safeNextPath } from "@/lib/validation";

export const dynamic = "force-dynamic";

/**
 * Landing point for every Supabase e-mail link (confirm sign-up, reset password).
 * Supports both the PKCE `code` flow and the `token_hash` flow, then sends the
 * person on to a same-origin `next` path.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next"));

  const fail = (message: string) =>
    NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(message)}`);

  if (!isSupabaseConfigured()) return fail("Email sign-in is not configured on this deployment.");

  const supabase = await createSupabaseServerClient();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return fail(friendlyAuthError(error.message).message);
  }

  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) return NextResponse.redirect(`${origin}${next}`);
    return fail(friendlyAuthError(error.message).message);
  }

  return fail("That link is not valid. Request a new one.");
}
