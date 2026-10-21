/**
 * VitaTwin — shared (multi-instance) rate limiter.
 *
 * When UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are set, counters
 * live in Redis so limits hold across every serverless instance. Without them,
 * or if Redis is unreachable, it falls back to the in-memory limiter, so
 * the app never fails closed because of the limiter itself.
 * Server-side only: these variables have no NEXT_PUBLIC_ prefix.
 */
import { checkRateLimit, type RateLimitResult } from "./rate-limit";

export function isSharedLimiterConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

interface PipelineItem {
  result?: number;
  error?: string;
}

export async function checkRateLimitShared(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return checkRateLimit(key, limit, windowMs);

  const redisKey = `vitatwin:rl:${key}`;
  try {
    const response = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["PEXPIRE", redisKey, String(windowMs), "NX"],
        ["PTTL", redisKey],
      ]),
      cache: "no-store",
      signal: AbortSignal.timeout(1500),
    });
    if (!response.ok) throw new Error(`redis ${response.status}`);

    const items = (await response.json()) as PipelineItem[];
    const count = Number(items[0]?.result);
    const ttlMs = Number(items[2]?.result);
    if (!Number.isFinite(count)) throw new Error("bad redis reply");

    const allowed = count <= limit;
    return {
      allowed,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil((Number.isFinite(ttlMs) && ttlMs > 0 ? ttlMs : windowMs) / 1000)),
    };
  } catch {
    return checkRateLimit(key, limit, windowMs);
  }
}
