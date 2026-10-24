import { TrendingDown } from "lucide-react";
import type { Lever } from "@/services/levers";

/** Ranked single-change interventions for the active twin (server-rendered). */
export function LeversCard({ levers }: { levers: Lever[] }) {
  if (levers.length === 0) return null;
  return (
    <div className="mt-5 border-t border-border pt-5">
      <h3 className="flex items-center gap-2 font-display text-base font-semibold text-text-primary">
        <TrendingDown className="h-4 w-4 text-primary-strong" aria-hidden="true" />
        Biggest levers for this twin
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        Each change tried on its own, ranked by how much it lowers the combined risk score. Illustrative, not advice.
      </p>
      <ol className="mt-3 space-y-2">
        {levers.map((lever, index) => (
          <li key={lever.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 rounded-lg bg-bg-wash px-3.5 py-2.5">
            <span className="text-sm font-medium text-text-primary">
              <span className="num mr-2 text-text-muted">{index + 1}.</span>
              {lever.label}
            </span>
            <span className="text-xs text-text-secondary">
              <span className="num font-semibold text-primary-strong">{lever.totalDelta} pts</span>
              {lever.effects.map((effect) => (
                <span key={effect.label} className="ml-3">
                  {effect.label}: <span className="num">{effect.delta}</span>
                </span>
              ))}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
