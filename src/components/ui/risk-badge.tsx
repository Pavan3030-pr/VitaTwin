const STYLES = {
  low: "bg-success-soft text-success border-success/20",
  moderate: "bg-warning-soft text-warning border-warning/20",
  high: "bg-danger-soft text-danger border-danger/20",
  critical: "bg-danger-soft text-danger border-danger/30",
} as const;

export type RiskCategory = keyof typeof STYLES;

export function RiskBadge({ category }: { category: string }) {
  const key = (category in STYLES ? category : "moderate") as RiskCategory;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STYLES[key]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
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
