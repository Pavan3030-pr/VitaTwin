import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetRateLimits } from "@/lib/rate-limit";
import { checkRateLimitShared, isSharedLimiterConfigured } from "@/lib/rate-limit-shared";

describe("shared rate limiter", () => {
  beforeEach(() => {
    resetRateLimits();
    vi.unstubAllEnvs();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("falls back to the in-memory limiter without Redis settings", async () => {
    expect(isSharedLimiterConfigured()).toBe(false);
    for (let i = 0; i < 2; i += 1) expect((await checkRateLimitShared("k", 2, 60_000)).allowed).toBe(true);
    expect((await checkRateLimitShared("k", 2, 60_000)).allowed).toBe(false);
  });

  it("uses Redis counters when configured", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify([{ result: 4 }, { result: 0 }, { result: 30_000 }]), { status: 200 }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const result = await checkRateLimitShared("k", 3, 60_000);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(result.allowed).toBe(false);
    expect(result.retryAfterSeconds).toBe(30);
  });

  it("allows requests under the limit", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([{ result: 1 }, { result: 1 }, { result: 59_000 }]))));
    const result = await checkRateLimitShared("k", 3, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it("fails open to the in-memory limiter when Redis errors", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "t");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("network"); }));
    expect((await checkRateLimitShared("k2", 1, 60_000)).allowed).toBe(true);
    expect((await checkRateLimitShared("k2", 1, 60_000)).allowed).toBe(false);
  });
});
