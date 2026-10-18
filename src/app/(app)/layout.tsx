import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { getViewerSession } from "@/lib/auth";

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

  return (
    <AppShell
      session={{
        source: session.source,
        email: session.email,
      }}
    >
      {children}
    </AppShell>
  );
}
