"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE, isSupabaseConfigured } from "./auth";
import { createSupabaseServerClient } from "./supabase/server";
import { checkRateLimit } from "./rate-limit";

/** Only same-origin relative paths are accepted as post-login destinations. */
function safeNext(value: FormDataEntryValue | null | undefined): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }
  return value;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Best-effort client key for rate limiting (first forwarded address). */
async function clientKey(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

function loginErrorUrl(message: string, next: string): string {
  return `/login?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`;
}

/**
 * Starts a synthetic demo session. No real patient data is involved.
 * The cookie is httpOnly so the client never holds the session flag in JS.
 */
export async function signInDemo(formData?: FormData): Promise<void> {
  const store = await cookies();
  store.set(DEMO_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });

  const next = formData?.get("next");
  redirect(safeNext(next));
}

/**
 * Email/password sign-in or sign-up against Supabase.
 * The form's submit button sets `intent` to "signin" or "signup".
 * Errors are surfaced to the login page through a query parameter, so the
 * form works without client-side JavaScript.
 */
export async function submitEmailAuth(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const intent = formData.get("intent") === "signup" ? "signup" : "signin";
  const next = safeNext(formData.get("next"));

  if (!isSupabaseConfigured()) {
    redirect(
      loginErrorUrl(
        "Email sign-in is not configured on this deployment. Use the demo twin.",
        next,
      ),
    );
  }

  const limit = checkRateLimit(`auth:${await clientKey()}`, 8, 10 * 60_000);
  if (!limit.allowed) {
    redirect(
      loginErrorUrl(
        `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
        next,
      ),
    );
  }

  if (!email || !password) {
    redirect(loginErrorUrl("Enter both an email address and a password.", next));
  }

  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    redirect(loginErrorUrl("Enter a valid email address.", next));
  }

  if (password.length < 8 || password.length > 128) {
    redirect(loginErrorUrl("Passwords must be between 8 and 128 characters.", next));
  }

  const supabase = await createSupabaseServerClient();

  if (intent === "signup") {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      redirect(loginErrorUrl(error.message, next));
    }
    redirect(
      loginErrorUrl(
        "Account created. Check your inbox to confirm the address, then sign in.",
        next,
      ),
    );
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    redirect(loginErrorUrl(error.message, next));
  }

  redirect(next);
}

/** Clears both the Supabase session and the demo cookie. */
export async function signOut(): Promise<void> {
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
  }

  const store = await cookies();
  store.delete(DEMO_COOKIE);
  redirect("/");
}
