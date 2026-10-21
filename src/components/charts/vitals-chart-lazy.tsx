"use client";

import dynamic from "next/dynamic";

/** Recharts is ~100 kB; load it only when the vitals page actually renders a chart. */
export const VitalsChart = dynamic(
  () => import("./vitals-chart").then((module) => module.VitalsChart),
  {
    ssr: false,
    loading: () => <div className="h-48 animate-pulse rounded-lg bg-bg-subtle" aria-hidden="true" />,
  },
);
