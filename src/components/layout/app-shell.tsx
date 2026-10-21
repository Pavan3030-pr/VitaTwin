import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { MobileNav, SidebarNav } from "./sidebar-nav";
import { LegalLinks } from "@/components/legal/site-footer";
import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "@/lib/auth-actions";
import type { SessionSource } from "@/lib/auth";

export interface AppShellSession {
  source: SessionSource;
  email: string | null;
}

export function AppShell({
  children,
  session,
}: {
  children: ReactNode;
  session: AppShellSession;
}) {
  const identity = session.email ?? (session.source === "demo" ? "Demo session" : null);
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-bg-card/90 px-4 py-2.5 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <BrandMark />
          <span className="hidden rounded-full bg-bg-wash px-2.5 py-0.5 text-[11px] font-semibold text-primary-deep sm:inline">
            Demo · synthetic
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-text-secondary md:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-primary-strong" aria-hidden="true" />
            All data is synthetic
          </span>
          {identity ? (
            <span
              className="hidden max-w-[14rem] truncate text-xs text-text-secondary sm:inline"
              title={identity}
            >
              {identity}
            </span>
          ) : null}
          <Link
            href="/account"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-primary-strong"
          >
            Account
          </Link>
          <form action={signOut}>
            <SubmitButton
              variant="secondary"
              size="sm"
              className="h-auto px-3.5 py-1.5 font-medium text-text-secondary"
              pendingLabel="Signing out…"
            >
              Sign out
            </SubmitButton>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-bg-card px-3 py-5 lg:block">
          <SidebarNav />
          <p className="mt-8 px-3 text-xs leading-relaxed text-text-muted">
            VitaTwin is a proof of concept. It is not a medical device and does not provide a
            diagnosis.
          </p>
          <LegalLinks className="mt-4 px-3 text-text-muted" />
        </aside>

        <main id="main-content" tabIndex={-1} className="min-w-0 flex-1 outline-none px-4 pb-24 pt-6 sm:px-6 lg:px-10 lg:pb-16">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
