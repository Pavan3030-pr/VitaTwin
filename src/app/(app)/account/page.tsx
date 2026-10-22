import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/auth/auth-card";
import { DeleteAccountForm } from "@/components/account/delete-account-form";
import { getViewerSession } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account" };

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [params, session] = await Promise.all([searchParams, getViewerSession()]);
  const isDemo = session.source === "demo";

  return (
    <div className="space-y-7">
      <PageHeader
        title="Account"
        description="Your sign-in details, your data, and the option to delete everything."
      />

      <section>
        <SectionTitle>Sign-in</SectionTitle>
        <Card>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-text-muted">Signed in as</dt>
              <dd className="mt-0.5 font-medium text-text-primary">{session.email ?? "Demo session"}</dd>
            </div>
            <div>
              <dt className="text-xs text-text-muted">Session type</dt>
              <dd className="mt-0.5 font-medium text-text-primary">
                {isDemo ? "Demo (synthetic data, nothing stored)" : "Email account"}
              </dd>
            </div>
          </dl>
          {!isDemo ? (
            <p className="mt-4 text-sm text-text-secondary">
              Forgot or want to change your password?{" "}
              <Link href="/forgot-password" className="font-medium text-primary-strong hover:underline">
                Send yourself a reset link
              </Link>
              .
            </p>
          ) : null}
        </Card>
      </section>

      <section>
        <SectionTitle>Your data</SectionTitle>
        <Card>
          <p className="text-sm leading-relaxed text-text-secondary">
            {isDemo
              ? "The demo twin is generated on the fly and nothing about you is stored on our servers. Ending the demo only clears the cookies in this browser."
              : "We store your email, a profile record and any saved twin snapshots. Imported FHIR and wearable files are analysed and discarded."}{" "}
            Read the <Link href="/privacy" className="font-medium text-primary-strong hover:underline">privacy policy</Link> for details.
          </p>
        </Card>
      </section>

      <section>
        <SectionTitle>{isDemo ? "End demo session" : "Delete account"}</SectionTitle>
        <FormMessage error={typeof params.error === "string" ? params.error.slice(0, 240) : null} />
        <DeleteAccountForm isDemo={isDemo} />
      </section>
    </div>
  );
}
