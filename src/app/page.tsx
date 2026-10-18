import Link from "next/link";
import { Activity, HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "@/components/ui/brand-mark";

const highlights = [
  {
    icon: HeartPulse,
    title: "Continuous fusion",
    body: "Wearable streams and EHR snapshots combine into one living twin state.",
  },
  {
    icon: Sparkles,
    title: "Explainable risk",
    body: "Every score ships with the factors that drove it — no black boxes.",
  },
  {
    icon: Activity,
    title: "Early warning",
    body: "Rising nocturnal heart rate plus poor sleep flags next-day cardiac stress.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy first",
    body: "Synthetic data only, server-side computation, nothing sensitive in the browser.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="flex items-center justify-between border-b border-border px-5 py-4 sm:px-8">
        <BrandMark />
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary">
          <Link
            href="/login"
            className="rounded-md px-3 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-subtle hover:text-text-primary"
          >
            Sign in
          </Link>
          <Link href="/login">
            <Button size="sm">Open demo</Button>
          </Link>
        </nav>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-12 sm:px-8 sm:py-16">
        <section className="text-center">
          <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Digital Twin Challenge 2026
          </p>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-text-primary sm:text-5xl">
            Your living{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              digital health twin
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary sm:text-lg">
            VitaTwin fuses wearable signals and EHR data to predict
            cardiometabolic risk before an event happens, and turns that model
            into guidance a person can act on today.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/login">
              <Button size="lg" className="w-full sm:w-auto">
                Explore the demo twin
              </Button>
            </Link>
            <Link href="#how-it-works">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                See how it works
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-xs text-text-muted">
            All patient data in this demonstration is synthetic.
          </p>
        </section>

        <section
          id="how-it-works"
          className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {highlights.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-xl border border-border bg-bg-card p-5 shadow-sm"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary-soft text-primary">
                <Icon className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <h2 className="mt-3 text-sm font-semibold text-text-primary">
                {title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                {body}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-14 overflow-hidden rounded-2xl border border-border bg-bg-card shadow-sm">
          <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="max-w-xl">
              <h2 className="text-xl font-semibold text-text-primary">
                Built for India&rsquo;s cardiometabolic burden
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Young-onset diabetes and hypertension are rising fast, yet care
                is still reactive. VitaTwin demonstrates how a continuously
                updated twin can shift that to proactive, personalised care.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                <span className="rounded-md bg-bg-subtle px-2.5 py-1 text-text-secondary">
                  CVD risk
                </span>
                <span className="rounded-md bg-bg-subtle px-2.5 py-1 text-text-secondary">
                  Diabetes progression
                </span>
                <span className="rounded-md bg-bg-subtle px-2.5 py-1 text-text-secondary">
                  Acute stress
                </span>
                <span className="rounded-md bg-bg-subtle px-2.5 py-1 text-text-secondary">
                  Clinician lens
                </span>
              </div>
            </div>
            <div className="flex h-28 w-full max-w-xs items-end gap-1.5 sm:h-32">
              {[38, 52, 45, 63, 71, 58, 82, 69, 55, 61, 48, 43].map((height, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-primary to-accent"
                  style={{ height: `${height}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-6 text-center text-xs text-text-muted sm:px-8">
        VitaTwin · Digital Twin Challenge 2026 · Happiest Health · Synthetic data
        only · Light theme only
      </footer>
    </div>
  );
}
