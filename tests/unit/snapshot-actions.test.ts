import { beforeEach, describe, expect, it, vi } from "vitest";

// ---- mocks for everything with I/O or framework side effects ----
const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});
vi.mock("next/navigation", () => ({ redirect: (url: string) => redirectMock(url) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/lib/client-key", () => ({ getClientKey: async () => "test-client" }));
vi.mock("@/lib/rate-limit-shared", () => ({
  checkRateLimitShared: async () => ({ allowed: true, remaining: 9, retryAfterSeconds: 0 }),
}));
const reportErrorMock = vi.fn();
vi.mock("@/lib/monitoring", () => ({ reportError: (r: unknown) => reportErrorMock(r) }));
vi.mock("@/lib/active", async () => ({
  getActiveBundle: async () => (await import("@/lib/data")).generateDemoBundle(),
}));

const sessionMock = vi.fn();
vi.mock("@/lib/auth", () => ({
  getViewerSession: () => sessionMock(),
  isSupabaseConfigured: () => true,
}));

const supabase = { from: vi.fn() };
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: async () => supabase }));

import { deleteSnapshot, saveSnapshot } from "@/lib/snapshot-actions";

const EMAIL_SESSION = { source: "supabase", userId: "u-1", email: "a@b.co" };
const GOOD_ID = "123e4567-e89b-12d3-a456-426614174000";

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
  sessionMock.mockResolvedValue(EMAIL_SESSION);
});

describe("saveSnapshot", () => {
  it("refuses demo sessions", async () => {
    sessionMock.mockResolvedValue({ source: "demo" });
    expect(await redirected(saveSnapshot())).toMatch(/error=Sign in with an email account/);
  });

  it("stops at the per-user cap", async () => {
    supabase.from.mockReturnValue({ select: async () => ({ count: 50, error: null }) });
    expect(await redirected(saveSnapshot())).toMatch(/50 saved snapshots/);
  });

  it("inserts a compact payload owned by the signed-in user", async () => {
    const insert = vi.fn<(row: unknown) => Promise<{ error: null }>>(async () => ({ error: null }));
    supabase.from.mockReturnValue({ select: async () => ({ count: 1, error: null }), insert });
    expect(await redirected(saveSnapshot())).toMatch(/notice=Snapshot saved\./);
    const row = insert.mock.calls[0][0] as { user_id: string; payload: { v: number; scores: unknown[] } };
    expect(row.user_id).toBe("u-1");
    expect(row.payload.v).toBe(1);
    expect(row.payload.scores).toHaveLength(3);
  });

  it("reports a friendly error when the insert fails", async () => {
    supabase.from.mockReturnValue({
      select: async () => ({ count: 0, error: null }),
      insert: async () => ({ error: { message: "boom" } }),
    });
    expect(await redirected(saveSnapshot())).toMatch(/could not save the snapshot/);
  });
});

describe("deleteSnapshot", () => {
  const form = (id: string) => {
    const data = new FormData();
    data.set("id", id);
    return data;
  };
  const deleteChain = (result: { data: unknown; error: unknown }) => ({
    delete: () => ({ eq: () => ({ select: async () => result }) }),
  });

  it("rejects malformed ids before touching the database", async () => {
    expect(await redirected(deleteSnapshot(form("not-a-uuid")))).toMatch(/could not be found/);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("does not report success when RLS removed nothing", async () => {
    supabase.from.mockReturnValue(deleteChain({ data: [], error: null }));
    expect(await redirected(deleteSnapshot(form(GOOD_ID)))).toMatch(/was not deleted/);
    expect(reportErrorMock).toHaveBeenCalledWith({ scope: "snapshot-delete-removed-nothing" });
  });

  it("confirms when a row was really deleted", async () => {
    supabase.from.mockReturnValue(deleteChain({ data: [{ id: GOOD_ID }], error: null }));
    expect(await redirected(deleteSnapshot(form(GOOD_ID)))).toMatch(/notice=Snapshot deleted\./);
  });
});
