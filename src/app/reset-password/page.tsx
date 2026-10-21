import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard, AUTH_INPUT, FormMessage } from "@/components/auth/auth-card";
import { SubmitButton } from "@/components/ui/submit-button";
import { updatePassword } from "@/lib/auth-actions";
import { isSupabaseConfigured } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Choose a new password · VitaTwin" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  let hasRecoverySession = false;
  if (isSupabaseConfigured()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    hasRecoverySession = Boolean(user);
  }

  if (!hasRecoverySession) {
    return (
      <AuthCard title="Link expired" description="This reset link is missing, expired or already used.">
        <Link
          href="/forgot-password"
          className="inline-flex h-11 items-center rounded-full bg-primary-strong px-6 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          Request a new link
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Choose a new password" description="Use at least 8 characters with a letter and a number.">
      <FormMessage error={typeof params.error === "string" ? params.error.slice(0, 240) : null} />
      <form action={updatePassword} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-text-primary">
            New password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            className={AUTH_INPUT}
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-text-primary">
            Confirm new password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            className={AUTH_INPUT}
          />
        </div>
        <SubmitButton className="w-full" pendingLabel="Updating…">
          Update password
        </SubmitButton>
      </form>
    </AuthCard>
  );
}
