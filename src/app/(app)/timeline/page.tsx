import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { History, Save, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { FormMessage } from "@/components/auth/auth-card";
import { RiskBadge } from "@/components/ui/risk-badge";
import { SubmitButton } from "@/components/ui/submit-button";
import { getViewerSession } from "@/lib/auth";
import { deleteSnapshot, saveSnapshot } from "@/lib/snapshot-actions";
import { listSnapshots } from "@/lib/snapshots-data";
import { getActiveBundle } from "@/lib/active";

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
function buildSnapshots(samples: Awaited<ReturnType<typeof getActiveBundle>>["samples"]): DaySnapshot[] {
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
      // One sample per hour, so non-awake samples equal hours slept.
      const sleepHours = group.filter((s) => s.sleepStage !== "awake").length;
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

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string; error?: string }>;
}) {
  const params = await searchParams;
  const [{ samples, twin }, session] = await Promise.all([getActiveBundle(), getViewerSession()]);
  const canSave = session.source === "supabase";
  const saved = canSave ? await listSnapshots() : [];
  const snapshots = buildSnapshots(samples).reverse();

  if (snapshots.length === 0) {
    return (
      <div className="space-y-7">
        <PageHeader title="Twin timeline" description="The twin remembers each day as it unfolds." />
        <EmptyState
          icon={History}
          title="No history yet"
          description="Once wearable data is connected, each day will appear here as a snapshot of your twin."
          action={
            <a href="/import" className="inline-flex h-10 items-center rounded-full bg-primary-strong px-5 text-sm font-semibold text-white hover:bg-primary-hover">
              Connect your data
            </a>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-7">
      <PageHeader
        title="Twin timeline"
        description="The twin is not a snapshot — it remembers. Each day below is a reconstructed state from the wearable window."
      />

      <section>
        <SectionTitle hint={canSave ? `${saved.length} saved` : "Email account"}>Saved snapshots</SectionTitle>
        <FormMessage
          error={typeof params.error === "string" ? params.error.slice(0, 240) : null}
          notice={typeof params.notice === "string" ? params.notice.slice(0, 240) : null}
        />
        {canSave ? (
          <div className="space-y-3">
            <form action={saveSnapshot}>
              <SubmitButton size="sm" pendingLabel="Saving…">
                <Save className="h-4 w-4" aria-hidden="true" />
                Save today&rsquo;s snapshot
              </SubmitButton>
            </form>
            {saved.length === 0 ? (
              <Card className="border-dashed">
                <p className="text-sm text-text-secondary">
                  Nothing saved yet. Save a snapshot to compare how your risk scores change over time.
                </p>
              </Card>
            ) : (
              <ul className="space-y-2">
                {saved.map((snap) => (
                  <li key={snap.id}>
                    <Card className="flex flex-wrap items-center justify-between gap-3 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-text-primary">
                          {new Date(snap.capturedAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}
                          <span className="ml-2 text-xs font-normal text-text-muted">
                            {snap.payload.patientName} · early warning {snap.payload.earlyWarning.level}
                          </span>
                        </p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
                          {snap.payload.scores.map((score) => (
                            <span key={score.type} className="inline-flex items-center gap-1.5">
                              {score.label}: <span className="num font-semibold text-text-primary">{score.value}</span>
                              <RiskBadge category={score.category} />
                            </span>
                          ))}
                        </div>
                      </div>
                      <form action={deleteSnapshot}>
                        <input type="hidden" name="id" value={snap.id} />
                        <SubmitButton variant="ghost" size="sm" className="text-danger-ink" pendingLabel="Deleting…">
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                          <span className="sr-only sm:not-sr-only">Delete</span>
                        </SubmitButton>
                      </form>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <Card className="border-dashed">
            <p className="text-sm text-text-secondary">
              Snapshots are saved to your account. Sign in with an email account (not the demo) to save and compare them.
            </p>
          </Card>
        )}
      </section>

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
                <p className="text-xs text-text-muted">{snapshot.day}</p>
              </div>

              <div className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                {[
                  { key: "HR", value: `${snapshot.heartRate} bpm` },
                  { key: "HRV", value: `${snapshot.hrv} ms` },
                  { key: "Sleep", value: `${snapshot.sleepHours} h` },
                  { key: "Steps", value: snapshot.steps.toLocaleString() },
                ].map((item) => (
                  <div key={item.key} className="rounded-md bg-bg-subtle px-2.5 py-1.5">
                    <p className="text-xs text-text-muted">{item.key}</p>
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
