/**
 * Maps raw Supabase Auth messages to clear, non-technical copy.
 * Unknown messages fall back to a generic line so internals never leak.
 */

export interface FriendlyAuthError {
  message: string;
  /** True when the user can fix this by asking for a new confirmation email. */
  canResend: boolean;
}

const RULES: Array<{ test: RegExp; message: string; canResend?: boolean }> = [
  { test: /invalid login credentials/i, message: "That email and password do not match. Check them and try again." },
  {
    test: /email not confirmed/i,
    message: "Confirm your email first. Open the link we sent you, or ask for a new one below.",
    canResend: true,
  },
  { test: /already registered|already been registered/i, message: "An account with that email already exists. Try signing in instead." },
  { test: /password should be at least|weak password/i, message: "That password is too weak. Use at least 8 characters with a letter and a number." },
  { test: /rate limit|too many requests|security purposes/i, message: "Too many requests. Please wait a minute and try again." },
  { test: /same password|different from the old password/i, message: "Choose a password you have not used before." },
  { test: /expired|invalid.*(token|link|otp)|otp/i, message: "That link has expired or was already used. Request a new one." },
  { test: /network|fetch failed/i, message: "We could not reach the sign-in service. Check your connection and try again." },
];

export function friendlyAuthError(raw: string | undefined | null): FriendlyAuthError {
  const text = raw ?? "";
  for (const rule of RULES) {
    if (rule.test.test(text)) return { message: rule.message, canResend: rule.canResend ?? false };
  }
  return { message: "Something went wrong. Please try again in a moment.", canResend: false };
}
