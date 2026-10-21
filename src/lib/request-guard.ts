import "server-only";
import { NextResponse } from "next/server";
import { checkRateLimit } from "./rate-limit";

/**
 * Rate-limits a Route Handler by client address. Returns a ready 429 response
 * when the caller is over the limit, otherwise null.
 *
 *   const blocked = guardRate(request, "fhir-export", 10, 60_000);
 *   if (blocked) return blocked;
 */
export function guardRate(
  request: Request,
  scope: string,
  limit: number,
  windowMs: number,
): NextResponse | null {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  const result = checkRateLimit(`${scope}:${ip}`, limit, windowMs);
  if (result.allowed) return null;
  return NextResponse.json(
    { error: "rate_limited", message: "Too many requests. Please slow down and try again shortly." },
    { status: 429, headers: { "Retry-After": String(result.retryAfterSeconds) } },
  );
}
