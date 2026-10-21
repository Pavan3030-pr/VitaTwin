import type { Metadata } from "next";
import { AuthCard, AUTH_INPUT, FormMessage } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { requestPasswordReset } from "@/lib/auth-actions";
import { isSupabaseConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reset your password · VitaTwin" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const ready = isSupabaseConfigured();

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the email you signed up with and we will send you a reset link."
    >
      <FormMessage
        error={typeof params.error === "string" ? params.error.slice(0, 240) : null}
        notice={typeof params.notice === "string" ? params.notice.slice(0, 240) : null}
      />
      <form action={requestPasswordReset} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-text-primary">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@example.com"
            disabled={!ready}
            className={AUTH_INPUT}
          />
        </div>
        <SubmitButton className="w-full" disabled={!ready} pendingLabel="Sending link…">
          Send reset link
        </SubmitButton>
        {!ready ? (
          <p className="text-xs text-text-muted">
            Password reset works once email sign-in is configured. The demo twin needs no password.
          </p>
        ) : null}
      </form>
    </AuthCard>
  );
}
