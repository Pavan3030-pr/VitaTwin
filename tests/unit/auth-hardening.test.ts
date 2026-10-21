import { describe, expect, it } from "vitest";
import { safeNextPath, validateEmail, validatePassword, validatePasswordPair } from "@/lib/validation";
import { friendlyAuthError } from "@/lib/auth-errors";

describe("validation", () => {
  it("validates emails", () => {
    expect(validateEmail("a@b.co")).toBeNull();
    expect(validateEmail("")).not.toBeNull();
    expect(validateEmail("not-an-email")).not.toBeNull();
    expect(validateEmail(`${"a".repeat(250)}@b.co`)).not.toBeNull();
  });

  it("requires length plus a letter and a number", () => {
    expect(validatePassword("short1")).not.toBeNull();
    expect(validatePassword("onlyletters")).not.toBeNull();
    expect(validatePassword("12345678")).not.toBeNull();
    expect(validatePassword("a".repeat(129) + "1")).not.toBeNull();
    expect(validatePassword("goodpass1")).toBeNull();
  });

  it("checks that the two passwords match", () => {
    expect(validatePasswordPair("goodpass1", "goodpass2")).toMatch(/do not match/);
    expect(validatePasswordPair("goodpass1", "goodpass1")).toBeNull();
  });

  it("only accepts same-origin relative redirects", () => {
    expect(safeNextPath("/insights")).toBe("/insights");
    expect(safeNextPath("//evil.com")).toBe("/dashboard");
    expect(safeNextPath("https://evil.com")).toBe("/dashboard");
    expect(safeNextPath("/\\evil.com")).toBe("/dashboard");
    expect(safeNextPath(undefined)).toBe("/dashboard");
  });
});

describe("friendly auth errors", () => {
  it("translates known Supabase messages", () => {
    expect(friendlyAuthError("Invalid login credentials").message).toMatch(/do not match/);
    const unconfirmed = friendlyAuthError("Email not confirmed");
    expect(unconfirmed.canResend).toBe(true);
  });

  it("never leaks unknown internals", () => {
    const out = friendlyAuthError("pg: relation auth.users violates constraint xyz");
    expect(out.message).not.toMatch(/pg|relation|constraint/);
  });
});
