"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  History,
  LayoutDashboard,
  Sparkles,
  Stethoscope,
  UserRound,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  short: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", short: "Home", icon: LayoutDashboard },
  { href: "/vitals", label: "Vitals & streams", short: "Vitals", icon: Activity },
  { href: "/insights", label: "Insights", short: "Insights", icon: Sparkles },
  { href: "/timeline", label: "Timeline", short: "History", icon: History },
  { href: "/clinician", label: "Clinician view", short: "Clinic", icon: Stethoscope },
  { href: "/profile", label: "Profile & EHR", short: "Profile", icon: UserRound },
];

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const isActive = useIsActive();

  return (
    <nav className="flex flex-col gap-1" aria-label="Twin sections">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(href);
        return (
          <Link
            key={href}
            href={href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? "bg-bg-wash text-primary-deep"
                : "text-text-secondary hover:bg-bg-subtle hover:text-text-primary"
            }`}
          >
            <Icon
              className={`h-[18px] w-[18px] ${active ? "text-primary-strong" : "text-text-muted"}`}
              aria-hidden="true"
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Bottom tab bar for phones — all six twin sections, icon + label. */
export function MobileNav() {
  const isActive = useIsActive();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-card/95 px-1 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden"
      aria-label="Twin sections (mobile)"
    >
      <ul className="grid grid-cols-6">
        {NAV_ITEMS.map(({ href, short, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 rounded-md py-2 text-[10.5px] font-medium ${
                  active ? "text-primary-strong" : "text-text-secondary"
                }`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
                {short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
