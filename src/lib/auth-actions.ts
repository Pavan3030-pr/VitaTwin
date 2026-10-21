"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_COOKIE, isSupabaseConfigured } from "./auth";
import { createSupabaseServerClient } from "./supabase/server";
import { checkRateLimit } from "./rate-limit";
import { getClientKey, getOrigin } from "./client-key";
import { friendlyAuthError } from "./auth-errors";
import { safeNextPath, validateEmail, validatePassword, validatePasswordPair } from "./validation";

function loginUrl(opts: { error?: string; notice?: string; next: string; resend?: boolean }): string {
  const q = new URLSearchParams();
  if (opts.error) q.set("error", opts.error);
  if (opts.notice) q.set("notice", opts.notice);
  if (opts.resend) q.set("resend", "1");
  q.set("next", opts.next);
  return `/login?${q.toString()}`;
}

function formUrl(path: string, opts: { error?: string; notice?: string }): string {
  const q = new URLSearchParams();
  if (opts.error) q.set("error", opts.error);
  if (opts.notice) q.set("notice", opts.notice);
  return `${path}?${q.toString()}`;
}

const NOT_CONFIGURED = "Email sign-in is not configured on this deployment. Use the demo twin.";

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

  redirect(safeNextPath(formData?.get("next")));
}

/**
 * Email/password sign-in or sign-up against Supabase.
 * The form's submit button sets `intent` to "signin" or "signup".
 * Errors and notices travel through query parameters, so the form works
 * without client-side JavaScript.
 */
export async function submitEmailAuth(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const intent = formData.get("intent") === "signup" ? "signup" : "signin";
  const next = safeNextPath(formData.get("next"));

  if (!isSupabaseConfigured()) redirect(loginUrl({ error: NOT_CONFIGURED, next }));

  const limit = checkRateLimit(`auth:${await getClientKey()}`, 8, 10 * 60_000);
  if (!limit.allowed) {
    redirect(
      loginUrl({
        error: `Too many attempts. Try again in ${Math.ceil(limit.retryAfterSeconds / 60)} minute(s).`,
        next,
      }),
    );
  }

  const emailProblem = validateEmail(email);
  if (emailProblem) redirect(loginUrl({ error: emailProblem, next }));

  // Strength rules apply to new passwords only; existing users may predate them.
  const passwordProblem =
    intent === "signup"
      ? validatePassword(password)
      : password.length === 0 || password.length > 128
        ? "Enter your password."
        : null;
  if (passwordProblem) redirect(loginUrl({ error: passwordProblem, next }));

  const supabase = await createSupabaseServerClient();

  if (intent === "signup") {
    const origin = await getOrigin();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) redirect(loginUrl({ error: friendlyAuthError(error.message).message, next }));
    // Projects with confirmation switched off return a session straight away.
    if (data.session) redirect(next);
    redirect(
      loginUrl({
        notice: "Account created. We sent a confirmation link to your email. Open it, then sign in.",
        next,
      }),
    );
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    const friendly = friendlyAuthError(error.message);
    redirect(loginUrl({ error: friendly.message, next, resend: friendly.canResend }));
  }

  redirect(next);
}

/** Sends a fresh confirmation email (used from the login form). */
export async function resendVerification(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();
  const next = safeNextPath(formData.get("next"));

  if (!isSupabaseConfigured()) redirect(loginUrl({ error: NOT_CONFIGURED, next }));

  const limit = checkRateLimit(`resend:${await getClientKey()}`, 3, 15 * 60_000);
  if (!limit.allowed) {
    redirect(loginUrl({ error: "Too many requests. Please wait a few minutes and try again.", next }));
  }
  const emailProblem = validateEmail(email);
  if (emailProblem) redirect(loginUrl({ error: emailProblem, next, resend: true }));

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) redirect(loginUrl({ error: friendlyAuthError(error.message).message, next }));

  redirect(loginUrl({ notice: "If that address has an unconfirmed account, a new link is on its way.", next }));
}

/** Step 1 of password reset: email a recovery link. Never reveals if the account exists. */
export async function requestPasswordReset(formData: FormData): Promise<void> {
  const email = String(formData.get("email") ?? "").trim();

  if (!isSupabaseConfigured()) redirect(formUrl("/forgot-password", { error: NOT_CONFIGURED }));

  const limit = checkRateLimit(`reset:${await getClientKey()}`, 3, 15 * 60_000);
  if (!limit.allowed) {
    redirect(formUrl("/forgot-password", { error: "Too many requests. Please wait a few minutes and try again." }));
  }
  const emailProblem = validateEmail(email);
  if (emailProblem) redirect(formUrl("/forgot-password", { error: emailProblem }));

  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });
  // Only surface infrastructure problems; "no such user" must look identical to success.
  if (error && /rate limit|too many|security purposes/i.test(error.message)) {
    redirect(formUrl("/forgot-password", { error: friendlyAuthError(error.message).message }));
  }

  redirect(
    formUrl("/forgot-password", {
      notice: "If an account exists for that email, a reset link is on its way. It expires in about an hour.",
    }),
  );
}

/** Step 2 of password reset: the recovery link has signed the user in; set the new password. */
export async function updatePassword(formData: FormData): Promise<void> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!isSupabaseConfigured()) redirect(formUrl("/reset-password", { error: NOT_CONFIGURED }));

  const problem = validatePasswordPair(password, confirm);
  if (problem) redirect(formUrl("/reset-password", { error: problem }));

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(formUrl("/forgot-password", { error: "That reset link has expired. Request a new one." }));
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(formUrl("/reset-password", { error: friendlyAuthError(error.message).message }));

  await supabase.auth.signOut();
  redirect(loginUrl({ notice: "Password updated. Sign in with your new password.", next: "/dashboard" }));
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
