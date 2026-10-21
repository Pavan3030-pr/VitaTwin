"use client";

import { Printer } from "lucide-react";

/** Opens the browser print dialog (choose "Save as PDF"). Hidden when printing. */
export function PrintButton({ label = "Print / save as PDF" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-2 rounded-full border border-border-strong bg-bg-card px-4 text-sm font-semibold text-text-primary transition-colors hover:border-primary-strong hover:text-primary-strong print:hidden"
    >
      <Printer className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  );
}
