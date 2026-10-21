"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/client-monitoring";

/** Last-resort boundary: replaces the root layout, so it brings its own <html>. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError("global", error, error.digest);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", textAlign: "center", padding: "20vh 1rem" }}>
        <h1 style={{ fontSize: "1.5rem" }}>VitaTwin hit an unexpected problem</h1>
        <p style={{ color: "#52606d" }}>Nothing was saved. Please reload the page.</p>
        <button
          type="button"
          onClick={reset}
          style={{ marginTop: "1rem", padding: "0.7rem 1.5rem", borderRadius: 999, border: 0, background: "#0f766e", color: "#fff", fontWeight: 600 }}
        >
          Reload
        </button>
      </body>
    </html>
  );
}
