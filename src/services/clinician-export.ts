/**
 * VitaTwin — clinician panel CSV export (pure, unit-tested).
 * Cells are quoted per RFC 4180 and neutralised against spreadsheet formula
 * injection (a leading = + - @ is prefixed with an apostrophe).
 */
import type { DemoBundle } from "@/lib/data";

export function csvCell(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  let text = String(value);
  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

const HEADER = [
  "Patient",
  "Age",
  "City",
  "CVD 10-yr risk (%)",
  "CVD category",
  "Diabetes score",
  "Diabetes category",
  "Acute stress score",
  "Early warning level",
  "Early warning index",
  "Lead time (h)",
  "AQI",
  "Open alerts",
];

export function buildCohortCsv(bundles: DemoBundle[], generatedAt: Date = new Date()): string {
  const score = (b: DemoBundle, type: string) => b.twin.riskScores.find((r) => r.type === type);
  const rows = bundles.map((b) => {
    const cvd = score(b, "cvd-10yr");
    const dia = score(b, "diabetes-progression");
    const acute = score(b, "acute-stress");
    return [
      `${b.patient.demographics.firstName} ${b.patient.demographics.lastName}`.trim(),
      b.patient.age,
      b.patient.demographics.location.split(",")[0],
      cvd?.value,
      cvd?.category,
      dia?.value,
      dia?.category,
      acute?.value,
      b.earlyWarning.level,
      b.earlyWarning.index,
      b.earlyWarning.leadTimeHours,
      b.environment?.usAqi,
      b.twin.alerts.length,
    ]
      .map(csvCell)
      .join(",");
  });
  const note = csvCell(
    `VitaTwin clinician panel - synthetic patients - decision support only, not a diagnosis - generated ${generatedAt.toISOString()}`,
  );
  return [note, HEADER.map(csvCell).join(","), ...rows].join("\r\n") + "\r\n";
}
