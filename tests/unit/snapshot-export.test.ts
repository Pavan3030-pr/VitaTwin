import { describe, expect, it } from "vitest";
import { generateDemoBundle } from "@/lib/data";
import { PERSONAS } from "@/lib/cohort";
import { buildSnapshotPayload, parseSnapshotPayload } from "@/services/snapshot";
import { buildCohortCsv, csvCell } from "@/services/clinician-export";

describe("snapshot payload", () => {
  it("keeps derived numbers only and round-trips through the parser", () => {
    const payload = buildSnapshotPayload(generateDemoBundle());
    expect(payload.scores).toHaveLength(3);
    expect(JSON.stringify(payload).length).toBeLessThan(2_000);
    expect(JSON.stringify(payload)).not.toMatch(/timestamp|samples/);
    expect(parseSnapshotPayload(JSON.parse(JSON.stringify(payload)))).toEqual(payload);
  });

  it("rejects malformed stored payloads", () => {
    expect(parseSnapshotPayload(null)).toBeNull();
    expect(parseSnapshotPayload({ v: 99 })).toBeNull();
    expect(parseSnapshotPayload({ v: 1, patientName: "x", scores: "nope" })).toBeNull();
  });
});

describe("clinician CSV", () => {
  it("escapes quotes, commas and newlines", () => {
    expect(csvCell('a,"b"\nc')).toBe('"a,""b""\nc"');
    expect(csvCell(null)).toBe("");
    expect(csvCell(0)).toBe("0");
  });

  it("neutralises spreadsheet formula injection", () => {
    expect(csvCell("=HYPERLINK(\"x\")")).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell("+1")).toBe("'+1");
    expect(csvCell("@sum")).toBe("'@sum");
  });

  it("has a note, a header and one row per patient", () => {
    const bundles = PERSONAS.map((p) => generateDemoBundle(p.id));
    const lines = buildCohortCsv(bundles, new Date("2026-10-21T00:00:00Z")).trimEnd().split("\r\n");
    expect(lines).toHaveLength(bundles.length + 2);
    expect(lines[0]).toMatch(/synthetic patients/);
    expect(lines[1]).toMatch(/^Patient,Age,City/);
  });
});
