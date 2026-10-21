import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { OnboardingDialog } from "@/components/onboarding/onboarding-dialog";
import { getViewerSession } from "@/lib/auth";
import { ONBOARDING_COOKIE } from "@/lib/onboarding";

/**
 * Server-side guard. Middleware already redirects unauthenticated requests,
 * but we re-check here so no page can ever render private data without a
 * session (defence in depth — SECURITY.md).
 */
export default async function AppGroupLayout({ children }: { children: ReactNode }) {
  const session = await getViewerSession();

  if (session.source === "none") {
    redirect("/login");
  }

  const onboarded = (await cookies()).get(ONBOARDING_COOKIE)?.value === "1";

  return (
    <AppShell
      session={{
        source: session.source,
        email: session.email,
      }}
    >
      {children}
      {onboarded ? null : <OnboardingDialog />}
    </AppShell>
  );
}
