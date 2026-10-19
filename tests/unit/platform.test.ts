import { beforeEach, describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimits } from "@/lib/rate-limit";
import { scrub } from "@/lib/monitoring";
import { readingStatus } from "@/services/twin-status";

describe("rate limiter", () => {
  beforeEach(() => resetRateLimits());

  it("allows up to the limit then blocks with a retry hint", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i += 1) {
      expect(checkRateLimit("ip-a", 3, 60_000, t0).allowed).toBe(true);
    }
    const blocked = checkRateLimit("ip-a", 3, 60_000, t0 + 1_000);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("isolates keys and resets after the window", () => {
    const t0 = 5_000_000;
    for (let i = 0; i < 4; i += 1) checkRateLimit("ip-a", 3, 60_000, t0);
    expect(checkRateLimit("ip-b", 3, 60_000, t0).allowed).toBe(true);
    expect(checkRateLimit("ip-a", 3, 60_000, t0 + 61_000).allowed).toBe(true);
  });
});

describe("error scrubbing", () => {
  it("removes emails, long numbers and tokens from reports", () => {
    const text = scrub("failed for kavya@example.com id 658550 token eyJhbGciOi.abc.def");
    expect(text).not.toMatch(/kavya|@|658550|eyJ/);
    expect(text).toContain("[redacted]");
  });

  it("handles undefined", () => {
    expect(scrub(undefined)).toBeUndefined();
  });
});

describe("reading status bands", () => {
  it("classifies each reading kind", () => {
    expect(readingStatus("hba1c", 8.3)).toBe("high");
    expect(readingStatus("hba1c", 7.1)).toBe("moderate");
    expect(readingStatus("hba1c", 5.6)).toBe("low");
    expect(readingStatus("sleep", 5)).toBe("high");
    expect(readingStatus("sleep", 7.5)).toBe("low");
    expect(readingStatus("spo2", 90)).toBe("high");
    expect(readingStatus("spo2", 97)).toBe("low");
    expect(readingStatus("heart-rate", 57)).toBe("low");
    expect(readingStatus("heart-rate", 105)).toBe("high");
  });

  it("never crashes on bad input", () => {
    expect(readingStatus("spo2", Number.NaN)).toBe("moderate");
  });
});
