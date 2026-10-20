import { Card, SectionTitle } from "@/components/ui/card";
import type { DataProvenance } from "@/types/twin";

const KIND: Record<DataProvenance["kind"], { label: string; cls: string }> = {
  synthetic: { label: "Synthetic", cls: "bg-bg-subtle text-text-secondary" },
  "real-live": { label: "Real · live", cls: "bg-success-soft text-success-ink" },
  "real-published": { label: "Real · published", cls: "bg-accent-soft text-primary-deep" },
  "real-dataset": { label: "Real · dataset", cls: "bg-success-soft text-success-ink" },
};

/** Honest labelling of what is real and what is simulated. */
export function ProvenanceCard({ items }: { items: DataProvenance[] }) {
  return (
    <section aria-label="Data provenance">
      <SectionTitle hint="What is real, what is simulated">Data provenance</SectionTitle>
      <Card className="divide-y divide-border p-0">
        {items.map((item) => (
          <div key={item.id} className="flex flex-wrap items-start justify-between gap-2 px-4 py-3">
            <div className="min-w-0 max-w-2xl">
              <p className="text-sm font-semibold text-text-primary">{item.label}</p>
              <p className="text-xs leading-relaxed text-text-secondary">{item.detail}</p>
            </div>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${KIND[item.kind].cls}`}>
              {KIND[item.kind].label}
            </span>
          </div>
        ))}
      </Card>
    </section>
  );
}
