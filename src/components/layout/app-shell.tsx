import type { ReactNode } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { SidebarNav } from "./sidebar-nav";
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
      <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-border bg-bg-card/90 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <BrandMark compact />
          <span className="hidden text-sm font-semibold text-text-primary sm:inline">
            VitaTwin
          </span>
          <span className="rounded-full border border-border bg-bg-subtle px-2 py-0.5 text-[11px] font-medium text-text-secondary">
            Demo · synthetic
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-1.5 text-xs text-text-secondary md:flex">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
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
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-bg-card px-3 py-5 lg:block">
          <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
            Twin
          </p>
          <SidebarNav />
          <p className="mt-6 px-3 text-xs leading-relaxed text-text-muted">
            VitaTwin is a proof of concept. It is not a medical device and does
            not provide a diagnosis.
          </p>
        </aside>

        <main className="min-w-0 flex-1 px-4 pb-16 pt-5 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>

      {/* Mobile navigation */}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg-card px-1 py-1 lg:hidden"
        aria-label="Twin sections"
      >
        <div className="flex items-center justify-around">
          {[
            { href: "/dashboard", label: "Home" },
            { href: "/vitals", label: "Vitals" },
            { href: "/insights", label: "Insights" },
            { href: "/timeline", label: "History" },
            { href: "/profile", label: "Profile" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-xs font-medium text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
