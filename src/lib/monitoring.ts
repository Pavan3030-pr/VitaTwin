/**
 * VitaTwin — error-tracking placeholder (Phase 6).
 *
 * One seam for reporting failures. Today it logs a *scrubbed* record to the
 * console; swap the body for Sentry / Vercel Observability later without
 * touching call sites. Health data is never logged (SECURITY.md).
 */

export interface ErrorReport {
  scope: string;
  digest?: string;
  message?: string;
}

// Order matters: whole emails and whole tokens first, then bare long numbers.
const PATTERNS: RegExp[] = [
  /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g,
  /\beyJ[\w-]+(?:\.[\w-]+)*/g,
  /\bbearer\s+\S+/gi,
  /\b\d{3,}\b/g,
];

/** Removes emails, tokens and long numbers so a report can never carry PHI. */
export function scrub(text: string | undefined): string | undefined {
  if (text === undefined) return undefined;
  return PATTERNS.reduce((out, pattern) => out.replace(pattern, "[redacted]"), text).slice(0, 200);
}

export function reportError(report: ErrorReport): void {
  const safe = { scope: report.scope, digest: report.digest, message: scrub(report.message) };
  console.error("[vitatwin:error]", safe);
}
