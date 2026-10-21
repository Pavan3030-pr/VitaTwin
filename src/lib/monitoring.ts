/**
 * VitaTwin — error tracking.
 *
 * One seam for reporting failures. Every report is scrubbed of emails, tokens
 * and long numbers first, so health data can never leave in a message.
 *
 *  - Always: a scrubbed line goes to the server console (visible in Vercel Logs).
 *  - Optional: set ERROR_WEBHOOK_URL (Slack/Discord/any JSON webhook) to also
 *    receive each report. Server-side only; the URL never reaches the browser.
 *
 * Browser errors reach this file through POST /api/log-error.
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
  const safe = {
    scope: scrub(report.scope)?.slice(0, 60) ?? "unknown",
    digest: report.digest?.slice(0, 40),
    message: scrub(report.message),
  };
  console.error("[vitatwin:error]", safe);

  // Browsers never see the webhook URL (the variable has no NEXT_PUBLIC_ prefix).
  const hook = typeof window === "undefined" ? process.env.ERROR_WEBHOOK_URL : undefined;
  if (!hook) return;

  const text = `VitaTwin error · ${safe.scope}${safe.digest ? ` · ${safe.digest}` : ""}${safe.message ? `\n${safe.message}` : ""}`;
  void fetch(hook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, content: text, ...safe, at: new Date().toISOString() }),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {
    /* reporting must never throw */
  });
}
