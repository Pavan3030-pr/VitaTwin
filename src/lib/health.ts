/** Operational probes for /api/health. Pure of side effects except one short outbound request. */

export type AuthStatus = "ok" | "unreachable" | "not-configured";

/**
 * Asks Supabase Auth's public health endpoint whether sign-in can work right now.
 * Reports only a status word, never any URL or key, and never throws.
 */
export async function checkAuthService(
  env: { url?: string; key?: string } = {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  fetchImpl: typeof fetch = fetch,
): Promise<AuthStatus> {
  if (!env.url || !env.key) return "not-configured";
  try {
    const response = await fetchImpl(`${env.url.replace(/\/$/, "")}/auth/v1/health`, {
      headers: { apikey: env.key },
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    return response.ok ? "ok" : "unreachable";
  } catch {
    return "unreachable";
  }
}
