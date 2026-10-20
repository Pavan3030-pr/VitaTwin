import { sampleWearableCsv } from "@/services/wearable-import";

export async function GET() {
  const body = sampleWearableCsv();
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vitatwin-sample-wearable.csv"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
