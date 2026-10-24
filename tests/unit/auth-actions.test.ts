import { beforeEach, describe, expect, it, vi } from "vitest";

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));

const cookieStore = { set: vi.fn(), delete: vi.fn() };
vi.mock("next/headers", () => ({ cookies: async () => cookieStore }));

const configured = vi.fn(() => true);
vi.mock("@/lib/auth", () => ({ DEMO_COOKIE: "vitatwin_demo", isSupabaseConfigured: () => configured() }));
vi.mock("@/lib/client-key", () => ({
  getClientKey: async () => "client-1",
  getOrigin: async () => "https://app.example",
}));
const limiter = vi.fn(async () => ({ allowed: true, remaining: 5, retryAfterSeconds: 0 }));
vi.mock("@/lib/rate-limit-shared", () => ({ checkRateLimitShared: () => limiter() }));

const auth = {
  signUp: vi.fn(),
  signInWithPassword: vi.fn(),
  resend: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  getUser: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(async () => ({})),
};
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => ({ auth }) }));

import {
  requestPasswordReset,
  resendVerification,
  signInDemo,
  signOut,
  submitEmailAuth,
  updatePassword,
} from "@/lib/auth-actions";

const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

async function redirected(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    return decodeURIComponent(String((error as Error).message).replace("REDIRECT:", "").replace(/\+/g, " "));
  }
  throw new Error("expected a redirect");
}

beforeEach(() => {
  vi.clearAllMocks();
  configured.mockReturnValue(true);
  limiter.mockResolvedValue({ allowed: true, remaining: 5, retryAfterSeconds: 0 });
});

describe("demo session", () => {
  it("sets an httpOnly cookie and only follows same-origin paths", async () => {
    expect(await redirected(signInDemo(form({ next: "/insights" })))).toBe("/insights");
    expect(cookieStore.set).toHaveBeenCalledWith(
      "vitatwin_demo",
      "1",
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
    expect(await redirected(signInDemo(form({ next: "//evil.example" })))).toBe("/dashboard");
  });
});

describe("submitEmailAuth", () => {
  it("explains when email sign-in is not configured", async () => {
    configured.mockReturnValue(false);
    expect(await redirected(submitEmailAuth(form({ email: "a@b.co", password: "x" })))).toMatch(/not configured/);
  });

  it("rate limits repeated attempts", async () => {
    limiter.mockResolvedValue({ allowed: false, remaining: 0, retryAfterSeconds: 120 });
    expect(await redirected(submitEmailAuth(form({ email: "a@b.co", password: "pass1234" })))).toMatch(/Too many attempts/);
    expect(auth.signInWithPassword).not.toHaveBeenCalled();
  });

  it("validates email and new-password strength before calling Supabase", async () => {
    expect(await redirected(submitEmailAuth(form({ email: "nope", password: "pass1234", intent: "signin" })))).toMatch(/valid email/);
    expect(await redirected(submitEmailAuth(form({ email: "a@b.co", password: "short", intent: "signup" })))).toMatch(/at least 8/);
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it("translates bad credentials and offers a resend when unconfirmed", async () => {
    auth.signInWithPassword.mockResolvedValueOnce({ error: { message: "Invalid login credentials" } });
    expect(await redirected(submitEmailAuth(form({ email: "a@b.co", password: "pass1234" })))).toMatch(/do not match/);

    auth.signInWithPassword.mockResolvedValueOnce({ error: { message: "Email not confirmed" } });
    const url = await redirected(submitEmailAuth(form({ email: "a@b.co", password: "pass1234" })));
    expect(url).toMatch(/resend=1/);
    expect(url).not.toMatch(/Email not confirmed/);
  });

  it("signs in and follows a safe next path only", async () => {
    auth.signInWithPassword.mockResolvedValue({ error: null });
    expect(await redirected(submitEmailAuth(form({ email: "a@b.co", password: "pass1234", next: "/timeline" })))).toBe("/timeline");
    expect(await redirected(submitEmailAuth(form({ email: "a@b.co", password: "pass1234", next: "https://evil.example" })))).toBe("/dashboard");
  });

  it("sign-up asks for confirmation, or goes straight in when confirmation is off", async () => {
    auth.signUp.mockResolvedValueOnce({ data: { session: null }, error: null });
    const url = await redirected(submitEmailAuth(form({ email: "a@b.co", password: "pass1234", intent: "signup" })));
    expect(url).toMatch(/notice=Account created/);
    expect(auth.signUp).toHaveBeenCalledWith(
      expect.objectContaining({ options: { emailRedirectTo: "https://app.example/auth/callback?next=%2Fdashboard" } }),
    );

    auth.signUp.mockResolvedValueOnce({ data: { session: {} }, error: null });
    expect(await redirected(submitEmailAuth(form({ email: "a@b.co", password: "pass1234", intent: "signup" })))).toBe("/dashboard");
  });
});

describe("password reset", () => {
  it("never reveals whether an account exists", async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ error: { message: "User not found" } });
    expect(await redirected(requestPasswordReset(form({ email: "ghost@b.co" })))).toMatch(/If an account exists/);
  });

  it("does surface rate-limit problems from Supabase", async () => {
    auth.resetPasswordForEmail.mockResolvedValueOnce({ error: { message: "email rate limit exceeded" } });
    expect(await redirected(requestPasswordReset(form({ email: "a@b.co" })))).toMatch(/Too many requests/);
  });

  it("updates the password only for a signed-in recovery session and with matching entries", async () => {
    expect(await redirected(updatePassword(form({ password: "goodpass1", confirm: "goodpass2" })))).toMatch(/do not match/);

    auth.getUser.mockResolvedValueOnce({ data: { user: null } });
    expect(await redirected(updatePassword(form({ password: "goodpass1", confirm: "goodpass1" })))).toMatch(/forgot-password.*expired/);

    auth.getUser.mockResolvedValueOnce({ data: { user: { id: "u1" } } });
    auth.updateUser.mockResolvedValueOnce({ error: null });
    expect(await redirected(updatePassword(form({ password: "goodpass1", confirm: "goodpass1" })))).toMatch(/Password updated/);
    expect(auth.signOut).toHaveBeenCalled();
  });

  it("validates the address before resending a confirmation mail", async () => {
    expect(await redirected(resendVerification(form({ email: "bad" })))).toMatch(/valid email/);
    expect(auth.resend).not.toHaveBeenCalled();
  });
});

describe("signOut", () => {
  it("ends the Supabase session, clears the demo cookie and returns home", async () => {
    expect(await redirected(signOut())).toBe("/");
    expect(auth.signOut).toHaveBeenCalled();
    expect(cookieStore.delete).toHaveBeenCalledWith("vitatwin_demo");
  });
});
