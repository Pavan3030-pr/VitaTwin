import { toRiskCategory, type RiskCategory } from "@/components/ui/risk-badge";

const STROKE: Record<RiskCategory, string> = {
  low: "#10B981",
  moderate: "#F59E0B",
  high: "#EF4444",
  critical: "#DC2626",
};

/**
 * Calm progress ring (DESIGN.md prefers rings over alarming imagery).
 * The number is always printed, so the colour is never the only signal.
 */
export function RiskRing({
  value,
  category,
  size = 96,
}: {
  value: number;
  category: string;
  size?: number;
}) {
  const key = toRiskCategory(category);
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference * (1 - clamped / 100);

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#E2E8F0" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke={STROKE[key]}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="num font-display text-2xl font-semibold text-text-primary">
          {clamped}
        </span>
        <span className="mt-0.5 text-[10px] text-text-muted">of 100</span>
      </div>
    </div>
  );
}
