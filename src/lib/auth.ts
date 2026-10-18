/**
 * VitaTwin — auth helpers.
 *
 * Two modes:
 *  1. Demo mode (always available): a signed demo cookie grants access to a
 *     synthetic twin. This keeps the jury demo working offline.
 *  2. Supabase mode: when NEXT_PUBLIC_SUPABASE_URL and
 *     NEXT_PUBLIC_SUPABASE_ANON_KEY are configured, a real Supabase session
 *     (email/password) is validated server-side with `auth.getUser()`.
 *
 * No secrets are ever read on the client; the service-role key stays server-only
 * and is not used by the app at all.
 */

import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./supabase/server";

export const DEMO_COOKIE = "vitatwin_demo";
export const DEMO_USER_ID = "demo-patient";

/** True when Supabase env vars are present (public URL + anon key only). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export type SessionSource = "supabase" | "demo" | "none";

export interface ViewerSession {
  source: SessionSource;
  userId: string | null;
  email: string | null;
}

const ANONYMOUS: ViewerSession = { source: "none", userId: null, email: null };

/**
 * Resolves the current viewer. A real Supabase session wins over the demo
 * cookie, so signing in with email never silently falls back to demo data.
 */
export async function getViewerSession(): Promise<ViewerSession> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      return { source: "supabase", userId: user.id, email: user.email ?? null };
    }
  }

  const store = await cookies();
  if (store.get(DEMO_COOKIE)?.value === "1") {
    return { source: "demo", userId: DEMO_USER_ID, email: null };
  }

  return ANONYMOUS;
}

/** Server-side gate used by the private app layout. */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getViewerSession();
  return session.source !== "none";
}
