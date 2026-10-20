import { TrendingUp } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/card";
import type { EarlyWarning } from "@/types/twin";

const TONE: Record<EarlyWarning["level"], string> = {
  stable: "bg-success-soft text-success-ink",
  watch: "bg-warning-soft text-warning-ink",
  warning: "bg-danger-soft text-danger-ink",
  urgent: "bg-danger-soft text-danger-ink",
};

function Trend({ ew }: { ew: EarlyWarning }) {
  const pts = [
    ...ew.history.slice(-6).map((h, i) => ({ x: i, y: h.index, f: false })),
    ...ew.forecast.map((f, i) => ({ x: 6 + i, y: f.index, f: true })),
  ];
  if (pts.length < 2) return null;
  const X = (x: number) => 8 + (x / (pts.length - 1)) * 284;
  const Y = (y: number) => 78 - (y / 100) * 70;
  const hist = pts.filter((p) => !p.f);
  const fc = [hist[hist.length - 1], ...pts.filter((p) => p.f)].filter(Boolean);
  const path = (list: typeof pts) => list.map((p, i) => `${i ? "L" : "M"}${X(p.x)},${Y(p.y)}`).join(" ");
  return (
    <svg viewBox="0 0 300 90" className="w-full" role="img" aria-label="Strain index history and 72-hour forecast">
      <line x1="8" x2="292" y1={Y(75)} y2={Y(75)} stroke="#EF4444" strokeDasharray="4 4" strokeWidth="1" />
      <text x="292" y={Y(75) - 3} textAnchor="end" fontSize="8" fill="#B91C1C">urgent line</text>
      <path d={path(hist)} fill="none" stroke="#0D9488" strokeWidth="2" />
      <path d={path(fc)} fill="none" stroke="#0D9488" strokeWidth="2" strokeDasharray="4 3" />
      {pts.map((p) => (
        <circle key={p.x} cx={X(p.x)} cy={Y(p.y)} r="2.5" fill={p.f ? "#fff" : "#0D9488"} stroke="#0D9488" />
      ))}
    </svg>
  );
}

export function EarlyWarningCard({ ew }: { ew: EarlyWarning }) {
  return (
    <section aria-labelledby="ew-title">
      <SectionTitle hint="Personal baseline, 72 h forecast">Early warning</SectionTitle>
      <Card className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="max-w-xl">
            <p id="ew-title" className="inline-flex items-center gap-2 font-display text-lg font-semibold text-text-primary">
              <TrendingUp className="h-5 w-5 text-primary-strong" aria-hidden="true" />
              Strain index {ew.index}/100
            </p>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">{ew.headline}</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${TONE[ew.level]}`}>
            {ew.level}
            {ew.leadTimeHours !== null ? ` · ~${ew.leadTimeHours} h lead` : ""}
          </span>
        </div>
        <Trend ew={ew} />
        {ew.signals.length > 0 && (
          <ul className="grid gap-2 sm:grid-cols-2">
            {ew.signals.map((s) => (
              <li key={s.metric} className="flex items-baseline justify-between rounded-lg bg-bg-subtle px-3 py-2 text-sm">
                <span className="text-text-secondary">{s.label}</span>
                <span className="num font-semibold text-text-primary">
                  {s.current} <span className="font-normal text-text-muted">vs {s.baseline} {s.unit}</span>
                  <span className={`ml-2 text-xs ${s.direction === "worse" ? "text-danger-ink" : "text-text-muted"}`}>
                    {s.zScore >= 0 ? "+" : ""}{s.zScore} SD
                  </span>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-text-muted">
          Each metric is compared with this person&apos;s own {ew.baselineDays}-day baseline (robust z-scores); the dashed line is a damped linear projection.
        </p>
      </Card>
    </section>
  );
}
