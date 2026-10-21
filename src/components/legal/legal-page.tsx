import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { LegalLinks } from "./site-footer";

export const LEGAL_UPDATED = "21 October 2026";
export const CONTACT = process.env.NEXT_PUBLIC_CONTACT_EMAIL ?? "";

export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex items-center justify-between px-5 py-4 sm:px-8">
        <BrandMark />
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-text-secondary hover:text-primary-strong"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </Link>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 pb-16 pt-4 sm:px-8">
        <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">{title}</h1>
        <p className="mt-1 text-sm text-text-muted">Last updated {LEGAL_UPDATED}</p>
        <div className="mt-8 space-y-7 text-[15px] leading-relaxed text-text-secondary [&_h2]:mb-2 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-text-primary [&_li]:ml-5 [&_li]:list-disc [&_ul]:space-y-1">
          {children}
        </div>
      </main>
      <footer className="border-t border-border px-5 py-5 text-text-muted sm:px-8">
        <LegalLinks className="justify-center" />
      </footer>
    </div>
  );
}
