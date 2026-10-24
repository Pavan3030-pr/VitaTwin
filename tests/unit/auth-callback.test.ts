import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const configured = vi.fn(() => true);
vi.mock("@/lib/auth", () => ({ isSupabaseConfigured: () => configured() }));
const auth = { exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn() };
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth }) }));

import { GET } from "@/app/auth/callback/route";

const call = (query: string) => GET(new NextRequest(`https://app.example/auth/callback${query}`));
const where = (res: Response) => decodeURIComponent(res.headers.get("location") ?? "");

beforeEach(() => {
  vi.clearAllMocks();
  configured.mockReturnValue(true);
});

describe("auth callback", () => {
  it("exchanges a PKCE code and lands on the requested page", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    expect(where(await call("?code=abc&next=/reset-password"))).toBe("https://app.example/reset-password");
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith("abc");
  });

  it("never redirects off-site", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: null });
    expect(where(await call("?code=abc&next=//evil.example"))).toBe("https://app.example/dashboard");
    expect(where(await call("?code=abc&next=https://evil.example"))).toBe("https://app.example/dashboard");
  });

  it("supports the token-hash flow", async () => {
    auth.verifyOtp.mockResolvedValue({ error: null });
    expect(where(await call("?token_hash=h&type=signup"))).toBe("https://app.example/dashboard");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ type: "signup", token_hash: "h" });
  });

  it("sends expired or invalid links to sign-in with a friendly message", async () => {
    auth.exchangeCodeForSession.mockResolvedValue({ error: { message: "Token has expired or is invalid" } });
    const out = where(await call("?code=old"));
    expect(out).toMatch(/\/login\?error=.*expired/);
    expect(out).not.toMatch(/Token has expired or is invalid/);
    expect(where(await call(""))).toMatch(/not valid/);
  });

  it("explains when Supabase is not configured", async () => {
    configured.mockReturnValue(false);
    expect(where(await call("?code=abc"))).toMatch(/not configured/);
  });
});
