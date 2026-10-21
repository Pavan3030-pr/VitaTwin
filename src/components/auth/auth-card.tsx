import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { LegalLinks } from "@/components/legal/site-footer";

export const AUTH_INPUT =
  "mt-1 w-full rounded-lg border border-border-strong bg-bg-card px-3.5 py-2.5 text-[15px] text-text-primary placeholder:text-text-muted focus:border-primary-strong focus:outline-none focus:ring-2 focus:ring-primary-strong/20 disabled:cursor-not-allowed disabled:bg-bg-subtle";

/** Centered single-column shell for the small auth pages. */
export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <BrandMark />
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-primary-strong"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to sign in
        </Link>
      </header>
      <main id="main-content" className="flex flex-1 items-start justify-center px-5 pb-16 pt-10 sm:items-center sm:pt-4">
        <div className="w-full max-w-md">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">{title}</h1>
          <p className="mt-1.5 text-[15px] text-text-secondary">{description}</p>
          <div className="mt-7">{children}</div>
        </div>
      </main>
      <footer className="px-5 py-5 text-text-muted sm:px-8">
        <LegalLinks className="justify-center" />
      </footer>
    </div>
  );
}

/** Inline banner for ?error= and ?notice= messages. */
export function FormMessage({ error, notice }: { error?: string | null; notice?: string | null }) {
  if (error) {
    return (
      <p role="alert" className="mb-4 rounded-lg border border-warning/40 bg-warning-soft px-3.5 py-2.5 text-sm text-warning-ink">
        {error}
      </p>
    );
  }
  if (notice) {
    return (
      <p role="status" className="mb-4 rounded-lg border border-success/30 bg-success-soft px-3.5 py-2.5 text-sm text-success-ink">
        {notice}
      </p>
    );
  }
  return null;
}
