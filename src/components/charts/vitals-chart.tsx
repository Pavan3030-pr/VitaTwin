"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { WearableSample } from "@/types/twin";

interface VitalsChartProps {
  samples: WearableSample[];
  metric: "heartRateBpm" | "hrvMs" | "steps" | "spO2";
  label: string;
  unit: string;
}

/** Groups the stream into daily averages for a readable light-theme chart. */
function toDailySeries(samples: WearableSample[], metric: VitalsChartProps["metric"]) {
  const buckets = new Map<string, { sum: number; count: number }>();

  for (const sample of samples) {
    const day = sample.timestamp.slice(0, 10);
    const bucket = buckets.get(day) ?? { sum: 0, count: 0 };
    bucket.sum += sample[metric];
    bucket.count += 1;
    buckets.set(day, bucket);
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, { sum, count }]) => ({
      day: day.slice(5),
      value: Math.round(sum / count),
    }));
}

export function VitalsChart({ samples, metric, label, unit }: VitalsChartProps) {
  const data = toDailySeries(samples, metric);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg bg-bg-subtle text-sm text-text-muted">
        No wearable data in this window.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0D9488" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#0D9488" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#64748B", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={52}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 10,
              border: "1px solid #E2E8F0",
              boxShadow: "0 4px 12px rgba(15,23,42,0.06)",
              fontSize: 12,
            }}
            formatter={(value) => [`${String(value)} ${unit}`, label]}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#0D9488"
            strokeWidth={2}
            fill={`url(#fill-${metric})`}
            activeDot={{ r: 3 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
