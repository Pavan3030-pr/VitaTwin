import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { TwinFigure } from "@/components/twin/twin-figure";
import { signInDemo, submitEmailAuth } from "@/lib/auth-actions";
import { isSupabaseConfigured } from "@/lib/auth";
import { generateDemoBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

const INPUT =
  "mt-1 w-full rounded-lg border border-border-strong bg-bg-card px-3.5 py-2.5 text-[15px] text-text-primary placeholder:text-text-muted focus:border-primary-strong focus:outline-none focus:ring-2 focus:ring-primary-strong/20 disabled:cursor-not-allowed disabled:bg-bg-subtle";

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";
  const error = typeof params.error === "string" ? params.error.slice(0, 240) : null;
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

        <main className="flex flex-1 items-center justify-center px-5 pb-16 pt-4">
          <div className="w-full max-w-md">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
              Sign in to VitaTwin
            </h1>
            <p className="mt-1.5 text-[15px] text-text-secondary">
              Open the demo twin instantly, or use your email account.
            </p>

            <form action={signInDemo} className="mt-7">
              <input type="hidden" name="next" value={nextPath} />
              <Button type="submit" size="lg" className="w-full">
                Continue with demo twin
              </Button>
            </form>

            <div className="my-7 flex items-center gap-3 text-sm text-text-muted">
              <span className="h-px flex-1 bg-border" />
              or use email
              <span className="h-px flex-1 bg-border" />
            </div>

            {error ? (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-warning/40 bg-warning-soft px-3.5 py-2.5 text-sm text-warning-ink"
              >
                {error}
              </p>
            ) : null}

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
                <label htmlFor="password" className="block text-sm font-medium text-text-primary">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  maxLength={128}
                  placeholder="At least 8 characters"
                  disabled={!supabaseReady}
                  className={INPUT}
                />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button
                  type="submit"
                  name="intent"
                  value="signin"
                  variant="secondary"
                  className="w-full"
                  disabled={!supabaseReady}
                >
                  Sign in
                </Button>
                <Button
                  type="submit"
                  name="intent"
                  value="signup"
                  variant="ghost"
                  className="w-full"
                  disabled={!supabaseReady}
                >
                  Create account
                </Button>
              </div>
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
      </div>
    </div>
  );
}
