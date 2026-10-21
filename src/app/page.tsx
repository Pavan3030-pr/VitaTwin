import Link from "next/link";
import { ArrowRight, Database, LockKeyhole, Server, ShieldCheck } from "lucide-react";
import { BrandMark, LogoGlyph } from "@/components/ui/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { RiskBadge } from "@/components/ui/risk-badge";
import { TwinFigure } from "@/components/twin/twin-figure";
import { RiskRing } from "@/components/twin/risk-ring";
import { LegalLinks } from "@/components/legal/site-footer";
import { generateDemoBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

const SIGNALS = ["Heart rate", "Heart-rate variability", "Sleep stages", "Blood oxygen", "Daily steps"];
const RECORDS = ["Lab results", "Diagnoses", "Medications", "Family history"];

const TRUST = [
  {
    icon: Database,
    title: "Synthetic patients only",
    body: "No real health records enter the system. Every demo value is generated.",
  },
  {
    icon: Server,
    title: "Models run on the server",
    body: "The browser receives results and reasons, never keys or raw model logic.",
  },
  {
    icon: LockKeyhole,
    title: "Private by default",
    body: "Sign-in is required for every twin page, backed by row-level security.",
  },
  {
    icon: ShieldCheck,
    title: "A proof of concept",
    body: "Heuristic models for demonstration. Not a medical device, not a diagnosis.",
  },
];

export default function LandingPage() {
  const { twin, patient, vitals } = generateDemoBundle();
  const cvd = twin.riskScores.find((score) => score.type === "cvd-10yr");
  const hba1c = patient.recentLabs.find((lab) => lab.name === "HbA1c")?.value ?? null;
  const drivers = [...(cvd?.factors ?? [])].sort((a, b) => b.weight - a.weight).slice(0, 6);
  const maxWeight = Math.max(1, ...drivers.map((driver) => driver.weight));

  return (
    <div className="flex min-h-screen flex-col bg-bg-page">
      <header className="sticky top-0 z-30 border-b border-border/70 bg-bg-page/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <BrandMark />
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
            <a
              href="#how-it-works"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary-strong md:inline"
            >
              How it works
            </a>
            <a
              href="#explainable"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary-strong md:inline"
            >
              Explainability
            </a>
            <a
              href="#india"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-text-secondary hover:text-primary-strong md:inline"
            >
              Why India
            </a>
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Open demo
            </Link>
          </nav>
        </div>
      </header>

      <main id="main-content" className="flex-1">
        {/* Hero */}
        <section className="bg-bg-wash">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 sm:px-8 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-20">
            <div className="max-w-xl">
              <h1 className="font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-text-primary sm:text-6xl">
                Your living digital health twin
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-text-secondary">
                VitaTwin combines wearable signals and health records into one model. It spots
                heart and diabetes risk early and shows exactly why.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/login" className={buttonVariants({ size: "lg" })}>
                  Open the demo twin
                </Link>
                <a href="#how-it-works" className={buttonVariants({ variant: "secondary", size: "lg" })}>
                  See how it works
                </a>
              </div>

              <p className="mt-5 flex items-start gap-2 text-sm text-text-secondary">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-strong" aria-hidden="true" />
                All patient data in this demonstration is synthetic.
              </p>
            </div>

            <div>
              <TwinFigure
                readings={{
                  heartRate: vitals.heartRateBpm,
                  spo2: vitals.spO2,
                  sleepHours: vitals.sleepHours,
                  hba1c,
                }}
              />
              <p className="mt-2 text-center text-xs text-text-muted">
                {patient.demographics.firstName}, {patient.age}, a synthetic patient. The dashed
                outline is her twin.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <h2 className="max-w-2xl font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
            From a wrist and a lab report to a risk you can act on
          </h2>

          <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-stretch lg:gap-6">
            <div>
              <h3 className="font-display text-lg font-semibold text-text-primary">Signals in</h3>
              <p className="mt-1 text-sm text-text-secondary">Seven days of hourly readings and the latest record.</p>
              <ul className="mt-4 flex flex-wrap gap-2">
                {SIGNALS.map((item) => (
                  <li key={item} className="rounded-full bg-bg-subtle px-3 py-1 text-sm text-text-primary">
                    {item}
                  </li>
                ))}
              </ul>
              <ul className="mt-2 flex flex-wrap gap-2">
                {RECORDS.map((item) => (
                  <li key={item} className="rounded-full border border-border-strong px-3 py-1 text-sm text-text-primary">
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="hidden items-center lg:flex" aria-hidden="true">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-text-primary">One twin</h3>
              <p className="mt-1 text-sm text-text-secondary">
                A fusion step reduces the window to a single, current state of the person and
                recomputes it on every visit.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <LogoGlyph className="h-14 w-14" />
                <p className="text-sm text-text-secondary">
                  Vitals, risk scores, trends and alerts, all derived and never stored as a black box.
                </p>
              </div>
            </div>

            <div className="hidden items-center lg:flex" aria-hidden="true">
              <ArrowRight className="h-5 w-5 text-primary" />
            </div>

            <div>
              <h3 className="font-display text-lg font-semibold text-text-primary">Reasons out</h3>
              <p className="mt-1 text-sm text-text-secondary">
                Three risk models, alerts and plain-language next steps.
              </p>
              {cvd && (
                <div className="mt-4 flex items-center gap-4">
                  <RiskRing value={cvd.value} category={cvd.category} size={84} />
                  <div>
                    <p className="text-sm font-semibold text-text-primary">Heart and vessels, 10 years</p>
                    <div className="mt-1">
                      <RiskBadge category={cvd.category} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Explainability */}
        <section id="explainable" className="border-y border-border bg-bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div className="max-w-md">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                Every score shows its working
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
                A number alone is hard to trust. Each VitaTwin score arrives with the factors
                that pushed it up, how much each one counted, and why it matters. A clinician can
                audit the reasoning in seconds.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-strong hover:text-primary-hover"
              >
                See it on the demo twin
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>

            <div>
              <p className="text-sm text-text-muted">What drove the demo patient&rsquo;s cardiovascular score</p>
              <ul className="mt-3 divide-y divide-border">
                {drivers.map((driver) => (
                  <li key={driver.factor} className="py-3">
                    <div className="flex items-baseline justify-between gap-4">
                      <p className="text-sm font-semibold text-text-primary">{driver.factor}</p>
                      <p className="num text-sm text-text-secondary">+{driver.weight} pts</p>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-bg-subtle">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(driver.weight / maxWeight) * 100}%` }}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-text-muted">{driver.note}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* India */}
        <section id="india" className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
            <div className="max-w-md">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
                Built for India&rsquo;s cardiometabolic burden
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-text-secondary">
                Diabetes and high blood pressure often begin in the thirties and forties, yet most
                care starts after an event. A twin moves the question from &ldquo;what
                happened?&rdquo; to &ldquo;what is likely next, and what can change it?&rdquo;
              </p>
            </div>

            <dl className="grid grid-cols-1 gap-6 self-center sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-border">
              {[
                { figure: "101 million", label: "adults living with diabetes" },
                { figure: "136 million", label: "adults with prediabetes" },
                { figure: "315 million", label: "adults with hypertension" },
              ].map((stat) => (
                <div key={stat.label} className="flex flex-col-reverse sm:px-6 sm:first:pl-0 sm:last:pr-0">
                  <dt className="text-sm text-text-secondary">{stat.label}</dt>
                  <dd className="num mt-1 whitespace-nowrap font-display text-[1.7rem] font-semibold text-primary-deep">
                    {stat.figure}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
          <p className="mt-8 text-xs text-text-muted">
            Source: ICMR-INDIAB national survey, published in The Lancet Diabetes &amp;
            Endocrinology, 2023.
          </p>
        </section>

        {/* Trust */}
        <section className="border-t border-border bg-bg-card">
          <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-text-primary">
              Privacy is part of the design
            </h2>
            <ul className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {TRUST.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary-strong" aria-hidden="true" />
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Closing call */}
        <section className="bg-bg-wash">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:px-8 md:flex-row md:items-center">
            <div className="max-w-xl">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-text-primary">
                Move a slider. Watch the twin respond.
              </h2>
              <p className="mt-2 text-[15px] text-text-secondary">
                Lower HbA1c, quit smoking or sleep less, and see each risk score change with its
                reasons.
              </p>
            </div>
            <Link href="/login" className={buttonVariants({ size: "lg" })}>
              Open the demo twin
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-5 py-6 text-center text-xs text-text-muted sm:px-8">
        <p>
          VitaTwin · Digital Twin Challenge 2026 · Happiest Health · Synthetic data only · Not a
          medical device
        </p>
        <LegalLinks className="mt-2 justify-center" />
      </footer>
    </div>
  );
}
