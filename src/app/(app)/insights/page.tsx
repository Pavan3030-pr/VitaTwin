import { Lightbulb, ShieldAlert, Sparkles } from "lucide-react";
import { Card, PageHeader, SectionTitle } from "@/components/ui/card";
import { RiskBadge, SeverityBadge } from "@/components/ui/risk-badge";
import { generateDemoBundle } from "@/lib/data";

export const dynamic = "force-dynamic";

const directionLabel: Record<string, string> = {
  higher: "raises risk",
  lower: "lowers reserve",
  neutral: "neutral",
};

export default function InsightsPage() {
  const { twin } = generateDemoBundle();

  return (
    <div className="space-y-7">
      <PageHeader
        title="Insights & alerts"
        description="Every prediction is paired with the factors that produced it, so a clinician can audit the reasoning."
      />

      <section>
        <SectionTitle hint="Auditable">Risk models</SectionTitle>
        <div className="space-y-3">
          {twin.riskScores.map((score) => (
            <Card key={score.type}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text-primary">{score.label}</p>
                  <p className="mt-0.5 text-xs text-text-muted">
                    {score.modelVersion} · updated {new Date(score.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-semibold tabular-nums text-text-primary">
                    {score.value}
                    <span className="ml-1 text-xs font-normal text-text-muted">/100</span>
                  </span>
                  <RiskBadge category={score.category} />
                </div>
              </div>

              <p className="mt-3 rounded-md bg-bg-subtle px-3 py-2 text-xs leading-relaxed text-text-secondary">
                {score.explanation}
              </p>

              {score.factors.length > 0 && (
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[420px] text-left text-xs">
                    <thead>
                      <tr className="border-b border-border text-text-muted">
                        <th className="pb-1.5 font-medium">Factor</th>
                        <th className="pb-1.5 font-medium">Weight</th>
                        <th className="pb-1.5 font-medium">Direction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {score.factors.map((factor) => (
                        <tr key={factor.factor}>
                          <td className="py-1.5 pr-3 text-text-primary">
                            {factor.factor}
                            <span className="mt-0.5 block text-xs text-text-muted">
                              {factor.note}
                            </span>
                          </td>
                          <td className="py-1.5 pr-3 tabular-nums text-text-secondary">
                            +{factor.weight}
                          </td>
                          <td className="py-1.5 text-text-secondary">
                            {directionLabel[factor.direction] ?? factor.direction}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle hint={`${twin.alerts.length} open`}>Alerts</SectionTitle>
        <div className="space-y-3">
          {twin.alerts.length === 0 && (
            <Card>
              <p className="text-sm text-text-secondary">No active alerts.</p>
            </Card>
          )}
          {twin.alerts.map((alert) => (
            <Card key={alert.id}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger-ink">
                  <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-text-primary">{alert.title}</p>
                    <SeverityBadge severity={alert.severity} />
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-text-secondary">{alert.body}</p>

                  <p className="mt-2 text-xs font-medium text-text-primary">Evidence</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-text-secondary">
                    {alert.factors.map((factor) => (
                      <li key={factor} className="flex gap-1.5">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-text-muted" />
                        {factor}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-2 rounded-md border border-border bg-bg-subtle px-2.5 py-1.5 text-xs text-text-secondary">
                    <span className="font-semibold text-text-primary">Recommended: </span>
                    {alert.recommendedAction}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionTitle hint="Personalised">Recommendations</SectionTitle>
        <div className="grid gap-3 sm:grid-cols-2">
          {twin.recommendations.map((rec) => (
            <Card key={rec.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-text-primary">{rec.title}</p>
                <span className="shrink-0 rounded-full border border-border bg-bg-subtle px-2 py-0.5 text-[11px] font-medium capitalize text-text-secondary">
                  {rec.priority}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">{rec.body}</p>
              <p className="mt-2 inline-flex items-center gap-1 text-xs text-text-muted">
                <Lightbulb className="h-3.5 w-3.5" aria-hidden="true" />
                {rec.category} · seek care {rec.whenToSeekCare}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="flex items-start gap-2 border-dashed">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-xs leading-relaxed text-text-secondary">
          These are heuristic proof-of-concept models. They illustrate how a
          digital twin can explain itself; they are not validated clinical
          instruments and must not guide real treatment decisions.
        </p>
      </Card>
    </div>
  );
}
