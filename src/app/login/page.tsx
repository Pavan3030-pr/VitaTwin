import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { TwinFigure } from "@/components/twin/twin-figure";
import { signInDemo, submitEmailAuth, resendVerification } from "@/lib/auth-actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { FormMessage } from "@/components/auth/auth-card";
import { LegalLinks } from "@/components/legal/site-footer";
import { safeNextPath } from "@/lib/validation";
import { isSupabaseConfigured } from "@/lib/auth";
import { generateDemoBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string; notice?: string; resend?: string }>;
}

const INPUT =
  "mt-1 w-full rounded-lg border border-border-strong bg-bg-card px-3.5 py-2.5 text-[15px] text-text-primary placeholder:text-text-muted focus:border-primary-strong focus:outline-none focus:ring-2 focus:ring-primary-strong/20 disabled:cursor-not-allowed disabled:bg-bg-subtle";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = safeNextPath(params.next);
  const error = typeof params.error === "string" ? params.error.slice(0, 240) : null;
  const notice = typeof params.notice === "string" ? params.notice.slice(0, 240) : null;
  const showResend = params.resend === "1";
  const supabaseReady = isSupabaseConfigured();
  const { vitals, patient } = generateDemoBundle();
  const hba1c = patient.recentLabs.find((lab) => lab.name === "HbA1c")?.value ?? null;

  return (
    <div className="grid min-h-screen lg:grid-cols-[1fr_1.05fr]">
      <aside className="hidden bg-bg-wash lg:flex lg:flex-col lg:justify-between lg:px-12 lg:py-10">
        <BrandMark />
        <div>
          <TwinFigure
            readings={{
              heartRate: vitals.heartRateBpm,
              spo2: vitals.spO2,
              sleepHours: vitals.sleepHours,
              hba1c,
            }}
          />
        </div>
        <p className="max-w-sm text-sm leading-relaxed text-text-secondary">
          A twin of a synthetic patient is waiting. Open it to see risk scores, the reasons behind
          them and what could change them.
        </p>
      </aside>

      <div className="flex flex-col bg-bg-page">
        <header className="flex items-center justify-between px-5 py-4 sm:px-8">
          <span className="lg:hidden">
            <BrandMark />
          </span>
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-primary-strong"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back
          </Link>
        </header>

        <main id="main-content" className="flex flex-1 items-center justify-center px-5 pb-16 pt-4">
          <div className="w-full max-w-md">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
              Sign in to VitaTwin
            </h1>
            <p className="mt-1.5 text-[15px] text-text-secondary">
              Open the demo twin instantly, or use your email account.
            </p>

            <form action={signInDemo} className="mt-7">
              <input type="hidden" name="next" value={nextPath} />
              <SubmitButton size="lg" className="w-full" pendingLabel="Opening demo…">
                Continue with demo twin
              </SubmitButton>
            </form>

            <div className="my-7 flex items-center gap-3 text-sm text-text-muted">
              <span className="h-px flex-1 bg-border" />
              or use email
              <span className="h-px flex-1 bg-border" />
            </div>

            <FormMessage error={error} notice={notice} />

            <form action={submitEmailAuth} className="space-y-4" aria-describedby="supabase-note">
              <input type="hidden" name="next" value={nextPath} />
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
                  disabled={!supabaseReady}
                  className={INPUT}
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs font-medium text-primary-strong hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  maxLength={128}
                  placeholder="At least 8 characters"
                  disabled={!supabaseReady}
                  className={INPUT}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <SubmitButton
                  name="intent"
                  value="signin"
                  variant="secondary"
                  className="w-full"
                  disabled={!supabaseReady}
                  pendingLabel="Signing in…"
                >
                  Sign in
                </SubmitButton>
                <SubmitButton
                  name="intent"
                  value="signup"
                  variant="ghost"
                  className="w-full"
                  disabled={!supabaseReady}
                  pendingLabel="Creating…"
                >
                  Create account
                </SubmitButton>
              </div>
              {showResend ? (
                <SubmitButton
                  formAction={resendVerification}
                  variant="secondary"
                  size="sm"
                  disabled={!supabaseReady}
                  pendingLabel="Sending…"
                >
                  Resend confirmation email
                </SubmitButton>
              ) : null}
              <p className="text-xs text-text-muted">
                By creating an account you agree to the <Link href="/terms" className="underline hover:text-primary-strong">Terms</Link> and{" "}
                <Link href="/privacy" className="underline hover:text-primary-strong">Privacy policy</Link>.
              </p>
              <p id="supabase-note" className="text-xs leading-relaxed text-text-muted">
                {supabaseReady
                  ? "Backed by Supabase Auth. Passwords never touch our servers."
                  : "Email sign-in activates once NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set. The demo above always works."}
              </p>
            </form>

            <p className="mt-8 flex items-start gap-2 rounded-lg bg-bg-wash px-3.5 py-3 text-sm text-primary-deep">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                All patient data in this demonstration is synthetic. No real personal health
                information is processed.
              </span>
            </p>
          </div>
        </main>
        <footer className="px-5 pb-6 text-text-muted sm:px-8">
          <LegalLinks className="justify-center" />
        </footer>
      </div>
    </div>
  );
}
