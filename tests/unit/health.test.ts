import { describe, expect, it, vi } from "vitest";
import { checkAuthService } from "@/lib/health";

const env = { url: "https://proj.supabase.co/", key: "sb_publishable_x" };

describe("checkAuthService", () => {
  it("reports not-configured without credentials", async () => {
    expect(await checkAuthService({})).toBe("not-configured");
  });

  it("calls the public auth health endpoint with the anon key", async () => {
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    expect(await checkAuthService(env, fetchMock as unknown as typeof fetch)).toBe("ok");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://proj.supabase.co/auth/v1/health");
    expect((init.headers as Record<string, string>).apikey).toBe("sb_publishable_x");
  });

  it("reports unreachable on errors and non-2xx, and never throws", async () => {
    expect(await checkAuthService(env, (async () => new Response("", { status: 503 })) as unknown as typeof fetch)).toBe("unreachable");
    expect(await checkAuthService(env, (async () => { throw new Error("down"); }) as unknown as typeof fetch)).toBe("unreachable");
  });
});
