/**
 * VitaTwin — shared input validation (used by server actions and tests).
 * Every function returns a human-readable error string, or null when valid.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value: string): string | null {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) return "Enter a valid email address.";
  return null;
}

export function validatePassword(value: string): string | null {
  if (!value) return "Enter a password.";
  if (value.length < 8) return "Use at least 8 characters.";
  if (value.length > 128) return "Use 128 characters or fewer.";
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) {
    return "Use at least one letter and one number.";
  }
  return null;
}

export function validatePasswordPair(password: string, confirm: string): string | null {
  const problem = validatePassword(password);
  if (problem) return problem;
  if (password !== confirm) return "The two passwords do not match.";
  return null;
}

/** Only same-origin relative paths are accepted as post-login destinations. */
export function safeNextPath(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }
  if (value.includes("\\")) return fallback;
  return value;
}
