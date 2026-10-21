"use client";

import Link from "next/link";
import { useEffect } from "react";
import { reportClientError } from "@/lib/client-monitoring";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError("root-route", error, error.digest);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <h1 className="font-display text-2xl font-semibold text-text-primary">Something went wrong</h1>
      <p className="mt-1.5 max-w-md text-sm text-text-secondary">
        This page could not be shown. Nothing was saved. You can try again or head back home.
      </p>
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-full bg-primary-strong px-6 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Try again
        </button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-full border border-border-strong px-6 text-sm font-semibold text-text-primary hover:border-primary-strong"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
