import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));
const cookieStore = { delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));
vi.mock("@/lib/active", () => ({ PATIENT_COOKIE: "vitatwin_patient" }));
vi.mock("@/lib/client-key", () => ({ getClientKey: async () => "client-1" }));
const limiter = vi.fn(async () => ({ allowed: true, remaining: 4, retryAfterSeconds: 0 }));
vi.mock("@/lib/rate-limit-shared", () => ({ checkRateLimitShared: () => limiter() }));
const sessionMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  DEMO_COOKIE: "vitatwin_demo",
  getViewerSession: () => sessionMock(),
  isSupabaseConfigured: () => true,
}));
const supabase = { rpc: vi.fn(), auth: { signOut: vi.fn(async () => ({})) } };
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => supabase }));

import { deleteAccount } from "@/lib/account-actions";

const form = (confirm: string) => {
  const data = new FormData();
  data.set("confirm", confirm);
  return data;
};
async function redirected(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return decodeURIComponent(String((error as Error).message).replace("REDIRECT:", ""));
  }
  throw new Error("expected a redirect");
}

beforeEach(() => {
  vi.clearAllMocks();
  sessionMock.mockResolvedValue({ source: "supabase", userId: "u-1" });
  limiter.mockResolvedValue({ allowed: true, remaining: 4, retryAfterSeconds: 0 });
});

describe("deleteAccount", () => {
  it("sends signed-out visitors to sign in", async () => {
    sessionMock.mockResolvedValue({ source: "none" });
    expect(await redirected(deleteAccount(form("DELETE")))).toBe("/login");
  });

  it("requires the exact confirmation word", async () => {
    expect(await redirected(deleteAccount(form("delete")))).toMatch(/Type DELETE in capitals/);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("keeps the account and says so when the database call fails", async () => {
    supabase.rpc.mockResolvedValueOnce({ error: { message: "boom" } });
    expect(await redirected(deleteAccount(form("DELETE")))).toMatch(/Nothing was removed/);
    expect(supabase.auth.signOut).not.toHaveBeenCalled();
  });

  it("deletes through the database function, signs out and clears cookies", async () => {
    supabase.rpc.mockResolvedValueOnce({ error: null });
    expect(await redirected(deleteAccount(form("DELETE")))).toMatch(/Your account and its data were deleted/);
    expect(supabase.rpc).toHaveBeenCalledWith("delete_my_account");
    expect(supabase.auth.signOut).toHaveBeenCalled();
    for (const name of ["vitatwin_demo", "vitatwin_patient", "vitatwin_onboarded"]) {
      expect(cookieStore.delete).toHaveBeenCalledWith(name);
    }
  });

  it("ends a demo session without touching the database", async () => {
    sessionMock.mockResolvedValue({ source: "demo" });
    expect(await redirected(deleteAccount(form("DELETE")))).toMatch(/deleted/);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it("is rate limited", async () => {
    limiter.mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 60 });
    expect(await redirected(deleteAccount(form("DELETE")))).toMatch(/Too many attempts/);
  });
});
