"use server";

import { getViewerSession } from "./auth";
import { checkRateLimitShared } from "./rate-limit-shared";
import { getClientKey } from "./client-key";
import { importWearableCsv, type WearableImportResult } from "@/services/wearable-import";

export interface WearableActionState {
  result: WearableImportResult | null;
  error: string | null;
}

const MAX_BYTES = 2_000_000;

export async function analyzeWearable(
  _prev: WearableActionState,
  formData: FormData,
): Promise<WearableActionState> {
  const session = await getViewerSession();
  if (session.source === "none") return { result: null, error: "Please sign in." };

  const limit = await checkRateLimitShared(`wearable:${await getClientKey()}`, 20, 60_000);
  if (!limit.allowed) {
    return { result: null, error: "Too many imports. Please wait a minute and try again." };
  }

  const file = formData.get("file");
  let text = String(formData.get("csv") ?? "");
  const label = String(formData.get("label") ?? "").trim() || undefined;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_BYTES) return { result: null, error: "File is larger than 2 MB." };
    text = await file.text();
  }
  if (!text.trim()) return { result: null, error: "Paste CSV rows or choose a file." };
  if (text.length > MAX_BYTES) return { result: null, error: "Input is larger than 2 MB." };
  if (text.trimStart().startsWith("<?xml") || text.includes("<HealthData")) {
    return {
      result: null,
      error:
        "Full Apple Health XML export is not supported yet. Export a CSV table (or use the sample CSV) with columns for date, heart rate, HRV, steps and sleep.",
    };
  }
  const result = importWearableCsv(text, { label });
  return { result, error: result.ok ? null : result.errors.join(" ") };
}
