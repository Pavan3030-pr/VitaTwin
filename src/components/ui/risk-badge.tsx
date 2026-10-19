import { AlertOctagon, AlertTriangle, CheckCircle2, CircleAlert } from "lucide-react";

/**
 * Risk badge: colour + icon + text label, so colour is never the only
 * indicator (DESIGN.md → Accessibility). Ink colours meet WCAG AA on soft fills.
 */
const STYLES = {
  low: {
    box: "bg-success-soft text-success-ink border-success/30",
    Icon: CheckCircle2,
  },
  moderate: {
    box: "bg-warning-soft text-warning-ink border-warning/40",
    Icon: CircleAlert,
  },
  high: {
    box: "bg-danger-soft text-danger-ink border-danger/30",
    Icon: AlertTriangle,
  },
  critical: {
    box: "bg-danger-soft text-danger-ink border-danger/50",
    Icon: AlertOctagon,
  },
} as const;

export type RiskCategory = keyof typeof STYLES;

export function toRiskCategory(category: string): RiskCategory {
  return (category in STYLES ? category : "moderate") as RiskCategory;
}

export function RiskBadge({ category }: { category: string }) {
  const key = toRiskCategory(category);
  const { box, Icon } = STYLES[key];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${box}`}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {key}
    </span>
  );
}

const SEVERITY_TO_CATEGORY: Record<string, RiskCategory> = {
  low: "low",
  info: "low",
  moderate: "moderate",
  warning: "moderate",
  high: "high",
  critical: "critical",
  danger: "critical",
};

export function SeverityBadge({ severity }: { severity: string }) {
  return <RiskBadge category={SEVERITY_TO_CATEGORY[severity] ?? "moderate"} />;
}
