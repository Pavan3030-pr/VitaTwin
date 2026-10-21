import { sampleWearableCsv } from "@/services/wearable-import";
import { guardRate } from "@/lib/request-guard";

export async function GET(request: Request) {
  const blocked = guardRate(request, "wearable-sample", 30, 60_000);
  if (blocked) return blocked;
  const body = sampleWearableCsv();
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="vitatwin-sample-wearable.csv"',
      "Cache-Control": "public, max-age=3600",
    },
  });
}
