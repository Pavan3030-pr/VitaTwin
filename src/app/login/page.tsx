import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/ui/brand-mark";
import { Button } from "@/components/ui/button";
import { signInDemo, submitEmailAuth } from "@/lib/auth-actions";
import { isSupabaseConfigured } from "@/lib/auth";

interface LoginPageProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    typeof params.next === "string" && params.next.startsWith("/") && !params.next.startsWith("//")
      ? params.next
      : "/dashboard";
  const error = typeof params.error === "string" ? params.error : null;
  const supabaseReady = isSupabaseConfigured();

  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8">
        <BrandMark />
        <Link
          href="/"
          className="rounded-md px-3 py-1.5 text-sm text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary"
        >
          Back
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-border bg-bg-card p-6 shadow-sm sm:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
              Sign in to VitaTwin
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Open the demo twin instantly, or use your email account.
            </p>

            <form action={signInDemo} className="mt-6">
              <input type="hidden" name="next" value={nextPath} />
              <Button type="submit" size="lg" className="w-full">
                Continue with demo twin
              </Button>
            </form>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wide text-text-muted">
              <span className="h-px flex-1 bg-border" />
              or
              <span className="h-px flex-1 bg-border" />
            </div>

            {error ? (
              <p
                role="alert"
                className="mb-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-text-primary"
              >
                {error}
              </p>
            ) : null}

            <form action={submitEmailAuth} className="space-y-3" aria-describedby="supabase-note">
              <input type="hidden" name="next" value={nextPath} />
              <div>
                <label
                  htmlFor="email"
                  className="mb-1 block text-sm font-medium text-text-primary"
                >
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                  disabled={!supabaseReady}
                  className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-bg-subtle"
                />
              </div>
              <div>
                <label
                  htmlFor="password"
                  className="mb-1 block text-sm font-medium text-text-primary"
                >
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  minLength={8}
                  placeholder="••••••••"
                  disabled={!supabaseReady}
                  className="w-full rounded-md border border-border bg-bg-card px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:bg-bg-subtle"
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
              <p id="supabase-note" className="text-xs text-text-muted">
                {supabaseReady
                  ? "Backed by Supabase Auth. Passwords never touch our servers."
                  : "Email sign-in activates once NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set. The demo above always works."}
              </p>
            </form>
          </div>

          <p className="mt-4 flex items-start gap-2 rounded-lg border border-border bg-bg-subtle px-3 py-2 text-xs text-text-secondary">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <span>
              All patient data in this demonstration is synthetic. No real
              personal health information is processed.
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
