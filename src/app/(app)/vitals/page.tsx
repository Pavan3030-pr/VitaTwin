import { Activity, Droplets, Footprints, HeartPulse, Moon, Wind } from "lucide-react";
import { Card, CardHeader, SectionTitle } from "@/components/ui/card";
import { VitalsChart } from "@/components/charts/vitals-chart";
import { generateDemoBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

export default function VitalsPage() {
  const { vitals, samples } = generateDemoBundle();

  const tiles = [
    {
      label: "Heart rate",
      value: `${vitals.heartRateBpm} bpm`,
      icon: HeartPulse,
      note: "Window average",
    },
    {
      label: "HRV",
      value: `${vitals.hrvMs} ms`,
      icon: Activity,
      note: "Autonomic recovery",
    },
    {
      label: "SpO₂",
      value: `${vitals.spO2}%`,
      icon: Droplets,
      note: "Blood oxygen",
    },
    {
      label: "Respiratory rate",
      value: `${vitals.respiratoryRate} /min`,
      icon: Wind,
      note: "Estimated",
    },
    {
      label: "Sleep",
      value: `${vitals.sleepHours} h`,
      icon: Moon,
      note: `${vitals.sleepQuality}/100 quality`,
    },
    {
      label: "Steps (latest day)",
      value: vitals.stepsToday.toLocaleString(),
      icon: Footprints,
      note: "Synthetic stream",
    },
  ];

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Vitals & streams
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Continuous wearable signals fused into the twin. Daily means are
          shown so trends stay readable.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map(({ label, value, icon: Icon, note }) => (
          <Card key={label} className="flex items-start gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <Icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs text-text-secondary">{label}</p>
              <p className="text-xl font-semibold tabular-nums text-text-primary">{value}</p>
              <p className="text-[11px] text-text-muted">{note}</p>
            </div>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Heart rate" hint="Daily average (bpm)" />
          <VitalsChart samples={samples} metric="heartRateBpm" label="Heart rate" unit="bpm" />
        </Card>
        <Card>
          <CardHeader title="Heart-rate variability" hint="Daily average (ms)" />
          <VitalsChart samples={samples} metric="hrvMs" label="HRV" unit="ms" />
        </Card>
        <Card>
          <CardHeader title="Blood oxygen" hint="Daily average (%)" />
          <VitalsChart samples={samples} metric="spO2" label="SpO₂" unit="%" />
        </Card>
        <Card>
          <CardHeader title="Activity" hint="Daily step average" />
          <VitalsChart samples={samples} metric="steps" label="Steps" unit="steps" />
        </Card>
      </section>

      <SectionTitle hint="Transparency">How this is computed</SectionTitle>
      <Card>
        <p className="text-sm leading-relaxed text-text-secondary">
          The wearable generator produces hourly samples across a seven-day
          window (heart rate, HRV, steps, sleep stage, SpO₂, activity and a
          stress index). The fusion step reduces that window to the summary
          above and hands it to the risk models. Everything is synthetic and
          runs on the server.
        </p>
        <p className="mt-2 text-xs text-text-muted">
          {samples.length.toLocaleString()} synthetic samples in this window.
        </p>
      </Card>
    </div>
  );
}
