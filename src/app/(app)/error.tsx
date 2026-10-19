"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { reportError } from "@/lib/monitoring";

/**
 * Route-level error boundary. Shows a calm, generic message and a retry —
 * never internal error details (SECURITY.md: no internal leakage).
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Only a correlation digest leaves the component, never health data.
    reportError({ scope: "app-route", digest: error.digest });
  }, [error]);

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger-ink">
        <AlertTriangle className="h-6 w-6" aria-hidden="true" />
      </span>
      <h1 className="mt-4 font-display text-2xl font-semibold text-text-primary">
        That view could not be rendered
      </h1>
      <p className="mt-1.5 text-sm text-text-secondary">
        The twin state failed to load. Nothing was saved and no patient data was affected.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 inline-flex h-11 items-center rounded-full bg-primary-strong px-6 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
      >
        Try again
      </button>
    </div>
  );
}
