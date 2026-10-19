/**
 * VitaTwin — display status bands for single readings.
 *
 * Kept in the services layer (not in components) so UI code never owns
 * clinical thresholds. These are illustrative PoC bands, not clinical rules.
 */

export type ReadingKind = "heart-rate" | "spo2" | "sleep" | "hba1c";
export type ReadingStatus = "low" | "moderate" | "high";

export const STATUS_LABEL: Record<ReadingStatus, string> = {
  low: "In range",
  moderate: "Watch",
  high: "Elevated",
};

/** Returns the status band for one reading. Non-finite input is treated as "watch". */
export function readingStatus(kind: ReadingKind, value: number): ReadingStatus {
  if (!Number.isFinite(value)) return "moderate";

  switch (kind) {
    case "heart-rate":
      // Resting heart rate: 50–80 in range, up to 100 watch, beyond (or <45) elevated.
      if (value > 100 || value < 45) return "high";
      if (value > 80 || value < 50) return "moderate";
      return "low";
    case "spo2":
      if (value < 92) return "high";
      if (value < 95) return "moderate";
      return "low";
    case "sleep":
      if (value < 6) return "high";
      if (value < 7) return "moderate";
      return "low";
    case "hba1c":
      if (value >= 8) return "high";
      if (value >= 6.5) return "moderate";
      return "low";
  }
}
