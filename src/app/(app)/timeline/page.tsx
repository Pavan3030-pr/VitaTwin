import { Card, SectionTitle } from "@/components/ui/card";
import { generateDemoBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

interface DaySnapshot {
  day: string;
  label: string;
  heartRate: number;
  hrv: number;
  sleepHours: number;
  steps: number;
  note: string;
}

/** Rolls the wearable stream up into one snapshot per calendar day. */
function buildSnapshots(samples: ReturnType<typeof generateDemoBundle>["samples"]): DaySnapshot[] {
  const buckets = new Map<string, typeof samples>();

  for (const sample of samples) {
    const day = sample.timestamp.slice(0, 10);
    const bucket = buckets.get(day) ?? [];
    bucket.push(sample);
    buckets.set(day, bucket);
  }

  const mean = (values: number[], fallback = 0) =>
    values.length > 0
      ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
      : fallback;

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, group]) => {
      const heartRate = mean(group.map((s) => s.heartRateBpm), 72);
      const hrv = mean(group.map((s) => s.hrvMs), 38);
      const sleepHours = Number(
        (group.filter((s) => s.sleepStage !== "awake").length / 4).toFixed(1),
      );
      const steps = group.reduce((sum, s) => sum + s.steps, 0);

      const note =
        heartRate > 82 && sleepHours < 6
          ? "Elevated nocturnal HR with short sleep — acute stress risk rose."
          : heartRate > 78
            ? "Heart rate trending above the personal baseline."
            : "Stable haemodynamics; recovery looks adequate.";

      return {
        day,
        label: new Date(`${day}T12:00:00`).toLocaleDateString([], {
          weekday: "short",
          day: "numeric",
          month: "short",
        }),
        heartRate,
        hrv,
        sleepHours,
        steps,
        note,
      };
    });
}

export default function TimelinePage() {
  const { samples, twin } = generateDemoBundle();
  const snapshots = buildSnapshots(samples).reverse();

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-text-primary">
          Twin timeline
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          The twin is not a snapshot — it remembers. Each day below is a
          reconstructed state from the wearable window.
        </p>
      </header>

      <SectionTitle hint={`${snapshots.length} days`}>Evolution</SectionTitle>

      <ol className="relative space-y-3 border-l border-border pl-5">
        {snapshots.map((snapshot, index) => (
          <li key={snapshot.day} className="relative">
            <span
              className={`absolute -left-[26px] top-3 h-3 w-3 rounded-full border-2 border-bg-card ${
                index === 0 ? "bg-primary" : "bg-border-strong"
              }`}
              aria-hidden="true"
            />
            <Card>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">
                  {snapshot.label}
                  {index === 0 && (
                    <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary">
                      latest
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-text-muted">{snapshot.day}</p>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {[
                  { key: "HR", value: `${snapshot.heartRate} bpm` },
                  { key: "HRV", value: `${snapshot.hrv} ms` },
                  { key: "Sleep", value: `${snapshot.sleepHours} h` },
                  { key: "Steps", value: snapshot.steps.toLocaleString() },
                ].map((item) => (
                  <div key={item.key} className="rounded-md bg-bg-subtle px-2.5 py-1.5">
                    <p className="text-[11px] text-text-muted">{item.key}</p>
                    <p className="font-medium tabular-nums text-text-primary">{item.value}</p>
                  </div>
                ))}
              </div>

              <p className="mt-2 text-xs leading-relaxed text-text-secondary">{snapshot.note}</p>
            </Card>
          </li>
        ))}
      </ol>

      <Card className="border-dashed">
        <p className="text-xs leading-relaxed text-text-secondary">
          Twin updated at {new Date(twin.updatedAt).toLocaleString()} ·{" "}
          {twin.insights.length} derived insight(s) in the current state. Timeline
          entries are reconstructed from synthetic wearable samples, not stored
          patient history.
        </p>
      </Card>
    </div>
  );
}
