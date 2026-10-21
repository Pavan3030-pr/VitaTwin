"use client";

/**
 * Browser → server error reporting. Sends a tiny, already-trimmed payload to
 * /api/log-error, where it is scrubbed again and logged. Never throws.
 */
export function reportClientError(scope: string, error?: unknown, digest?: string): void {
  try {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : undefined;
    const body = JSON.stringify({ scope, digest, message: message?.slice(0, 200) });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon("/api/log-error", new Blob([body], { type: "application/json" }));
      return;
    }
    void fetch("/api/log-error", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* reporting must never throw */
  }
}
